import type { BoxAnnotation } from "@/common/domain/annotations/types";
import type { IImageRepository } from "@/common/infrastructure/persistence/interfaces";
import { BoxAnnotationSchema } from "@/common/domain/annotations/schemas";

export async function saveAnnotations(
  imageId: string,
  annotations: BoxAnnotation[],
  imageRepo: IImageRepository,
): Promise<void> {
  // Validate each annotation at the boundary
  for (const annotation of annotations) {
    const result = BoxAnnotationSchema.safeParse(annotation);
    if (!result.success) {
      throw new Error(`Invalid annotation data: ${result.error.message}`);
    }
  }

  await imageRepo.saveAnnotations(imageId, annotations);
}
