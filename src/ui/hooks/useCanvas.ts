"use client";

import { useCallback, useRef } from "react";
import { useCanvasStore } from "@/ui/stores/canvasStore";
import { useAnnotations } from "@/ui/hooks/useAnnotations";
import type { BoxAnnotation } from "@/common/domain/annotations/types";

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 20;
const ZOOM_FACTOR = 1.15;

export type HandleType = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

type DragOp =
  | { kind: "pan" }
  | { kind: "draw" }
  | {
      kind: "move";
      boxId: string;
      origBox: BoxAnnotation;
      startNormX: number;
      startNormY: number;
    }
  | {
      kind: "resize";
      boxId: string;
      origBox: BoxAnnotation;
      handle: HandleType;
      startNormX: number;
      startNormY: number;
    };

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function applyMove(
  orig: BoxAnnotation,
  dx: number,
  dy: number,
): { x: number; y: number; w: number; h: number } {
  return {
    x: clamp(orig.x + dx, orig.w / 2, 1 - orig.w / 2),
    y: clamp(orig.y + dy, orig.h / 2, 1 - orig.h / 2),
    w: orig.w,
    h: orig.h,
  };
}

function applyResize(
  orig: BoxAnnotation,
  handle: HandleType,
  dx: number,
  dy: number,
): { x: number; y: number; w: number; h: number } {
  let left = orig.x - orig.w / 2;
  let top = orig.y - orig.h / 2;
  let right = orig.x + orig.w / 2;
  let bottom = orig.y + orig.h / 2;

  if (handle.includes("w")) left = clamp(left + dx, 0, right - 0.005);
  if (handle.includes("e")) right = clamp(right + dx, left + 0.005, 1);
  if (handle.includes("n")) top = clamp(top + dy, 0, bottom - 0.005);
  if (handle.includes("s")) bottom = clamp(bottom + dy, top + 0.005, 1);

  const w = right - left;
  const h = bottom - top;
  return { x: left + w / 2, y: top + h / 2, w, h };
}

