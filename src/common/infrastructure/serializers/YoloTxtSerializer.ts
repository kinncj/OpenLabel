import type { ImageRecord } from "@/common/domain/dataset/types";

export function serializeImageToYoloTxt(image: ImageRecord): string {
  const tpBoxes = image.annotations.filter((a) => a.review === "tp");
  if (tpBoxes.length === 0) return "";

  return tpBoxes
    .map(
      (a) =>
        `${a.classId} ${a.x.toFixed(6)} ${a.y.toFixed(6)} ${a.w.toFixed(6)} ${a.h.toFixed(6)}`,
    )
    .join("\n");
}
