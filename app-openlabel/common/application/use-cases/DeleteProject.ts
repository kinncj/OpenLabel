import type { IProjectRepository } from "@/common/infrastructure/persistence/interfaces";

export async function deleteProject(
  projectId: string,
  repo: IProjectRepository,
): Promise<void> {
  await repo.delete(projectId);
}
