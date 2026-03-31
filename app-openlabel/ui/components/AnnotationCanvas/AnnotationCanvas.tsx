"use client";

import React, { useEffect, useRef, useState } from "react";
import { useCanvasStore } from "@/ui/stores/canvasStore";
import { useCanvas } from "@/ui/hooks/useCanvas";
import { BoxLayer } from "@/ui/components/AnnotationCanvas/BoxLayer";
import { DrawingLayerInner } from "@/ui/components/AnnotationCanvas/DrawingLayer";
import type { ImageRecord } from "@/common/domain/dataset/types";

type Props = {
  image: ImageRecord;
  blobUrl: string;
};

export function AnnotationCanvas({ image, blobUrl }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { zoom, panX, panY, drawing } = useCanvasStore();
  const {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    onKeyDown,
    onBoxPointerDown,
    onHandlePointerDown,
  } = useCanvas(image.width, image.height);

  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  const viewW = containerSize.w / zoom;
  const viewH = containerSize.h / zoom;
  const viewBox = `${panX} ${panY} ${viewW} ${viewH}`;

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, overflow: "hidden", background: "var(--color-canvas-bg, #1a1a2e)", cursor: drawing ? "crosshair" : "default" }}
    >
      <svg
        ref={svgRef}
        width={containerSize.w}
        height={containerSize.h}
        viewBox={viewBox}
        style={{ display: "block", userSelect: "none" }}
        onPointerDown={(e) => onPointerDown(e, false)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      >
        {/* Image */}
        <image
          href={blobUrl}
          x={0}
          y={0}
          width={image.width}
          height={image.height}
          preserveAspectRatio="none"
        />

        {/* Annotations */}
        <BoxLayer
          annotations={image.annotations}
          imageWidth={image.width}
          imageHeight={image.height}
          onBoxPointerDown={onBoxPointerDown}
          onHandlePointerDown={onHandlePointerDown}
        />

        {/* Drawing ghost */}
        <DrawingLayerInner drawing={drawing} imageWidth={image.width} imageHeight={image.height} />
      </svg>
    </div>
  );
}
