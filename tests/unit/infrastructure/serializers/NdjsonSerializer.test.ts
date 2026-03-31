import { describe, it, expect } from "vitest";
import { serializeToNdjson } from "@/common/infrastructure/serializers/NdjsonSerializer";
import { parseNdjson } from "@/common/infrastructure/parsers/NdjsonParser";
import type { Project } from "@/common/domain/dataset/types";

const baseProject: Project = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Test Project",
  version: 1,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  classes: [
    { id: 0, name: "cat", color: "#e6194b", source: "preset" },
    { id: 1, name: "dog", color: "#3cb44b", source: "preset" },
  ],
  images: [
    {
      id: "00000000-0000-0000-0000-000000000002",
      fileName: "img1.jpg",
      storedBlobKey: "abc",
      width: 640,
      height: 480,
      split: "train",
      reviewState: "complete",
      hash: "abc",
      annotations: [
        {
          id: "00000000-0000-0000-0000-000000000003",
          classId: 0,
          x: 0.5,
          y: 0.5,
          w: 0.2,
          h: 0.3,
          zIndex: 0,
          review: "tp",
          locked: false,
          hidden: false,
        },
        {
          id: "00000000-0000-0000-0000-000000000004",
          classId: 1,
          x: 0.2,
          y: 0.2,
          w: 0.1,
          h: 0.1,
          zIndex: 1,
          review: "fp",
          locked: false,
          hidden: false,
        },
        {
          id: "00000000-0000-0000-0000-000000000005",
          classId: 0,
          x: 0.7,
          y: 0.7,
          w: 0.15,
          h: 0.15,
          zIndex: 2,
          review: "ignore",
          locked: false,
          hidden: false,
        },
      ],
    },
    {
      id: "00000000-0000-0000-0000-000000000006",
      fileName: "img2.jpg",
      storedBlobKey: "def",
      width: 320,
      height: 240,
      split: "val",
      reviewState: "negative",
      hash: "def",
      annotations: [],
    },
  ],
  exportOptions: {
    includeYaml: true,
    includeTxtLabels: true,
    includeLabelStudio: false,
    blockIncompleteImages: true,
  },
};

describe("NdjsonSerializer", () => {
  it("produces valid NDJSON that parses back", () => {
    const ndjson = serializeToNdjson(baseProject);
    const { dataset, images } = parseNdjson(ndjson);
    expect(dataset.task).toBe("detect");
    expect(dataset.class_names).toEqual(["cat", "dog"]);
    expect(images).toHaveLength(2);
  });

  it("only includes tp boxes in annotations", () => {
    const ndjson = serializeToNdjson(baseProject);
    const { images } = parseNdjson(ndjson);
    const img1 = images.find((i) => i.file === "images/train/img1.jpg")!;
    expect(img1.annotations.boxes).toHaveLength(1);
    // The single tp box has classId 0
    expect(img1.annotations.boxes[0]?.[0]).toBe(0);
  });

  it("fp boxes are absent", () => {
    const ndjson = serializeToNdjson(baseProject);
    const { images } = parseNdjson(ndjson);
    const img1 = images.find((i) => i.file === "images/train/img1.jpg")!;
    // Only 1 box (tp), not the fp or ignore ones
    expect(img1.annotations.boxes).toHaveLength(1);
  });

  it("negative image has empty boxes array", () => {
    const ndjson = serializeToNdjson(baseProject);
    const { images } = parseNdjson(ndjson);
    const img2 = images.find((i) => i.file === "images/val/img2.jpg")!;
    expect(img2.annotations.boxes).toEqual([]);
  });

  it("class names are in id order", () => {
    const reversed: Project = {
      ...baseProject,
      classes: [
        { id: 1, name: "dog", color: "#3cb44b", source: "preset" },
        { id: 0, name: "cat", color: "#e6194b", source: "preset" },
      ],
    };
    const ndjson = serializeToNdjson(reversed);
    const { dataset } = parseNdjson(ndjson);
    expect(dataset.class_names[0]).toBe("cat");
    expect(dataset.class_names[1]).toBe("dog");
  });

  it("does not include UI fields in NDJSON", () => {
    const ndjson = serializeToNdjson(baseProject);
    expect(ndjson).not.toContain('"zIndex"');
    expect(ndjson).not.toContain('"locked"');
    expect(ndjson).not.toContain('"hidden"');
    expect(ndjson).not.toContain('"review"');
    expect(ndjson).not.toContain('"color"');
  });
});
