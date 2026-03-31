import { describe, it, expect, vi } from "vitest";
import type { Project, ImageRecord } from "@/common/domain/dataset/types";
import type {
  IProjectRepository,
  IImageRepository,
  IBlobRepository,
} from "@/common/infrastructure/persistence/interfaces";
import { exportDataset } from "@/common/application/use-cases/ExportDataset";

function makeImage(id: string, reviewState: ImageRecord["reviewState"]): ImageRecord {
  return {
    id,
    fileName: `${id}.jpg`,
    storedBlobKey: id,
    width: 64,
    height: 64,
    split: "train",
    reviewState,
    annotations: [],
    hash: id,
  };
}

function makeProject(images: ImageRecord[], blockIncomplete = true): Project {
  return {
    id: "proj-1",
    name: "Test",
    version: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    classes: [{ id: 0, name: "cat", color: "#e6194b", source: "preset" }],
    images,
    exportOptions: {
      includeYaml: true,
      includeTxtLabels: true,
      includeLabelStudio: false,
      blockIncompleteImages: blockIncomplete,
    },
  };
}

function makeRepos(project: Project, images: ImageRecord[]) {
  const projectRepo: IProjectRepository = {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(project),
    findAll: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };
  const imageRepo: IImageRepository = {
    addImages: vi.fn(),
    findByProject: vi.fn().mockResolvedValue(images),
    findById: vi.fn(),
    saveAnnotations: vi.fn(),
    findByHash: vi.fn(),
    delete: vi.fn(),
    updateSplit: vi.fn(),
    updateReviewState: vi.fn(),
  };
  // Return a blob-like object that implements arrayBuffer() for jsdom compatibility
  const fakeBlob = {
    arrayBuffer: () => Promise.resolve(new Uint8Array([0xff, 0xd8, 0xff]).buffer),
    type: "image/jpeg",
  } as unknown as Blob;
  const blobRepo: IBlobRepository = {
    save: vi.fn(),
    get: vi.fn().mockResolvedValue(fakeBlob),
    delete: vi.fn(),
  };
  return { project: projectRepo, image: imageRepo, blob: blobRepo };
}

describe("ExportDataset gate", () => {
  it("proceeds when all images are complete", async () => {
    const images = [makeImage("a", "complete"), makeImage("b", "complete")];
    const project = makeProject(images);
    const repos = makeRepos(project, images);
    const result = await exportDataset("proj-1", repos);
    expect(result.type).toBe("success");
  });

  it("blocks when an incomplete image exists and blockIncompleteImages=true", async () => {
    const images = [makeImage("a", "complete"), makeImage("b", "incomplete")];
    const project = makeProject(images, true);
    const repos = makeRepos(project, images);
    const result = await exportDataset("proj-1", repos);
    expect(result.type).toBe("ExportGateBlocked");
    if (result.type === "ExportGateBlocked") {
      expect(result.incompleteImages).toHaveLength(1);
      expect(result.incompleteImages[0]!.id).toBe("b");
    }
  });

  it("proceeds with warning when blockIncompleteImages=false", async () => {
    const images = [makeImage("a", "complete"), makeImage("b", "incomplete")];
    const project = makeProject(images, false);
    const repos = makeRepos(project, images);
    const result = await exportDataset("proj-1", repos);
    expect(result.type).toBe("success");
  });

  it("proceeds with warning when force=true override", async () => {
    const images = [makeImage("a", "incomplete")];
    const project = makeProject(images, true);
    const repos = makeRepos(project, images);
    const result = await exportDataset("proj-1", repos, true);
    expect(result.type).toBe("success");
    if (result.type === "success") {
      expect(result.warnings.some((w) => w.includes("incomplete"))).toBe(true);
    }
  });

  it("throws when project has zero images", async () => {
    const project = makeProject([]);
    const repos = makeRepos(project, []);
    await expect(exportDataset("proj-1", repos)).rejects.toThrow("empty");
  });
});
