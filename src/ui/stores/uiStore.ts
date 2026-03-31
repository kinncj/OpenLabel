"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export type ToastVariant = "info" | "success" | "warning" | "error";

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

interface UiState {
  activeImageId: string | null;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  toasts: Toast[];
  importDialogOpen: boolean;
  createProjectDialogOpen: boolean;

  setActiveImage: (id: string | null) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  setImportDialogOpen: (open: boolean) => void;
  setCreateProjectDialogOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeImageId: null,
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  toasts: [],
  importDialogOpen: false,
  createProjectDialogOpen: false,

  setActiveImage: (id) => set({ activeImageId: id }),

  toggleLeftPanel: () => set((state) => ({ leftPanelCollapsed: !state.leftPanelCollapsed })),

  toggleRightPanel: () => set((state) => ({ rightPanelCollapsed: !state.rightPanelCollapsed })),

  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: uuidv4() }],
    })),

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  setImportDialogOpen: (open) => set({ importDialogOpen: open }),

  setCreateProjectDialogOpen: (open) => set({ createProjectDialogOpen: open }),
}));
