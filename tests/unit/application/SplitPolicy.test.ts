import { describe, it, expect } from "vitest";
import { applySplitPolicy } from "@/common/application/services/SplitPolicy";
import type { ImageRecord } from "@/common/domain/dataset/types";

function makeImages(count: number): ImageRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `img-${i}`,
    fileName: `img${i}.jpg`,
    storedBlobKey: `key-${i}`,
    width: 640,
    height: 480,
    split: "train" as const,
    reviewState: "complete" as const,
    annotations: [],
    hash: `hash-${i.toString().padStart(4, "0")}`,
  }));
}

describe("SplitPolicy", () => {
  it("returns unchanged if only 1 image", () => {
    const imgs = makeImages(1);
    const result = applySplitPolicy(imgs);
    expect(result.every((i) => i.split === "train")).toBe(true);
  });

  it("assigns 1 val from 2 images", () => {
    const imgs = makeImages(2);
    const result = applySplitPolicy(imgs);
    const vals = result.filter((i) => i.split === "val");
    expect(vals).toHaveLength(1);
  });

  it("assigns ~10% for 10 images (minimum 1)", () => {
    const imgs = makeImages(10);
    const result = applySplitPolicy(imgs);
    const vals = result.filter((i) => i.split === "val");
    expect(vals.length).toBeGreaterThanOrEqual(1);
    expect(vals.length).toBeLessThanOrEqual(2);
  });

  it("assigns ~10% for 100 images", () => {
    const imgs = makeImages(100);
    const result = applySplitPolicy(imgs);
    const vals = result.filter((i) => i.split === "val");
    expect(vals.length).toBeGreaterThanOrEqual(9);
    expect(vals.length).toBeLessThanOrEqual(11);
  });

  it("is a no-op when manual splits exist", () => {
    const imgs = makeImages(10);
    imgs[0]!.split = "val";
    const result = applySplitPolicy(imgs);
    // All same as input since manual split was detected
    expect(result[0]!.split).toBe("val");
    // Policy doesn't reassign the remaining ones
    const vals = result.filter((i) => i.split === "val");
    expect(vals).toHaveLength(1);
  });

  it("is deterministic — same input produces same val set", () => {
    const imgs = makeImages(20);
    const r1 = applySplitPolicy([...imgs]);
    const r2 = applySplitPolicy([...imgs]);
    expect(r1.map((i) => i.split)).toEqual(r2.map((i) => i.split));
  });

  it("returns empty array for empty input", () => {
    expect(applySplitPolicy([])).toEqual([]);
  });
});
