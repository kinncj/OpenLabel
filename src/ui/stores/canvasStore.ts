"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { BoxAnnotation } from "@/common/domain/annotations/types";

export type CanvasTool = "draw" | "pan" | "select";

export type DrawingState = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

// Transient edit overlay — used during drag to give immediate feedback without
// hitting IndexedDB on every pointermove. Committed (persisted) on pointerup.
export type EditingBox = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  tool: CanvasTool;
  selectedBoxId: string | null;
  drawing: DrawingState | null;
  editingBox: EditingBox | null;
  activeClassId: number;

  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setTool: (tool: CanvasTool) => void;
  selectBox: (id: string | null) => void;
  setActiveClass: (classId: number) => void;
  startDraw: (x: number, y: number) => void;
  updateDraw: (x: number, y: number) => void;
  commitDraw: () => BoxAnnotation | null;
  cancelDraw: () => void;
  setEditingBox: (box: EditingBox | null) => void;
  resetView: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  zoom: 1,
  panX: 0,
  panY: 0,
  tool: "draw",
  selectedBoxId: null,
  drawing: null,
  editingBox: null,
  activeClassId: 0,

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(20, zoom)) }),

  setPan: (panX, panY) => set({ panX, panY }),

  setTool: (tool) => set({ tool }),

  selectBox: (id) => set({ selectedBoxId: id }),

  setActiveClass: (classId) => set({ activeClassId: classId }),

  startDraw: (x, y) => set({ drawing: { startX: x, startY: y, currentX: x, currentY: y } }),

  updateDraw: (x, y) =>
    set((state) => ({
      drawing: state.drawing ? { ...state.drawing, currentX: x, currentY: y } : null,
    })),

  commitDraw: () => {
    const { drawing, activeClassId } = get();
    if (!drawing) return null;

    const { startX, startY, currentX, currentY } = drawing;
    const x = (startX + currentX) / 2;
    const y = (startY + currentY) / 2;
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);

    // Discard tiny boxes (< 0.5% of image dimension) that are likely accidental clicks
    if (w < 0.005 || h < 0.005) {
      set({ drawing: null });
      return null;
    }

    const box: BoxAnnotation = {
      id: uuidv4(),
      classId: activeClassId,
      x,
      y,
      w,
      h,
      zIndex: 0, // caller should assign proper zIndex
      review: "tp",
      locked: false,
      hidden: false,
    };

    set({ drawing: null, selectedBoxId: box.id });
    return box;
  },

  cancelDraw: () => set({ drawing: null }),

  setEditingBox: (box) => set({ editingBox: box }),

  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),
}));
