import type { ClassDef } from "@/common/domain/classes/types";

// Color palette — 80 visually distinct hex colors with sufficient contrast
const PALETTE = [
  "#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4",
  "#42d4f4", "#f032e6", "#bfef45", "#fabed4", "#469990",
  "#dcbeff", "#9a6324", "#fffac8", "#800000", "#aaffc3",
  "#808000", "#ffd8b1", "#000075", "#a9a9a9", "#ffffff",
  "#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4",
  "#42d4f4", "#f032e6", "#bfef45", "#fabed4", "#469990",
  "#dcbeff", "#9a6324", "#fffac8", "#800000", "#aaffc3",
  "#808000", "#ffd8b1", "#000075", "#a9a9a9", "#ffffff",
  "#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4",
  "#42d4f4", "#f032e6", "#bfef45", "#fabed4", "#469990",
  "#dcbeff", "#9a6324", "#fffac8", "#800000", "#aaffc3",
  "#808000", "#ffd8b1", "#000075", "#a9a9a9", "#ffffff",
  "#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4",
  "#42d4f4", "#f032e6", "#bfef45", "#fabed4", "#469990",
  "#dcbeff", "#9a6324", "#fffac8", "#800000", "#aaffc3",
  "#808000", "#ffd8b1", "#000075", "#a9a9a9", "#ffffff",
];

const COCO_NAMES = [
  "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck",
  "boat", "traffic light", "fire hydrant", "stop sign", "parking meter", "bench",
  "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra",
  "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee",
  "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove",
  "skateboard", "surfboard", "tennis racket", "bottle", "wine glass", "cup",
  "fork", "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange",
  "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch",
  "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse",
  "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
  "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier",
  "toothbrush",
];

export const coco80Classes: ClassDef[] = COCO_NAMES.map((name, i) => ({
  id: i,
  name,
  color: PALETTE[i] ?? "#a9a9a9",
  source: "preset",
}));
