"use client";

import React from "react";

export function AppFooter() {
  return (
    <footer
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "var(--footer-height)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "0 14px",
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        fontSize: 11,
        color: "var(--color-text-muted)",
      }}
    >
      <span>OpenLabel</span>
      <span style={{ color: "var(--color-border)" }}>·</span>
      <a
        href="https://github.com/kinncj/OpenLabel"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "var(--color-text-muted)", textDecoration: "none" }}
        onMouseOver={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
        onMouseOut={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
      >
        GitHub
      </a>
      <span style={{ color: "var(--color-border)" }}>·</span>
      <span>AGPLv3</span>
    </footer>
  );
}
