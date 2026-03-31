import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Dexie, { type Table } from "dexie";
import { setDb } from "@/common/infrastructure/persistence/db";
import { ProjectRepository } from "@/common/infrastructure/persistence/ProjectRepository";
import { BlobRepository } from "@/common/infrastructure/persistence/BlobRepository";
import type { Project } from "@/common/domain/dataset/types";
import type { PersistedProject, PersistedImage, PersistedBlob } from "@/common/infrastructure/persistence/db";

// Local subclass so each test gets an isolated DB name — avoids ConstraintErrors
// from fake-indexeddb sharing state across tests with the same "openlabel" name.
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
  return new TestDb(`openlabel-proj-test-${++_counter}`);
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Test Project",
    version: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    classes: [],
    images: [],
    exportOptions: {
      includeYaml: true,
      includeTxtLabels: true,
      includeLabelStudio: false,
      blockIncompleteImages: true,
    },
    ...overrides,
  };
}

function makeImage(overrides = {}) {
  return {
    id: "img-0000-0000-0000-000000000001",
    fileName: "cat.jpg",
    storedBlobKey: "hash-abc",
    width: 640,
    height: 480,
    split: "train" as const,
    reviewState: "incomplete" as const,
    annotations: [],
    hash: "hash-abc",
    ...overrides,
  };
}

