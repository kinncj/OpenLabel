"use client";

import { useCallback, useState } from "react";
import { useProjectStore } from "@/ui/stores/projectStore";
import { useUiStore } from "@/ui/stores/uiStore";
import { exportDataset } from "@/common/application/use-cases/ExportDataset";
import type { ImageRecord } from "@/common/domain/dataset/types";
import { getDb } from "@/common/infrastructure/persistence/db";
import { ProjectRepository } from "@/common/infrastructure/persistence/ProjectRepository";
import { ImageRepository } from "@/common/infrastructure/persistence/ImageRepository";
import { BlobRepository } from "@/common/infrastructure/persistence/BlobRepository";

function getRepos() {
  const db = getDb();
  return {
    project: new ProjectRepository(db),
    image: new ImageRepository(db),
    blob: new BlobRepository(db),
  };
}

export function useExport() {
  const { activeProject } = useProjectStore();
  const { addToast } = useUiStore();
  const [blockedImages, setBlockedImages] = useState<ImageRecord[] | null>(null);
  const [exporting, setExporting] = useState(false);

  const triggerDownload = (bytes: Uint8Array, filename: string) => {
    const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const doExport = useCallback(
    async (force = false) => {
      if (!activeProject) {
        addToast({ message: "No active project to export", variant: "error" });
        return;
      }
      setExporting(true);
      try {
        const result = await exportDataset(activeProject.id, getRepos(), force);
        if (result.type === "ExportGateBlocked") {
          setBlockedImages(result.incompleteImages);
          return;
        }
        for (const w of result.warnings) {
          addToast({ message: w, variant: "warning" });
        }
        const filename = `${activeProject.name.replace(/[^a-z0-9]/gi, "_")}-export.zip`;
        triggerDownload(result.zip, filename);
        addToast({ message: "Export complete", variant: "success" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addToast({ message: `Export failed: ${msg}`, variant: "error" });
      } finally {
        setExporting(false);
      }
    },
    [activeProject, addToast],
  );

  const exportWithOverride = useCallback(async () => {
    setBlockedImages(null);
    await doExport(true);
  }, [doExport]);

  const dismissExportGate = useCallback(() => setBlockedImages(null), []);

  return { doExport, exportWithOverride, dismissExportGate, blockedImages, exporting };
}
