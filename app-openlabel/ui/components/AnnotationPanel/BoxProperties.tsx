"use client";

import React from "react";
import type { BoxAnnotation, BoxReviewState } from "@/common/domain/annotations/types";
import { useAnnotations } from "@/ui/hooks/useAnnotations";
import { useProjectStore } from "@/ui/stores/projectStore";
import { useCanvasStore } from "@/ui/stores/canvasStore";

export function BoxProperties() {
  const { selectedBoxId } = useCanvasStore();
  const { activeImage, setBoxReview, updateBox } = useAnnotations();
  const { activeProject } = useProjectStore();

  if (!activeImage || !selectedBoxId) {
    return <p style={{ fontSize: 12, color: "#888" }}>Select a box to see properties</p>;
  }

  const box = activeImage.annotations.find((a) => a.id === selectedBoxId);
  if (!box) return null;

  const reviewOptions: BoxReviewState[] = ["tp", "fp", "ignore"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
      {/* Class */}
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ color: "#888" }}>Class</span>
        <select
          value={box.classId}
          onChange={(e) => updateBox(box.id, { classId: parseInt(e.target.value, 10) })}
          style={selectStyle}
        >
          {activeProject?.classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </label>

      {/* Review state */}
      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend style={{ color: "#888", marginBottom: 4 }}>Review</legend>
        <div style={{ display: "flex", gap: 4 }}>
          {reviewOptions.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={box.review === r}
              onClick={() => setBoxReview(box.id, r)}
              style={{
                flex: 1,
                padding: "4px 0",
                borderRadius: 4,
                border: box.review === r ? "1px solid #4363d8" : "1px solid #2a2a3e",
                background: box.review === r ? "#4363d822" : "transparent",
                color: box.review === r ? "#4363d8" : "#888",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Coordinates (read-only) */}
      <div>
        <div style={{ color: "#888", marginBottom: 4 }}>Coordinates (normalized)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {(["x", "y", "w", "h"] as const).map((k) => (
            <div key={k} style={{ background: "#111", borderRadius: 4, padding: "3px 6px" }}>
              <span style={{ color: "#888" }}>{k}: </span>
              <span>{box[k].toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ color: "#888" }}>Note</span>
        <textarea
          value={box.note ?? ""}
          onChange={(e) => updateBox(box.id, { note: e.target.value || undefined })}
          rows={2}
          style={{
            background: "#111",
            border: "1px solid #2a2a3e",
            borderRadius: 4,
            color: "inherit",
            padding: "4px 6px",
            fontSize: 12,
            resize: "vertical",
          }}
        />
      </label>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid #2a2a3e",
  borderRadius: 4,
  color: "inherit",
  padding: "4px 6px",
  fontSize: 12,
  width: "100%",
};
