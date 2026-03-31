# Export contract

This document is the authoritative spec for the openlabel zip format.
Serializers, parsers, and tests must all agree with what is written here.

---

## Zip structure

```
dataset-annotation-app-export.zip
├── dataset.ndjson            ← canonical training format (always present)
├── data.yaml                 ← Ultralytics YOLO config (opt-in)
├── images/
│   ├── train/
│   ├── val/
│   └── test/                 ← only present if any image has split=test
├── labels/
│   ├── train/
│   ├── val/
│   └── test/                 ← YOLO txt, one file per image (opt-in)
├── labelstudio.json          ← Label Studio JSON (opt-in)
└── meta/
    └── project.json          ← round-trip UI metadata (always present)
```

---

## dataset.ndjson

```mermaid
flowchart LR
    L1["Line 1 — dataset header\n{ type, task, class_names }"]
    L2["Line 2+ — image records\n{ type, file, split, width, height, annotations }"]
    L3["annotations.boxes\n[ [class_id, x, y, w, h], … ]"]

    L1 --> L2 --> L3
```

### Dataset header (line 1)

```json
{
  "type": "dataset",
  "task": "detect",
  "class_names": ["person", "car", "bicycle"]
}
```

- `class_names` is ordered by `ClassDef.id` (zero-indexed, stable within a project).

### Image record (lines 2+)

```json
{
  "type": "image",
  "file": "frame_001.jpg",
  "split": "train",
  "width": 1920,
  "height": 1080,
  "annotations": {
    "boxes": [
      [0, 0.512, 0.340, 0.210, 0.430],
      [1, 0.820, 0.650, 0.090, 0.120]
    ]
  }
}
```

- `boxes` format: `[class_id, x_center, y_center, width, height]` — all normalized `[0, 1]`.
- **Only `tp` boxes are exported.** `fp` and `ignore` boxes are never included.
- Negative image (no tp boxes): `"annotations": { "boxes": [] }`.
- No UI-only fields (`zIndex`, `review`, `color`, `locked`, `hidden`) appear here.

---

## data.yaml

```yaml
path: .
train: images/train
val: images/val
test: images/test       # omitted if no test split

nc: 3
names:
  0: person
  1: car
  2: bicycle
```

`test` key is omitted when no images have `split=test`.

---

## YOLO txt labels

One file per image at `labels/{split}/{stem}.txt`. Each line is one `tp` box:

```
0 0.512 0.340 0.210 0.430
1 0.820 0.650 0.090 0.120
```

Format: `class_id x_center y_center width height` (space-separated, normalized).
Negative images get an empty file (zero bytes).

---

## labelstudio.json

Optional. Enabled via `ExportOptions.includeLabelStudio = true`.

```mermaid
flowchart LR
    Task["Task object\n{ id, data.image, annotations }"]
    Ann["Annotation\n{ result[], was_cancelled }"]
    Result["Result object\n{ type: rectanglelabels,\nfrom_name, to_name,\noriginal_width, original_height }"]
    Value["Value\n{ x, y, width, height,\nrotation, rectanglelabels }"]

    Task --> Ann --> Result --> Value
```

```json
[
  {
    "id": 1,
    "data": { "image": "frame_001.jpg" },
    "annotations": [{
      "result": [{
        "from_name": "label",
        "to_name": "image",
        "type": "rectanglelabels",
        "value": {
          "x": 40.7, "y": 12.5, "width": 21.0, "height": 43.0,
          "rotation": 0,
          "rectanglelabels": ["person"]
        },
        "original_width": 1920,
        "original_height": 1080,
        "image_rotation": 0
      }],
      "was_cancelled": false
    }]
  }
]
```

**Coordinate system:** `x`, `y`, `width`, `height` are percentages `[0, 100]` of image dimensions.
`x` and `y` are the **top-left** corner (not center — unlike YOLO format).

### Conversion between formats

```mermaid
flowchart LR
    YOLO["YOLO center-normalized\nx_c, y_c, w, h  ∈ [0,1]"]
    LS["Label Studio top-left percent\nx, y, w, h  ∈ [0,100]"]

    YOLO -- "× 100\nx = (x_c - w/2) × 100\ny = (y_c - h/2) × 100" --> LS
    LS -- "÷ 100\nx_c = (x + w/2) / 100\ny_c = (y + h/2) / 100" --> YOLO
```

---

## meta/project.json

Full `Project` object serialized as JSON. Contains:
- All `ImageRecord` fields including `reviewState`, `hash`, `storedBlobKey`
- All `BoxAnnotation` fields including `review`, `zIndex`, `locked`, `hidden`, `note`
- `ClassDef` colors and `source`
- `ExportOptions`

This file is the highest-priority source during re-import. If present, it wins over `dataset.ndjson` for UI state.

---

## Import priority

```mermaid
flowchart TD
    Z[ZIP received]
    Z --> A{meta/project.json\npresent?}
    A -- yes --> B[Parse + Zod validate → baseProject]
    A -- no --> C{dataset.ndjson\npresent?}
    B --> D{dataset.ndjson\nalso present?}
    D -- yes --> E[Merge: NDJSON tp boxes override\nmeta tp boxes per image]
    D -- no --> F[Use meta as-is]
    E --> G[Store blobs from zip]
    F --> G
    C -- yes --> H[Parse NDJSON → images + class names]
    C -- no --> I{labelstudio.json\npresent?}
    I -- yes --> J[Parse Label Studio → images + class names]
    I -- no --> K[Error: no usable source]
    H --> G
    J --> G
    G --> L[Zod validate each ImageRecord]
    L --> M[project.create in IndexedDB]
```

---

## Security rules for import

- All zip paths are normalized before extraction — `../` traversal, Windows reserved names, null bytes, and leading `/` are all rejected.
- Per-file size limit: 10 MB.
- Total zip size limit: 2 GB.
- All NDJSON lines and Label Studio tasks are validated against Zod schemas before mutating state.
- Invalid lines are skipped with a warning; they do not abort the import.
- Remote URLs found inside imported files are never auto-fetched.
