import type { ClassDef } from "@/common/domain/classes/types";

const VOC_NAMES = [
  "aeroplane", "bicycle", "bird", "boat", "bottle",
  "bus", "car", "cat", "chair", "cow",
  "diningtable", "dog", "horse", "motorbike", "person",
  "pottedplant", "sheep", "sofa", "train", "tvmonitor",
];

const VOC_COLORS = [
  "#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4",
  "#42d4f4", "#f032e6", "#bfef45", "#fabed4", "#469990",
  "#dcbeff", "#9a6324", "#800000", "#aaffc3", "#808000",
  "#ffd8b1", "#000075", "#a9a9a9", "#ffffff", "#42d4f4",
];

export const voc20Classes: ClassDef[] = VOC_NAMES.map((name, i) => ({
  id: i,
  name,
  color: VOC_COLORS[i] ?? "#a9a9a9",
  source: "preset",
}));
