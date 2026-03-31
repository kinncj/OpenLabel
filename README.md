# openlabel

Browser-only YOLO detection dataset annotator. No backend, no accounts, no upload. Your images stay on your machine — everything lives in IndexedDB.

---

## What it does

- Draw, move, and resize bounding boxes on images
- Assign classes from built-in presets (COCO, VOC, LVIS, Open Images, xView, …) or define your own
- Mark boxes as TP / FP / ignore for review workflows
- Export a zip: `dataset.ndjson` + YOLO txt labels + `data.yaml` + optional Label Studio JSON
- Re-import that zip losslessly — review states, z-order, and colors survive the round-trip
- Auto-splits train/val if you forget

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export → out/
```

Serve the `out/` folder from any static host (GitHub Pages, Netlify, a local `python -m http.server`).

---

## Preset class packs

| Pack | Classes | Domain |
|---|---|---|
| COCO-80 | 80 | Everyday objects |
| VOC-20 | 20 | PASCAL VOC benchmark |
| Objects365 | 365 | Large-scale everyday |
| Open Images V7 | 601 | Google broad categories |
| LVIS | 1203 | Long-tail fine-grained |
| VisDrone-10 | 10 | Drone footage |
| xView-60 | 60 | Satellite imagery |
| Global Wheat | 1 | Spike detection |
| Brain Tumor | 2 | Medical MRI |
| African Wildlife | 4 | Buffalo / elephant / rhino / zebra |
| Signature | 1 | Document signatures |
| Medical Pills | 1 | Pill detection |

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `1`–`9` | Select class |
| `Delete` / `Backspace` | Delete selected box |
| Scroll wheel | Zoom |
| Middle-click drag | Pan |
| Drag empty area | Pan |

---

## Export format

```
export.zip
├── dataset.ndjson       ← canonical, training-safe
├── data.yaml            ← Ultralytics-compatible
├── images/{train,val,test}/
├── labels/{train,val,test}/   ← YOLO txt (one file per image)
├── labelstudio.json     ← optional Label Studio JSON
└── meta/project.json   ← round-trip UI metadata
```

Only `tp` (true-positive) boxes go into `dataset.ndjson` and YOLO txt. `fp` and `ignore` boxes are kept in `meta/project.json` only — they never contaminate training data.

---

## Stack

| Concern | Library |
|---|---|
| Framework | Next.js 15 (App Router, static export) |
| Language | TypeScript strict |
| State | Zustand 5 |
| Persistence | Dexie 4 (IndexedDB) |
| Validation | Zod 3 |
| Zip I/O | fflate 0.8 |
| Canvas | SVG (inline) |
| Tests | Vitest 2 + Playwright |

---

## Docs

- [Architecture](docs/architecture.md)
- [Data model](docs/data-model.md)
- [Export contract](docs/export-contract.md)
- [ADR index](docs/README.md)

---

## License

AGPLv3 — see [LICENSE](./LICENSE)
