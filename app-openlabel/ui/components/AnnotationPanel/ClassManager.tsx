"use client";

import React, { useEffect, useRef, useState } from "react";
import { useCanvasStore } from "@/ui/stores/canvasStore";
import { useClasses } from "@/ui/hooks/useClasses";
import { CLASS_PACKS } from "@/common/domain/classes/registry";

const DEFAULT_CUSTOM_COLOR = "#4363d8";

export function ClassManager() {
  const { activeClassId, setActiveClass } = useCanvasStore();
  const { classes, importPack, addCustomClass, deleteClass } = useClasses();

  // Import preset state
  const [selectedPack, setSelectedPack] = useState(CLASS_PACKS[0]?.id ?? "");
  const [importing, setImporting] = useState(false);

  // Add custom class state
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customColor, setCustomColor] = useState(DEFAULT_CUSTOM_COLOR);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Keyboard quick-select: 1-9 → class index 0-8
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9) {
        const idx = n - 1;
        const cls = classes[idx];
        if (cls) setActiveClass(cls.id);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [classes, setActiveClass]);

  // Focus name input when form opens
  useEffect(() => {
    if (showAddForm) nameInputRef.current?.focus();
  }, [showAddForm]);

  async function handleImport() {
    if (!selectedPack) return;
    setImporting(true);
    try {
      await importPack(selectedPack);
    } finally {
      setImporting(false);
    }
  }

  async function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!customName.trim()) return;
    await addCustomClass(customName, customColor);
    setCustomName("");
    setCustomColor(DEFAULT_CUSTOM_COLOR);
    setShowAddForm(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

      {/* Import preset pack */}
      <div style={{ display: "flex", gap: 4 }}>
        <select
          value={selectedPack}
          onChange={(e) => setSelectedPack(e.target.value)}
          style={selectStyle}
          aria-label="Select preset class pack"
        >
          {CLASS_PACKS.map((pack) => (
            <option key={pack.id} value={pack.id}>
              {pack.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleImport}
          disabled={importing || !selectedPack}
          title={CLASS_PACKS.find((p) => p.id === selectedPack)?.description}
          style={{ ...btnStyle, flexShrink: 0 }}
        >
          {importing ? "…" : "Import"}
        </button>
      </div>

      {/* Class list */}
      {classes.length === 0 ? (
        <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
          No classes — import a preset or add a custom class below.
        </p>
      ) : (
        <div
          role="listbox"
          aria-label="Class picker"
          style={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {classes.map((cls, i) => {
            const isActive = cls.id === activeClassId;
            return (
              <div
                key={cls.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 6px",
                  borderRadius: 4,
                  border: isActive ? `2px solid ${cls.color}` : "2px solid transparent",
                  background: isActive ? `${cls.color}22` : "transparent",
                }}
              >
                {/* Color swatch — click to select */}
                <button
                  role="option"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setActiveClass(cls.id)}
                  title={`Select ${cls.name}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "inherit",
                    textAlign: "left",
                    overflow: "hidden",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      background: cls.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cls.name}
                  </span>
                  {i < 9 && (
                    <kbd
                      aria-label={`Shortcut ${i + 1}`}
                      style={{ fontSize: 10, color: "#888", background: "#222", padding: "1px 4px", borderRadius: 3, flexShrink: 0 }}
                    >
                      {i + 1}
                    </kbd>
                  )}
                </button>

                {/* Delete */}
                <button
                  type="button"
                  aria-label={`Delete class ${cls.name}`}
                  onClick={() => deleteClass(cls.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#666",
                    fontSize: 14,
                    lineHeight: 1,
                    padding: "0 2px",
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add custom class */}
      {showAddForm ? (
        <form onSubmit={handleAddCustom} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <input
              ref={nameInputRef}
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Class name"
              maxLength={64}
              required
              style={inputStyle}
            />
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              title="Pick color"
              style={{ width: 32, height: 28, padding: 2, border: "1px solid #333", borderRadius: 4, background: "#1a1a2e", cursor: "pointer", flexShrink: 0 }}
            />
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button type="submit" disabled={!customName.trim()} style={{ ...btnStyle, flex: 1 }}>
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setCustomName(""); setCustomColor(DEFAULT_CUSTOM_COLOR); }}
              style={{ ...btnStyle, background: "transparent", color: "#888", flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          style={{ ...btnStyle, background: "transparent", border: "1px dashed #444", color: "#888", width: "100%" }}
        >
          + Add custom class
        </button>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  flex: 1,
  padding: "4px 6px",
  fontSize: 12,
  background: "#0d0d1a",
  color: "#ccc",
  border: "1px solid #333",
  borderRadius: 4,
  minWidth: 0,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "4px 6px",
  fontSize: 12,
  background: "#0d0d1a",
  color: "#ccc",
  border: "1px solid #333",
  borderRadius: 4,
  minWidth: 0,
};

const btnStyle: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: 12,
  background: "#4363d8",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};
