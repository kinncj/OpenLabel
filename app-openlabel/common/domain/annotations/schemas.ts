import { z } from "zod";

export const BoxReviewStateSchema = z.enum(["tp", "fp", "ignore"]);

export const BoxAnnotationSchema = z.object({
  id: z.string().uuid(),
  classId: z.number().int().nonnegative(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1),
  h: z.number().min(0).max(1),
  zIndex: z.number().int(),
  review: BoxReviewStateSchema,
  locked: z.boolean(),
  hidden: z.boolean(),
  note: z.string().optional(),
});

export type BoxAnnotationInput = z.input<typeof BoxAnnotationSchema>;
