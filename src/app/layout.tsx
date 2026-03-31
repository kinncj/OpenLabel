import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import { AppFooter } from "@/ui/components/common/AppFooter";

export const metadata: Metadata = {
  title: "OpenLabel — YOLO Dataset Annotator",
  description: "Browser-only YOLO detect dataset annotator. Zero backend.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        {children}
        <AppFooter />
      </body>
    </html>
  );
}
