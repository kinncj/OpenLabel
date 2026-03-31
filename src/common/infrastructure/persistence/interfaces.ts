import type { Project } from "@/common/domain/dataset/types";
import type { ImageRecord } from "@/common/domain/dataset/types";
import type { BoxAnnotation } from "@/common/domain/annotations/types";

export interface IProjectRepository {
  create(project: Project): Promise<void>;
  findById(id: string): Promise<Project | undefined>;
  findAll(): Promise<Project[]>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IImageRepository {
  addImages(projectId: string, images: ImageRecord[]): Promise<void>;
  findByProject(projectId: string): Promise<ImageRecord[]>;
  findById(id: string): Promise<ImageRecord | undefined>;
  saveAnnotations(imageId: string, annotations: BoxAnnotation[]): Promise<void>;
  findByHash(projectId: string, hash: string): Promise<ImageRecord | undefined>;
  delete(imageId: string): Promise<void>;
  updateSplit(imageId: string, split: ImageRecord["split"]): Promise<void>;
  updateReviewState(
    imageId: string,
    reviewState: ImageRecord["reviewState"],
  ): Promise<void>;
}

export interface IBlobRepository {
  save(key: string, blob: Blob): Promise<void>;
  get(key: string): Promise<Blob | undefined>;
  delete(key: string): Promise<void>;
}
