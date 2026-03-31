import { describe, it, expect } from "vitest";
import { ClassDefSchema } from "@/common/domain/classes/schemas";

const valid = {
  id: 0,
  name: "person",
  color: "#ff0000",
  source: "preset" as const,
};

describe("ClassDefSchema", () => {
  it("accepts a fully valid class definition", () => {
    expect(ClassDefSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts uppercase hex color", () => {
    const result = ClassDefSchema.safeParse({ ...valid, color: "#FF00AB" });
    expect(result.success).toBe(true);
  });

  it("accepts mixed-case hex color", () => {
    const result = ClassDefSchema.safeParse({ ...valid, color: "#aAbBcC" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = ClassDefSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name with control characters (\\x01)", () => {
    const result = ClassDefSchema.safeParse({ ...valid, name: "bad\x01name" });
    expect(result.success).toBe(false);
  });

  it("rejects name with null byte (\\x00)", () => {
    const result = ClassDefSchema.safeParse({ ...valid, name: "bad\x00name" });
    expect(result.success).toBe(false);
  });

  it("rejects name with forward slash", () => {
    const result = ClassDefSchema.safeParse({ ...valid, name: "bad/name" });
    expect(result.success).toBe(false);
  });

  it("rejects name with backslash", () => {
    const result = ClassDefSchema.safeParse({ ...valid, name: "bad\\name" });
    expect(result.success).toBe(false);
  });

  it("rejects Windows reserved name CON (case-insensitive)", () => {
    const result = ClassDefSchema.safeParse({ ...valid, name: "CON" });
    expect(result.success).toBe(false);
  });

  it("rejects Windows reserved name con (lowercase)", () => {
    const result = ClassDefSchema.safeParse({ ...valid, name: "con" });
    expect(result.success).toBe(false);
  });

  it("rejects Windows reserved name NUL", () => {
    const result = ClassDefSchema.safeParse({ ...valid, name: "NUL" });
    expect(result.success).toBe(false);
  });

  it("rejects Windows reserved name PRN", () => {
    const result = ClassDefSchema.safeParse({ ...valid, name: "PRN" });
    expect(result.success).toBe(false);
  });

  it("rejects Windows reserved name COM1", () => {
    const result = ClassDefSchema.safeParse({ ...valid, name: "COM1" });
    expect(result.success).toBe(false);
  });

  it("rejects Windows reserved name LPT9", () => {
    const result = ClassDefSchema.safeParse({ ...valid, name: "LPT9" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 128 chars", () => {
    const result = ClassDefSchema.safeParse({ ...valid, name: "a".repeat(129) });
    expect(result.success).toBe(false);
  });

  it("accepts name exactly 128 chars", () => {
    const result = ClassDefSchema.safeParse({ ...valid, name: "a".repeat(128) });
    expect(result.success).toBe(true);
  });

  it("rejects color missing # prefix", () => {
    const result = ClassDefSchema.safeParse({ ...valid, color: "ff0000" });
    expect(result.success).toBe(false);
  });

  it("rejects color with only 3 hex digits", () => {
    const result = ClassDefSchema.safeParse({ ...valid, color: "#f00" });
    expect(result.success).toBe(false);
  });

  it("rejects color with non-hex characters", () => {
    const result = ClassDefSchema.safeParse({ ...valid, color: "#gggggg" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid source value", () => {
    const result = ClassDefSchema.safeParse({ ...valid, source: "unknown" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid source values", () => {
    for (const source of ["preset", "custom", "imported"] as const) {
      expect(ClassDefSchema.safeParse({ ...valid, source }).success).toBe(true);
    }
  });

  it("rejects negative id", () => {
    const result = ClassDefSchema.safeParse({ ...valid, id: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects float id", () => {
    const result = ClassDefSchema.safeParse({ ...valid, id: 1.5 });
    expect(result.success).toBe(false);
  });
});
