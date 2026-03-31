import { v4 as uuidv4 } from "uuid";
import type { BoxAnnotation } from "@/common/domain/annotations/types";

export class YoloTxtParseError extends Error {
  constructor(
    message: string,
    public readonly lineErrors: Array<{ line: number; message: string }>,
  ) {
    super(message);
    this.name = "YoloTxtParseError";
  }
}

export function parseYoloTxt(raw: string): BoxAnnotation[] {
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const annotations: BoxAnnotation[] = [];
  const lineErrors: Array<{ line: number; message: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const parts = lines[i]!.trim().split(/\s+/);

    if (parts.length !== 5) {
      lineErrors.push({ line: lineNum, message: `Expected 5 fields, got ${parts.length}` });
      continue;
    }

    const [rawClassId, rawX, rawY, rawW, rawH] = parts as [
      string,
      string,
      string,
      string,
      string,
    ];
    const classId = parseInt(rawClassId, 10);
    const x = parseFloat(rawX);
    const y = parseFloat(rawY);
    const w = parseFloat(rawW);
    const h = parseFloat(rawH);

    if (!Number.isInteger(classId) || classId < 0) {
      lineErrors.push({ line: lineNum, message: `Invalid class_id: ${rawClassId}` });
      continue;
    }

    for (const [name, val] of [
      ["x", x],
      ["y", y],
      ["w", w],
      ["h", h],
    ] as [string, number][]) {
      if (isNaN(val) || val < 0 || val > 1) {
        lineErrors.push({ line: lineNum, message: `${name} out of range [0,1]: ${val}` });
      }
    }

    if (lineErrors.some((e) => e.line === lineNum)) continue;

    annotations.push({
      id: uuidv4(),
      classId,
      x,
      y,
      w,
      h,
      zIndex: i,
      review: "tp",
      locked: false,
      hidden: false,
    });
  }

  if (lineErrors.length > 0) {
    throw new YoloTxtParseError(
      `YOLO txt parse failed with ${lineErrors.length} error(s)`,
      lineErrors,
    );
  }

  return annotations;
}
