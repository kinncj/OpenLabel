"use client";

import React from "react";
import type { DrawingState } from "@/ui/stores/canvasStore";
import { useCanvasStore } from "@/ui/stores/canvasStore";
import { useProjectStore } from "@/ui/stores/projectStore";

type Props = {
  drawing: DrawingState | null;
};

export function DrawingLayer({ drawing }: Props) {
  const { activeClassId } = useCanvasStore();
  const { activeProject } = useProjectStore();

  if (!drawing) return null;

  const classDef = activeProject?.classes.find((c) => c.id === activeClassId);
  const color = classDef?.color ?? "#ffffff";

  // drawing coords are in normalized [0,1] space — we need to render in image pixel space
  // The parent SVG viewBox is in image pixel space already (set by AnnotationCanvas)
  // So we need to convert back. But we don't have imageWidth/height here.
  // We'll use a data attr approach: DrawingLayer receives pixel coords from the store,
  // which are already normalized. We'll pass imageSize as a prop.
  //
  // For now we render using normalized coords scaled to a 1x1 space — this means the
  // parent SVG must pass imageWidth/imageHeight here. We redesign to accept them.
  return null; // Placeholder — see DrawingLayerInner below
}

type InnerProps = {
  drawing: DrawingState | null;
  imageWidth: number;
  imageHeight: number;
};

export function DrawingLayerInner({ drawing, imageWidth, imageHeight }: InnerProps) {
  const { activeClassId } = useCanvasStore();
  const { activeProject } = useProjectStore();

  if (!drawing) return null;

  const classDef = activeProject?.classes.find((c) => c.id === activeClassId);
  const color = classDef?.color ?? "#ffffff";

  const x1 = Math.min(drawing.startX, drawing.currentX) * imageWidth;
  const y1 = Math.min(drawing.startY, drawing.currentY) * imageHeight;
  const w = Math.abs(drawing.currentX - drawing.startX) * imageWidth;
  const h = Math.abs(drawing.currentY - drawing.startY) * imageHeight;

  return (
    <rect
      x={x1}
      y={y1}
      width={w}
      height={h}
      fill={color}
      fillOpacity={0.1}
      stroke={color}
      strokeWidth={1.5}
      strokeDasharray="6 3"
      style={{ pointerEvents: "none" }}
    />
  );
}
