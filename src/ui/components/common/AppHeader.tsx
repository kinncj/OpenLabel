"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sun, Moon } from "@phosphor-icons/react";
import { useThemeStore } from "@/ui/stores/themeStore";

type Props = {
  children?: React.ReactNode;
};

export function AppHeader({ children }: Props) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "var(--header-height)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 14px",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.15)",
      }}
    >
      {/* Logo → home */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
        <Image
          src="/logo-icon.png"
          alt="OpenLabel"
          width={28}
          height={28}
          style={{ objectFit: "contain" }}
          priority
        />
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px", lineHeight: 1 }}>
          <span style={{ color: "#27B5AA" }}>Open</span><span style={{ color: "#F47B20" }}>Label</span>
        </span>
      </Link>

      {/* Context slot (project name, breadcrumbs, etc.) */}
      {children && (
        <>
          <span style={{ color: "var(--color-border)", fontSize: 18, fontWeight: 200 }}>|</span>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, overflow: "hidden", minWidth: 0 }}>
            {children}
          </div>
        </>
      )}
      {!children && <div style={{ flex: 1 }} />}

      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 6,
          border: "1px solid var(--color-border)",
          background: "transparent",
          color: "var(--color-text-muted)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {theme === "dark" ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
      </button>
    </header>
  );
}
