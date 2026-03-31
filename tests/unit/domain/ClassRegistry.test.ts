import { describe, it, expect } from "vitest";
import { CLASS_PACKS, CLASS_PACK_REGISTRY } from "@/common/domain/classes/registry";

const EXPECTED_PACK_IDS = [
  "coco80",
  "voc20",
  "objects365",
  "openimagesv7",
  "lvis",
  "visdrone10",
  "xview60",
  "globalwheat",
  "braintumor",
  "africanwildlife",
  "signature",
  "medicalpills",
];

describe("ClassRegistry — CLASS_PACKS", () => {
  it("has exactly 12 packs", () => {
    expect(CLASS_PACKS).toHaveLength(12);
  });

  it("contains all expected pack ids", () => {
    const ids = CLASS_PACKS.map((p) => p.id);
    for (const expected of EXPECTED_PACK_IDS) {
      expect(ids).toContain(expected);
    }
  });

  it("every pack has a non-empty string id", () => {
    for (const pack of CLASS_PACKS) {
      expect(typeof pack.id).toBe("string");
      expect(pack.id.length).toBeGreaterThan(0);
    }
  });

  it("every pack has a non-empty string label", () => {
    for (const pack of CLASS_PACKS) {
      expect(typeof pack.label).toBe("string");
      expect(pack.label.length).toBeGreaterThan(0);
    }
  });

  it("every pack has a non-empty description", () => {
    for (const pack of CLASS_PACKS) {
      expect(typeof pack.description).toBe("string");
      expect(pack.description.length).toBeGreaterThan(0);
    }
  });

  it("every pack has at least 1 class", () => {
    for (const pack of CLASS_PACKS) {
      expect(pack.classes.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("no duplicate class names within a single pack (excluding lvis which has 2 known source duplicates)", () => {
    for (const pack of CLASS_PACKS) {
      if (pack.id === "lvis") continue; // lvis source data has 2 known duplicates: "bow" and "underwear"
      const names = pack.classes.map((c) => c.name);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    }
  });

  it("lvis pack has exactly 2 duplicate names in source data (bow, underwear)", () => {
    const lvis = CLASS_PACKS.find((p) => p.id === "lvis")!;
    const names = lvis.classes.map((c) => c.name);
    const counts: Record<string, number> = {};
    names.forEach((n) => { counts[n] = (counts[n] ?? 0) + 1; });
    const dups = Object.entries(counts).filter(([, v]) => v > 1).map(([k]) => k).sort();
    expect(dups).toEqual(["bow", "underwear"]);
  });

  it("class ids are sequential starting from 0 within each pack", () => {
    for (const pack of CLASS_PACKS) {
      const ids = pack.classes.map((c) => c.id);
      for (let i = 0; i < ids.length; i++) {
        expect(ids[i]).toBe(i);
      }
    }
  });

  it("every class has a valid 6-digit hex color", () => {
    const hexRe = /^#[0-9a-fA-F]{6}$/;
    for (const pack of CLASS_PACKS) {
      for (const cls of pack.classes) {
        expect(cls.color).toMatch(hexRe);
      }
    }
  });

  it("coco80 pack has exactly 80 classes", () => {
    const coco = CLASS_PACKS.find((p) => p.id === "coco80");
    expect(coco).toBeDefined();
    expect(coco!.classes).toHaveLength(80);
  });

  it("voc20 pack has exactly 20 classes", () => {
    const voc = CLASS_PACKS.find((p) => p.id === "voc20");
    expect(voc).toBeDefined();
    expect(voc!.classes).toHaveLength(20);
  });

  it("visdrone10 pack has exactly 10 classes", () => {
    const vis = CLASS_PACKS.find((p) => p.id === "visdrone10");
    expect(vis).toBeDefined();
    expect(vis!.classes).toHaveLength(10);
  });
});

describe("ClassRegistry — CLASS_PACK_REGISTRY", () => {
  it("is a Map", () => {
    expect(CLASS_PACK_REGISTRY).toBeInstanceOf(Map);
  });

  it("has exactly 12 entries", () => {
    expect(CLASS_PACK_REGISTRY.size).toBe(12);
  });

  it("all expected pack ids are present as keys", () => {
    for (const id of EXPECTED_PACK_IDS) {
      expect(CLASS_PACK_REGISTRY.has(id)).toBe(true);
    }
  });

  it("values match the classes arrays from CLASS_PACKS", () => {
    for (const pack of CLASS_PACKS) {
      expect(CLASS_PACK_REGISTRY.get(pack.id)).toBe(pack.classes);
    }
  });

  it("returns undefined for an unknown pack id", () => {
    expect(CLASS_PACK_REGISTRY.get("nonexistent-pack")).toBeUndefined();
  });
});
