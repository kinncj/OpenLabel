import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Dexie, { type Table } from "dexie";
import { setDb } from "@/common/infrastructure/persistence/db";
import { ImageRepository } from "@/common/infrastructure/persistence/ImageRepository";
import type { ImageRecord } from "@/common/domain/dataset/types";
import type { PersistedProject, PersistedImage, PersistedBlob } from "@/common/infrastructure/persistence/db";

// Fresh DB per test — fake-indexeddb shares global state for same-named DBs.
class TestDb extends Dexie {
  projects!: Table<PersistedProject, string>;
  images!: Table<PersistedImage, string>;
  blobs!: Table<PersistedBlob, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      projects: "id, name, updatedAt",
      images: "id, projectId, hash, [projectId+split]",
      blobs: "key",
    });
  }
}

let _counter = 0;
function freshDb() {
  return new TestDb(`openlabel-img-test-${++_counter}`);
}

function makeImage(overrides: Partial<ImageRecord> & { id?: string } = {}): ImageRecord {
  return {
    id: "img-0000-0000-0000-000000000001",
    fileName: "photo.jpg",
    storedBlobKey: "blob-key-abc",
    width: 800,
    height: 600,
    split: "train",
    reviewState: "incomplete",
    annotations: [],
    hash: "abc123",
    ...overrides,
  };
}

function makeAnnotation(overrides = {}) {
  return {
    id: "00000000-0000-4000-8000-aaaaaaaaaaaa",
    classId: 0,
    x: 0.1,
    y: 0.2,
    w: 0.3,
    h: 0.4,
    zIndex: 1,
    review: "tp" as const,
    locked: false,
    hidden: false,
    ...overrides,
  };
}

const PROJECT_ID = "project-000-0000-0000-000000000001";

