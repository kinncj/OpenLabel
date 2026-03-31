# ADR 006 — Label Studio import/export compatibility

**Status:** Accepted

## Context

Label Studio is a widely-used open-source annotation platform. Teams often start in Label Studio and want to migrate to openlabel (or vice versa), or use both tools for different review workflows. Supporting Label Studio JSON format lowers the friction of that migration.

## Decision

Add optional Label Studio JSON support at the serializer/parser layer, controlled by `ExportOptions.includeLabelStudio`.

**Export:** `LabelStudioSerializer.serializeToLabelStudio(project)` produces a `labelstudio.json` file included in the export zip when `includeLabelStudio = true`. Only `tp` boxes are exported (same rule as NDJSON).

**Import:** `LabelStudioParser.parseLabelStudio(raw)` handles `labelstudio.json` as priority 2b in `ImportDataset` — after `meta/project.json` and `dataset.ndjson`, before failing. Class names are inferred from `rectanglelabels` in order of first appearance.

## Coordinate system

Label Studio uses top-left percentage coordinates `[0, 100]`. openlabel uses YOLO center-normalized `[0, 1]`. Conversion is applied in both serializer and parser.

| Direction | x_center | y_center |
|---|---|---|
| YOLO → LS | `(x - w/2) × 100` | `(y - h/2) × 100` |
| LS → YOLO | `(x + w/2) / 100` | `(y + h/2) / 100` |

## Limitations

- Images are matched by filename only (the `data.image` URL is basename-stripped). Remote URLs in imported LS files are never fetched.
- LS `predictions` objects are ignored on import — only `annotations` are read.
- Only the first non-cancelled annotation per task is used.
- Split information is not present in LS format; all imported images default to `train`.

## Consequences

- `ExportOptions` gains `includeLabelStudio: boolean` (defaults `false`).
- The Zod schema uses `.default(false)` so existing persisted projects validate without the new field.
- No new dependencies — the LS format is plain JSON, handled by the existing Zod + fflate stack.
