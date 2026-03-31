import type { Project, ImageRecord } from "@/common/domain/dataset/types";
import type {
  IProjectRepository,
  IImageRepository,
  IBlobRepository,
} from "@/common/infrastructure/persistence/interfaces";
import { applySplitPolicy } from "@/common/application/services/SplitPolicy";
import { serializeToNdjson } from "@/common/infrastructure/serializers/NdjsonSerializer";
import { serializeImageToYoloTxt } from "@/common/infrastructure/serializers/YoloTxtSerializer";
import { serializeToDataYaml } from "@/common/infrastructure/serializers/YamlSerializer";
import { serializeToLabelStudio } from "@/common/infrastructure/serializers/LabelStudioSerializer";
import { buildZip } from "@/common/infrastructure/zip/ZipWriter";
import { strToU8 } from "fflate";

export type ExportGateError = {
  type: "ExportGateBlocked";
  incompleteImages: ImageRecord[];
};

export type ExportSuccess = {
  type: "success";
  zip: Uint8Array;
  warnings: string[];
};

export type ExportResult = ExportGateError | ExportSuccess;

export async function exportDataset(
  projectId: string,
  repos: {
    project: IProjectRepository;
    image: IImageRepository;
    blob: IBlobRepository;
  },
  forceIncomplete = false,
): Promise<ExportResult> {
  const project = await repos.project.findById(projectId);
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const images = await repos.image.findByProject(projectId);
  if (images.length === 0) {
    throw new Error("Cannot export an empty project");
  }

  // Export gate
  if (project.exportOptions.blockIncompleteImages && !forceIncomplete) {
    const incomplete = images.filter((img) => img.reviewState === "incomplete");
    if (incomplete.length > 0) {
      return { type: "ExportGateBlocked", incompleteImages: incomplete };
    }
  }

  const warnings: string[] = [];

  if (forceIncomplete) {
    const incompleteCount = images.filter((img) => img.reviewState === "incomplete").length;
    if (incompleteCount > 0) {
      warnings.push(
        `Exporting with ${incompleteCount} incomplete image(s). Review annotations before training.`,
      );
    }
  }

  // Apply split policy
  const imagesWithSplits = applySplitPolicy(images);
  const hasTest = imagesWithSplits.some((img) => img.split === "test");
  const hasVal = imagesWithSplits.some((img) => img.split === "val");

  if (!hasVal) {
    warnings.push("No val split found. Add at least one val image for proper training.");
  }

  const fullProject: Project = { ...project, images: imagesWithSplits };

  const entries = new Map<string, Uint8Array | string>();

  // NDJSON
  entries.set("dataset.ndjson", serializeToNdjson(fullProject));

  // YAML
  if (project.exportOptions.includeYaml) {
    entries.set("data.yaml", serializeToDataYaml(fullProject, hasTest));
  }

  // Label Studio JSON
  if (project.exportOptions.includeLabelStudio) {
    entries.set("labelstudio.json", serializeToLabelStudio(fullProject));
  }

  // meta/project.json — full round-trip metadata including UI state
  const metaProject = { ...project, images };
  entries.set("meta/project.json", JSON.stringify(metaProject, null, 2));

  // Image blobs and YOLO txt labels
  for (const image of imagesWithSplits) {
    const blob = await repos.blob.get(image.storedBlobKey);
    if (!blob) {
      warnings.push(`Missing blob for image: ${image.fileName} — skipped`);
      continue;
    }

    const imageBytes = new Uint8Array(await blob.arrayBuffer());
    entries.set(`images/${image.split}/${image.fileName}`, imageBytes);

    if (project.exportOptions.includeTxtLabels) {
      const stem = image.fileName.replace(/\.[^.]+$/, "");
      entries.set(`labels/${image.split}/${stem}.txt`, serializeImageToYoloTxt(image));
    }
  }

  const zip = buildZip(entries);
  return { type: "success", zip, warnings };
}
