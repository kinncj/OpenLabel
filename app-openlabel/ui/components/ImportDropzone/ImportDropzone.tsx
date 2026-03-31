"use client";

import React from "react";
import { useDropzone } from "react-dropzone";
import { useImport } from "@/ui/hooks/useImport";

type Props = {
  onImported?: (projectId: string) => void;
};

export function ImportDropzone({ onImported }: Props) {
  const { importZip, importing } = useImport();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/zip": [".zip"], "application/x-zip-compressed": [".zip"] },
    multiple: false,
    disabled: importing,
    onDrop: async (accepted) => {
      const file = accepted[0];
      if (!file) return;
      const id = await importZip(file);
      if (id && onImported) onImported(id);
    },
  });

  return (
    <div
      {...getRootProps()}
      aria-label="Import dataset zip"
      role="button"
      aria-busy={importing}
      style={{
        border: `2px dashed ${isDragActive ? "#4363d8" : "#2a2a3e"}`,
        borderRadius: 8,
        padding: "32px 24px",
        textAlign: "center",
        cursor: importing ? "wait" : "pointer",
        background: isDragActive ? "#4363d811" : "transparent",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <input {...getInputProps()} aria-label="Select zip file" />
      <p style={{ fontSize: 14, color: isDragActive ? "#4363d8" : "#888", margin: 0 }}>
        {importing
          ? "Importing…"
          : isDragActive
            ? "Drop ZIP to import"
            : "Drag & drop a dataset ZIP here, or click to select"}
      </p>
      <p style={{ fontSize: 11, color: "#555", marginTop: 6 }}>
        Accepts: dataset ZIP with NDJSON or meta/project.json
      </p>
    </div>
  );
}
