import type { IBlobRepository } from "@/common/infrastructure/persistence/interfaces";
import type { OpenLabelDb } from "@/common/infrastructure/persistence/db";

export class BlobRepository implements IBlobRepository {
  constructor(private readonly db: OpenLabelDb) {}

  async save(key: string, blob: Blob): Promise<void> {
    await this.db.blobs.put({ key, blob });
  }

  async get(key: string): Promise<Blob | undefined> {
    const row = await this.db.blobs.get(key);
    return row?.blob;
  }

  async delete(key: string): Promise<void> {
    await this.db.blobs.delete(key);
  }
}
