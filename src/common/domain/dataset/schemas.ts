import { z } from "zod";
import { BoxAnnotationSchema } from "@/common/domain/annotations/schemas";
import { ClassDefSchema } from "@/common/domain/classes/schemas";

export const SplitSchema = z.enum(["train", "val", "test"]);
export const ImageReviewStateSchema = z.enum(["complete", "incomplete", "negative"]);

export const ExportOptionsSchema = z.object({
  includeYaml: z.boolean(),
  includeTxtLabels: z.boolean(),
  includeLabelStudio: z.boolean().default(true),
  blockIncompleteImages: z.boolean(),
});

export const ImageRecordSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  storedBlobKey: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  split: SplitSchema,
  reviewState: ImageReviewStateSchema,
  annotations: z.array(BoxAnnotationSchema),
  hash: z.string().min(1),
});

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  version: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  classes: z.array(ClassDefSchema),
  images: z.array(ImageRecordSchema),
  exportOptions: ExportOptionsSchema,
});

// NDJSON-specific schemas (training format — no UI fields)
export const NdjsonBoxTupleSchema = z
  .tuple([
    z.number().int().nonnegative(), // class_id
    z.number().min(0).max(1), // x_center
    z.number().min(0).max(1), // y_center
    z.number().min(0).max(1), // width
    z.number().min(0).max(1), // height
  ])
  .describe("YOLO detect box: [class_id, x_center, y_center, width, height]");

export const NdjsonDatasetLineSchema = z.object({
  type: z.literal("dataset"),
  task: z.literal("detect"),
  class_names: z.array(z.string()),
});

export const NdjsonImageLineSchema = z.object({
  type: z.literal("image"),
  file: z.string().min(1),
  split: SplitSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  annotations: z.object({
    boxes: z.array(NdjsonBoxTupleSchema),
  }),
});

export type NdjsonDatasetLine = z.infer<typeof NdjsonDatasetLineSchema>;
export type NdjsonImageLine = z.infer<typeof NdjsonImageLineSchema>;
