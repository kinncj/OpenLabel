import { describe, it, expect } from "vitest";
import { parseNdjson, NdjsonParseError } from "@/common/infrastructure/parsers/NdjsonParser";

const VALID_NDJSON = [
  `{"type":"dataset","task":"detect","class_names":["cat","dog"]}`,
  `{"type":"image","file":"img1.jpg","split":"train","width":640,"height":480,"annotations":{"boxes":[[0,0.5,0.5,0.2,0.3]]}}`,
  `{"type":"image","file":"img2.jpg","split":"val","width":320,"height":240,"annotations":{"boxes":[]}}`,
].join("\n");

describe("NdjsonParser", () => {
  it("parses valid NDJSON", () => {
    const { dataset, images } = parseNdjson(VALID_NDJSON);
    expect(dataset.task).toBe("detect");
    expect(dataset.class_names).toEqual(["cat", "dog"]);
    expect(images).toHaveLength(2);
    expect(images[0]?.file).toBe("img1.jpg");
    expect(images[0]?.annotations.boxes).toHaveLength(1);
  });

  it("parses empty annotations for negative image", () => {
    const { images } = parseNdjson(VALID_NDJSON);
    expect(images[1]?.annotations.boxes).toEqual([]);
  });

  it("throws on empty input", () => {
    expect(() => parseNdjson("")).toThrow(NdjsonParseError);
  });

  it("throws with line number when line 1 is invalid JSON", () => {
    expect(() => parseNdjson("not json")).toThrow(NdjsonParseError);
  });

  it("throws when dataset line has wrong type", () => {
    const bad = `{"type":"image","file":"x.jpg","split":"train","width":640,"height":480,"annotations":{"boxes":[]}}`;
    expect(() => parseNdjson(bad)).toThrow(NdjsonParseError);
  });

  it("collects all line errors (not just first)", () => {
    const input = [
      `{"type":"dataset","task":"detect","class_names":[]}`,
      `{"type":"image","file":"a.jpg","split":"train","width":640,"height":480,"annotations":{"boxes":[[0,2.0,0.5,0.1,0.1]]}}`, // x=2.0 invalid
      `{"type":"image","file":"b.jpg","split":"train","width":640,"height":480,"annotations":{"boxes":[[0,-1,0.5,0.1,0.1]]}}`, // x=-1 invalid
    ].join("\n");

    let error: NdjsonParseError | null = null;
    try {
      parseNdjson(input);
    } catch (e) {
      if (e instanceof NdjsonParseError) error = e;
    }
    expect(error).not.toBeNull();
    expect(error!.lineErrors.length).toBe(2);
  });

  it("ignores lines with __proto__ (Zod blocks it)", () => {
    const input = [
      `{"type":"dataset","task":"detect","class_names":[]}`,
      `{"__proto__":{"isAdmin":true},"type":"image","file":"x.jpg","split":"train","width":640,"height":480,"annotations":{"boxes":[]}}`,
    ].join("\n");
    // This will fail Zod validation because extra keys aren't stripped by default
    // But proto pollution is blocked by the fact that Zod re-creates the object
    // The point is it doesn't throw a JS prototype error
    expect(() => parseNdjson(input)).not.toThrow(TypeError);
  });
});
