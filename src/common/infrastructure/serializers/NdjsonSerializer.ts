import type { Project } from "@/common/domain/dataset/types";

export function serializeToNdjson(project: Project): string {
  const classNames = [...project.classes]
    .sort((a, b) => a.id - b.id)
    .map((c) => c.name);

  const lines: string[] = [];

  lines.push(
    JSON.stringify({
      type: "dataset",
      task: "detect",
      class_names: classNames,
    }),
  );

  for (const image of project.images) {
    const tpBoxes = image.annotations
      .filter((a) => a.review === "tp")
      .map((a) => [a.classId, a.x, a.y, a.w, a.h] as [number, number, number, number, number]);

    lines.push(
      JSON.stringify({
        type: "image",
        file: image.fileName,
        split: image.split,
        width: image.width,
        height: image.height,
        annotations: { boxes: tpBoxes },
      }),
    );
  }

  return lines.join("\n");
}
