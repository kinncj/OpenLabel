"use client";

import { withClientOnly } from "@/ui/hoc/withClientOnly";
import { ProjectList } from "@/ui/components/ProjectList/ProjectList";

const ClientProjectList = withClientOnly(ProjectList);

export default function HomePage() {
  return <ClientProjectList />;
}
