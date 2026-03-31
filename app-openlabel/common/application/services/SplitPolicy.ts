import type { ImageRecord } from "@/common/domain/dataset/types";

/**
 * Auto-assigns ~10% of all-train datasets to val.
 * Manual split assignments are respected — if any image is not "train",
 * the policy is a no-op.
 * Uses a deterministic hash-based selection so the same input always
 * produces the same val set.
 */
export function applySplitPolicy(images: ImageRecord[]): ImageRecord[] {
  if (images.length === 0) return images;

  const allTrain = images.every((img) => img.split === "train");
  if (!allTrain) return images;
  if (images.length < 2) return images;

  // Sort by hash for determinism, then pick ~10% (minimum 1) for val
  const sorted = [...images].sort((a, b) => a.hash.localeCompare(b.hash));
  const valCount = Math.max(1, Math.round(images.length * 0.1));
  const valSet = new Set(sorted.slice(0, valCount).map((img) => img.id));

  return images.map((img) => ({
    ...img,
    split: valSet.has(img.id) ? ("val" as const) : img.split,
  }));
}
