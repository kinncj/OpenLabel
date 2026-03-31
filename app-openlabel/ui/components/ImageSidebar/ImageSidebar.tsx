"use client";

import React, { useState } from "react";
import type { ImageRecord, Split, ImageReviewState } from "@/common/domain/dataset/types";
import { useProjectStore } from "@/ui/stores/projectStore";
import { useUiStore } from "@/ui/stores/uiStore";
import { ImageThumbnail } from "@/ui/components/ImageSidebar/ImageThumbnail";

type SplitFilter = "all" | Split;
type ReviewFilter = "all" | ImageReviewState;

export function ImageSidebar() {
  const { activeProject } = useProjectStore();
  const { activeImageId, setActiveImage } = useUiStore();
  const [splitFilter, setSplitFilter] = useState<SplitFilter>("all");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");

  if (!activeProject) return null;

  const filtered = activeProject.images.filter((img) => {
    if (splitFilter !== "all" && img.split !== splitFilter) return false;
    if (reviewFilter !== "all" && img.reviewState !== reviewFilter) return false;
    return true;
  });

  const splitTabs: SplitFilter[] = ["all", "train", "val", "test"];
  const reviewTabs: ReviewFilter[] = ["all", "complete", "incomplete", "negative"];

  return (
    <aside
      aria-label="Image list"
      style={{
        width: 220,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--color-border, #2a2a3e)",
        background: "var(--color-surface, #16213e)",
        overflow: "hidden",
      }}
    >
      {/* Split filter */}
      <div
        role="tablist"
        aria-label="Filter by split"
        style={{ display: "flex", borderBottom: "1px solid var(--color-border, #2a2a3e)" }}
      >
        {splitTabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={splitFilter === t}
            type="button"
            onClick={() => setSplitFilter(t)}
            style={{
              flex: 1,
              padding: "5px 2px",
              fontSize: 10,
              fontWeight: splitFilter === t ? 700 : 400,
              background: "transparent",
              border: "none",
              borderBottom: splitFilter === t ? "2px solid var(--color-primary, #4363d8)" : "2px solid transparent",
              color: splitFilter === t ? "var(--color-primary, #4363d8)" : "#888",
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Review filter */}
      <div
        role="tablist"
        aria-label="Filter by review state"
        style={{ display: "flex", borderBottom: "1px solid var(--color-border, #2a2a3e)" }}
      >
        {reviewTabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={reviewFilter === t}
            type="button"
            onClick={() => setReviewFilter(t)}
            style={{
              flex: 1,
              padding: "4px 1px",
              fontSize: 9,
              fontWeight: reviewFilter === t ? 700 : 400,
              background: "transparent",
              border: "none",
              borderBottom: reviewFilter === t ? "2px solid var(--color-primary, #4363d8)" : "2px solid transparent",
              color: reviewFilter === t ? "var(--color-primary, #4363d8)" : "#888",
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Image list */}
      <div
        role="list"
        aria-label="Images"
        style={{ flex: 1, overflowY: "auto", padding: "6px 4px", display: "flex", flexDirection: "column", gap: 4 }}
      >
        {filtered.length === 0 && (
          <p style={{ color: "#888", fontSize: 12, padding: "8px", textAlign: "center" }}>
            No images match filters
          </p>
        )}
        {filtered.map((img: ImageRecord) => (
          <div key={img.id} role="listitem">
            <ImageThumbnail
              image={img}
              isActive={img.id === activeImageId}
              onClick={() => setActiveImage(img.id)}
            />
          </div>
        ))}
      </div>

      {/* Footer count */}
      <div
        style={{
          padding: "6px 8px",
          fontSize: 11,
          color: "#888",
          borderTop: "1px solid var(--color-border, #2a2a3e)",
        }}
      >
        {filtered.length} / {activeProject.images.length} images
      </div>
    </aside>
  );
}
