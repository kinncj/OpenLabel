"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProject } from "@/ui/hooks/useProject";
import { useUiStore } from "@/ui/stores/uiStore";
import { AppHeader } from "@/ui/components/common/AppHeader";
import { ProjectCard } from "@/ui/components/ProjectList/ProjectCard";
import { ImportDropzone } from "@/ui/components/ImportDropzone/ImportDropzone";

export function ProjectList() {
  const router = useRouter();
  const { projects, loadProjects, createProject } = useProject();
  const { importDialogOpen, createProjectDialogOpen, setImportDialogOpen, setCreateProjectDialogOpen } = useUiStore();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const project = await createProject(newName.trim(), newDesc.trim() || undefined);
    if (project) {
      setCreateProjectDialogOpen(false);
      setNewName("");
      setNewDesc("");
      router.push(`/workspace?id=${project.id}`);
    }
  }

  function handleImported(id: string) {
    router.push(`/workspace?id=${id}`);
  }

  const headerActions = (
    <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
      <button type="button" onClick={() => setImportDialogOpen(true)} style={secondaryBtn}>
        Import ZIP
      </button>
      <button type="button" onClick={() => setCreateProjectDialogOpen(true)} style={primaryBtn}>
        + New Project
      </button>
    </div>
  );

  return (
    <>
      <AppHeader>{headerActions}</AppHeader>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "calc(var(--header-height) + 40px) 24px calc(var(--footer-height) + 24px)" }}>

      {/* Import dialog */}
      {importDialogOpen && (
        <div style={dialogOverlay} onClick={() => setImportDialogOpen(false)}>
          <div style={dialogBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>Import Dataset ZIP</h2>
            <ImportDropzone onImported={handleImported} />
            <button
              type="button"
              onClick={() => setImportDialogOpen(false)}
              style={{ ...secondaryBtn, marginTop: 12 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Create dialog */}
      {createProjectDialogOpen && (
        <div style={dialogOverlay} onClick={() => setCreateProjectDialogOpen(false)}>
          <div style={dialogBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>New Project</h2>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                Name *
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  autoFocus
                  style={inputStyle}
                  placeholder="My Dataset"
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                Description
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={inputStyle}
                  placeholder="Optional"
                />
              </label>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setCreateProjectDialogOpen(false)} style={secondaryBtn}>
                  Cancel
                </button>
                <button type="submit" style={primaryBtn} disabled={!newName.trim()}>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project grid */}
      {projects.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "60px 0" }}>
          <p>No projects yet. Create one or import a ZIP.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onOpen={(id) => router.push(`/workspace?id=${id}`)} />
          ))}
        </div>
      )}
      </div>
    </>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: "8px 16px",
  background: "var(--color-primary)",
  color: "#fff",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
};

const secondaryBtn: React.CSSProperties = {
  padding: "8px 16px",
  background: "transparent",
  color: "var(--color-text-muted)",
  border: "1px solid var(--color-border)",
  borderRadius: 5,
  cursor: "pointer",
  fontSize: 13,
};

const inputStyle: React.CSSProperties = {
  background: "var(--color-input-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: 4,
  color: "inherit",
  padding: "6px 8px",
  fontSize: 13,
};

const dialogOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 300,
};

const dialogBox: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  padding: "24px",
  width: "min(480px, 90vw)",
};
