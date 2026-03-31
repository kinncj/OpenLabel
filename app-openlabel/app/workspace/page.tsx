"use client";

import { Suspense } from "react";
import { WorkspaceClient } from "./WorkspaceClient";

export default function WorkspacePage() {
  return (
    <Suspense>
      <WorkspaceClient />
    </Suspense>
  );
}
