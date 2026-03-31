import type { ClassDef } from "@/common/domain/classes/types";
import { coco80Classes } from "@/common/domain/classes/packs/coco80";
import { voc20Classes } from "@/common/domain/classes/packs/voc20";
import { visdrone10Classes } from "@/common/domain/classes/packs/visdrone10";
import { xview60Classes } from "@/common/domain/classes/packs/xview60";
import { objects365Classes } from "@/common/domain/classes/packs/objects365";
import { openImagesV7Classes } from "@/common/domain/classes/packs/openimagesv7";
import { lvisClasses } from "@/common/domain/classes/packs/lvis";
import { globalWheatClasses } from "@/common/domain/classes/packs/globalwheat";
import { brainTumorClasses } from "@/common/domain/classes/packs/brain-tumor";
import { africanWildlifeClasses } from "@/common/domain/classes/packs/african-wildlife";
import { signatureClasses } from "@/common/domain/classes/packs/signature";
import { medicalPillsClasses } from "@/common/domain/classes/packs/medical-pills";

export type ClassPackMeta = {
  id: string;
  label: string;
  description: string;
  classes: ClassDef[];
};

export const CLASS_PACKS: ClassPackMeta[] = [
  // ── General purpose ──────────────────────────────────────────────────────
  {
    id: "coco80",
    label: "COCO-80",
    description: "MS COCO 2017 — 80 everyday objects (person, car, chair, …)",
    classes: coco80Classes,
  },
  {
    id: "voc20",
    label: "VOC-20",
    description: "PASCAL VOC — 20 classes (aeroplane, bicycle, person, …)",
    classes: voc20Classes,
  },
  {
    id: "objects365",
    label: "Objects365 (365)",
    description: "Objects365 v2 — 365 everyday objects, large-scale detection",
    classes: objects365Classes,
  },
  {
    id: "openimagesv7",
    label: "Open Images V7 (601)",
    description: "Google Open Images V7 — 601 classes across diverse categories",
    classes: openImagesV7Classes,
  },
  {
    id: "lvis",
    label: "LVIS (1203)",
    description: "LVIS v1 — 1203 long-tail categories for fine-grained detection",
    classes: lvisClasses,
  },
  // ── Aerial / overhead ────────────────────────────────────────────────────
  {
    id: "visdrone10",
    label: "VisDrone-10",
    description: "VisDrone-DET 2019 — 10 drone-captured object classes",
    classes: visdrone10Classes,
  },
  {
    id: "xview60",
    label: "xView-60",
    description: "DIUx xView 2018 — 60 overhead satellite imagery classes",
    classes: xview60Classes,
  },
  // ── Domain-specific ──────────────────────────────────────────────────────
  {
    id: "globalwheat",
    label: "Global Wheat",
    description: "Global Wheat Detection 2020 — wheat_head spike detection",
    classes: globalWheatClasses,
  },
  {
    id: "braintumor",
    label: "Brain Tumor",
    description: "Brain tumor MRI — 2 classes: negative / positive",
    classes: brainTumorClasses,
  },
  {
    id: "africanwildlife",
    label: "African Wildlife",
    description: "African wildlife — buffalo, elephant, rhino, zebra",
    classes: africanWildlifeClasses,
  },
  {
    id: "signature",
    label: "Signature",
    description: "Signature detection — single class",
    classes: signatureClasses,
  },
  {
    id: "medicalpills",
    label: "Medical Pills",
    description: "Medical pill detection — single class",
    classes: medicalPillsClasses,
  },
];

// Keyed map for direct lookup by id
export const CLASS_PACK_REGISTRY: Map<string, ClassDef[]> = new Map(
  CLASS_PACKS.map((p) => [p.id, p.classes]),
);
