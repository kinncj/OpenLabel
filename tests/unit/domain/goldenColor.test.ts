import { describe, it, expect } from "vitest";
import { goldenColor } from "@/common/domain/classes/packs/utils";

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/;

describe("goldenColor", () => {
  it("returns a string", () => {
    expect(typeof goldenColor(0)).toBe("string");
  });

  it("starts with #", () => {
    expect(goldenColor(0)).toMatch(/^#/);
  });

  it("returns exactly 7 characters", () => {
    expect(goldenColor(0)).toHaveLength(7);
  });

  it("returns a valid lowercase 6-digit hex color for i=0", () => {
    expect(goldenColor(0)).toMatch(HEX_COLOR_RE);
  });

  it("returns valid hex colors for i=0 through i=11", () => {
    for (let i = 0; i < 12; i++) {
      expect(goldenColor(i)).toMatch(HEX_COLOR_RE);
    }
  });

  it("all 12 adjacent values produce different colors (no consecutive collision)", () => {
    const colors = Array.from({ length: 12 }, (_, i) => goldenColor(i));
    for (let i = 0; i < colors.length - 1; i++) {
      expect(colors[i]).not.toBe(colors[i + 1]);
    }
  });

  it("all 12 colors are unique (no duplicates in first 12)", () => {
    const colors = Array.from({ length: 12 }, (_, i) => goldenColor(i));
    const unique = new Set(colors);
    expect(unique.size).toBe(12);
  });

  it("is deterministic — same i always returns same color", () => {
    for (let i = 0; i < 20; i++) {
      expect(goldenColor(i)).toBe(goldenColor(i));
    }
  });

  it("i=0 and i=1 are different", () => {
    expect(goldenColor(0)).not.toBe(goldenColor(1));
  });

  it("i=5 and i=6 are different", () => {
    expect(goldenColor(5)).not.toBe(goldenColor(6));
  });

  it("returns a valid hex for a large index", () => {
    expect(goldenColor(1000)).toMatch(HEX_COLOR_RE);
  });

  it("returns a valid hex for i=0 (red-ish — hue near 0°)", () => {
    // At i=0, h=0 so it should have a red component
    const color = goldenColor(0);
    expect(color).toMatch(HEX_COLOR_RE);
    // The red channel should be the highest at hue 0
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });
});
