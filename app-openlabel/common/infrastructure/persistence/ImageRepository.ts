import type { ImageRecord } from "@/common/domain/dataset/types";
import type { BoxAnnotation } from "@/common/domain/annotations/types";
import type { IImageRepository } from "@/common/infrastructure/persistence/interfaces";
import type { OpenLabelDb } from "@/common/infrastructure/persistence/db";

export class ImageRepository implements IImageRepository {
  constructor(private readonly db: OpenLabelDb) {}

  async addImages(projectId: string, images: ImageRecord[]): Promise<void> {
    await this.db.transaction("rw", this.db.images, async () => {
      const rows = images.map((img) => ({ ...img, projectId }));
      await this.db.images.bulkAdd(rows);
    });
  }

  async findByProject(projectId: string): Promise<ImageRecord[]> {
    const rows = await this.db.images.where("projectId").equals(projectId).toArray();
    return rows.map(({ projectId: _pid, ...img }) => img as ImageRecord);
  }

  async findById(id: string): Promise<ImageRecord | undefined> {
    const row = await this.db.images.get(id);
    if (!row) return undefined;
    const { projectId: _pid, ...img } = row;
    return img as ImageRecord;
  }

  async saveAnnotations(imageId: string, annotations: BoxAnnotation[]): Promise<void> {
    await this.db.images.update(imageId, { annotations });
  }

  async findByHash(projectId: string, hash: string): Promise<ImageRecord | undefined> {
    const row = await this.db.images
      .where("[projectId+split]")
      .between([projectId], [projectId, "\uffff"])
      .filter((img) => img.hash === hash)
      .first();
    if (!row) return undefined;
    const { projectId: _pid, ...img } = row;
    return img as ImageRecord;
  }

  async delete(imageId: string): Promise<void> {
    await this.db.images.delete(imageId);
  }

  async updateSplit(imageId: string, split: ImageRecord["split"]): Promise<void> {
    await this.db.images.update(imageId, { split });
  }

  async updateReviewState(
    imageId: string,
    reviewState: ImageRecord["reviewState"],
  ): Promise<void> {
    await this.db.images.update(imageId, { reviewState });
  }
}
