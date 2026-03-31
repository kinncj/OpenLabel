"use client";

import React from "react";
import type { Project } from "@/common/domain/dataset/types";
import { useProject } from "@/ui/hooks/useProject";

type Props = {
  project: Project;
  onOpen: (id: string) => void;
};

export function ProjectCard({ project, onOpen }: Props) {
  const { deleteProject } = useProject();

  const updated = new Date(project.updatedAt).toLocaleDateString();

  return (
    <div
      style={{
        background: "var(--color-surface, #16213e)",
        border: "1px solid var(--color-border, #2a2a3e)",
        borderRadius: 8,
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {project.name}
          </h2>
          {project.description && (
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{project.description}</p>
          )}
        </div>
        <button
          type="button"
          aria-label={`Delete project "${project.name}"`}
          onClick={() => deleteProject(project.id)}
          style={{
            background: "transparent",
            border: "none",
            color: "#c62828",
            cursor: "pointer",
            fontSize: 14,
            padding: "2px 4px",
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ fontSize: 11, color: "#888", display: "flex", gap: 12 }}>
        <span>{project.images.length} images</span>
        <span>{project.classes.length} classes</span>
        <span>Updated {updated}</span>
      </div>

      <button
        type="button"
        onClick={() => onOpen(project.id)}
        style={{
          padding: "6px 0",
          background: "#4363d8",
          color: "#fff",
          border: "none",
          borderRadius: 5,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        Open
      </button>
    </div>
  );
}
