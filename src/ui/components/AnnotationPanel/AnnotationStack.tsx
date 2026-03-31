"use client";

import React from "react";
import { ArrowUp, ArrowDown, Lock, LockOpen, Eye, EyeSlash, Trash } from "@phosphor-icons/react";
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
    return (
      <p style={{ fontSize: 12, color: "#888", textAlign: "center", padding: "12px 0" }}>
        No boxes on this image yet. Draw some on the canvas.
      </p>
    );
  }

  return (
    <div role="list" aria-label="Annotation stack" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
              gap: 4,
              padding: "4px 6px",
              borderRadius: 4,
              border: isSelected ? `1px solid ${cls?.color ?? "#4363d8"}` : "1px solid transparent",
              background: isSelected ? `${cls?.color ?? "#4363d8"}18` : "transparent",
              cursor: "pointer",
            }}
            onClick={() => selectBox(ann.id)}
          >
            <span
              aria-hidden="true"
              style={{ width: 8, height: 8, borderRadius: "50%", background: cls?.color ?? "#aaa", flexShrink: 0 }}
            />

            <span style={{ fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {cls?.name ?? `class ${ann.classId}`}
            </span>

            <Badge variant={ann.review} />

            <IBtn icon={<ArrowUp size={11} />} label="Bring forward" onClick={(e) => { e.stopPropagation(); bringForward(ann.id); }} />
            <IBtn icon={<ArrowDown size={11} />} label="Send backward" onClick={(e) => { e.stopPropagation(); sendBackward(ann.id); }} />
            <IBtn
              icon={ann.locked ? <Lock size={11} weight="fill" /> : <LockOpen size={11} />}
              label={ann.locked ? "Unlock" : "Lock"}
              {...(ann.locked ? { color: "#f58231" } : {})}
              onClick={(e) => { e.stopPropagation(); setBoxLocked(ann.id, !ann.locked); }}
            />
            <IBtn
              icon={ann.hidden ? <EyeSlash size={11} /> : <Eye size={11} />}
              label={ann.hidden ? "Show" : "Hide"}
              {...(ann.hidden ? { color: "#888" } : {})}
              onClick={(e) => { e.stopPropagation(); setBoxHidden(ann.id, !ann.hidden); }}
            />
            <IBtn
              icon={<Trash size={11} />}
              label="Delete"
              color="#e6194b"
              onClick={(e) => { e.stopPropagation(); deleteBox(ann.id); }}
            />
          </div>
        );
      })}
    </div>
  );
}

function IBtn({
  icon, label, color, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color?: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "2px 3px",
        color: color ?? "#aaa",
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
      }}
    >
      {icon}
    </button>
  );
}
