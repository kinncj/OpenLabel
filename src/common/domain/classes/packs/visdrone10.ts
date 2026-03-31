import type { ClassDef } from "@/common/domain/classes/types";

// VisDrone-DET 2019 — drone-captured object detection
const VISDRONE_NAMES = [
  "pedestrian", "people", "bicycle", "car", "van",
  "truck", "tricycle", "awning-tricycle", "bus", "motor",
];

const VISDRONE_COLORS = [
  "#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4",
  "#42d4f4", "#f032e6", "#bfef45", "#fabed4", "#469990",
];

export const visdrone10Classes: ClassDef[] = VISDRONE_NAMES.map((name, i) => ({
  id: i,
  name,
  color: VISDRONE_COLORS[i] ?? "#a9a9a9",
  source: "preset",
}));
