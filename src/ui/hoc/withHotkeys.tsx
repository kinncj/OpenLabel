"use client";

import React, { useEffect } from "react";

export type HotkeyMap = Record<string, (e: KeyboardEvent) => void>;

export function withHotkeys<P extends object>(
  Component: React.ComponentType<P>,
  getHotkeys: (props: P) => HotkeyMap,
): React.FC<P> {
  const WithHotkeys: React.FC<P> = (props) => {
    useEffect(() => {
      const hotkeys = getHotkeys(props);
      const handler = (e: KeyboardEvent) => {
        // Build a key string like "ctrl+s", "meta+z", "Delete"
        const parts: string[] = [];
        if (e.ctrlKey) parts.push("ctrl");
        if (e.metaKey) parts.push("meta");
        if (e.altKey) parts.push("alt");
        if (e.shiftKey) parts.push("shift");
        parts.push(e.key);
        const combo = parts.join("+");

        const fn = hotkeys[combo] ?? hotkeys[e.key];
        if (fn) {
          e.preventDefault();
          fn(e);
        }
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    });

    return <Component {...props} />;
  };
  WithHotkeys.displayName = `withHotkeys(${Component.displayName ?? Component.name})`;
  return WithHotkeys;
}
