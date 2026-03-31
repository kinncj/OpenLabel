"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  BoundingBox,
  Hand,
  Cursor,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsOut,
} from "@phosphor-icons/react";
import { useCanvasStore } from "@/ui/stores/canvasStore";
import type { CanvasTool } from "@/ui/stores/canvasStore";
import { useCanvas } from "@/ui/hooks/useCanvas";
import { BoxLayer } from "@/ui/components/AnnotationCanvas/BoxLayer";
import { DrawingLayerInner } from "@/ui/components/AnnotationCanvas/DrawingLayer";
import type { ImageRecord } from "@/common/domain/dataset/types";

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 20;
const ZOOM_FACTOR = 1.15;

type Props = {
  image: ImageRecord;
  blobUrl: string;
};

const TOOLS: { id: CanvasTool; Icon: React.ElementType; label: string; shortcut: string }[] = [
  { id: "draw", Icon: BoundingBox, label: "Draw box", shortcut: "B" },
  { id: "pan",  Icon: Hand,        label: "Pan canvas", shortcut: "H" },
  { id: "select", Icon: Cursor,    label: "Select / move", shortcut: "V" },
];

export function AnnotationCanvas({ image, blobUrl }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { zoom, panX, panY, drawing, tool } = useCanvasStore();
  const { setZoom, setTool, resetView } = useCanvasStore();
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

  const canvasCursor =
    tool === "pan"
      ? "grab"
      : tool === "draw"
      ? "crosshair"
      : "default";

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, overflow: "hidden", background: "var(--color-canvas-bg, #1a1a2e)", position: "relative", cursor: canvasCursor }}
    >
      {/* Toolbar */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 2,
          background: "#0d1229ee",
          border: "1px solid #2a2a3e",
          borderRadius: 8,
          padding: "4px 6px",
          backdropFilter: "blur(4px)",
          userSelect: "none",
        }}
      >
        {/* Tool buttons */}
        {TOOLS.map(({ id, Icon, label, shortcut }) => (
          <ToolBtn
            key={id}
            active={tool === id}
            onClick={() => setTool(id)}
            label={`${label} (${shortcut})`}
          >
            <Icon size={16} weight={tool === id ? "fill" : "regular"} />
          </ToolBtn>
        ))}

        <div style={{ width: 1, height: 20, background: "#2a2a3e", margin: "0 4px" }} />

        {/* Zoom out */}
        <ToolBtn
          onClick={() => setZoom(Math.max(ZOOM_MIN, zoom / ZOOM_FACTOR))}
          label="Zoom out (−)"
        >
          <MagnifyingGlassMinus size={16} />
        </ToolBtn>

        {/* Zoom level */}
        <span
          style={{
            fontSize: 11,
            color: "#aaa",
            minWidth: 38,
            textAlign: "center",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.round(zoom * 100)}%
        </span>

        {/* Zoom in */}
        <ToolBtn
          onClick={() => setZoom(Math.min(ZOOM_MAX, zoom * ZOOM_FACTOR))}
          label="Zoom in (+)"
        >
          <MagnifyingGlassPlus size={16} />
        </ToolBtn>

        {/* Fit / reset */}
        <ToolBtn onClick={resetView} label="Reset view (0)">
          <ArrowsOut size={16} />
        </ToolBtn>
      </div>

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

function ToolBtn({
  children,
  active,
  onClick,
  label,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: 6,
        border: active ? "1px solid #4363d8" : "1px solid transparent",
        background: active ? "#4363d822" : "transparent",
        color: active ? "#4363d8" : "#aaa",
        cursor: "pointer",
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}
