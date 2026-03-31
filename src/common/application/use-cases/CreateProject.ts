import { v4 as uuidv4 } from "uuid";
import type { Project } from "@/common/domain/dataset/types";
import type { IProjectRepository } from "@/common/infrastructure/persistence/interfaces";

export async function createProject(
  name: string,
  description: string | undefined,
  repo: IProjectRepository,
): Promise<Project> {
  const now = new Date().toISOString();
  const project: Project = {
    id: uuidv4(),
    name,
    ...(description !== undefined ? { description } : {}),
    version: 1,
    createdAt: now,
    updatedAt: now,
    classes: [],
    images: [],
    exportOptions: {
      includeYaml: true,
      includeTxtLabels: true,
      includeLabelStudio: true,
      blockIncompleteImages: true,
    },
  };

  await repo.create(project);
  return project;
}
