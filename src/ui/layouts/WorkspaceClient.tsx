"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { withClientOnly } from "@/ui/hoc/withClientOnly";
import { withErrorBoundary } from "@/ui/hoc/withErrorBoundary";
import { WorkspaceLayout } from "@/ui/layouts/WorkspaceLayout";
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
  const router = useRouter();
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

  return (
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
              background: "#4363d822",
              border: "3px dashed #4363d8",
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <p style={{ fontSize: 20, color: "#4363d8", fontWeight: 600 }}>Drop images to add</p>
          </div>
        )}

        <ClientImageSidebar />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div
            style={{
              height: 40,
              borderBottom: "1px solid var(--color-border, #2a2a3e)",
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              gap: 12,
              fontSize: 13,
              color: "#888",
            }}
          >
            <button
              type="button"
              onClick={() => router.push("/")}
              title="Back to projects"
              aria-label="Back to projects"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#888",
                fontSize: 12,
                padding: "4px 6px",
                borderRadius: 4,
              }}
            >
              <ArrowLeft size={14} />
              Projects
            </button>
            <span style={{ color: "#2a2a3e" }}>|</span>
            <span style={{ fontWeight: 600, color: "#e0e0e0" }}>
              {activeProject?.name ?? "Loading…"}
            </span>
            {activeImage && (
              <span>
                {activeImage.fileName} — {activeImage.width}×{activeImage.height}
              </span>
            )}
          </div>

          {activeImage && blobUrl ? (
            <AnnotationCanvas image={activeImage} blobUrl={blobUrl} />
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#555",
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
  );
}

export const WorkspaceClient = withClientOnly(WorkspaceInner);
