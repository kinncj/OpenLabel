import { describe, it, expect } from "vitest";
import {
  parseLabelStudio,
  LabelStudioParseError,
} from "@/common/infrastructure/parsers/LabelStudioParser";

// ── factory helpers ───────────────────────────────────────────────────────────

type LSValueOverride = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rectanglelabels?: string[];
};

function makeResult(overrides: LSValueOverride = {}) {
  return {
    type: "rectanglelabels" as const,
    value: {
      x: overrides.x ?? 10,
      y: overrides.y ?? 20,
      width: overrides.width ?? 30,
      height: overrides.height ?? 40,
      rotation: 0,
      rectanglelabels: overrides.rectanglelabels ?? ["cat"],
    },
    original_width: 640,
    original_height: 480,
  };
}

function makeTask(options: {
  image?: string;
  results?: ReturnType<typeof makeResult>[];
  cancelled?: boolean;
}) {
  return {
    id: 1,
    data: { image: options.image ?? "dog.jpg" },
    annotations: [
      {
        result: options.results ?? [makeResult()],
        was_cancelled: options.cancelled ?? false,
      },
    ],
  };
}

function serialize(tasks: unknown): string {
  return JSON.stringify(tasks);
}

// ── tests ────────────────────────────────────────────────────────────────────

describe("LabelStudioParser", () => {
  it("converts a single annotation from percentage top-left to normalized center coords", () => {
    // LS: x=10%, y=20%, width=30%, height=40%
    // Expected YOLO center: x=(10+15)/100=0.25, y=(20+20)/100=0.40, w=0.30, h=0.40
    const task = makeTask({ results: [makeResult({ x: 10, y: 20, width: 30, height: 40 })] });
    const { images } = parseLabelStudio(serialize([task]));

    expect(images).toHaveLength(1);
    const [box] = images[0]!.annotations;
    expect(box!.x).toBeCloseTo(0.25);
    expect(box!.y).toBeCloseTo(0.40);
    expect(box!.w).toBeCloseTo(0.30);
    expect(box!.h).toBeCloseTo(0.40);
  });

  it("assigns classId by first-appearance order across all tasks", () => {
    const tasks = [
      makeTask({ image: "a.jpg", results: [makeResult({ rectanglelabels: ["dog"] })] }),
      makeTask({ image: "b.jpg", results: [makeResult({ rectanglelabels: ["cat"] })] }),
    ];
    const { classNames, images } = parseLabelStudio(serialize(tasks));
    expect(classNames).toEqual(["dog", "cat"]);
    expect(images[0]!.annotations[0]!.classId).toBe(0); // dog
    expect(images[1]!.annotations[0]!.classId).toBe(1); // cat
  });

  it("parses multiple annotations on one task", () => {
    const results = [
      makeResult({ x: 0, y: 0, width: 10, height: 10, rectanglelabels: ["cat"] }),
      makeResult({ x: 50, y: 50, width: 20, height: 20, rectanglelabels: ["dog"] }),
      makeResult({ x: 80, y: 80, width: 10, height: 10, rectanglelabels: ["cat"] }),
    ];
    const task = makeTask({ results });
    const { images, classNames } = parseLabelStudio(serialize([task]));

    expect(classNames).toEqual(["cat", "dog"]);
    expect(images[0]!.annotations).toHaveLength(3);
    expect(images[0]!.annotations[0]!.classId).toBe(0); // cat
    expect(images[0]!.annotations[1]!.classId).toBe(1); // dog
    expect(images[0]!.annotations[2]!.classId).toBe(0); // cat again — same id
  });

  it("adds image with empty annotations when task has no annotation results", () => {
    const task = { id: 1, data: { image: "empty.jpg" }, annotations: [] };
    const { images } = parseLabelStudio(serialize([task]));
    expect(images).toHaveLength(1);
    expect(images[0]!.fileName).toBe("empty.jpg");
    expect(images[0]!.annotations).toEqual([]);
  });

  it("returns empty images and classNames for empty task list", () => {
    const { classNames, images } = parseLabelStudio(serialize([]));
    expect(classNames).toEqual([]);
    expect(images).toEqual([]);
  });

  it("throws LabelStudioParseError on invalid JSON", () => {
    expect(() => parseLabelStudio("{not valid json")).toThrow(LabelStudioParseError);
    expect(() => parseLabelStudio("{not valid json")).toThrow(
      /not valid JSON/i,
    );
  });

  it("throws LabelStudioParseError when top-level is not an array", () => {
    expect(() => parseLabelStudio(JSON.stringify({ type: "not-an-array" }))).toThrow(
      LabelStudioParseError,
    );
  });

  it("throws LabelStudioParseError when a task is missing the data.image field", () => {
    const bad = [{ id: 1, data: {}, annotations: [] }];
    expect(() => parseLabelStudio(serialize(bad))).toThrow(LabelStudioParseError);
  });

  it("extracts filename from a full URL path", () => {
    const task = makeTask({ image: "https://storage.example.com/bucket/images/photo.jpg" });
    const { images } = parseLabelStudio(serialize([task]));
    expect(images[0]!.fileName).toBe("photo.jpg");
  });

  it("extracts filename from a relative POSIX path", () => {
    const task = makeTask({ image: "/datasets/train/frame_001.png" });
    const { images } = parseLabelStudio(serialize([task]));
    expect(images[0]!.fileName).toBe("frame_001.png");
  });

  it("assigns review=tp and locked=false to all parsed boxes", () => {
    const task = makeTask({ results: [makeResult()] });
    const { images } = parseLabelStudio(serialize([task]));
    const box = images[0]!.annotations[0]!;
    expect(box.review).toBe("tp");
    expect(box.locked).toBe(false);
    expect(box.hidden).toBe(false);
  });

  it("infers image dimensions from original_width/original_height on results", () => {
    const result = {
      ...makeResult(),
      original_width: 1920,
      original_height: 1080,
    };
    const task = makeTask({ results: [result] });
    const { images } = parseLabelStudio(serialize([task]));
    expect(images[0]!.width).toBe(1920);
    expect(images[0]!.height).toBe(1080);
  });

  it("picks first non-cancelled annotation when multiple annotations exist on a task", () => {
    const tasks = [
      {
        id: 1,
        data: { image: "img.jpg" },
        annotations: [
          { result: [], was_cancelled: true },
          {
            result: [makeResult({ rectanglelabels: ["bird"] })],
            was_cancelled: false,
          },
        ],
      },
    ];
    const { images, classNames } = parseLabelStudio(serialize(tasks));
    expect(classNames).toContain("bird");
    expect(images[0]!.annotations).toHaveLength(1);
  });
});
