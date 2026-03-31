"use client";

import { create } from "zustand";
import type { Project, ImageRecord } from "@/common/domain/dataset/types";
import type { ClassDef } from "@/common/domain/classes/types";

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;

  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  updateActiveProject: (patch: Partial<Project>) => void;
  upsertImage: (image: ImageRecord) => void;
  removeImage: (imageId: string) => void;
  updateClasses: (classes: ClassDef[]) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProject: null,

  setProjects: (projects) => set({ projects }),

  setActiveProject: (project) => set({ activeProject: project }),

  updateActiveProject: (patch) =>
    set((state) => ({
      activeProject: state.activeProject ? { ...state.activeProject, ...patch } : null,
    })),

  upsertImage: (image) =>
    set((state) => {
      if (!state.activeProject) return state;
      const existing = state.activeProject.images.findIndex((img) => img.id === image.id);
      const images =
        existing >= 0
          ? state.activeProject.images.map((img) => (img.id === image.id ? image : img))
          : [...state.activeProject.images, image];
      return { activeProject: { ...state.activeProject, images } };
    }),

  removeImage: (imageId) =>
    set((state) => {
      if (!state.activeProject) return state;
      return {
        activeProject: {
          ...state.activeProject,
          images: state.activeProject.images.filter((img) => img.id !== imageId),
        },
      };
    }),

  updateClasses: (classes) =>
    set((state) => ({
      activeProject: state.activeProject ? { ...state.activeProject, classes } : null,
    })),
}));
