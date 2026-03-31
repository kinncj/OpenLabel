"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { withClientOnly } from "@/ui/hoc/withClientOnly";
import { withErrorBoundary } from "@/ui/hoc/withErrorBoundary";
import { WorkspaceLayout } from "@/ui/layouts/WorkspaceLayout";
import { AppHeader } from "@/ui/components/common/AppHeader";
import { ImageSidebar } from "@/ui/components/ImageSidebar/ImageSidebar";
import { AnnotationPanel } from "@/ui/components/AnnotationPanel/AnnotationPanel";
import { AnnotationCanvas } from "@/ui/components/AnnotationCanvas/AnnotationCanvas";
import { useProject } from "@/ui/hooks/useProject";
import { useImages } from "@/ui/hooks/useImages";
import { useUiStore } from "@/ui/stores/uiStore";
import { useProjectStore } from "@/ui/stores/projectStore";
import { useDropzone } from "react-dropzone";
import { getDb } from "@/common/infrastructure/persistence/db";
import { BlobRepository } from "@/common/infrastructure/persistence/BlobRepository";

const ClientImageSidebar = withClientOnly(withErrorBoundary(ImageSidebar));
const ClientAnnotationPanel = withClientOnly(withErrorBoundary(AnnotationPanel));

function WorkspaceInner() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id") ?? "";
  const { loadProject } = useProject();
  const { addImages } = useImages();
  const { activeProject } = useProjectStore();
  const { activeImageId, setActiveImage } = useUiStore();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) loadProject(projectId);
  }, [projectId, loadProject]);

  useEffect(() => {
    let url: string | null = null;
    if (!activeImageId || !activeProject) return;
    const img = activeProject.images.find((i) => i.id === activeImageId);
    if (!img) return;
    const blobRepo = new BlobRepository(getDb());
    blobRepo.get(img.storedBlobKey).then((blob) => {
      if (blob) {
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      }
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [activeImageId, activeProject]);

  useEffect(() => {
    if (activeProject && activeProject.images.length > 0 && !activeImageId) {
      setActiveImage(activeProject.images[0]!.id);
    }
  }, [activeProject, activeImageId, setActiveImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    noClick: true,
    onDrop: (files) => addImages(files),
  });

  const activeImage = activeProject?.images.find((img) => img.id === activeImageId) ?? null;

  const headerContext = (
    <>
      <span style={{ fontWeight: 600, color: "var(--color-text)", fontSize: 13 }}>
        {activeProject?.name ?? "Loading…"}
      </span>
      {activeImage && (
        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
          {activeImage.fileName} — {activeImage.width}×{activeImage.height}
        </span>
      )}
    </>
  );

  return (
    <>
      <AppHeader>{headerContext}</AppHeader>
      <WorkspaceLayout>
        <div
          {...getRootProps()}
          style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}
        >
          <input {...getInputProps()} aria-label="Drop images to add" />

          {isDragActive && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--color-primary-subtle)",
                border: "3px dashed var(--color-primary)",
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <p style={{ fontSize: 20, color: "var(--color-primary)", fontWeight: 600 }}>Drop images to add</p>
            </div>
          )}

          <ClientImageSidebar />

          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {activeImage && blobUrl ? (
              <AnnotationCanvas image={activeImage} blobUrl={blobUrl} />
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-text-dim)",
                  fontSize: 14,
                }}
              >
                {activeProject?.images.length === 0
                  ? "Drop images anywhere to get started"
                  : "Select an image from the sidebar"}
              </div>
            )}
          </div>

          <ClientAnnotationPanel />
        </div>
      </WorkspaceLayout>
    </>
  );
}

export const WorkspaceClient = withClientOnly(WorkspaceInner);
