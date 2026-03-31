"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/ui/stores/projectStore";
import { useUiStore } from "@/ui/stores/uiStore";
import { useAnnotations } from "@/ui/hooks/useAnnotations";
import { useExport } from "@/ui/hooks/useExport";
import { ClassManager } from "@/ui/components/AnnotationPanel/ClassManager";
import { AnnotationStack } from "@/ui/components/AnnotationPanel/AnnotationStack";
import { BoxProperties } from "@/ui/components/AnnotationPanel/BoxProperties";

type Tab = "classes" | "stack" | "box";

export function AnnotationPanel() {
  const { activeProject } = useProjectStore();
  const { activeImageId } = useUiStore();
  const { activeImage } = useAnnotations();
  const { doExport, exportWithOverride, dismissExportGate, blockedImages, exporting } = useExport();
  const [tab, setTab] = useState<Tab>("classes");

  const panelStyle: React.CSSProperties = {
    width: 240,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid var(--color-border, #2a2a3e)",
    background: "var(--color-surface, #16213e)",
    overflow: "hidden",
  };

  return (
    <aside aria-label="Annotation panel" style={panelStyle}>
      {/* Export button */}
      <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--color-border, #2a2a3e)" }}>
        <button
          type="button"
          onClick={() => doExport()}
          disabled={exporting || !activeProject}
          style={{
            width: "100%",
            padding: "7px 0",
            background: "#4363d8",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            cursor: exporting ? "wait" : "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {exporting ? "Exporting…" : "Export ZIP"}
        </button>
      </div>

      {/* Export gate warning */}
      {blockedImages && (
        <div
          role="alert"
          style={{ padding: "8px 10px", background: "#c6282822", borderBottom: "1px solid #c62828" }}
        >
          <p style={{ fontSize: 12, margin: "0 0 6px" }}>
            {blockedImages.length} incomplete image(s) blocked export.
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={exportWithOverride} style={smallBtn}>
              Export anyway
            </button>
            <button type="button" onClick={dismissExportGate} style={{ ...smallBtn, background: "transparent", color: "#aaa" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        role="tablist"
        style={{ display: "flex", borderBottom: "1px solid var(--color-border, #2a2a3e)" }}
      >
        {(["classes", "stack", "box"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "6px 0",
              fontSize: 11,
              fontWeight: tab === t ? 700 : 400,
              background: "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--color-primary, #4363d8)" : "2px solid transparent",
              color: tab === t ? "var(--color-primary, #4363d8)" : "#888",
              cursor: "pointer",
            }}
          >
            {t === "classes" ? "Classes" : t === "stack" ? "Stack" : "Box"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        role="tabpanel"
        style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}
      >
        {tab === "classes" && <ClassManager />}
        {tab === "stack" && activeImage && (
          <AnnotationStack annotations={activeImage.annotations} />
        )}
        {tab === "stack" && !activeImage && (
          <p style={{ fontSize: 12, color: "#888" }}>Select an image first</p>
        )}
        {tab === "box" && <BoxProperties />}
      </div>

      {/* Image review state */}
      {activeImage && (
        <ImageReviewControls imageId={activeImage.id} reviewState={activeImage.reviewState} />
      )}
    </aside>
  );
}

function ImageReviewControls({
  imageId,
  reviewState,
}: {
  imageId: string;
  reviewState: import("@/common/domain/dataset/types").ImageReviewState;
}) {
  const db = (typeof window !== "undefined") ? import("@/common/infrastructure/persistence/db") : null;
  const { upsertImage, activeProject } = useProjectStore();

  async function setReview(state: typeof reviewState) {
    if (!activeProject) return;
    const img = activeProject.images.find((i) => i.id === imageId);
    if (!img) return;
    const { getDb } = await import("@/common/infrastructure/persistence/db");
    const { ImageRepository } = await import("@/common/infrastructure/persistence/ImageRepository");
    const repo = new ImageRepository(getDb());
    await repo.updateReviewState(imageId, state);
    upsertImage({ ...img, reviewState: state });
  }

  const states: typeof reviewState[] = ["complete", "incomplete", "negative"];
  return (
    <div style={{ padding: "8px 10px", borderTop: "1px solid var(--color-border, #2a2a3e)" }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Image review</div>
      <div style={{ display: "flex", gap: 4 }}>
        {states.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={reviewState === s}
            onClick={() => setReview(s)}
            style={{
              flex: 1,
              padding: "4px 0",
              fontSize: 10,
              borderRadius: 3,
              border: reviewState === s ? "1px solid #4363d8" : "1px solid #2a2a3e",
              background: reviewState === s ? "#4363d822" : "transparent",
              color: reviewState === s ? "#4363d8" : "#888",
              cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

const smallBtn: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: 11,
  background: "#c62828",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};
