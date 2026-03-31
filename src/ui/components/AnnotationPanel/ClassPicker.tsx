"use client";

import React, { useEffect } from "react";
import type { ClassDef } from "@/common/domain/classes/types";
import { useCanvasStore } from "@/ui/stores/canvasStore";

type Props = {
  classes: ClassDef[];
};

export function ClassPicker({ classes }: Props) {
  const { activeClassId, setActiveClass } = useCanvasStore();

  // Keyboard quick-select: 1-9 → class index 0-8
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9) {
        const idx = n - 1;
        if (idx < classes.length) {
          setActiveClass(classes[idx]!.id);
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [classes, setActiveClass]);

  if (classes.length === 0) {
    return (
      <p style={{ fontSize: 12, color: "#888", padding: "4px 0" }}>
        No classes — add some first
      </p>
    );
  }

  return (
    <div
      role="listbox"
      aria-label="Class picker"
      style={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      {classes.map((cls, i) => {
        const isActive = cls.id === activeClassId;
        return (
          <button
            key={cls.id}
            role="option"
            aria-selected={isActive}
            type="button"
            onClick={() => setActiveClass(cls.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 8px",
              borderRadius: 4,
              border: isActive ? `2px solid ${cls.color}` : "2px solid transparent",
              background: isActive ? `${cls.color}22` : "transparent",
              cursor: "pointer",
              color: "inherit",
              textAlign: "left",
            }}
          >
            {/* Color swatch */}
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
            <span style={{ fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {cls.name}
            </span>
            {i < 9 && (
              <kbd
                aria-label={`Shortcut key ${i + 1}`}
                style={{ fontSize: 10, color: "#888", background: "#222", padding: "1px 4px", borderRadius: 3 }}
              >
                {i + 1}
              </kbd>
            )}
          </button>
        );
      })}
    </div>
  );
}
