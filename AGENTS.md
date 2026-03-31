# AGENTS.md — openlabel / dataset-annotation-app

All AI agents working in this repo must read this file before proposing or generating anything.
Global behavioral rules live in `~/.claude/CLAUDE.md`. This file provides project-specific
overrides and context on top of those global rules.

---

## 1. Project Identity

**Name:** `dataset-annotation-app` (repo alias: `openlabel`)
**Goal:** Browser-only YOLO detect dataset annotator — NDJSON-first export, overlap-friendly
box editing, TP/FP review states, and lossless re-import.
**Scope (v1):** detect task only. No segmentation, pose, OBB, classification, SAM, or inference.
**Runtime:** Zero backend. Zero API routes. Zero server actions. IndexedDB only.

---

## 2. Tech Stack (locked — do not substitute without an ADR)

| Concern | Library |
|---|---|
| Framework | Next.js (App Router, static export) |
| Language | TypeScript (strict) |
| State | Zustand |
| Persistence | Dexie (IndexedDB) |
| Validation | Zod |
| Zip I/O | fflate |
| File upload | react-dropzone |
| Canvas/overlay | SVG (inline, not canvas 2D or WebGL) |
| Unit/integration tests | Vitest + React Testing Library |
| E2E tests | Playwright |
| Linting | ESLint + Prettier |

---

## 3. Repository Structure (BusinessRepo)

```text
/app                      Next.js app router pages (routing only)
/app-openlabel            Business repo root — all domain + UI code lives here
  /common
    /domain
      /dataset            Project, ImageRecord, ClassDef
      /annotations        BoxAnnotation, review states
      /classes            ClassPack registry, COCO-80/VOC-20/VisDrone-10 presets
    /application
      /use-cases          CreateProject, ExportDataset, ImportDataset, ...
      /services           AutoSave, HashService, SplitPolicy
    /infrastructure
      /persistence        Dexie repositories
      /zip                fflate wrappers
      /parsers            NDJSON parser, YOLO txt parser
      /serializers        NDJSON serializer, YOLO txt/YAML serializer
  /ui
    /components           Presentational React components
    /layouts              Page shells
    /hooks                State/domain composition hooks
    /hoc                  withClientOnly, withErrorBoundary, withHotkeys
    /stores               Zustand stores
/infra
  /github-actions
  /hosting
/tests
  /unit
  /integration
  /e2e
/docs
  /adr
  /prd
Makefile
```

> **Path alias:** `@/*` → `./app-openlabel/*` in both `tsconfig.json` and `vitest.config.ts`.
> So `@/common/domain/...` resolves to `app-openlabel/common/domain/...` and
> `@/ui/components/...` resolves to `app-openlabel/ui/components/...`.

---

## 4. Architecture Rules

- **Clean Architecture is mandatory.** Domain objects must not import React, Zustand, or Dexie.
- **Repositories behind interfaces.** Dexie is an implementation detail, not a dependency.
- **Serializers are pure functions.** No side effects, no I/O, no imports from `/ui`.
- **Use-cases orchestrate.** They call repositories and services; they do not contain UI logic.
- **React components are presentational where possible.** State lives in hooks or Zustand stores.
- **HOCs only for:** `withClientOnly`, `withErrorBoundary`, `withHotkeys`. Do not invent more.
- **No barrel re-exports** that collapse layer boundaries.
- **Zod schemas live next to domain types.** Validate at system boundaries (import, user input).

---

## 5. Domain Model (canonical)

```ts
type Split = "train" | "val" | "test";
type ImageReviewState = "complete" | "incomplete" | "negative";
type BoxReviewState = "tp" | "fp" | "ignore";

type ClassDef = {
  id: number;           // zero-indexed, stable within a project
  name: string;
  color: string;        // hex
  source: "preset" | "custom" | "imported";
};

type BoxAnnotation = {
  id: string;           // uuid
  classId: number;
  x: number;            // normalized 0..1 (x_center)
  y: number;            // normalized 0..1 (y_center)
  w: number;            // normalized 0..1
  h: number;            // normalized 0..1
  zIndex: number;
  review: BoxReviewState;
  locked: boolean;
  hidden: boolean;
  note?: string;
};

type ImageRecord = {
  id: string;
  fileName: string;
  storedBlobKey: string;
  width: number;
  height: number;
  split: Split;
  reviewState: ImageReviewState;
  annotations: BoxAnnotation[];
  hash: string;         // SHA-256 of raw bytes, for dedup and stable IDs
};

type Project = {
  id: string;
  name: string;
  description?: string;
  version: number;
  createdAt: string;    // ISO-8601
  updatedAt: string;
  classes: ClassDef[];
  images: ImageRecord[];
  exportOptions: ExportOptions;
};

type ExportOptions = {
  includeYaml: boolean;
  includeTxtLabels: boolean;
  blockIncompleteImages: boolean;
};
```

---

## 6. Export Contract

### Zip structure
```text
dataset-annotation-app-export.zip
├── dataset.ndjson           # canonical — training-safe, no UI metadata
├── data.yaml                # YOLO compatibility
├── images/
│   ├── train/
│   ├── val/
│   └── test/
├── labels/
│   ├── train/
│   ├── val/
│   └── test/
└── meta/
    └── project.json         # round-trip UI metadata only
```

