# Data model

---

## Domain types

```mermaid
classDiagram
    class Project {
        +string id
        +string name
        +string? description
        +number version
        +string createdAt
        +string updatedAt
        +ClassDef[] classes
        +ImageRecord[] images
        +ExportOptions exportOptions
    }

    class ImageRecord {
        +string id
        +string fileName
        +string storedBlobKey
        +number width
        +number height
        +Split split
        +ImageReviewState reviewState
        +BoxAnnotation[] annotations
        +string hash
    }

    class BoxAnnotation {
        +string id
        +number classId
        +number x
        +number y
        +number w
        +number h
        +number zIndex
        +BoxReviewState review
        +boolean locked
        +boolean hidden
        +string? note
    }

    class ClassDef {
        +number id
        +string name
        +string color
        +ClassSource source
    }

    class ExportOptions {
        +boolean includeYaml
        +boolean includeTxtLabels
        +boolean includeLabelStudio
        +boolean blockIncompleteImages
    }

    Project "1" --> "many" ImageRecord : images
    Project "1" --> "many" ClassDef : classes
    Project "1" --> "1" ExportOptions : exportOptions
    ImageRecord "1" --> "many" BoxAnnotation : annotations
    BoxAnnotation --> ClassDef : classId
```

**Coordinate system:** `x`, `y`, `w`, `h` are normalized to `[0, 1]` in YOLO center format.
`x` and `y` are the center of the box, not the top-left corner.

---

## Review state machines

### Image review state

```mermaid
stateDiagram-v2
    [*] --> incomplete : image added

    incomplete --> complete : annotator marks done
    incomplete --> negative : annotator marks no objects
    complete --> incomplete : annotator re-opens
    complete --> negative : annotator changes decision
    negative --> incomplete : annotator changes decision
    negative --> complete : annotator adds boxes
```

### Box review state

```mermaid
stateDiagram-v2
    [*] --> tp : box drawn

    tp --> fp : reviewer marks false positive
    tp --> ignore : reviewer marks ignore
    fp --> tp : reviewer corrects
    fp --> ignore : reviewer changes
    ignore --> tp : reviewer corrects
    ignore --> fp : reviewer changes
```

Only `tp` boxes appear in `dataset.ndjson` and YOLO txt labels.
`fp` and `ignore` are preserved in `meta/project.json` for review traceability but never enter training data.

---

## Split assignment

```mermaid
flowchart TD
    A[Image added] --> B{Split set manually?}
    B -- yes --> C[Use manual split]
    B -- no --> D{total images ≥ 2?}
    D -- no --> E[assign train]
    D -- yes --> F{~10% val quota filled?}
    F -- no --> G[assign val]
    F -- yes --> E
```

`test` split is never auto-assigned — only set manually per image.

---

## Class pack registry

```mermaid
graph LR
    subgraph Registry["CLASS_PACKS array"]
        P1["COCO-80 (80)"]
        P2["VOC-20 (20)"]
        P3["Objects365 (365)"]
        P4["Open Images V7 (601)"]
        P5["LVIS (1203)"]
        P6["VisDrone-10 (10)"]
        P7["xView-60 (60)"]
        P8["Global Wheat (1)"]
        P9["Brain Tumor (2)"]
        P10["African Wildlife (4)"]
        P11["Signature (1)"]
        P12["Medical Pills (1)"]
    end

    subgraph Map["CLASS_PACK_REGISTRY Map"]
        K["id → ClassDef[]"]
    end

    subgraph UI["ClassManager component"]
        D["Import preset dropdown"]
    end

    Registry --> Map
    Map --> UI

    style P5 fill:#2a1a4e,color:#ccc
    style P4 fill:#1a2a4e,color:#ccc
    style P3 fill:#1a3a2e,color:#ccc
```

Colors for packs with more than 20 classes are generated via golden-angle HSL rotation
(`h = (i × 137.508) mod 360`) to guarantee maximum visual separation regardless of palette size.

---

## IndexedDB schema (Dexie)

```mermaid
erDiagram
    projects {
        string id PK
        string name
        string createdAt
        string updatedAt
        number version
        json classes
        json exportOptions
    }

    images {
        string id PK
        string projectId FK
        string fileName
        string storedBlobKey FK
        number width
        number height
        string split
        string reviewState
        json annotations
        string hash
    }

    blobs {
        string hash PK
        blob data
    }

    projects ||--o{ images : "projectId"
    images }o--|| blobs : "storedBlobKey / hash"
```

`blobs` are content-addressed by SHA-256 hash. Uploading the same image twice stores it once.
Deleting a project removes blobs that are no longer referenced by any other project.
