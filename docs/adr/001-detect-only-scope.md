# ADR 001 — Detect-only scope for v1

**Status:** Accepted

## Context

A dataset annotation tool can support many tasks: object detection (detect), instance segmentation (segment), pose estimation (pose), oriented bounding boxes (OBB), and image classification. Supporting all of these in v1 would significantly increase complexity.

## Decision

v1 supports only YOLO `detect` task (axis-aligned bounding boxes). All other tasks (segment, pose, OBB, classification, SAM, inference) are out of scope.

## Consequences

- The data model (`BoxAnnotation`) only needs to store bounding box coordinates — no polygon vertices, keypoints, or rotation angles.
- The export contract is simpler: one format (NDJSON + YOLO txt) with a stable, well-understood schema.
- The canvas interaction model is simpler: draw rectangles only.
- Future tasks can be added via ADR when the v1 core is stable.
