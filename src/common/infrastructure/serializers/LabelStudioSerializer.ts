import type { Project } from "@/common/domain/dataset/types";
import type { BoxAnnotation } from "@/common/domain/annotations/types";
import type { ClassDef } from "@/common/domain/classes/types";

// Label Studio JSON export format — object detection (RectangleLabels)
// Coordinates: x, y are top-left as % of image dimensions (0–100)
// Our format: x, y are center as normalized 0–1

type LSValue = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  rectanglelabels: string[];
};

type LSResult = {
  id: string;
  from_name: string;
  to_name: string;
  type: "rectanglelabels";
  value: LSValue;
  original_width: number;
  original_height: number;
  image_rotation: number;
};

type LSAnnotation = {
  result: LSResult[];
  was_cancelled: boolean;
};

type LSTask = {
  id: number;
  data: { image: string };
  annotations: LSAnnotation[];
};

function boxToResult(
  box: BoxAnnotation,
  classMap: Map<number, ClassDef>,
  imageWidth: number,
  imageHeight: number,
  idx: number,
): LSResult {
  const cls = classMap.get(box.classId);
  const label = cls?.name ?? `class_${box.classId}`;

  // Convert: center-normalized → top-left percentage
  const x = (box.x - box.w / 2) * 100;
  const y = (box.y - box.h / 2) * 100;
  const w = box.w * 100;
  const h = box.h * 100;

  return {
    id: `result_${idx}`,
    from_name: "label",
    to_name: "image",
    type: "rectanglelabels",
    value: { x, y, width: w, height: h, rotation: 0, rectanglelabels: [label] },
    original_width: imageWidth,
    original_height: imageHeight,
    image_rotation: 0,
  };
}

export function serializeToLabelStudio(project: Project): string {
  const classMap = new Map(project.classes.map((c) => [c.id, c]));

  const tasks: LSTask[] = project.images.map((image, taskIdx) => {
    const results: LSResult[] = [];
    let resultIdx = 0;

    for (const ann of image.annotations) {
      // Only export tp boxes (same rule as NDJSON training export)
      if (ann.review !== "tp") continue;
      results.push(boxToResult(ann, classMap, image.width, image.height, resultIdx++));
    }

    return {
      id: taskIdx + 1,
      data: { image: `images/${image.split}/${image.fileName}` },
      annotations: [{ result: results, was_cancelled: false }],
    };
  });

  return JSON.stringify(tasks, null, 2);
}
