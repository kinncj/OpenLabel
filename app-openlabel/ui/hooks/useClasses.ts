"use client";

import { useCallback } from "react";
import { useProjectStore } from "@/ui/stores/projectStore";
import { CLASS_PACK_REGISTRY } from "@/common/domain/classes/registry";
import type { ClassDef } from "@/common/domain/classes/types";

async function persistClasses(project: import("@/common/domain/dataset/types").Project, classes: ClassDef[]) {
  const { getDb } = await import("@/common/infrastructure/persistence/db");
  const { ProjectRepository } = await import("@/common/infrastructure/persistence/ProjectRepository");
  const repo = new ProjectRepository(getDb());
  await repo.save({ ...project, classes });
}

function nextId(classes: ClassDef[]): number {
  return classes.reduce((m, c) => Math.max(m, c.id), -1) + 1;
}

export function useClasses() {
  const { activeProject, updateClasses } = useProjectStore();

  const importPack = useCallback(
    async (packId: string) => {
      if (!activeProject) return;
      const packClasses = CLASS_PACK_REGISTRY.get(packId);
      if (!packClasses) return;

      const existingNames = new Set(activeProject.classes.map((c) => c.name));
      let id = nextId(activeProject.classes);
      const toAdd: ClassDef[] = packClasses
        .filter((c) => !existingNames.has(c.name))
        .map((c) => ({ ...c, id: id++ }));

      if (toAdd.length === 0) return;
      const updated = [...activeProject.classes, ...toAdd];
      await persistClasses(activeProject, updated);
      updateClasses(updated);
    },
    [activeProject, updateClasses],
  );

  const addCustomClass = useCallback(
    async (name: string, color: string) => {
      if (!activeProject || !name.trim()) return;
      const newClass: ClassDef = {
        id: nextId(activeProject.classes),
        name: name.trim(),
        color,
        source: "custom",
      };
      const updated = [...activeProject.classes, newClass];
      await persistClasses(activeProject, updated);
      updateClasses(updated);
    },
    [activeProject, updateClasses],
  );

  const deleteClass = useCallback(
    async (id: number) => {
      if (!activeProject) return;
      const updated = activeProject.classes.filter((c) => c.id !== id);
      await persistClasses(activeProject, updated);
      updateClasses(updated);
    },
    [activeProject, updateClasses],
  );

  return {
    classes: activeProject?.classes ?? [],
    importPack,
    addCustomClass,
    deleteClass,
  };
}
