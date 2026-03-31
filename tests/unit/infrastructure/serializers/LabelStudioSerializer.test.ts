import { describe, it, expect } from "vitest";
import { serializeToLabelStudio } from "@/common/infrastructure/serializers/LabelStudioSerializer";
import type { Project, ImageRecord } from "@/common/domain/dataset/types";
import type { BoxAnnotation } from "@/common/domain/annotations/types";
import type { ClassDef } from "@/common/domain/classes/types";

// ── factory helpers ───────────────────────────────────────────────────────────

function makeClass(id: number, name: string): ClassDef {
  return { id, name, color: "#ffffff", source: "custom" };
}

function makeBox(overrides: Partial<BoxAnnotation> & { classId: number }): BoxAnnotation {
  return {
    id: `box-${Math.random()}`,
    x: 0.5,
    y: 0.5,
    w: 0.2,
    h: 0.3,
    zIndex: 0,
    review: "tp",
    locked: false,
    hidden: false,
    ...overrides,
  };
}

function makeImage(overrides: Partial<ImageRecord> & { fileName: string }): ImageRecord {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    storedBlobKey: "key",
    width: 640,
    height: 480,
    split: "train",
    reviewState: "complete",
    hash: "abc",
    annotations: [],
    ...overrides,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    name: "test",
    version: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    classes: [],
    images: [],
    exportOptions: {
      includeYaml: true,
      includeTxtLabels: true,
      includeLabelStudio: true,
      blockIncompleteImages: false,
    },
    ...overrides,
  };
}

function parse(output: string): ReturnType<typeof JSON.parse> {
  return JSON.parse(output);
}

// ── tests ────────────────────────────────────────────────────────────────────

