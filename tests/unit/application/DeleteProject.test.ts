import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteProject } from "@/common/application/use-cases/DeleteProject";
import type { IProjectRepository } from "@/common/infrastructure/persistence/interfaces";

function makeRepo(): IProjectRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    save: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe("deleteProject", () => {
  let repo: IProjectRepository;

  beforeEach(() => {
    repo = makeRepo();
  });

  it("calls repo.delete() with the provided projectId", async () => {
    await deleteProject("proj-abc", repo);
    expect(repo.delete).toHaveBeenCalledWith("proj-abc");
  });

  it("calls repo.delete() exactly once", async () => {
    await deleteProject("proj-abc", repo);
    expect(repo.delete).toHaveBeenCalledTimes(1);
  });

  it("does not call any other repo method", async () => {
    await deleteProject("proj-abc", repo);
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.findById).not.toHaveBeenCalled();
    expect(repo.findAll).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("resolves without a return value (void)", async () => {
    const result = await deleteProject("proj-abc", repo);
    expect(result).toBeUndefined();
  });

  it("propagates a rejection from repo.delete()", async () => {
    const err = new Error("storage failure");
    (repo.delete as ReturnType<typeof vi.fn>).mockRejectedValue(err);
    await expect(deleteProject("failing-id", repo)).rejects.toThrow("storage failure");
  });

  it("passes different ids correctly", async () => {
    await deleteProject("id-one", repo);
    await deleteProject("id-two", repo);
    expect(repo.delete).toHaveBeenNthCalledWith(1, "id-one");
    expect(repo.delete).toHaveBeenNthCalledWith(2, "id-two");
  });
});