export function useCanvas(imageWidth: number, imageHeight: number) {
  const {
    zoom, panX, panY, drawing, selectedBoxId, tool,
    setZoom, setPan, setTool, startDraw, updateDraw, commitDraw, cancelDraw,
    selectBox, setEditingBox,
  } = useCanvasStore();

  const { saveBox, deleteBox, updateBox, activeImage } = useAnnotations();

  const dragRef = useRef<DragOp | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  function clientToNorm(
    e: { clientX: number; clientY: number },
    svgEl: SVGSVGElement,
  ) {
    const rect = svgEl.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) * (svgEl.viewBox.baseVal.width / rect.width);
    const svgY = (e.clientY - rect.top) * (svgEl.viewBox.baseVal.height / rect.height);
    return {
      x: (panX + svgX / zoom) / imageWidth,
      y: (panY + svgY / zoom) / imageHeight,
    };
  }

  // ─── Box body pointer down ───────────────────────────────────────────────────
  const onBoxPointerDown = useCallback(
    (e: React.PointerEvent, boxId: string) => {
      if (e.button !== 0) return;

      // Draw mode: let the event bubble to the SVG root so a new box can be drawn over this one
      if (tool === "draw") return;

      e.stopPropagation();

      // Pan tool or Ctrl held → pan, don't move box
      if (tool === "pan" || e.ctrlKey || e.metaKey) return;

      // Select mode: select and start move
      const box = activeImage?.annotations.find((a) => a.id === boxId);
      if (!box || box.locked) return;

      selectBox(boxId);

      const svgEl = (e.currentTarget as SVGElement).ownerSVGElement!;
      const norm = clientToNorm(e, svgEl as SVGSVGElement);

      dragRef.current = {
        kind: "move",
        boxId,
        origBox: box,
        startNormX: norm.x,
        startNormY: norm.y,
      };
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeImage, selectBox, tool, panX, panY, zoom, imageWidth, imageHeight],
  );

  // ─── Handle pointer down (resize) ───────────────────────────────────────────
  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent, boxId: string, handle: HandleType) => {
      if (e.button !== 0) return;

      // Only select mode can resize boxes
      if (tool !== "select") return;

      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) return;

      const box = activeImage?.annotations.find((a) => a.id === boxId);
      if (!box || box.locked) return;

      const svgEl = (e.currentTarget as SVGElement).ownerSVGElement!;
      const norm = clientToNorm(e, svgEl as SVGSVGElement);

      dragRef.current = {
        kind: "resize",
        boxId,
        origBox: box,
        handle,
        startNormX: norm.x,
        startNormY: norm.y,
      };
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeImage, tool, panX, panY, zoom, imageWidth, imageHeight],
  );

  // ─── SVG root pointer down ───────────────────────────────────────────────────
  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>, isOnBox: boolean) => {
      // Middle button always pans
      if (e.button === 1) {
        dragRef.current = { kind: "pan" };
        lastPointerRef.current = { x: e.clientX, y: e.clientY };
        (e.target as Element).setPointerCapture(e.pointerId);
        return;
      }

      if (e.button === 0) {
        // Ctrl/Cmd held OR pan tool → pan
        if (e.ctrlKey || e.metaKey || tool === "pan") {
          selectBox(null);
          dragRef.current = { kind: "pan" };
          lastPointerRef.current = { x: e.clientX, y: e.clientY };
          (e.target as Element).setPointerCapture(e.pointerId);
          return;
        }

        if (!isOnBox && tool === "draw") {
          selectBox(null);
          const norm = clientToNorm(e, e.currentTarget);
          startDraw(norm.x, norm.y);
          dragRef.current = { kind: "draw" };
          (e.target as Element).setPointerCapture(e.pointerId);
        }

        if (!isOnBox && tool === "select") {
          selectBox(null);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tool, panX, panY, zoom, imageWidth, imageHeight, startDraw, selectBox],
  );

  // ─── Pointer move ────────────────────────────────────────────────────────────
  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const op = dragRef.current;
      if (!op) return;

      if (op.kind === "pan" && lastPointerRef.current) {
        const dx = (e.clientX - lastPointerRef.current.x) / zoom;
        const dy = (e.clientY - lastPointerRef.current.y) / zoom;
        setPan(panX - dx, panY - dy);
        lastPointerRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (op.kind === "draw") {
        const norm = clientToNorm(e, e.currentTarget);
        updateDraw(norm.x, norm.y);
        return;
      }

      if (op.kind === "move" || op.kind === "resize") {
        const norm = clientToNorm(e, e.currentTarget);
        const dx = norm.x - op.startNormX;
        const dy = norm.y - op.startNormY;

        const geom =
          op.kind === "move"
            ? applyMove(op.origBox, dx, dy)
            : applyResize(op.origBox, op.handle, dx, dy);

        setEditingBox({ id: op.boxId, ...geom });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [panX, panY, zoom, imageWidth, imageHeight, setPan, updateDraw, setEditingBox],
  );

  // ─── Pointer up ─────────────────────────────────────────────────────────────
  const onPointerUp = useCallback(
    async (e: React.PointerEvent<SVGSVGElement>) => {
      const op = dragRef.current;
      dragRef.current = null;

      if (!op) return;

      if (op.kind === "pan") {
        lastPointerRef.current = null;
        return;
      }

      if (op.kind === "draw") {
        const box = commitDraw();
        if (box) await saveBox(box);
        return;
      }

      if (op.kind === "move" || op.kind === "resize") {
        const norm = clientToNorm(e, e.currentTarget);
        const dx = norm.x - op.startNormX;
        const dy = norm.y - op.startNormY;

        const geom =
          op.kind === "move"
            ? applyMove(op.origBox, dx, dy)
            : applyResize(op.origBox, op.handle, dx, dy);

        setEditingBox(null);
        await updateBox(op.boxId, geom);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [panX, panY, zoom, imageWidth, imageHeight, commitDraw, saveBox, updateBox, setEditingBox],
  );

  // ─── Wheel zoom ─────────────────────────────────────────────────────────────
  const onWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const svgEl = e.currentTarget;
      const rect = svgEl.getBoundingClientRect();
      const cursorSvgX = (e.clientX - rect.left) * (svgEl.viewBox.baseVal.width / rect.width);
      const cursorSvgY = (e.clientY - rect.top) * (svgEl.viewBox.baseVal.height / rect.height);

      const delta = e.deltaY > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR;
      const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom * delta));

      const worldX = panX + cursorSvgX / zoom;
      const worldY = panY + cursorSvgY / zoom;
      setZoom(newZoom);
      setPan(worldX - cursorSvgX / newZoom, worldY - cursorSvgY / newZoom);
    },
    [zoom, panX, panY, setZoom, setPan],
  );

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────────
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Escape") {
        cancelDraw();
        dragRef.current = null;
        setEditingBox(null);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedBoxId) {
        e.preventDefault();
        deleteBox(selectedBoxId);
      }
      if (e.key === "+" || e.key === "=") {
        setZoom(Math.min(ZOOM_MAX, zoom * ZOOM_FACTOR));
      }
      if (e.key === "-") {
        setZoom(Math.max(ZOOM_MIN, zoom / ZOOM_FACTOR));
      }
      // Tool shortcuts
      if (e.key === "b" || e.key === "B") setTool("draw");
      if (e.key === "h" || e.key === "H") setTool("pan");
      if (e.key === "v" || e.key === "V") setTool("select");
    },
    [zoom, selectedBoxId, setZoom, setTool, cancelDraw, deleteBox, setEditingBox],
  );

  return {
    zoom,
    panX,
    panY,
    tool,
    drawing,
    selectedBoxId,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    onKeyDown,
    onBoxPointerDown,
    onHandlePointerDown,
  };
}
