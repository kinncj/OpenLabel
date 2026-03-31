"use client";

import React, { useEffect, useState } from "react";

export function withClientOnly<P extends object>(
  Component: React.ComponentType<P>,
): React.FC<P> {
  const ClientOnly: React.FC<P> = (props) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return <Component {...props} />;
  };
  ClientOnly.displayName = `withClientOnly(${Component.displayName ?? Component.name})`;
  return ClientOnly;
}
