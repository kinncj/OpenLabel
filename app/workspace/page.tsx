"use client";

import { Suspense } from "react";
import { WorkspaceClient } from "@/ui/layouts/WorkspaceClient";

export default function WorkspacePage() {
  return (
    <Suspense>
      <WorkspaceClient />
    </Suspense>
  );
}
