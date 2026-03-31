---
name: validate-export
description: Validate a local export zip against the openlabel export contract
---

You are validating an openlabel export zip against the export contract defined in AGENTS.md section 6.

**Input:** path to a zip file, passed as $ARGUMENTS. If not provided, look for the most recently modified `*.zip` in the project root.

**Checks to run (fail fast on first error in each category):**

### Structure
- [ ] `dataset.ndjson` present
- [ ] `data.yaml` present
- [ ] `meta/project.json` present
- [ ] `images/train/` directory present
- [ ] `labels/train/` directory present
- [ ] No `../` path components in any zip entry

### `dataset.ndjson`
- [ ] Line 1 is valid JSON with `"type": "dataset"`, `"task": "detect"`, `"class_names"` array
- [ ] `class_names` is zero-indexed (IDs match array positions)
- [ ] All subsequent lines are valid JSON with `"type": "image"`
- [ ] Every image record has: `file`, `split`, `width`, `height`, `annotations`
- [ ] `annotations.boxes` is an array; each element is `[int, float, float, float, float]`
- [ ] All box coordinates are in `[0, 1]`
- [ ] All class IDs reference valid indices in `class_names`
- [ ] No UI-only fields (`zIndex`, `review`, `color`, `locked`) present in image records

### YOLO txt files
- [ ] Every image record has a matching `labels/{split}/{stem}.txt`
- [ ] Box count in txt matches `tp`-only count in `dataset.ndjson` for that image
- [ ] Negative images have an empty (0-byte) txt file

### `data.yaml`
- [ ] `names` list length equals `class_names` length
- [ ] `train` path present; `val` present if dataset has ≥ 2 images

### Images
- [ ] Every `file` referenced in NDJSON has a corresponding file in `images/{split}/`
- [ ] No orphaned image files not referenced in NDJSON

### Meta
- [ ] `meta/project.json` is valid JSON
- [ ] Contains `classes`, `images` arrays

**Output:** a markdown report listing PASS / FAIL for each check with file:line references for failures.
If all checks pass, print `✓ Export contract satisfied.`
If any check fails, print `✗ Export contract violated — see failures above.` and exit non-zero.
