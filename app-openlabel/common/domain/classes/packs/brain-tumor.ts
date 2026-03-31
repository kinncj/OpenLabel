import type { ClassDef } from "@/common/domain/classes/types";

// Brain Tumor detection — negative vs positive
export const brainTumorClasses: ClassDef[] = [
  { id: 0, name: "negative", color: "#3cb44b", source: "preset" },
  { id: 1, name: "positive", color: "#e6194b", source: "preset" },
];
