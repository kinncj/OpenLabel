"use client";

import { useCallback } from "react";
import { useProjectStore } from "@/ui/stores/projectStore";
import { useUiStore } from "@/ui/stores/uiStore";
import { addImages as addImagesUC } from "@/common/application/use-cases/AddImages";
import { getDb } from "@/common/infrastructure/persistence/db";
import { ImageRepository } from "@/common/infrastructure/persistence/ImageRepository";
import { BlobRepository } from "@/common/infrastructure/persistence/BlobRepository";

function getRepos() {
  const db = getDb();
  return {
    image: new ImageRepository(db),
    blob: new BlobRepository(db),
  };
}

export function useImages() {
  const { activeProject, upsertImage } = useProjectStore();
  const { setActiveImage, addToast } = useUiStore();

  const addImages = useCallback(
    async (files: File[]) => {
      if (!activeProject) {
        addToast({ message: "No active project", variant: "error" });
        return;
      }
      try {
        const repos = getRepos();
        const { added, failed } = await addImagesUC(
          activeProject.id,
          files,
          repos.image,
          repos.blob,
        );
        for (const img of added) {
          upsertImage(img);
        }
        if (added.length > 0) {
          addToast({ message: `Added ${added.length} image(s)`, variant: "success" });
          if (!useUiStore.getState().activeImageId) {
            setActiveImage(added[0]!.id);
          }
        }
        for (const failure of failed) {
          addToast({
            message: `Failed: ${failure.fileName} — ${failure.reason}`,
            variant: "warning",
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addToast({ message: `Image upload failed: ${msg}`, variant: "error" });
      }
    },
    [activeProject, upsertImage, addToast, setActiveImage],
  );

  return { addImages };
}
