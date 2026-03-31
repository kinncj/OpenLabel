import { v4 as uuidv4 } from "uuid";
import type { ImageRecord } from "@/common/domain/dataset/types";
import type {
  IImageRepository,
  IBlobRepository,
} from "@/common/infrastructure/persistence/interfaces";
import { sha256 } from "@/common/application/services/HashService";

export type AddImagesResult = {
  added: ImageRecord[];
  failed: Array<{ fileName: string; reason: string }>;
};

async function decodeImageDimensions(
  buffer: ArrayBuffer,
  mimeType: string,
): Promise<{ width: number; height: number }> {
  const blob = new Blob([buffer], { type: mimeType });
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;
  bitmap.close();
  return { width, height };
}

export async function addImages(
  projectId: string,
  files: File[],
  imageRepo: IImageRepository,
  blobRepo: IBlobRepository,
): Promise<AddImagesResult> {
  const added: ImageRecord[] = [];
  const failed: Array<{ fileName: string; reason: string }> = [];

  for (const file of files) {
    try {
      const buffer = await file.arrayBuffer();
      const hash = await sha256(buffer);

      // Dedup within this project
      const existing = await imageRepo.findByHash(projectId, hash);
      if (existing) {
        failed.push({ fileName: file.name, reason: "Duplicate image (already in project)" });
        continue;
      }

      let dimensions: { width: number; height: number };
      try {
        dimensions = await decodeImageDimensions(buffer, file.type || "image/jpeg");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        failed.push({ fileName: file.name, reason: `Failed to decode image: ${msg}` });
        continue;
      }

      const blob = new Blob([buffer], { type: file.type || "image/jpeg" });
      await blobRepo.save(hash, blob);

      const record: ImageRecord = {
        id: uuidv4(),
        fileName: file.name,
        storedBlobKey: hash,
        width: dimensions.width,
        height: dimensions.height,
        split: "train",
        reviewState: "incomplete",
        annotations: [],
        hash,
      };

      await imageRepo.addImages(projectId, [record]);
      added.push(record);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failed.push({ fileName: file.name, reason: msg });
    }
  }

  return { added, failed };
}
