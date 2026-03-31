import { describe, it, expect } from "vitest";
import { parseYoloTxt, YoloTxtParseError } from "@/common/infrastructure/parsers/YoloTxtParser";

// ── helpers ──────────────────────────────────────────────────────────────────

function line(classId: number, x: number, y: number, w: number, h: number): string {
  return `${classId} ${x} ${y} ${w} ${h}`;
}

function parseSingle(classId: number, x: number, y: number, w: number, h: number) {
  return parseYoloTxt(line(classId, x, y, w, h));
}

// ── tests ────────────────────────────────────────────────────────────────────

describe("YoloTxtParser", () => {
  it("parses a single valid box", () => {
    const boxes = parseSingle(3, 0.5, 0.5, 0.2, 0.3);
    expect(boxes).toHaveLength(1);
    const box = boxes[0]!;
    expect(box.classId).toBe(3);
    expect(box.x).toBeCloseTo(0.5);
    expect(box.y).toBeCloseTo(0.5);
    expect(box.w).toBeCloseTo(0.2);
    expect(box.h).toBeCloseTo(0.3);
  });

  it("assigns default review=tp to every parsed box", () => {
    const [box] = parseSingle(0, 0.1, 0.2, 0.3, 0.4);
    expect(box!.review).toBe("tp");
    expect(box!.locked).toBe(false);
    expect(box!.hidden).toBe(false);
  });

  it("parses multiple valid boxes", () => {
    const raw = [
      line(0, 0.1, 0.2, 0.3, 0.4),
      line(1, 0.5, 0.6, 0.1, 0.2),
      line(2, 0.9, 0.8, 0.05, 0.05),
    ].join("\n");
    const boxes = parseYoloTxt(raw);
    expect(boxes).toHaveLength(3);
    expect(boxes[0]!.classId).toBe(0);
    expect(boxes[1]!.classId).toBe(1);
    expect(boxes[2]!.classId).toBe(2);
  });

  it("does not filter fp/ignore boxes — raw parser returns everything as tp", () => {
    // The parser has no concept of review state on input; all boxes come out as tp.
    // Filtering fp/ignore is the caller's responsibility.
    const raw = [line(0, 0.1, 0.2, 0.1, 0.1), line(1, 0.5, 0.5, 0.2, 0.2)].join("\n");
    const boxes = parseYoloTxt(raw);
    expect(boxes).toHaveLength(2);
    boxes.forEach((b) => expect(b.review).toBe("tp"));
  });

  it("returns empty array for empty input", () => {
    expect(parseYoloTxt("")).toEqual([]);
    expect(parseYoloTxt("   ")).toEqual([]);
    expect(parseYoloTxt("\n\n\n")).toEqual([]);
  });

  it("throws YoloTxtParseError with lineErrors when a line has wrong field count", () => {
    const raw = "0 0.5 0.5 0.2"; // only 4 fields
    let err: YoloTxtParseError | null = null;
    try {
      parseYoloTxt(raw);
    } catch (e) {
      if (e instanceof YoloTxtParseError) err = e;
    }
    expect(err).not.toBeNull();
    expect(err!.lineErrors).toHaveLength(1);
    expect(err!.lineErrors[0]!.line).toBe(1);
    expect(err!.lineErrors[0]!.message).toMatch(/4/);
  });

  it("collects errors for all bad lines, not just the first", () => {
    const raw = [
      "0 0.5 0.5 0.2",     // 4 fields
      line(1, 0.5, 0.5, 0.1, 0.1), // valid
      "2 0.1",              // 2 fields
    ].join("\n");
    let err: YoloTxtParseError | null = null;
    try {
      parseYoloTxt(raw);
    } catch (e) {
      if (e instanceof YoloTxtParseError) err = e;
    }
    expect(err!.lineErrors).toHaveLength(2);
    expect(err!.lineErrors.map((e) => e.line)).toEqual([1, 3]);
  });

  it("throws on out-of-range x value (>1)", () => {
    expect(() => parseSingle(0, 1.5, 0.5, 0.2, 0.2)).toThrow(YoloTxtParseError);
  });

  it("throws on out-of-range y value (<0)", () => {
    expect(() => parseSingle(0, 0.5, -0.1, 0.2, 0.2)).toThrow(YoloTxtParseError);
  });

  it("throws on out-of-range w and h values and lists each as a separate error", () => {
    let err: YoloTxtParseError | null = null;
    try {
      parseSingle(0, 0.5, 0.5, 2.0, -1.0);
    } catch (e) {
      if (e instanceof YoloTxtParseError) err = e;
    }
    expect(err).not.toBeNull();
    // Both w and h are out of range — should have two errors on line 1
    expect(err!.lineErrors.length).toBeGreaterThanOrEqual(2);
    const msgs = err!.lineErrors.map((e) => e.message);
    expect(msgs.some((m) => m.includes("w"))).toBe(true);
    expect(msgs.some((m) => m.includes("h"))).toBe(true);
  });

  it("throws on non-numeric coordinate field", () => {
    expect(() => parseYoloTxt("0 0.5 banana 0.2 0.3")).toThrow(YoloTxtParseError);
  });

  it("throws on non-numeric classId field", () => {
    expect(() => parseYoloTxt("cat 0.5 0.5 0.2 0.3")).toThrow(YoloTxtParseError);
  });

  it("parses classId given as a float string (parseInt truncates)", () => {
    // "1.5" → parseInt("1.5", 10) === 1, Number.isInteger(1) is true — valid parse
    const boxes = parseYoloTxt("1.5 0.5 0.5 0.2 0.3");
    expect(boxes).toHaveLength(1);
    expect(boxes[0]!.classId).toBe(1);
  });

  it("assigns a unique UUID id to each parsed box", () => {
    const raw = [line(0, 0.1, 0.1, 0.1, 0.1), line(1, 0.5, 0.5, 0.1, 0.1)].join("\n");
    const boxes = parseYoloTxt(raw);
    expect(boxes[0]!.id).not.toBe(boxes[1]!.id);
    expect(boxes[0]!.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("sets zIndex from line position", () => {
    const raw = [line(0, 0.1, 0.1, 0.1, 0.1), line(1, 0.5, 0.5, 0.1, 0.1)].join("\n");
    const boxes = parseYoloTxt(raw);
    expect(boxes[0]!.zIndex).toBe(0);
    expect(boxes[1]!.zIndex).toBe(1);
  });
});
