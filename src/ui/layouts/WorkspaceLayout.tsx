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
        height: "calc(100vh - var(--header-height) - var(--footer-height))",
        marginTop: "var(--header-height)",
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
