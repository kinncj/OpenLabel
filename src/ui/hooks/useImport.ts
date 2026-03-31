"use client";

import { useCallback, useState } from "react";
import { useProjectStore } from "@/ui/stores/projectStore";
import { useUiStore } from "@/ui/stores/uiStore";
import { importDataset } from "@/common/application/use-cases/ImportDataset";
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

export function useImport() {
  const { setProjects, projects } = useProjectStore();
  const { addToast, setImportDialogOpen } = useUiStore();
  const [importing, setImporting] = useState(false);

  const importZip = useCallback(
    async (file: File): Promise<string | null> => {
      setImporting(true);
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { project, warnings } = await importDataset(bytes, getRepos());
        setProjects([project, ...projects]);
        for (const w of warnings) {
          addToast({ message: w, variant: "warning" });
        }
        addToast({ message: `Imported "${project.name}"`, variant: "success" });
        setImportDialogOpen(false);
        return project.id;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addToast({ message: `Import failed: ${msg}`, variant: "error" });
        return null;
      } finally {
        setImporting(false);
      }
    },
    [projects, setProjects, addToast, setImportDialogOpen],
  );

  return { importZip, importing };
}
