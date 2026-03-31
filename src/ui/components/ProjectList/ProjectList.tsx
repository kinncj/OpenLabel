"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProject } from "@/ui/hooks/useProject";
import { useUiStore } from "@/ui/stores/uiStore";
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

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>openlabel</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => setImportDialogOpen(true)}
            style={secondaryBtn}
          >
            Import ZIP
          </button>
          <button
            type="button"
            onClick={() => setCreateProjectDialogOpen(true)}
            style={primaryBtn}
          >
            + New Project
          </button>
        </div>
      </div>

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
        <div style={{ textAlign: "center", color: "#888", padding: "60px 0" }}>
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
  );
}

const primaryBtn: React.CSSProperties = {
  padding: "8px 16px",
  background: "#4363d8",
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
  color: "#ccc",
  border: "1px solid #2a2a3e",
  borderRadius: 5,
  cursor: "pointer",
  fontSize: 13,
};

const inputStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid #2a2a3e",
  borderRadius: 4,
  color: "inherit",
  padding: "6px 8px",
  fontSize: 13,
};

const dialogOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "#00000088",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
};

const dialogBox: React.CSSProperties = {
  background: "#16213e",
  border: "1px solid #2a2a3e",
  borderRadius: 10,
  padding: "24px",
  width: "min(480px, 90vw)",
};
