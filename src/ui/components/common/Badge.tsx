"use client";

import React from "react";

type BadgeVariant = "default" | "train" | "val" | "test" | "complete" | "incomplete" | "negative" | "tp" | "fp" | "ignore";

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; label: string }> = {
  default:    { bg: "#4a4a5a", text: "#fff", label: "" },
  train:      { bg: "#1d6fa5", text: "#fff", label: "train" },
  val:        { bg: "#2e7d32", text: "#fff", label: "val" },
  test:       { bg: "#7b1fa2", text: "#fff", label: "test" },
  complete:   { bg: "#2e7d32", text: "#fff", label: "✓ complete" },
  incomplete: { bg: "#e65100", text: "#fff", label: "● incomplete" },
  negative:   { bg: "#5a5a6a", text: "#ccc", label: "○ negative" },
  tp:         { bg: "#2e7d32", text: "#fff", label: "TP" },
  fp:         { bg: "#c62828", text: "#fff", label: "FP" },
  ignore:     { bg: "#5a5a6a", text: "#ccc", label: "IGN" },
};

type Props = {
  variant: BadgeVariant;
  label?: string;
  title?: string;
  style?: React.CSSProperties;
};

export function Badge({ variant, label, title, style }: Props) {
  const s = VARIANT_STYLES[variant];
  return (
    <span
      title={title ?? s.label}
      aria-label={title ?? s.label}
      style={{
        display: "inline-block",
        padding: "1px 6px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: s.bg,
        color: s.text,
        letterSpacing: "0.03em",
        ...style,
      }}
    >
      {label ?? s.label}
    </span>
  );
}
