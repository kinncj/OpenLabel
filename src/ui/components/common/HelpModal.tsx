"use client";

import React, { useEffect } from "react";
import {
  X,
  CursorClick,
  ArrowsOut,
  Trash,
  Tag,
  UploadSimple,
  Package,
  Export,
  ArrowClockwise,
} from "@phosphor-icons/react";

type Props = {
  onClose: () => void;
};

export function HelpModal({ onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="Help"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "#00000099",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#1c1c1c",
          borderRadius: 10,
          border: "1px solid #2d2d2d",
          width: "100%",
          maxWidth: 560,
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "24px 28px",
          position: "relative",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>How to annotate</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close help"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#888", padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Steps */}
        <section style={{ marginBottom: 24 }}>
          <h3 style={sectionTitle}>Quick start</h3>
          <ol style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {steps.map((step, i) => (
              <li key={i} style={{ fontSize: 13, lineHeight: 1.5 }}>
                <span style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <step.Icon size={18} weight="duotone" color="#F47B20" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>
                    <strong>{step.label}</strong>
                    {" — "}
                    <span style={{ color: "#aaa" }}>{step.detail}</span>
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Keyboard shortcuts */}
        <section style={{ marginBottom: 24 }}>
          <h3 style={sectionTitle}>Keyboard shortcuts</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <tbody>
              {shortcuts.map(([key, desc]) => (
                <tr key={key} style={{ borderBottom: "1px solid #2d2d2d" }}>
                  <td style={{ padding: "5px 0", width: 120 }}>
                    <kbd style={kbdStyle}>{key}</kbd>
                  </td>
                  <td style={{ padding: "5px 0", color: "#aaa" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Annotation quality */}
        <section>
          <h3 style={sectionTitle}>Annotation quality labels</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
            <QualityRow color="#3cb44b" label="Correct" detail="The box correctly surrounds a real object. Goes into your training data." />
            <QualityRow color="#e6194b" label="Wrong" detail="The box is a false detection or placed on the wrong thing. Kept for review but excluded from training." />
            <QualityRow color="#f58231" label="Skip" detail="Uncertain — skip for now. Also excluded from training." />
          </div>
        </section>
      </div>
    </div>
  );
}

function QualityRow({ color, label, detail }: { color: string; label: string; detail: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span
        style={{
          marginTop: 2,
          width: 12,
          height: 12,
          borderRadius: 2,
          background: color,
          flexShrink: 0,
        }}
      />
      <span>
        <strong style={{ color }}>{label}</strong>
        {" — "}
        <span style={{ color: "#aaa" }}>{detail}</span>
      </span>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: 13,
  fontWeight: 700,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const kbdStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#0d0d0d",
  border: "1px solid #444",
  borderRadius: 4,
  padding: "2px 6px",
  fontFamily: "monospace",
  fontSize: 11,
  color: "#ccc",
};

const steps = [
  {
    Icon: UploadSimple,
    label: "Add images",
    detail: "Click 'Add images' in the left panel, or drag image files anywhere onto the workspace.",
  },
  {
    Icon: Tag,
    label: "Set up classes",
    detail: "Open the Classes tab on the right. Import a preset (COCO, LVIS, …) or type your own class names.",
  },
  {
    Icon: CursorClick,
    label: "Draw boxes",
    detail: "Click and drag on the image to draw a bounding box around each object.",
  },
  {
    Icon: ArrowsOut,
    label: "Adjust boxes",
    detail: "Click a box to select it, then drag to move or drag the handles to resize.",
  },
  {
    Icon: ArrowClockwise,
    label: "Review annotations",
    detail: "Use the Box tab to mark each annotation as Correct, Wrong, or Skip.",
  },
  {
    Icon: Package,
    label: "Assign splits",
    detail: "Images auto-split into train/val. Change any image's split in the image sidebar.",
  },
  {
    Icon: Export,
    label: "Export",
    detail: "Click 'Export ZIP' to download your dataset in NDJSON + YOLO format, ready for training.",
  },
  {
    Icon: Trash,
    label: "Delete",
    detail: "Select a box and press Delete or Backspace to remove it.",
  },
];

const shortcuts: [string, string][] = [
  ["B", "Draw tool — click & drag to draw a box"],
  ["H", "Pan tool — drag to move around"],
  ["V", "Select tool — click boxes to select"],
  ["Ctrl + drag", "Pan the canvas (works in any tool)"],
  ["1 – 9", "Select class by number"],
  ["Delete / ⌫", "Delete selected box"],
  ["+ / −", "Zoom in / out"],
  ["Scroll", "Zoom in / out"],
  ["Middle-drag", "Pan the canvas"],
  ["Esc", "Deselect / cancel draw"],
];
