# ADR 002 — NDJSON as canonical export format

**Status:** Accepted

## Context

The export format determines interoperability, round-trip fidelity, and training pipeline compatibility. Options considered: JSON array, CSV, YOLO txt-only, NDJSON (newline-delimited JSON).

## Decision

`dataset.ndjson` is the canonical training-safe export. Each line is a self-contained JSON object. Line 1 is the dataset header; subsequent lines are image records.

## Rationale

- **Streamable**: large datasets can be read line-by-line without loading the entire file into memory.
- **Stable schema**: each line is independently valid, so a corrupt line doesn't invalidate the file.
- **Training-safe**: only `tp` (true positive) boxes appear in `annotations.boxes`. `fp` and `ignore` boxes are excluded so they don't corrupt training data.
- **Append-friendly**: new images can be added by appending lines.

## Consequences

- The NDJSON schema is locked per this ADR. Changes require a version bump and migration path.
- `data.yaml` and YOLO txt files are generated alongside NDJSON for direct Ultralytics compatibility but are not canonical.
- `meta/project.json` holds all UI-only state (review states, z-order, colors) that must not pollute training data.
