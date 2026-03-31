"use client";

import { useCallback } from "react";
import { useProjectStore } from "@/ui/stores/projectStore";
import { useUiStore } from "@/ui/stores/uiStore";
import { createProject as createProjectUC } from "@/common/application/use-cases/CreateProject";
import { deleteProject as deleteProjectUC } from "@/common/application/use-cases/DeleteProject";
import { getDb } from "@/common/infrastructure/persistence/db";
import { ProjectRepository } from "@/common/infrastructure/persistence/ProjectRepository";

function getRepos() {
  const db = getDb();
  return { project: new ProjectRepository(db) };
}

export function useProject() {
  const { projects, activeProject, setProjects, setActiveProject } = useProjectStore();
  const { addToast } = useUiStore();

  const loadProjects = useCallback(async () => {
    try {
      const repos = getRepos();
      const all = await repos.project.findAll();
      setProjects(all);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast({ message: `Failed to load projects: ${msg}`, variant: "error" });
    }
  }, [setProjects, addToast]);

  const loadProject = useCallback(
    async (id: string) => {
      try {
        const repos = getRepos();
        const project = await repos.project.findById(id);
        if (project) setActiveProject(project);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addToast({ message: `Failed to load project: ${msg}`, variant: "error" });
      }
    },
    [setActiveProject, addToast],
  );

  const createProject = useCallback(
    async (name: string, description?: string) => {
      try {
        const repos = getRepos();
        const project = await createProjectUC(name, description, repos.project);
        setProjects([project, ...projects]);
        return project;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addToast({ message: `Failed to create project: ${msg}`, variant: "error" });
        return null;
      }
    },
    [projects, setProjects, addToast],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      try {
        const repos = getRepos();
        await deleteProjectUC(id, repos.project);
        setProjects(projects.filter((p) => p.id !== id));
        if (activeProject?.id === id) setActiveProject(null);
        addToast({ message: "Project deleted", variant: "success" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addToast({ message: `Failed to delete project: ${msg}`, variant: "error" });
      }
    },
    [projects, activeProject, setProjects, setActiveProject, addToast],
  );

  return { projects, activeProject, loadProjects, loadProject, createProject, deleteProject };
}
