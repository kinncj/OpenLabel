# Architecture

openlabel is a static SPA with zero backend. Everything runs in the browser; data lives in IndexedDB.

---

## System context

```mermaid
C4Context
    title openlabel — system context

    Person(user, "Annotator", "Labels images for YOLO training")

    System(app, "openlabel", "Browser-only annotation tool\nNext.js static export")

    System_Ext(idb, "IndexedDB", "Browser-local storage\nprojects / images / blobs")
    System_Ext(fs, "File system", "Source images\nExported ZIP files")
    System_Ext(yolo, "Ultralytics / YOLO", "Consumes exported dataset")
    System_Ext(ls, "Label Studio", "Optional import/export peer")

    Rel(user, app, "Annotates images, exports datasets")
    Rel(app, idb, "Reads/writes via Dexie")
    Rel(user, fs, "Drops images in, downloads ZIP out")
    Rel(app, yolo, "Exports dataset.ndjson + YOLO txt + data.yaml")
    Rel(app, ls, "Imports/exports labelstudio.json")
```

---

## Clean Architecture layers

```mermaid
block-beta
  columns 1

  block:ui["UI layer  (src/ui)"]
    a["Components\n(React, SVG canvas)"]
    b["Hooks\n(useCanvas, useClasses, …)"]
    c["Stores\n(Zustand)"]
  end

  block:app["Application layer  (src/common/application)"]
    d["Use-cases\n(ExportDataset, ImportDataset, CreateProject, …)"]
    e["Services\n(HashService, SplitPolicy, AutoSave)"]
  end

  block:infra["Infrastructure layer  (src/common/infrastructure)"]
    f["Repositories\n(ProjectRepository, ImageRepository, BlobRepository)"]
    g["Serializers\n(NDJSON, YOLO txt, YAML, Label Studio)"]
    h["Parsers\n(NDJSON, YOLO txt, Label Studio)"]
    i["Zip I/O\n(ZipReader, ZipWriter via fflate)"]
  end

  block:domain["Domain layer  (src/common/domain)"]
    j["Types\n(Project, ImageRecord, BoxAnnotation, ClassDef)"]
    k["Schemas\n(Zod validators)"]
    l["Class packs\n(COCO, LVIS, OIV7, …)"]
  end

  ui --> app
  app --> infra
  app --> domain
  infra --> domain
```

**Dependency rule:** arrows point inward only. Domain imports nothing from infra or UI.

---

## Component map

```mermaid
graph TD
    subgraph Pages["src/app/ (Next.js routing)"]
        Home["/ — ProjectList"]
        Workspace["/workspace?id= — WorkspaceClient"]
    end

    subgraph WorkspaceLayout["WorkspaceLayout"]
        Sidebar["ImageSidebar\n(thumbnails, split badge, review state)"]
        Canvas["AnnotationCanvas\n(SVG, zoom/pan, box draw/move/resize)"]
        Panel["AnnotationPanel\n(tabs: Classes / Stack / Box)"]
    end

    subgraph Panel
        ClassManager["ClassManager\n(import preset, add custom, delete)"]
        AnnotationStack["AnnotationStack\n(z-order list)"]
        BoxProperties["BoxProperties\n(class, review, lock, note)"]
    end

    subgraph Stores["Zustand stores"]
        ProjectStore["projectStore\n(activeProject, images, classes)"]
        CanvasStore["canvasStore\n(zoom, pan, drawing, selectedBoxId)"]
        UiStore["uiStore\n(activeImageId)"]
    end

    Home --> ProjectStore
    Workspace --> WorkspaceLayout
    WorkspaceLayout --> Sidebar
    WorkspaceLayout --> Canvas
    WorkspaceLayout --> Panel
    Canvas --> CanvasStore
    Panel --> ProjectStore
    Sidebar --> UiStore
```

---

## Annotation canvas interaction state machine

```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> Drawing : pointerdown on empty area\n(drawing mode active)
    Idle --> Moving : pointerdown on box
    Idle --> Resizing : pointerdown on resize handle
    Idle --> Panning : pointerdown on empty area\n(drawing mode off)

    Drawing --> Idle : pointerup → save new box
    Moving --> Idle : pointerup → persist move
    Resizing --> Idle : pointerup → persist resize
    Panning --> Idle : pointerup

    Idle --> Idle : Delete/Backspace → delete selected box
    Idle --> Idle : scroll wheel → zoom
    Idle --> Idle : 1–9 → change active class
```

