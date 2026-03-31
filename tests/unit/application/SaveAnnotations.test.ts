import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveAnnotations } from "@/common/application/use-cases/SaveAnnotations";
import type { IImageRepository } from "@/common/infrastructure/persistence/interfaces";
import type { BoxAnnotation } from "@/common/domain/annotations/types";

function makeRepo(): IImageRepository {
  return {
    addImages: vi.fn(),
    findByProject: vi.fn(),
    findById: vi.fn(),
    saveAnnotations: vi.fn().mockResolvedValue(undefined),
    findByHash: vi.fn(),
    delete: vi.fn(),
    updateSplit: vi.fn(),
    updateReviewState: vi.fn(),
  };
}

function makeAnnotation(overrides: Partial<BoxAnnotation> = {}): BoxAnnotation {
  return {
    id: "00000000-0000-4000-8000-aaaaaaaaaaaa",
    classId: 0,
    x: 0.1,
    y: 0.2,
    w: 0.3,
    h: 0.4,
    zIndex: 1,
    review: "tp",
    locked: false,
    hidden: false,
    ...overrides,
  };
}

const IMAGE_ID = "img-0000-0000-0000-000000000001";

describe("saveAnnotations", () => {
  let repo: IImageRepository;

  beforeEach(() => {
    repo = makeRepo();
  });

  describe("valid annotations", () => {
    it("calls repo.saveAnnotations with the correct imageId", async () => {
      const anns = [makeAnnotation()];
      await saveAnnotations(IMAGE_ID, anns, repo);
      expect(repo.saveAnnotations).toHaveBeenCalledWith(IMAGE_ID, anns);
    });

    it("calls repo.saveAnnotations exactly once", async () => {
      await saveAnnotations(IMAGE_ID, [makeAnnotation()], repo);
      expect(repo.saveAnnotations).toHaveBeenCalledTimes(1);
    });

    it("passes all annotations through to the repo", async () => {
      const anns = [
        makeAnnotation({ id: "00000000-0000-4000-8000-aaaaaaaaaaaa" }),
        makeAnnotation({ id: "00000000-0000-4000-8000-bbbbbbbbbbbb" }),
      ];
      await saveAnnotations(IMAGE_ID, anns, repo);
      const [, passedAnns] = (repo.saveAnnotations as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(passedAnns).toHaveLength(2);
    });

    it("accepts an annotation with a note field", async () => {
      const ann = makeAnnotation({ note: "double-check this box" });
      await expect(saveAnnotations(IMAGE_ID, [ann], repo)).resolves.toBeUndefined();
    });

    it("accepts coordinates at the boundaries (0 and 1)", async () => {
      const ann = makeAnnotation({ x: 0, y: 0, w: 1, h: 1 });
      await expect(saveAnnotations(IMAGE_ID, [ann], repo)).resolves.toBeUndefined();
    });
  });

  describe("empty annotations array", () => {
    it("still calls repo.saveAnnotations", async () => {
      await saveAnnotations(IMAGE_ID, [], repo);
      expect(repo.saveAnnotations).toHaveBeenCalledTimes(1);
    });

    it("passes the empty array through", async () => {
      await saveAnnotations(IMAGE_ID, [], repo);
      expect(repo.saveAnnotations).toHaveBeenCalledWith(IMAGE_ID, []);
    });

    it("resolves without throwing", async () => {
      await expect(saveAnnotations(IMAGE_ID, [], repo)).resolves.toBeUndefined();
    });
  });

  describe("invalid annotation data", () => {
    it("throws when id is not a valid UUID", async () => {
      const bad = makeAnnotation({ id: "not-a-uuid" });
      await expect(saveAnnotations(IMAGE_ID, [bad], repo)).rejects.toThrow(
        /Invalid annotation data/,
      );
    });

    it("does not call repo when validation fails", async () => {
      const bad = makeAnnotation({ id: "not-a-uuid" });
      await saveAnnotations(IMAGE_ID, [bad], repo).catch(() => {});
      expect(repo.saveAnnotations).not.toHaveBeenCalled();
    });

    it("throws on the first bad annotation even when others are valid", async () => {
      const good = makeAnnotation({ id: "00000000-0000-4000-8000-aaaaaaaaaaaa" });
      const bad = makeAnnotation({ id: "not-a-uuid" });
      await expect(saveAnnotations(IMAGE_ID, [bad, good], repo)).rejects.toThrow(
        /Invalid annotation data/,
      );
    });

    it("throws when x is greater than 1", async () => {
      const bad = makeAnnotation({ x: 1.5 });
      await expect(saveAnnotations(IMAGE_ID, [bad], repo)).rejects.toThrow(
        /Invalid annotation data/,
      );
    });

    it("throws when y is less than 0", async () => {
      const bad = makeAnnotation({ y: -0.1 });
      await expect(saveAnnotations(IMAGE_ID, [bad], repo)).rejects.toThrow(
        /Invalid annotation data/,
      );
    });

    it("throws when w is greater than 1", async () => {
      const bad = makeAnnotation({ w: 2 });
      await expect(saveAnnotations(IMAGE_ID, [bad], repo)).rejects.toThrow(
        /Invalid annotation data/,
      );
    });

    it("throws when h is negative", async () => {
      const bad = makeAnnotation({ h: -0.5 });
      await expect(saveAnnotations(IMAGE_ID, [bad], repo)).rejects.toThrow(
        /Invalid annotation data/,
      );
    });

    it("throws when classId is negative", async () => {
      const bad = makeAnnotation({ classId: -1 });
      await expect(saveAnnotations(IMAGE_ID, [bad], repo)).rejects.toThrow(
        /Invalid annotation data/,
      );
    });

    it("throws when review is not a valid BoxReviewState", async () => {
      const bad = makeAnnotation({ review: "maybe" as any });
      await expect(saveAnnotations(IMAGE_ID, [bad], repo)).rejects.toThrow(
        /Invalid annotation data/,
      );
    });
  });
});
