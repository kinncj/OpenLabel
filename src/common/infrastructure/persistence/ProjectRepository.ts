import type { Project } from "@/common/domain/dataset/types";
import type { IProjectRepository } from "@/common/infrastructure/persistence/interfaces";
import type { OpenLabelDb, PersistedProject } from "@/common/infrastructure/persistence/db";

function toPersistedProject(project: Project): PersistedProject {
  // Strip images — stored separately
  const { images: _images, ...rest } = project;
  return rest;
}

export class ProjectRepository implements IProjectRepository {
  constructor(private readonly db: OpenLabelDb) {}

  async create(project: Project): Promise<void> {
    await this.db.transaction("rw", [this.db.projects, this.db.images], async () => {
      await this.db.projects.add(toPersistedProject(project));
      if (project.images.length > 0) {
        const rows = project.images.map((img) => ({
          ...img,
          projectId: project.id,
        }));
        await this.db.images.bulkAdd(rows);
      }
    });
  }

  async findById(id: string): Promise<Project | undefined> {
    const row = await this.db.projects.get(id);
    if (!row) return undefined;
    const images = await this.db.images.where("projectId").equals(id).toArray();
    return { ...row, images };
  }

  async findAll(): Promise<Project[]> {
    const rows = await this.db.projects.orderBy("updatedAt").reverse().toArray();
    // Don't load images for the list view — callers that need images call findById
    return rows.map((row) => ({ ...row, images: [] }));
  }

  async save(project: Project): Promise<void> {
    await this.db.projects.put(toPersistedProject(project));
  }

  async delete(id: string): Promise<void> {
    await this.db.transaction("rw", [this.db.projects, this.db.images, this.db.blobs], async () => {
      // Collect blob keys for images in this project
      const images = await this.db.images.where("projectId").equals(id).toArray();
      const hashesToCheck = images.map((img) => img.hash);

      await this.db.images.where("projectId").equals(id).delete();
      await this.db.projects.delete(id);

      // Delete blobs that are no longer referenced by any other project
      for (const hash of hashesToCheck) {
        const still = await this.db.images.where("hash").equals(hash).count();
        if (still === 0) {
          await this.db.blobs.delete(hash);
        }
      }
    });
  }
}
