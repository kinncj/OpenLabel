"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ClassDef } from "@/common/domain/classes/types";

type Props = {
  classes: ClassDef[];
  value: number;
  onChange: (classId: number) => void;
};

/** Combobox with substring filter for class selection. Keyboard: ↑↓ navigate, Enter select, Esc close. */
export function FuzzyClassSelect({ classes, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const active = classes.find((c) => c.id === value);

  const filtered = query.trim()
    ? classes.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : classes;

  function openMenu() {
    setQuery("");
    setHighlightIdx(0);
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function close() {
    setOpen(false);
    setQuery("");
  }

  function pick(classId: number) {
    onChange(classId);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cls = filtered[highlightIdx];
      if (cls) pick(cls.id);
    } else if (e.key === "Escape") {
      close();
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[highlightIdx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightIdx]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Reset highlight when query changes
  useEffect(() => {
    setHighlightIdx(0);
  }, [query]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={openMenu}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 8px",
          background: "#111",
          border: "1px solid #2a2a3e",
          borderRadius: 4,
          color: "inherit",
          cursor: "pointer",
          textAlign: "left",
          fontSize: 12,
        }}
      >
        {active && (
          <span
            style={{ width: 10, height: 10, borderRadius: 2, background: active.color, flexShrink: 0 }}
          />
        )}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {active?.name ?? "— select class —"}
        </span>
        <span style={{ color: "#666", fontSize: 10 }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 2px)",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "#16213e",
            border: "1px solid #2a2a3e",
            borderRadius: 4,
            boxShadow: "0 8px 24px #00000066",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search input */}
          <div style={{ padding: "6px 8px", borderBottom: "1px solid #2a2a3e" }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={`Search ${classes.length} classes…`}
              style={{
                width: "100%",
                background: "#0d0d1a",
                border: "1px solid #333",
                borderRadius: 3,
                color: "inherit",
                padding: "4px 6px",
                fontSize: 12,
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Results */}
          <div
            ref={listRef}
            role="listbox"
            style={{ maxHeight: 200, overflowY: "auto" }}
          >
            {filtered.length === 0 && (
              <div style={{ padding: "8px 10px", fontSize: 12, color: "#888" }}>No match</div>
            )}
            {filtered.map((cls, idx) => {
              const isHighlighted = idx === highlightIdx;
              return (
                <div
                  key={cls.id}
                  role="option"
                  aria-selected={cls.id === value}
                  onMouseDown={() => pick(cls.id)}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 10px",
                    cursor: "pointer",
                    background: isHighlighted ? "#4363d822" : cls.id === value ? "#ffffff0a" : "transparent",
                    borderLeft: isHighlighted ? `3px solid ${cls.color}` : "3px solid transparent",
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{ width: 10, height: 10, borderRadius: 2, background: cls.color, flexShrink: 0 }}
                  />
                  <span style={{ flex: 1 }}>{cls.name}</span>
                  {cls.id === value && <span style={{ color: "#4363d8", fontSize: 10 }}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
