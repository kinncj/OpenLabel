"use client";

import React from "react";
import type { BoxAnnotation } from "@/common/domain/annotations/types";
import { useCanvasStore } from "@/ui/stores/canvasStore";
import { useAnnotations } from "@/ui/hooks/useAnnotations";
import { useProjectStore } from "@/ui/stores/projectStore";
import { Badge } from "@/ui/components/common/Badge";

type Props = {
  annotations: BoxAnnotation[];
};

export function AnnotationStack({ annotations }: Props) {
  const { selectedBoxId, selectBox } = useCanvasStore();
  const { activeProject } = useProjectStore();
  const { deleteBox, setBoxLocked, setBoxHidden, bringForward, sendBackward } = useAnnotations();

  const sorted = [...annotations].sort((a, b) => b.zIndex - a.zIndex);

  if (sorted.length === 0) {
    return <p style={{ fontSize: 12, color: "#888" }}>No annotations on this image</p>;
  }

  return (
    <div
      role="list"
      aria-label="Annotation stack"
      style={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      {sorted.map((ann) => {
        const cls = activeProject?.classes.find((c) => c.id === ann.classId);
        const isSelected = ann.id === selectedBoxId;

        return (
          <div
            key={ann.id}
            role="listitem"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 6px",
              borderRadius: 4,
              border: isSelected ? `1px solid ${cls?.color ?? "#4363d8"}` : "1px solid transparent",
              background: isSelected ? `${cls?.color ?? "#4363d8"}18` : "transparent",
              cursor: "pointer",
            }}
            onClick={() => selectBox(ann.id)}
          >
            {/* Color dot */}
            <span
              aria-hidden="true"
              style={{ width: 8, height: 8, borderRadius: "50%", background: cls?.color ?? "#aaa", flexShrink: 0 }}
            />

            <span style={{ fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {cls?.name ?? `class ${ann.classId}`}
            </span>

            <Badge variant={ann.review} />

            {/* Z-order controls */}
            <button
              type="button"
              aria-label="Bring forward"
              title="Bring forward"
              onClick={(e) => { e.stopPropagation(); bringForward(ann.id); }}
              style={iconBtnStyle}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label="Send backward"
              title="Send backward"
              onClick={(e) => { e.stopPropagation(); sendBackward(ann.id); }}
              style={iconBtnStyle}
            >
              ↓
            </button>

            {/* Lock */}
            <button
              type="button"
              aria-label={ann.locked ? "Unlock" : "Lock"}
              aria-pressed={ann.locked}
              title={ann.locked ? "Unlock" : "Lock"}
              onClick={(e) => { e.stopPropagation(); setBoxLocked(ann.id, !ann.locked); }}
              style={{ ...iconBtnStyle, color: ann.locked ? "#f58231" : "#888" }}
            >
              {ann.locked ? "🔒" : "🔓"}
            </button>

            {/* Hide */}
            <button
              type="button"
              aria-label={ann.hidden ? "Show" : "Hide"}
              aria-pressed={ann.hidden}
              title={ann.hidden ? "Show" : "Hide"}
              onClick={(e) => { e.stopPropagation(); setBoxHidden(ann.id, !ann.hidden); }}
              style={{ ...iconBtnStyle, color: ann.hidden ? "#888" : "inherit" }}
            >
              {ann.hidden ? "👁" : "👁"}
            </button>

            {/* Delete */}
            <button
              type="button"
              aria-label="Delete annotation"
              title="Delete"
              onClick={(e) => { e.stopPropagation(); deleteBox(ann.id); }}
              style={{ ...iconBtnStyle, color: "#e6194b" }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "2px 3px",
  fontSize: 11,
  color: "#aaa",
  borderRadius: 2,
};
