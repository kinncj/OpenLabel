"use client";

import React from "react";
import type { BoxAnnotation } from "@/common/domain/annotations/types";
import { useCanvasStore } from "@/ui/stores/canvasStore";
import { useProjectStore } from "@/ui/stores/projectStore";
import type { HandleType } from "@/ui/hooks/useCanvas";

const HANDLE_SIZE = 8; // px in image-space (stays constant regardless of zoom)

type Props = {
  annotations: BoxAnnotation[];
  imageWidth: number;
  imageHeight: number;
  onBoxPointerDown: (e: React.PointerEvent, boxId: string) => void;
  onHandlePointerDown: (e: React.PointerEvent, boxId: string, handle: HandleType) => void;
};

type HandleDef = { handle: HandleType; cx: number; cy: number; cursor: string };

function getHandles(
  svgX: number,
  svgY: number,
  svgW: number,
  svgH: number,
): HandleDef[] {
  const mx = svgX + svgW / 2;
  const my = svgY + svgH / 2;
  const r = svgX + svgW;
  const b = svgY + svgH;
  return [
    { handle: "nw", cx: svgX, cy: svgY, cursor: "nw-resize" },
    { handle: "n",  cx: mx,   cy: svgY, cursor: "n-resize"  },
    { handle: "ne", cx: r,    cy: svgY, cursor: "ne-resize" },
    { handle: "e",  cx: r,    cy: my,   cursor: "e-resize"  },
    { handle: "se", cx: r,    cy: b,    cursor: "se-resize" },
    { handle: "s",  cx: mx,   cy: b,    cursor: "s-resize"  },
    { handle: "sw", cx: svgX, cy: b,    cursor: "sw-resize" },
    { handle: "w",  cx: svgX, cy: my,   cursor: "w-resize"  },
  ];
}

export function BoxLayer({
  annotations,
  imageWidth,
  imageHeight,
  onBoxPointerDown,
  onHandlePointerDown,
}: Props) {
  const { selectedBoxId, editingBox, zoom } = useCanvasStore();
  const { activeProject } = useProjectStore();

  const sorted = [...annotations].sort((a, b) => a.zIndex - b.zIndex);

  // Handle size in image-space pixels, adjusted so it looks ~8px on screen
  const hSize = HANDLE_SIZE / zoom;

  return (
    <g>
      {sorted.map((ann) => {
        if (ann.hidden) return null;

        const classDef = activeProject?.classes.find((c) => c.id === ann.classId);
        const color = classDef?.color ?? "#ffffff";
        const isSelected = ann.id === selectedBoxId;

        // Use editingBox override if this box is being dragged
        const geom = editingBox?.id === ann.id
          ? { x: editingBox.x, y: editingBox.y, w: editingBox.w, h: editingBox.h }
          : { x: ann.x, y: ann.y, w: ann.w, h: ann.h };

        // Denormalize center → SVG top-left
        const svgX = (geom.x - geom.w / 2) * imageWidth;
        const svgY = (geom.y - geom.h / 2) * imageHeight;
        const svgW = geom.w * imageWidth;
        const svgH = geom.h * imageHeight;

        const fillOpacity = ann.review === "tp" ? 0.15 : 0.25;
        const strokeDash =
          ann.review === "fp" ? "8 4" : ann.review === "ignore" ? "4 4" : undefined;
        const strokeWidth = isSelected ? 2.5 / zoom : 1.5 / zoom;
        const cursor = ann.locked ? "not-allowed" : isSelected ? "move" : "pointer";

        return (
          <g key={ann.id}>
            {/* Box body — drag to move */}
            <rect
              x={svgX}
              y={svgY}
              width={svgW}
              height={svgH}
              fill={color}
              fillOpacity={fillOpacity}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
              strokeOpacity={isSelected ? 1 : 0.85}
              style={{ cursor }}
              onPointerDown={(e) => {
                if (!ann.locked) onBoxPointerDown(e, ann.id);
              }}
            />

            {/* Label chip */}
            {classDef && (
              <text
                x={svgX + 3 / zoom}
                y={svgY - 3 / zoom}
                fontSize={Math.max(8 / zoom, Math.min(12 / zoom, svgH * 0.12))}
                fill={color}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {classDef.name}
              </text>
            )}

            {/* Lock icon */}
            {ann.locked && (
              <text
                x={svgX + svgW - 14 / zoom}
                y={svgY + 14 / zoom}
                fontSize={12 / zoom}
                fill={color}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                🔒
              </text>
            )}

            {/* Resize handles — only shown when selected and not locked */}
            {isSelected && !ann.locked && getHandles(svgX, svgY, svgW, svgH).map(({ handle, cx, cy, cursor: hCursor }) => (
              <rect
                key={handle}
                x={cx - hSize / 2}
                y={cy - hSize / 2}
                width={hSize}
                height={hSize}
                fill="#fff"
                stroke={color}
                strokeWidth={1.5 / zoom}
                style={{ cursor: hCursor }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onHandlePointerDown(e, ann.id, handle);
                }}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}
