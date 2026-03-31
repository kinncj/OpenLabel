import { describe, it, expect } from "vitest";
import { serializeImageToYoloTxt } from "@/common/infrastructure/serializers/YoloTxtSerializer";
import type { ImageRecord } from "@/common/domain/dataset/types";

const baseImage: ImageRecord = {
  id: "00000000-0000-0000-0000-000000000001",
  fileName: "test.jpg",
  storedBlobKey: "abc",
  width: 640,
  height: 480,
  split: "train",
  reviewState: "complete",
  hash: "abc",
  annotations: [],
};

describe("YoloTxtSerializer", () => {
  it("serializes a single tp box", () => {
    const img: ImageRecord = {
      ...baseImage,
      annotations: [
        {
          id: "00000000-0000-0000-0000-000000000002",
          classId: 3,
          x: 0.5,
          y: 0.5,
          w: 0.2,
          h: 0.3,
          zIndex: 0,
          review: "tp",
          locked: false,
          hidden: false,
        },
      ],
    };
    const txt = serializeImageToYoloTxt(img);
    expect(txt.trim()).toBe("3 0.500000 0.500000 0.200000 0.300000");
  });

  it("only includes tp boxes", () => {
    const img: ImageRecord = {
      ...baseImage,
      annotations: [
        {
          id: "00000000-0000-0000-0000-000000000002",
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
          id: "00000000-0000-0000-0000-000000000003",
          classId: 1,
          x: 0.1,
          y: 0.1,
          w: 0.1,
          h: 0.1,
          zIndex: 1,
          review: "fp",
          locked: false,
          hidden: false,
        },
        {
          id: "00000000-0000-0000-0000-000000000004",
          classId: 2,
          x: 0.9,
          y: 0.9,
          w: 0.05,
          h: 0.05,
          zIndex: 2,
          review: "ignore",
          locked: false,
          hidden: false,
        },
      ],
    };
    const txt = serializeImageToYoloTxt(img);
    const lines = txt.split("\n").filter((l) => l.trim());
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^0 /);
  });

  it("returns empty string for negative image", () => {
    const txt = serializeImageToYoloTxt(baseImage);
    expect(txt).toBe("");
  });

  it("uses 6 decimal places", () => {
    const img: ImageRecord = {
      ...baseImage,
      annotations: [
        {
          id: "00000000-0000-0000-0000-000000000002",
          classId: 0,
          x: 1 / 3,
          y: 1 / 7,
          w: 0.1,
          h: 0.1,
          zIndex: 0,
          review: "tp",
          locked: false,
          hidden: false,
        },
      ],
    };
    const txt = serializeImageToYoloTxt(img);
    expect(txt).toMatch(/0 0\.333333 0\.142857 0\.100000 0\.100000/);
  });
});
