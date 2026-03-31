import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import type { BoxAnnotation } from "@/common/domain/annotations/types";

// ── Zod schemas ──────────────────────────────────────────────────────────────

const LSValueSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().default(0),
  rectanglelabels: z.array(z.string()).min(1),
});

const LSResultSchema = z.object({
  type: z.literal("rectanglelabels"),
  value: LSValueSchema,
  original_width: z.number().int().positive().optional(),
  original_height: z.number().int().positive().optional(),
});

const LSAnnotationSchema = z.object({
  result: z.array(LSResultSchema),
  was_cancelled: z.boolean().default(false),
});

const LSTaskSchema = z.object({
  id: z.number().optional(),
  data: z.object({
    image: z.string().min(1),
  }),
  annotations: z.array(LSAnnotationSchema).default([]),
  predictions: z.array(z.unknown()).default([]),
});

const LSFileSchema = z.array(LSTaskSchema);

// ── Public types ─────────────────────────────────────────────────────────────

export type LabelStudioImage = {
  fileName: string;
  width: number;
  height: number;
  annotations: BoxAnnotation[];
};

export type LabelStudioParseResult = {
  classNames: string[];
  images: LabelStudioImage[];
};

export class LabelStudioParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LabelStudioParseError";
  }
}

// ── Parser ───────────────────────────────────────────────────────────────────

/**
 * Extracts just the filename from a URL or path.
 * e.g. "https://example.com/images/dog.jpg" → "dog.jpg"
 *       "/images/train/cat.png" → "cat.png"
 */
function extractFileName(imageField: string): string {
  const parts = imageField.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] ?? imageField;
}

export function parseLabelStudio(raw: string): LabelStudioParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new LabelStudioParseError("Label Studio file is not valid JSON");
  }

  const result = LSFileSchema.safeParse(parsed);
  if (!result.success) {
    throw new LabelStudioParseError(
      `Label Studio schema validation failed: ${result.error.message}`,
    );
  }

  // Collect all class names in order of first appearance
  const classIndexMap = new Map<string, number>();
  const classNames: string[] = [];

  function getOrAddClass(name: string): number {
    const existing = classIndexMap.get(name);
    if (existing !== undefined) return existing;
    const id = classNames.length;
    classNames.push(name);
    classIndexMap.set(name, id);
    return id;
  }

  const images: LabelStudioImage[] = [];

  for (const task of result.data) {
    const fileName = extractFileName(task.data.image);

    // Pick the first non-cancelled annotation
    const annotation = task.annotations.find((a) => !a.was_cancelled) ?? task.annotations[0];
    if (!annotation) {
      // No annotations for this task — add as image with no boxes
      images.push({ fileName, width: 0, height: 0, annotations: [] });
      continue;
    }

    const boxes: BoxAnnotation[] = [];
    let inferredWidth = 0;
    let inferredHeight = 0;

    for (let i = 0; i < annotation.result.length; i++) {
      const r = annotation.result[i]!;
      const label = r.value.rectanglelabels[0]!;
      const classId = getOrAddClass(label);

      if (r.original_width) inferredWidth = r.original_width;
      if (r.original_height) inferredHeight = r.original_height;

      // Convert LS percentage coords (top-left) → normalized center coords
      const x = (r.value.x + r.value.width / 2) / 100;
      const y = (r.value.y + r.value.height / 2) / 100;
      const w = r.value.width / 100;
      const h = r.value.height / 100;

      boxes.push({
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

    images.push({ fileName, width: inferredWidth, height: inferredHeight, annotations: boxes });
  }

  return { classNames, images };
}
