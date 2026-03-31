import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProject } from "@/common/application/use-cases/CreateProject";
import type { IProjectRepository } from "@/common/infrastructure/persistence/interfaces";

function makeRepo(): IProjectRepository {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn(),
    findAll: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };
}

// UUID v4 pattern: xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("createProject", () => {
  let repo: IProjectRepository;

  beforeEach(() => {
    repo = makeRepo();
  });

  it("creates a project with the provided name", async () => {
    const project = await createProject("My Dataset", undefined, repo);
    expect(project.name).toBe("My Dataset");
  });

  it("stores the description when provided", async () => {
    const project = await createProject("Labelled", "road signs", repo);
    expect(project.description).toBe("road signs");
  });

  it("omits description when not provided", async () => {
    const project = await createProject("No Desc", undefined, repo);
    expect(project.description).toBeUndefined();
  });

  it("generates a valid UUID v4 for id", async () => {
    const project = await createProject("ID Check", undefined, repo);
    expect(project.id).toMatch(UUID_V4_RE);
  });

  it("generates a unique id on each call", async () => {
    const a = await createProject("A", undefined, repo);
    const b = await createProject("B", undefined, repo);
    expect(a.id).not.toBe(b.id);
  });

  it("sets createdAt to a recent ISO timestamp", async () => {
    const before = Date.now();
    const project = await createProject("Timing", undefined, repo);
    const after = Date.now();
    const ts = new Date(project.createdAt).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("sets updatedAt equal to createdAt", async () => {
    const project = await createProject("Timestamps", undefined, repo);
    expect(project.updatedAt).toBe(project.createdAt);
  });

  it("initialises version to 1", async () => {
    const project = await createProject("Versioned", undefined, repo);
    expect(project.version).toBe(1);
  });

  it("initialises classes to an empty array", async () => {
    const project = await createProject("Classes", undefined, repo);
    expect(project.classes).toEqual([]);
  });

  it("initialises images to an empty array", async () => {
    const project = await createProject("Images", undefined, repo);
    expect(project.images).toEqual([]);
  });

  it("sets default exportOptions", async () => {
    const project = await createProject("Export", undefined, repo);
    expect(project.exportOptions).toEqual({
      includeYaml: true,
      includeTxtLabels: true,
      includeLabelStudio: true,
      blockIncompleteImages: true,
    });
  });

  it("calls repo.create() exactly once", async () => {
    await createProject("Once", undefined, repo);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it("calls repo.create() with the project that is returned", async () => {
    const project = await createProject("Passed", "desc", repo);
    expect(repo.create).toHaveBeenCalledWith(project);
  });

  it("returns the project object after persisting it", async () => {
    const result = await createProject("Return", undefined, repo);
    expect(result).toBeDefined();
    expect(result.name).toBe("Return");
  });
});