describe("ProjectRepository", () => {
  let db: TestDb;
  let repo: ProjectRepository;

  beforeEach(() => {
    db = freshDb();
    setDb(db as any);
    repo = new ProjectRepository(db as any);
  });

  afterEach(async () => {
    await db.delete();
  });

  describe("create()", () => {
    it("stores a project and makes it retrievable", async () => {
      const project = makeProject();
      await repo.create(project);
      const stored = await db.projects.get(project.id);
      expect(stored).toBeDefined();
      expect(stored!.id).toBe(project.id);
      expect(stored!.name).toBe("Test Project");
    });

    it("strips the images array from the projects table row", async () => {
      const image = makeImage();
      const project = makeProject({ images: [image] });
      await repo.create(project);
      const stored = await db.projects.get(project.id);
      expect((stored as any).images).toBeUndefined();
    });

    it("inserts images into the images table when provided", async () => {
      const image = makeImage();
      const project = makeProject({ images: [image] });
      await repo.create(project);
      const images = await db.images.where("projectId").equals(project.id).toArray();
      expect(images).toHaveLength(1);
      expect(images[0].id).toBe(image.id);
      expect(images[0].projectId).toBe(project.id);
    });

    it("stores a project with description", async () => {
      const project = makeProject({ description: "a labelling project" });
      await repo.create(project);
      const stored = await db.projects.get(project.id);
      expect(stored!.description).toBe("a labelling project");
    });
  });

  describe("findById()", () => {
    it("retrieves a stored project by id", async () => {
      const project = makeProject();
      await repo.create(project);
      const found = await repo.findById(project.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(project.id);
      expect(found!.name).toBe(project.name);
    });

    it("returns undefined for an unknown id", async () => {
      const found = await repo.findById("no-such-id");
      expect(found).toBeUndefined();
    });

    it("re-attaches images when finding by id", async () => {
      const image = makeImage();
      const project = makeProject({ images: [image] });
      await repo.create(project);
      const found = await repo.findById(project.id);
      expect(found!.images).toHaveLength(1);
      expect(found!.images[0].id).toBe(image.id);
    });

    it("returns empty images array when no images were stored", async () => {
      const project = makeProject();
      await repo.create(project);
      const found = await repo.findById(project.id);
      expect(found!.images).toEqual([]);
    });
  });

  describe("findAll()", () => {
    it("returns an empty array when no projects exist", async () => {
      const all = await repo.findAll();
      expect(all).toEqual([]);
    });

    it("returns all stored projects", async () => {
      const p1 = makeProject({ id: "00000000-0000-4000-8000-000000000001", name: "Alpha" });
      const p2 = makeProject({ id: "00000000-0000-4000-8000-000000000002", name: "Beta" });
      await repo.create(p1);
      await repo.create(p2);
      const all = await repo.findAll();
      expect(all).toHaveLength(2);
      const names = all.map((p) => p.name);
      expect(names).toContain("Alpha");
      expect(names).toContain("Beta");
    });

    it("returns projects without images (images are [])", async () => {
      const image = makeImage();
      const project = makeProject({ images: [image] });
      await repo.create(project);
      const all = await repo.findAll();
      expect(all[0].images).toEqual([]);
    });

    it("orders results by updatedAt descending", async () => {
      const older = makeProject({
        id: "00000000-0000-4000-8000-000000000001",
        name: "Older",
        updatedAt: "2024-01-01T00:00:00.000Z",
      });
      const newer = makeProject({
        id: "00000000-0000-4000-8000-000000000002",
        name: "Newer",
        updatedAt: "2024-06-01T00:00:00.000Z",
      });
      await repo.create(older);
      await repo.create(newer);
      const all = await repo.findAll();
      expect(all[0].name).toBe("Newer");
      expect(all[1].name).toBe("Older");
    });
  });

  describe("save()", () => {
    it("updates name on existing project", async () => {
      const project = makeProject({ name: "Original" });
      await repo.create(project);
      await repo.save({ ...project, name: "Updated", images: [] });
      const stored = await db.projects.get(project.id);
      expect(stored!.name).toBe("Updated");
    });

    it("updates description", async () => {
      const project = makeProject();
      await repo.create(project);
      await repo.save({ ...project, description: "new desc", images: [] });
      const stored = await db.projects.get(project.id);
      expect(stored!.description).toBe("new desc");
    });

    it("updates version", async () => {
      const project = makeProject({ version: 1 });
      await repo.create(project);
      await repo.save({ ...project, version: 2, images: [] });
      const stored = await db.projects.get(project.id);
      expect(stored!.version).toBe(2);
    });
  });

  describe("delete()", () => {
    it("removes the project row", async () => {
      const project = makeProject();
      await repo.create(project);
      await repo.delete(project.id);
      const stored = await db.projects.get(project.id);
      expect(stored).toBeUndefined();
    });

    it("removes associated images", async () => {
      const image = makeImage();
      const project = makeProject({ images: [image] });
      await repo.create(project);
      await repo.delete(project.id);
      const images = await db.images.where("projectId").equals(project.id).toArray();
      expect(images).toHaveLength(0);
    });

    it("does not throw when deleting a non-existent project", async () => {
      await expect(repo.delete("ghost-id")).resolves.toBeUndefined();
    });

    it("cascades: removes blobs that are only referenced by this project", async () => {
      const image = makeImage({ hash: "exclusive-blob-hash", storedBlobKey: "exclusive-blob-hash" });
      const project = makeProject({ images: [image] });
      await repo.create(project);

      const blobRepo = new BlobRepository(db as any);
      await blobRepo.save("exclusive-blob-hash", new Blob(["data"]));

      expect(await blobRepo.get("exclusive-blob-hash")).toBeDefined();

      await repo.delete(project.id);

      expect(await blobRepo.get("exclusive-blob-hash")).toBeUndefined();
    });

    it("cascades: keeps blobs shared with another project", async () => {
      const sharedHash = "shared-blob-hash";
      const img1 = makeImage({
        id: "img-0000-0000-0000-000000000001",
        hash: sharedHash,
        storedBlobKey: sharedHash,
      });
      const img2 = makeImage({
        id: "img-0000-0000-0000-000000000002",
        hash: sharedHash,
        storedBlobKey: sharedHash,
      });
      const p1 = makeProject({ id: "00000000-0000-4000-8000-000000000001", images: [img1] });
      const p2 = makeProject({ id: "00000000-0000-4000-8000-000000000002", images: [img2] });
      await repo.create(p1);
      await repo.create(p2);

      const blobRepo = new BlobRepository(db as any);
      await blobRepo.save(sharedHash, new Blob(["data"]));

      await repo.delete(p1.id);

      expect(await blobRepo.get(sharedHash)).toBeDefined();
    });
  });
});
