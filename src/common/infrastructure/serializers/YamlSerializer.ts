import type { Project } from "@/common/domain/dataset/types";

export function serializeToDataYaml(project: Project, hasTest: boolean): string {
  const names = [...project.classes]
    .sort((a, b) => a.id - b.id)
    .map((c) => `  - ${c.name}`)
    .join("\n");

  const nc = project.classes.length;

  const lines = [
    `path: .`,
    `train: images/train`,
    `val: images/val`,
  ];

  if (hasTest) {
    lines.push(`test: images/test`);
  }

  lines.push(``, `nc: ${nc}`, `names:`, names);

  return lines.join("\n") + "\n";
}
