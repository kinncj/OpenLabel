import { v4 as uuidv4 } from "uuid";
import type { Project, ImageRecord } from "@/common/domain/dataset/types";
import type {
  IProjectRepository,
  IImageRepository,
  IBlobRepository,
} from "@/common/infrastructure/persistence/interfaces";
import { readZip } from "@/common/infrastructure/zip/ZipReader";
import { parseNdjson } from "@/common/infrastructure/parsers/NdjsonParser";
import { parseLabelStudio } from "@/common/infrastructure/parsers/LabelStudioParser";
import { ProjectSchema, ImageRecordSchema } from "@/common/domain/dataset/schemas";

export type ImportResult = {
  project: Project;
  warnings: string[];
};

function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder("utf-8").decode(bytes);
}

export async function importDataset(
  zipBytes: Uint8Array,
  repos: {
    project: IProjectRepository;
    image: IImageRepository;
    blob: IBlobRepository;
  },
): Promise<ImportResult> {
  const entries = readZip(zipBytes);
  const warnings: string[] = [];
  const now = new Date().toISOString();

  // --- Priority 1: meta/project.json ---
  let baseProject: Project | null = null;
  const metaBytes = entries.get("meta/project.json");
  if (metaBytes) {
    try {
      const raw = JSON.parse(utf8Decode(metaBytes));
      const result = ProjectSchema.safeParse(raw);
      if (result.success) {
        baseProject = result.data;
      } else {
        warnings.push(`meta/project.json validation failed: ${result.error.message}`);
      }
    } catch {
      warnings.push("meta/project.json could not be parsed as JSON");
    }
  }

  // --- Priority 2: dataset.ndjson ---
  const ndjsonBytes = entries.get("dataset.ndjson");
  // --- Priority 2b: labelstudio.json ---
  const lsBytes = entries.get("labelstudio.json");

  if (!ndjsonBytes && !lsBytes && !baseProject) {
    throw new Error("Zip contains neither meta/project.json, dataset.ndjson, nor labelstudio.json");
  }

  let ndjsonImages: ImageRecord[] = [];
  let classNames: string[] = [];
  if (ndjsonBytes) {
    try {
      const { dataset, images: ndjsonLines } = parseNdjson(utf8Decode(ndjsonBytes));
      classNames = dataset.class_names;
      ndjsonImages = ndjsonLines.map((line) => ({
        id: uuidv4(),
        fileName: line.file,
        storedBlobKey: "",
        width: line.width,
        height: line.height,
        split: line.split,
        reviewState: "incomplete" as const,
        annotations: line.annotations.boxes.map((box, i) => ({
          id: uuidv4(),
          classId: box[0],
          x: box[1],
          y: box[2],
          w: box[3],
          h: box[4],
          zIndex: i,
          review: "tp" as const,
          locked: false,
          hidden: false,
        })),
        hash: "",
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      warnings.push(`dataset.ndjson parse error: ${msg}`);
    }
  }

  // --- Priority 2b: labelstudio.json (fallback when no NDJSON) ---
  let lsImages: ImageRecord[] = [];
  let lsClassNames: string[] = [];
  if (lsBytes && ndjsonImages.length === 0 && !baseProject) {
    try {
      const { classNames: lsCls, images: lsRaw } = parseLabelStudio(utf8Decode(lsBytes));
      lsClassNames = lsCls;
      lsImages = lsRaw.map((img) => ({
        id: uuidv4(),
        fileName: img.fileName,
        storedBlobKey: "",
        width: img.width,
        height: img.height,
        split: "train" as const,
        reviewState: "incomplete" as const,
        annotations: img.annotations,
        hash: "",
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      warnings.push(`labelstudio.json parse error: ${msg}`);
    }
  }

  // Merge: if we have both, prefer meta/project.json for UI state
  let images: ImageRecord[];
  let project: Project;

  if (baseProject) {
    // Merge ndjson training annotations into meta images if present
    if (ndjsonImages.length > 0) {
      const ndjsonByFile = new Map(ndjsonImages.map((img) => [img.fileName, img]));
      images = baseProject.images.map((metaImg) => {
        const ndjsonImg = ndjsonByFile.get(metaImg.fileName);
        if (!ndjsonImg) return metaImg;
        // Use meta for UI fields, ndjson for tp annotations
        const tpBoxes = ndjsonImg.annotations;
        const otherBoxes = metaImg.annotations.filter((a) => a.review !== "tp");
        return {
          ...metaImg,
          width: ndjsonImg.width,
          height: ndjsonImg.height,
          annotations: [...tpBoxes, ...otherBoxes],
        };
      });
    } else {
      images = baseProject.images;
    }
    project = { ...baseProject, id: uuidv4(), images, updatedAt: now };
  } else {
    // Fallback: construct project from NDJSON or Label Studio
    const sourceImages = ndjsonImages.length > 0 ? ndjsonImages : lsImages;
    const sourceClassNames = ndjsonImages.length > 0 ? classNames : lsClassNames;
    const classes = sourceClassNames.map((name, i) => ({
      id: i,
      name,
      color: "#a9a9a9",
      source: "imported" as const,
    }));
    images = sourceImages;
    project = {
      id: uuidv4(),
      name: "Imported Dataset",
      version: 1,
      createdAt: now,
      updatedAt: now,
      classes,
      images: [],
      exportOptions: {
        includeYaml: true,
        includeTxtLabels: true,
        includeLabelStudio: false,
        blockIncompleteImages: true,
      },
    };
  }

  // --- Store blobs from zip ---
  for (const image of images) {
    const splits = ["train", "val", "test"] as const;
    let found = false;
    for (const split of splits) {
      const blobKey = `images/${split}/${image.fileName}`;
      const blobBytes = entries.get(blobKey);
      if (blobBytes) {
        const ext = image.fileName.split(".").pop()?.toLowerCase() ?? "jpg";
        const mimeMap: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
        };
        const mime = mimeMap[ext] ?? "image/jpeg";
        const blob = new Blob([blobBytes as Uint8Array<ArrayBuffer>], { type: mime });
        const key = image.storedBlobKey || image.hash || uuidv4();
        await repos.blob.save(key, blob);
        image.storedBlobKey = key;
        found = true;
        break;
      }
    }
    if (!found) {
      warnings.push(`Image blob not found in zip: ${image.fileName}`);
    }
  }

  // Validate final images
  const validImages: ImageRecord[] = [];
  for (const img of images) {
    const result = ImageRecordSchema.safeParse(img);
    if (result.success) {
      validImages.push(result.data);
    } else {
      warnings.push(`Skipping invalid image record (${img.fileName}): ${result.error.message}`);
    }
  }

  const finalProject: Project = { ...project, images: validImages };

  await repos.project.create(finalProject);

  return { project: finalProject, warnings };
}
