"use client";

import { useCallback } from "react";
import type { BoxAnnotation, BoxReviewState } from "@/common/domain/annotations/types";
import { useProjectStore } from "@/ui/stores/projectStore";
import { useUiStore } from "@/ui/stores/uiStore";
import { useCanvasStore } from "@/ui/stores/canvasStore";
import { saveAnnotations as saveAnnotationsUC } from "@/common/application/use-cases/SaveAnnotations";
import { getDb } from "@/common/infrastructure/persistence/db";
import { ImageRepository } from "@/common/infrastructure/persistence/ImageRepository";

function getImageRepo() {
  return new ImageRepository(getDb());
}

function reindexZOrder(annotations: BoxAnnotation[]): BoxAnnotation[] {
  return [...annotations]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((ann, i) => ({ ...ann, zIndex: i }));
}

export function useAnnotations() {
  const { activeProject, upsertImage } = useProjectStore();
  const { activeImageId, addToast } = useUiStore();
  const { selectBox } = useCanvasStore();

  const activeImage = activeProject?.images.find((img) => img.id === activeImageId) ?? null;

  const persist = useCallback(
    async (imageId: string, annotations: BoxAnnotation[]) => {
      try {
        await saveAnnotationsUC(imageId, annotations, getImageRepo());
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addToast({ message: `Autosave failed: ${msg}`, variant: "error" });
      }
    },
    [addToast],
  );

  const saveBox = useCallback(
    async (box: BoxAnnotation) => {
      if (!activeImage) return;
      const nextZIndex = activeImage.annotations.length;
      const boxWithZ = { ...box, zIndex: nextZIndex };
      const annotations = [...activeImage.annotations, boxWithZ];
      const updated = { ...activeImage, annotations };
      upsertImage(updated);
      await persist(activeImage.id, annotations);
    },
    [activeImage, upsertImage, persist],
  );

  const deleteBox = useCallback(
    async (id: string) => {
      if (!activeImage) return;
      const annotations = reindexZOrder(activeImage.annotations.filter((a) => a.id !== id));
      upsertImage({ ...activeImage, annotations });
      await persist(activeImage.id, annotations);
      selectBox(null);
    },
    [activeImage, upsertImage, persist, selectBox],
  );

  const updateBox = useCallback(
    async (id: string, patch: Partial<BoxAnnotation>) => {
      if (!activeImage) return;
      const annotations = activeImage.annotations.map((a) =>
        a.id === id ? { ...a, ...patch } : a,
      );
      upsertImage({ ...activeImage, annotations });
      await persist(activeImage.id, annotations);
    },
    [activeImage, upsertImage, persist],
  );

  const setBoxReview = useCallback(
    (id: string, review: BoxReviewState) => updateBox(id, { review }),
    [updateBox],
  );

  const setBoxLocked = useCallback(
    (id: string, locked: boolean) => updateBox(id, { locked }),
    [updateBox],
  );

  const setBoxHidden = useCallback(
    (id: string, hidden: boolean) => updateBox(id, { hidden }),
    [updateBox],
  );

  const bringForward = useCallback(
    async (id: string) => {
      if (!activeImage) return;
      const sorted = [...activeImage.annotations].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((a) => a.id === id);
      if (idx < 0 || idx >= sorted.length - 1) return;
      // Swap with next
      const tmp = sorted[idx + 1]!.zIndex;
      sorted[idx + 1] = { ...sorted[idx + 1]!, zIndex: sorted[idx]!.zIndex };
      sorted[idx] = { ...sorted[idx]!, zIndex: tmp };
      const annotations = reindexZOrder(sorted);
      upsertImage({ ...activeImage, annotations });
      await persist(activeImage.id, annotations);
    },
    [activeImage, upsertImage, persist],
  );

  const sendBackward = useCallback(
    async (id: string) => {
      if (!activeImage) return;
      const sorted = [...activeImage.annotations].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((a) => a.id === id);
      if (idx <= 0) return;
      const tmp = sorted[idx - 1]!.zIndex;
      sorted[idx - 1] = { ...sorted[idx - 1]!, zIndex: sorted[idx]!.zIndex };
      sorted[idx] = { ...sorted[idx]!, zIndex: tmp };
      const annotations = reindexZOrder(sorted);
      upsertImage({ ...activeImage, annotations });
      await persist(activeImage.id, annotations);
    },
    [activeImage, upsertImage, persist],
  );

  const bringToFront = useCallback(
    async (id: string) => {
      if (!activeImage) return;
      const max = Math.max(...activeImage.annotations.map((a) => a.zIndex), -1);
      await updateBox(id, { zIndex: max + 1 });
    },
    [activeImage, updateBox],
  );

  const sendToBack = useCallback(
    async (id: string) => {
      if (!activeImage) return;
      const sorted = [...activeImage.annotations].sort((a, b) => a.zIndex - b.zIndex);
      const target = sorted.find((a) => a.id === id);
      if (!target) return;
      const annotations = reindexZOrder([
        { ...target, zIndex: -1 },
        ...sorted.filter((a) => a.id !== id),
      ]);
      upsertImage({ ...activeImage, annotations });
      await persist(activeImage.id, annotations);
    },
    [activeImage, upsertImage, persist],
  );

  return {
    activeImage,
    saveBox,
    deleteBox,
    updateBox,
    setBoxReview,
    setBoxLocked,
    setBoxHidden,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
  };
}
