"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
};

export function WorkspaceLayout({ children }: Props) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--color-bg, #0f0f0f)",
        color: "var(--color-text, #e0e0e0)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {children}
    </div>
  );
}
