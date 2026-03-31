# ADR 003 — Sidecar metadata strategy (meta/project.json)

**Status:** Accepted

## Context

Training annotations and UI state serve different audiences. A model trainer only needs `class_id x y w h`. A reviewer needs z-order, review states, lock/hide flags, and notes. Mixing these in the training format would require stripping them before training and risks accidental inclusion of UI metadata in training pipelines.

## Decision

The zip export contains two layers:
1. `dataset.ndjson` — training-safe canonical format with only `tp` boxes and no UI fields
2. `meta/project.json` — full round-trip sidecar with all UI state including `fp`/`ignore` boxes, z-order, review states, colors, and notes

On re-import, `meta/project.json` takes priority for UI state; `dataset.ndjson` is authoritative for training annotations.

## Consequences

- Round-trip import is lossless for all data including reviewer annotations.
- Training pipelines that only consume `dataset.ndjson` are never exposed to UI metadata.
- `fp` boxes are never accidentally treated as negative-class training samples.
- `meta/project.json` must be versioned to support future schema migrations.
