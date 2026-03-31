# openlabel — docs index

| Document | What it covers |
|---|---|
| [Architecture](architecture.md) | Layers, data flow, component map, folder layout |
| [Data model](data-model.md) | Domain types, state machines, class pack registry |
| [Export contract](export-contract.md) | Zip structure, NDJSON schema, YOLO txt, Label Studio |
| [ADR 001](adr/001-detect-only-scope.md) | Why v1 is detect-only |
| [ADR 002](adr/002-ndjson-canonical-export.md) | Why NDJSON is the canonical format |
| [ADR 003](adr/003-sidecar-metadata.md) | Why UI state lives in `meta/project.json` |
| [ADR 004](adr/004-browser-only-persistence.md) | Why IndexedDB, no backend |
| [ADR 005](adr/005-business-repo-structure.md) | Why `src/` wraps domain + UI |
| [ADR 006](adr/006-label-studio-compatibility.md) | Label Studio import/export strategy |

---

All architecture decisions that affect the public contract or repo structure need an ADR before merging.
New tasks beyond detect (segment, pose, OBB) need their own ADR when the time comes.
