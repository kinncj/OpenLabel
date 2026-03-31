import { describe, it, expect } from "vitest";
import { BoxAnnotationSchema } from "@/common/domain/annotations/schemas";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

const valid = {
  id: VALID_UUID,
  classId: 0,
  x: 0.5,
  y: 0.5,
  w: 0.1,
  h: 0.1,
  zIndex: 0,
  review: "tp" as const,
  locked: false,
  hidden: false,
};

describe("BoxAnnotationSchema", () => {
  it("accepts a fully valid annotation", () => {
    expect(BoxAnnotationSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts annotation with optional note field", () => {
    const result = BoxAnnotationSchema.safeParse({ ...valid, note: "double check this" });
    expect(result.success).toBe(true);
  });

  it("accepts annotation without note field", () => {
    const result = BoxAnnotationSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.note).toBeUndefined();
    }
  });

  it("rejects missing id", () => {
    const { id: _id, ...rest } = valid;
    const result = BoxAnnotationSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID id (plain string)", () => {
    const result = BoxAnnotationSchema.safeParse({ ...valid, id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID id (numeric string)", () => {
    const result = BoxAnnotationSchema.safeParse({ ...valid, id: "12345" });
    expect(result.success).toBe(false);
  });

  it("accepts x at the boundary value 0", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, x: 0 }).success).toBe(true);
  });

  it("accepts x at the boundary value 1", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, x: 1 }).success).toBe(true);
  });

  it("rejects x below 0", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, x: -0.001 }).success).toBe(false);
  });

  it("rejects x above 1", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, x: 1.001 }).success).toBe(false);
  });

  it("rejects y below 0", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, y: -0.5 }).success).toBe(false);
  });

  it("rejects y above 1", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, y: 1.5 }).success).toBe(false);
  });

  it("rejects w below 0", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, w: -0.1 }).success).toBe(false);
  });

  it("rejects w above 1", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, w: 1.1 }).success).toBe(false);
  });

  it("rejects h below 0", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, h: -0.01 }).success).toBe(false);
  });

  it("rejects h above 1", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, h: 2.0 }).success).toBe(false);
  });

  it("accepts all valid review states", () => {
    for (const review of ["tp", "fp", "ignore"] as const) {
      expect(BoxAnnotationSchema.safeParse({ ...valid, review }).success).toBe(true);
    }
  });

  it("rejects invalid review state", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, review: "tn" }).success).toBe(false);
  });

  it("rejects review state empty string", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, review: "" }).success).toBe(false);
  });

  it("rejects negative classId", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, classId: -1 }).success).toBe(false);
  });

  it("rejects float classId", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, classId: 1.5 }).success).toBe(false);
  });

  it("accepts zIndex of 0", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, zIndex: 0 }).success).toBe(true);
  });

  it("accepts negative zIndex", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, zIndex: -1 }).success).toBe(true);
  });

  it("accepts locked: true", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, locked: true }).success).toBe(true);
  });

  it("accepts hidden: true", () => {
    expect(BoxAnnotationSchema.safeParse({ ...valid, hidden: true }).success).toBe(true);
  });
});