### `dataset.ndjson` rules
- Line 1: dataset record `{ "type": "dataset", "task": "detect", "class_names": [...] }`
- Lines 2+: one image record per line
- Image record keys: `type`, `file`, `split`, `width`, `height`, `annotations`
- `annotations.boxes`: array of `[class_id, x_center, y_center, width, height]` — normalized, zero-indexed
- **Only `tp` boxes are exported into `annotations.boxes`.**
- `fp` and `ignore` boxes go in `meta/project.json` only.
- Negative image (zero tp boxes): `"annotations": { "boxes": [] }`
- No UI-only fields (`zIndex`, `review`, `color`, `locked`) in training NDJSON.

### `data.yaml` rules
- `names`: list ordered by class ID
- `train`, `val` paths required; `test` optional

### YOLO txt rules
- `labels/{split}/{stem}.txt`
- One line per tp box: `class_id x_center y_center width height`
- Empty file for negative images (no objects)

### Split policy
- `train` is required.
- If `val` is missing and the dataset has ≥ 2 images, auto-create a `val` subset at ~10%.
- Manual split overrides per image take precedence.

### Export gate
- Block export for `incomplete` images by default.
- Allow override with explicit warning; never silently export incomplete images.

---

## 7. Import Rules

Priority order when re-importing:
1. `meta/project.json` — authoritative for UI state (review states, z-order, colors)
2. `dataset.ndjson` — authoritative for training annotations and class names
3. Fallback: raw NDJSON + images zip (no sidecar)
4. Stretch: YOLO detect folder structure

Security rules for import:
- Normalize all zip paths before extracting (block `../` traversal).
- Enforce per-file and total size limits.
- Validate all NDJSON lines against Zod schema before mutating state.
- Sanitize filenames (strip control chars, reserve names, path separators).
- Escape all class names and labels before rendering.
- Do not auto-fetch remote URLs found inside imported files.

---

## 8. Testing Strategy

| Layer | Tool | What to cover |
|---|---|---|
| Serializers/parsers | Vitest | round-trip NDJSON, YOLO txt, coordinate normalization |
| Repositories | Vitest + fake-indexeddb | CRUD, dedup, hash stability |
| Use-cases | Vitest | export gate logic, split policy, negative image rule |
| UI components | RTL | canvas interaction, class picker, annotation stack |
| E2E | Playwright | upload → annotate → export → re-import full flow |

Test files live under `/tests/{unit,integration,e2e}` mirroring source paths.
No snapshot tests for business logic. Snapshots only for stable pure-render UI.

---

## 9. Security Rules

- No `dangerouslySetInnerHTML` anywhere.
- No remote auto-fetch from imported NDJSON URLs.
- Zip path traversal normalization is non-negotiable — add a unit test for it.
- Filename sanitization must cover: `..`, `/`, `\`, null bytes, Windows reserved names.
- Image decode failures must be caught and reported, never silently swallowed.
- No `eval`, no `new Function`, no dynamic `import()` of user-supplied content.

---

## 10. UI/UX Rules

- Left panel: image list/grid with split badge, review state badge, and box count.
- Center: SVG annotation canvas with zoom/pan.
- Right panel: annotation stack (z-order visible), class picker, box properties, review controls.
- Overlapping boxes: translucent fills, stack list for selection cycling.
- Z-order controls: bring forward / send backward / bring to front / send to back.
- Keyboard shortcuts required: save, undo, redo, delete, zoom in/out, z-order, class quick-select (1–9).
- Accessibility: visible focus states, keyboard operability for all major actions, non-color-only status indicators.
- Autosave to IndexedDB after every meaningful edit. Never rely on memory only.

---

## 11. What NOT to do

- Do not add `Co-Authored-By: Claude` to commits.
- Do not add cloud sync, auth, or any server dependency.
- Do not export `fp` or `ignore` boxes as training annotations.
- Do not export `fp` as a "background" class.
- Do not scrape Ultralytics docs at runtime.
- Do not implement SAM, model inference, or non-detect tasks in v1.
- Do not use HOCs as the primary state model.
- Do not skip Zod validation on imported data.
- Do not use `git add -A` blindly.
- Do not add features outside the v1 scope without an ADR.

---

## 12. ADR Index

All decisions live in `/docs/adr/`. Required ADRs before first release:

| # | Title |
|---|---|
| 001 | detect-only scope |
| 002 | NDJSON as canonical export format |
| 003 | sidecar metadata strategy (`meta/project.json`) |
| 004 | browser-only persistence (IndexedDB / no backend) |

---

## 13. Skills Reference

These skills are available and encouraged in this project:

| Invocation | What it does |
|---|---|
| `/tdd <description>` | Write failing tests first, implement until green |
| `/ship` | Lint → build → commit → push → verify |
| `/wrap-up` | End-of-session summary, flag unfinished work |
| `/feature-dev` | Guided feature development with codebase context |
| `/add-class-pack` | Scaffold a new YOLO class pack into the registry |
| `/validate-export` | Validate a local zip against the export contract |

---

## 14. Definition of Done

A feature is done when:
- Unit and integration tests pass.
- Export contract is unbroken (run `/validate-export`).
- No incomplete images silently exported.
- Round-trip re-import is lossless for classes, annotations, review state, z-order, and splits.
- Keyboard shortcuts work.
- Accessibility requirements met.
- ADR written if a non-obvious decision was made.