describe("LabelStudioSerializer", () => {
  it("converts center-normalized coords to percentage top-left correctly", () => {
    // box: x=0.5, y=0.5, w=0.4, h=0.6
    // expected LS: x=(0.5-0.2)*100=30, y=(0.5-0.3)*100=20, width=40, height=60
    const box = makeBox({ classId: 0, x: 0.5, y: 0.5, w: 0.4, h: 0.6 });
    const image = makeImage({ fileName: "img.jpg", annotations: [box] });
    const project = makeProject({ classes: [makeClass(0, "cat")], images: [image] });

    const tasks = parse(serializeToLabelStudio(project));
    const value = tasks[0].annotations[0].result[0].value;

    expect(value.x).toBeCloseTo(30);
    expect(value.y).toBeCloseTo(20);
    expect(value.width).toBeCloseTo(40);
    expect(value.height).toBeCloseTo(60);
  });

  it("uses the class name from the project classes map", () => {
    const box = makeBox({ classId: 1 });
    const image = makeImage({ fileName: "img.jpg", annotations: [box] });
    const project = makeProject({
      classes: [makeClass(0, "cat"), makeClass(1, "dog")],
      images: [image],
    });

    const tasks = parse(serializeToLabelStudio(project));
    const label = tasks[0].annotations[0].result[0].value.rectanglelabels[0];
    expect(label).toBe("dog");
  });

  it("falls back to class_<id> label when classId has no matching class", () => {
    const box = makeBox({ classId: 99 });
    const image = makeImage({ fileName: "img.jpg", annotations: [box] });
    const project = makeProject({ classes: [], images: [image] });

    const tasks = parse(serializeToLabelStudio(project));
    const label = tasks[0].annotations[0].result[0].value.rectanglelabels[0];
    expect(label).toBe("class_99");
  });

  it("excludes fp boxes from serialized results", () => {
    const tp = makeBox({ classId: 0, review: "tp" });
    const fp = makeBox({ classId: 0, review: "fp" });
    const image = makeImage({ fileName: "img.jpg", annotations: [tp, fp] });
    const project = makeProject({ classes: [makeClass(0, "cat")], images: [image] });

    const tasks = parse(serializeToLabelStudio(project));
    expect(tasks[0].annotations[0].result).toHaveLength(1);
  });

  it("excludes ignore boxes from serialized results", () => {
    const tp = makeBox({ classId: 0, review: "tp" });
    const ignored = makeBox({ classId: 0, review: "ignore" });
    const image = makeImage({ fileName: "img.jpg", annotations: [tp, ignored] });
    const project = makeProject({ classes: [makeClass(0, "cat")], images: [image] });

    const tasks = parse(serializeToLabelStudio(project));
    expect(tasks[0].annotations[0].result).toHaveLength(1);
  });

  it("produces an empty task list for a project with no images", () => {
    const project = makeProject({ images: [] });
    const tasks = parse(serializeToLabelStudio(project));
    expect(tasks).toEqual([]);
  });

  it("produces an entry with empty results for an image with no tp boxes", () => {
    const fp = makeBox({ classId: 0, review: "fp" });
    const ignored = makeBox({ classId: 0, review: "ignore" });
    const image = makeImage({ fileName: "negative.jpg", annotations: [fp, ignored] });
    const project = makeProject({ classes: [makeClass(0, "cat")], images: [image] });

    const tasks = parse(serializeToLabelStudio(project));
    expect(tasks).toHaveLength(1);
    expect(tasks[0].annotations[0].result).toHaveLength(0);
  });

  it("serializes multiple images with multiple tp boxes each", () => {
    const boxes1 = [
      makeBox({ classId: 0, x: 0.1, y: 0.1, w: 0.1, h: 0.1 }),
      makeBox({ classId: 1, x: 0.9, y: 0.9, w: 0.1, h: 0.1 }),
    ];
    const boxes2 = [makeBox({ classId: 0, x: 0.5, y: 0.5, w: 0.2, h: 0.2 })];
    const images = [
      makeImage({ fileName: "a.jpg", annotations: boxes1 }),
      makeImage({ fileName: "b.jpg", id: "00000000-0000-0000-0000-000000000002", annotations: boxes2 }),
    ];
    const project = makeProject({
      classes: [makeClass(0, "cat"), makeClass(1, "dog")],
      images,
    });

    const tasks = parse(serializeToLabelStudio(project));
    expect(tasks).toHaveLength(2);
    expect(tasks[0].data.image).toBe("images/train/a.jpg");
    expect(tasks[0].annotations[0].result).toHaveLength(2);
    expect(tasks[1].data.image).toBe("images/train/b.jpg");
    expect(tasks[1].annotations[0].result).toHaveLength(1);
  });

  it("includes original_width and original_height from the image record", () => {
    const box = makeBox({ classId: 0 });
    const image = makeImage({ fileName: "img.jpg", width: 1920, height: 1080, annotations: [box] });
    const project = makeProject({ classes: [makeClass(0, "cat")], images: [image] });

    const tasks = parse(serializeToLabelStudio(project));
    const result = tasks[0].annotations[0].result[0];
    expect(result.original_width).toBe(1920);
    expect(result.original_height).toBe(1080);
  });

  it("numbers tasks starting from 1", () => {
    const images = [
      makeImage({ fileName: "a.jpg" }),
      makeImage({ fileName: "b.jpg", id: "00000000-0000-0000-0000-000000000002" }),
    ];
    const project = makeProject({ images });
    const tasks = parse(serializeToLabelStudio(project));
    expect(tasks[0].id).toBe(1);
    expect(tasks[1].id).toBe(2);
  });

  it("sets was_cancelled=false on every annotation", () => {
    const image = makeImage({ fileName: "img.jpg", annotations: [makeBox({ classId: 0 })] });
    const project = makeProject({ classes: [makeClass(0, "cat")], images: [image] });
    const tasks = parse(serializeToLabelStudio(project));
    expect(tasks[0].annotations[0].was_cancelled).toBe(false);
  });

  it("outputs valid JSON", () => {
    const box = makeBox({ classId: 0 });
    const image = makeImage({ fileName: "img.jpg", annotations: [box] });
    const project = makeProject({ classes: [makeClass(0, "cat")], images: [image] });
    expect(() => JSON.parse(serializeToLabelStudio(project))).not.toThrow();
  });
});
