"use client";

import React, { useRef, useState } from "react";
import { UploadSimple } from "@phosphor-icons/react";
import type { ImageRecord, Split, ImageReviewState } from "@/common/domain/dataset/types";
import { useProjectStore } from "@/ui/stores/projectStore";
import { useUiStore } from "@/ui/stores/uiStore";
import { useImages } from "@/ui/hooks/useImages";
import { ImageThumbnail } from "@/ui/components/ImageSidebar/ImageThumbnail";

type SplitFilter = "all" | Split;
type ReviewFilter = "all" | ImageReviewState;

const REVIEW_LABELS: Record<ReviewFilter, string> = {
  all: "All",
  complete: "Done",
  incomplete: "Todo",
  negative: "Empty",
};

export function ImageSidebar() {
  const { activeProject } = useProjectStore();
  const { activeImageId, setActiveImage } = useUiStore();
  const { addImages } = useImages();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [splitFilter, setSplitFilter] = useState<SplitFilter>("all");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");

  if (!activeProject) return null;

  const filtered = activeProject.images.filter((img) => {
    if (splitFilter !== "all" && img.split !== splitFilter) return false;
    if (reviewFilter !== "all" && img.reviewState !== reviewFilter) return false;
    return true;
  });

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) addImages(files);
    e.target.value = "";
  }

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
      {/* Upload button */}
      <div style={{ padding: "8px 8px 0" }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={onFileInput}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "7px 0",
            background: "#4363d8",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          <UploadSimple size={14} weight="bold" />
          Add images
        </button>
      </div>

      {/* Split filter */}
      <div
        role="tablist"
        aria-label="Filter by split"
        style={{ display: "flex", borderBottom: "1px solid var(--color-border, #2a2a3e)", marginTop: 8 }}
      >
        {splitTabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={splitFilter === t}
            type="button"
            onClick={() => setSplitFilter(t)}
            style={tabStyle(splitFilter === t)}
          >
            {t === "all" ? "All" : t}
          </button>
        ))}
      </div>

      {/* Review filter */}
      <div
        role="tablist"
        aria-label="Filter by status"
        style={{ display: "flex", borderBottom: "1px solid var(--color-border, #2a2a3e)" }}
      >
        {reviewTabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={reviewFilter === t}
            type="button"
            onClick={() => setReviewFilter(t)}
            style={tabStyle(reviewFilter === t)}
          >
            {REVIEW_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Image list */}
      <div
        role="list"
        aria-label="Images"
        style={{ flex: 1, overflowY: "auto", padding: "6px 4px", display: "flex", flexDirection: "column", gap: 4 }}
      >
        {filtered.length === 0 && activeProject.images.length === 0 && (
          <div style={{ padding: "16px 8px", textAlign: "center" }}>
            <p style={{ color: "#888", fontSize: 12, margin: "0 0 8px" }}>No images yet</p>
            <p style={{ color: "#555", fontSize: 11, margin: 0 }}>
              Click &quot;Add images&quot; above or drag image files onto the canvas.
            </p>
          </div>
        )}
        {filtered.length === 0 && activeProject.images.length > 0 && (
          <p style={{ color: "#888", fontSize: 12, padding: "8px", textAlign: "center" }}>
            No images match this filter
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
      <div style={{ padding: "6px 10px", fontSize: 11, color: "#666", borderTop: "1px solid var(--color-border, #2a2a3e)" }}>
        {filtered.length} of {activeProject.images.length} images
      </div>
    </aside>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: "5px 2px",
    fontSize: 10,
    fontWeight: active ? 700 : 400,
    background: "transparent",
    border: "none",
    borderBottom: active ? "2px solid var(--color-primary, #4363d8)" : "2px solid transparent",
    color: active ? "var(--color-primary, #4363d8)" : "#888",
    cursor: "pointer",
  };
}
