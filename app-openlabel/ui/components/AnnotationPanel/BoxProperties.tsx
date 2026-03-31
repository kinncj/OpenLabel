"use client";

import React from "react";
import { CheckCircle, XCircle, MinusCircle, Lock, LockOpen, EyeSlash, Eye } from "@phosphor-icons/react";
import type { BoxAnnotation, BoxReviewState } from "@/common/domain/annotations/types";
import { useAnnotations } from "@/ui/hooks/useAnnotations";
import { useProjectStore } from "@/ui/stores/projectStore";
import { useCanvasStore } from "@/ui/stores/canvasStore";
import { FuzzyClassSelect } from "@/ui/components/common/FuzzyClassSelect";

const REVIEW_OPTIONS: { value: BoxReviewState; label: string; detail: string; Icon: React.ElementType; color: string }[] = [
  { value: "tp", label: "Correct",  detail: "Goes into training data", Icon: CheckCircle, color: "#3cb44b" },
  { value: "fp", label: "Wrong",    detail: "False detection — excluded", Icon: XCircle,   color: "#e6194b" },
  { value: "ignore", label: "Skip", detail: "Uncertain — excluded",    Icon: MinusCircle, color: "#f58231" },
];

export function BoxProperties() {
  const { selectedBoxId } = useCanvasStore();
  const { activeImage, setBoxReview, updateBox, setBoxLocked, setBoxHidden } = useAnnotations();
  const { activeProject } = useProjectStore();

  if (!activeImage || !selectedBoxId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "20px 0", color: "#555" }}>
        <p style={{ fontSize: 12, textAlign: "center", margin: 0 }}>
          Click a box on the canvas to see and edit its properties.
        </p>
      </div>
    );
  }

  const box = activeImage.annotations.find((a) => a.id === selectedBoxId);
  if (!box) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 12 }}>

      {/* Class — fuzzy search combobox */}
      <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={labelStyle}>Object class</span>
        <FuzzyClassSelect
          classes={activeProject?.classes ?? []}
          value={box.classId}
          onChange={(classId) => updateBox(box.id, { classId })}
        />
      </label>

      {/* Quality / review state */}
      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend style={labelStyle}>Annotation quality</legend>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 5 }}>
          {REVIEW_OPTIONS.map(({ value, label, detail, Icon, color }) => {
            const active = box.review === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setBoxReview(box.id, value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  borderRadius: 5,
                  border: active ? `1px solid ${color}` : "1px solid #2a2a3e",
                  background: active ? `${color}20` : "transparent",
                  color: active ? color : "#888",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.1s",
                }}
              >
                <Icon size={15} weight={active ? "fill" : "regular"} />
                <span style={{ fontWeight: active ? 600 : 400 }}>{label}</span>
                <span style={{ fontSize: 10, marginLeft: "auto", opacity: 0.7 }}>{detail}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Quick toggles */}
      <div style={{ display: "flex", gap: 6 }}>
        <ToggleButton
          pressed={box.locked}
          onToggle={() => setBoxLocked(box.id, !box.locked)}
          Icon={box.locked ? Lock : LockOpen}
          label={box.locked ? "Locked" : "Lock"}
          activeColor="#f58231"
        />
        <ToggleButton
          pressed={box.hidden}
          onToggle={() => setBoxHidden(box.id, !box.hidden)}
          Icon={box.hidden ? EyeSlash : Eye}
          label={box.hidden ? "Hidden" : "Hide"}
          activeColor="#888"
        />
      </div>

      {/* Note */}
      <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={labelStyle}>Note</span>
        <textarea
          value={box.note ?? ""}
          onChange={(e) => updateBox(box.id, { note: e.target.value || undefined })}
          placeholder="Optional note about this box…"
          rows={2}
          style={{
            background: "#111",
            border: "1px solid #2a2a3e",
            borderRadius: 4,
            color: "inherit",
            padding: "5px 7px",
            fontSize: 12,
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
      </label>

      {/* Coords (collapsed by default) */}
      <details>
        <summary style={{ fontSize: 11, color: "#666", cursor: "pointer" }}>Coordinates (normalized)</summary>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 6 }}>
          {(["x", "y", "w", "h"] as const).map((k) => (
            <div key={k} style={{ background: "#111", borderRadius: 4, padding: "3px 6px", fontSize: 11 }}>
              <span style={{ color: "#888" }}>{k}: </span>
              <span style={{ fontFamily: "monospace" }}>{box[k].toFixed(4)}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function ToggleButton({
  pressed, onToggle, Icon, label, activeColor,
}: {
  pressed: boolean;
  onToggle: () => void;
  Icon: React.ElementType;
  label: string;
  activeColor: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        padding: "5px 0",
        borderRadius: 4,
        border: pressed ? `1px solid ${activeColor}` : "1px solid #2a2a3e",
        background: pressed ? `${activeColor}20` : "transparent",
        color: pressed ? activeColor : "#666",
        cursor: "pointer",
        fontSize: 11,
      }}
    >
      <Icon size={13} weight={pressed ? "fill" : "regular"} />
      {label}
    </button>
  );
}

const labelStyle: React.CSSProperties = {
  color: "#888",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