---

## Import flow

```mermaid
sequenceDiagram
    actor User
    participant UI as ImportDropzone
    participant UC as ImportDataset (use-case)
    participant ZR as ZipReader
    participant Repos as Repositories (Dexie)

    User->>UI: drops ZIP file
    UI->>UC: importDataset(zipBytes)
    UC->>ZR: readZip(zipBytes) — path-traversal check
    ZR-->>UC: entries Map

    alt meta/project.json present
        UC->>UC: parse + Zod validate → baseProject
    end
    alt dataset.ndjson present
        UC->>UC: parseNdjson → images + classNames
    else labelstudio.json present
        UC->>UC: parseLabelStudio → images + classNames
    end

    UC->>UC: merge (meta wins for UI state)
    UC->>Repos: project.create(finalProject)
    UC->>Repos: blob.save(key, blob) per image
    UC-->>UI: { project, warnings }
    UI->>User: redirect to /workspace?id=
```

---

## Export flow

```mermaid
sequenceDiagram
    actor User
    participant UI as AnnotationPanel / useExport
    participant UC as ExportDataset (use-case)
    participant ZW as ZipWriter
    participant Repos as Repositories

    User->>UI: clicks "Export ZIP"
    UI->>UC: exportDataset(projectId)
    UC->>Repos: project.findById + image.findByProject
    UC->>UC: check export gate (blockIncompleteImages)

    alt gate blocked
        UC-->>UI: ExportGateBlocked { incompleteImages }
        UI->>User: warning dialog
        User->>UI: "Export anyway"
        UI->>UC: exportDataset(projectId, forceIncomplete=true)
    end

    UC->>UC: applySplitPolicy (auto-val at ~10%)
    UC->>UC: serializeToNdjson
    UC->>UC: serializeToDataYaml (if enabled)
    UC->>UC: serializeToLabelStudio (if enabled)
    UC->>Repos: blob.get per image
    UC->>UC: serializeImageToYoloTxt per image (if enabled)
    UC->>ZW: buildZip(entries)
    ZW-->>UC: Uint8Array
    UC-->>UI: ExportSuccess { zip, warnings }
    UI->>User: browser download
```

---

## Folder layout

```
/
├── src/                          business repo root (Next.js src/ convention)
│   ├── app/                      Next.js App Router (routing only)
│   │   ├── page.tsx              → ProjectList
│   │   └── workspace/
│   │       ├── page.tsx
│   │       └── WorkspaceClient.tsx   → full annotation workspace
│   │
│   ├── common/
│   │   ├── domain/
│   │   │   ├── annotations/      BoxAnnotation, review states
│   │   │   ├── classes/          ClassDef, CLASS_PACKS registry, all packs
│   │   │   └── dataset/          Project, ImageRecord, ExportOptions, Zod schemas
│   │   ├── application/
│   │   │   ├── use-cases/        CreateProject, ExportDataset, ImportDataset, …
│   │   │   └── services/         HashService, SplitPolicy
│   │   └── infrastructure/
│   │       ├── parsers/          NdjsonParser, LabelStudioParser, YoloTxtParser
│   │       ├── persistence/      Dexie db, ProjectRepository, ImageRepository, BlobRepository
│   │       ├── serializers/      NdjsonSerializer, YoloTxtSerializer, YamlSerializer, LabelStudioSerializer
│   │       └── zip/              ZipReader (path-traversal protected), ZipWriter
│   └── ui/
│       ├── components/           AnnotationCanvas, AnnotationPanel, ImageSidebar, …
│       ├── hoc/                  withClientOnly, withErrorBoundary
│       ├── hooks/                useCanvas, useClasses, useAnnotations, …
│       ├── layouts/              WorkspaceLayout
│       └── stores/               projectStore, canvasStore, uiStore
│
├── tests/
│   ├── unit/                     Vitest — serializers, parsers, use-cases
│   ├── integration/              Vitest + fake-indexeddb — repositories
│   └── e2e/                      Playwright — full annotation flow
│
├── docs/
│   ├── README.md                 ← you are here
│   ├── architecture.md
│   ├── data-model.md
│   ├── export-contract.md
│   └── adr/
│
├── infra/
│   └── hosting/
│
└── tsconfig.json                 @/* → ./src/*
```

> **Path alias:** `@/*` maps to `./src/*` in both `tsconfig.json` and `vitest.config.ts`.
> There are no `@/app/...` imports — intra-`src/app/` references use relative paths.