describe("ImageRepository", () => {
  let db: TestDb;
  let repo: ImageRepository;

  beforeEach(() => {
    db = freshDb();
    setDb(db as any);
    repo = new ImageRepository(db as any);
  });

  afterEach(async () => {
    await db.delete();
  });

  describe("addImages()", () => {
    it("inserts multiple images for a project", async () => {
      const img1 = makeImage({ id: "img-0000-0000-0000-000000000001", fileName: "a.jpg" });
      const img2 = makeImage({ id: "img-0000-0000-0000-000000000002", fileName: "b.jpg" });
      await repo.addImages(PROJECT_ID, [img1, img2]);
      const rows = await db.images.where("projectId").equals(PROJECT_ID).toArray();
      expect(rows).toHaveLength(2);
    });

    it("tags each inserted image with the correct projectId", async () => {
      const img = makeImage();
      await repo.addImages(PROJECT_ID, [img]);
      const rows = await db.images.toArray();
      expect(rows[0].projectId).toBe(PROJECT_ID);
    });

    it("handles an empty array without throwing", async () => {
      await expect(repo.addImages(PROJECT_ID, [])).resolves.toBeUndefined();
    });

    it("does not mix images between projects", async () => {
      const img1 = makeImage({ id: "img-0000-0000-0000-000000000001" });
      const img2 = makeImage({ id: "img-0000-0000-0000-000000000002" });
      await repo.addImages("project-A", [img1]);
      await repo.addImages("project-B", [img2]);
      const rowsA = await db.images.where("projectId").equals("project-A").toArray();
      const rowsB = await db.images.where("projectId").equals("project-B").toArray();
      expect(rowsA).toHaveLength(1);
      expect(rowsB).toHaveLength(1);
    });
  });

  describe("findByProject()", () => {
    it("returns all images for a project", async () => {
      const img1 = makeImage({ id: "img-0000-0000-0000-000000000001", fileName: "a.jpg" });
      const img2 = makeImage({ id: "img-0000-0000-0000-000000000002", fileName: "b.jpg" });
      await repo.addImages(PROJECT_ID, [img1, img2]);
      const found = await repo.findByProject(PROJECT_ID);
      expect(found).toHaveLength(2);
    });

    it("returns empty array when project has no images", async () => {
      const found = await repo.findByProject("nonexistent-project");
      expect(found).toEqual([]);
    });

    it("strips projectId from returned ImageRecord objects", async () => {
      const img = makeImage();
      await repo.addImages(PROJECT_ID, [img]);
      const found = await repo.findByProject(PROJECT_ID);
      expect((found[0] as any).projectId).toBeUndefined();
    });
  });

  describe("findById()", () => {
    it("retrieves a specific image by id", async () => {
      const img = makeImage({ id: "img-0000-0000-0000-000000000001", fileName: "target.jpg" });
      await repo.addImages(PROJECT_ID, [img]);
      const found = await repo.findById("img-0000-0000-0000-000000000001");
      expect(found).toBeDefined();
      expect(found!.fileName).toBe("target.jpg");
    });

    it("returns undefined for a missing id", async () => {
      const found = await repo.findById("no-such-image");
      expect(found).toBeUndefined();
    });

    it("strips projectId from the returned ImageRecord", async () => {
      const img = makeImage();
      await repo.addImages(PROJECT_ID, [img]);
      const found = await repo.findById(img.id);
      expect((found as any).projectId).toBeUndefined();
    });
  });

  describe("saveAnnotations()", () => {
    it("updates annotations on the target image", async () => {
      const img = makeImage();
      await repo.addImages(PROJECT_ID, [img]);
      const ann = makeAnnotation();
      await repo.saveAnnotations(img.id, [ann]);
      const row = await db.images.get(img.id);
      expect(row!.annotations).toHaveLength(1);
      expect(row!.annotations[0].id).toBe(ann.id);
    });

    it("overwrites existing annotations", async () => {
      const img = makeImage({ annotations: [makeAnnotation()] });
      await repo.addImages(PROJECT_ID, [img]);
      await repo.saveAnnotations(img.id, []);
      const row = await db.images.get(img.id);
      expect(row!.annotations).toEqual([]);
    });

    it("saves multiple annotations at once", async () => {
      const img = makeImage();
      await repo.addImages(PROJECT_ID, [img]);
      const anns = [
        makeAnnotation({ id: "00000000-0000-4000-8000-aaaaaaaaaaaa" }),
        makeAnnotation({ id: "00000000-0000-4000-8000-bbbbbbbbbbbb" }),
      ];
      await repo.saveAnnotations(img.id, anns);
      const row = await db.images.get(img.id);
      expect(row!.annotations).toHaveLength(2);
    });
  });

  describe("findByHash()", () => {
    it("finds an image by projectId and hash", async () => {
      const img = makeImage({ hash: "deadbeef" });
      await repo.addImages(PROJECT_ID, [img]);
      const found = await repo.findByHash(PROJECT_ID, "deadbeef");
      expect(found).toBeDefined();
      expect(found!.id).toBe(img.id);
    });

    it("returns undefined when hash does not match", async () => {
      const img = makeImage({ hash: "deadbeef" });
      await repo.addImages(PROJECT_ID, [img]);
      const found = await repo.findByHash(PROJECT_ID, "cafebabe");
      expect(found).toBeUndefined();
    });

    it("returns undefined when projectId does not match", async () => {
      const img = makeImage({ hash: "deadbeef" });
      await repo.addImages(PROJECT_ID, [img]);
      const found = await repo.findByHash("other-project", "deadbeef");
      expect(found).toBeUndefined();
    });

    it("strips projectId from the returned record", async () => {
      const img = makeImage({ hash: "deadbeef" });
      await repo.addImages(PROJECT_ID, [img]);
      const found = await repo.findByHash(PROJECT_ID, "deadbeef");
      expect((found as any).projectId).toBeUndefined();
    });
  });

  describe("delete()", () => {
    it("removes the image from the table", async () => {
      const img = makeImage();
      await repo.addImages(PROJECT_ID, [img]);
      await repo.delete(img.id);
      const row = await db.images.get(img.id);
      expect(row).toBeUndefined();
    });

    it("does not remove other images", async () => {
      const img1 = makeImage({ id: "img-0000-0000-0000-000000000001" });
      const img2 = makeImage({ id: "img-0000-0000-0000-000000000002" });
      await repo.addImages(PROJECT_ID, [img1, img2]);
      await repo.delete(img1.id);
      const row2 = await db.images.get(img2.id);
      expect(row2).toBeDefined();
    });

    it("does not throw when deleting a non-existent image", async () => {
      await expect(repo.delete("ghost-image-id")).resolves.toBeUndefined();
    });
  });

  describe("updateSplit()", () => {
    it("changes the split field to 'val'", async () => {
      const img = makeImage({ split: "train" });
      await repo.addImages(PROJECT_ID, [img]);
      await repo.updateSplit(img.id, "val");
      const row = await db.images.get(img.id);
      expect(row!.split).toBe("val");
    });

    it("changes the split field to 'test'", async () => {
      const img = makeImage({ split: "train" });
      await repo.addImages(PROJECT_ID, [img]);
      await repo.updateSplit(img.id, "test");
      const row = await db.images.get(img.id);
      expect(row!.split).toBe("test");
    });

    it("does not affect other fields", async () => {
      const img = makeImage({ fileName: "keep.jpg", split: "train" });
      await repo.addImages(PROJECT_ID, [img]);
      await repo.updateSplit(img.id, "val");
      const row = await db.images.get(img.id);
      expect(row!.fileName).toBe("keep.jpg");
    });
  });

  describe("updateReviewState()", () => {
    it("changes reviewState to 'complete'", async () => {
      const img = makeImage({ reviewState: "incomplete" });
      await repo.addImages(PROJECT_ID, [img]);
      await repo.updateReviewState(img.id, "complete");
      const row = await db.images.get(img.id);
      expect(row!.reviewState).toBe("complete");
    });

    it("changes reviewState to 'negative'", async () => {
      const img = makeImage({ reviewState: "incomplete" });
      await repo.addImages(PROJECT_ID, [img]);
      await repo.updateReviewState(img.id, "negative");
      const row = await db.images.get(img.id);
      expect(row!.reviewState).toBe("negative");
    });

    it("does not affect other fields", async () => {
      const img = makeImage({ fileName: "stable.jpg", reviewState: "incomplete" });
      await repo.addImages(PROJECT_ID, [img]);
      await repo.updateReviewState(img.id, "complete");
      const row = await db.images.get(img.id);
      expect(row!.fileName).toBe("stable.jpg");
    });
  });
});
