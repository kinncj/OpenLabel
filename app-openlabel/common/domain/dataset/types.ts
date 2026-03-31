import type { BoxAnnotation } from "@/common/domain/annotations/types";
import type { ClassDef } from "@/common/domain/classes/types";

export type Split = "train" | "val" | "test";
export type ImageReviewState = "complete" | "incomplete" | "negative";

export type ImageRecord = {
  id: string;
  fileName: string;
  storedBlobKey: string;
  width: number;
  height: number;
  split: Split;
  reviewState: ImageReviewState;
  annotations: BoxAnnotation[];
  hash: string;
};

export type ExportOptions = {
  includeYaml: boolean;
  includeTxtLabels: boolean;
  includeLabelStudio: boolean;
  blockIncompleteImages: boolean;
};

export type Project = {
  id: string;
  name: string;
  description?: string | undefined;
  version: number;
  createdAt: string;
  updatedAt: string;
  classes: ClassDef[];
  images: ImageRecord[];
  exportOptions: ExportOptions;
};
