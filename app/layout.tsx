import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "openlabel — YOLO Dataset Annotator",
  description: "Browser-only YOLO detect dataset annotator. Zero backend.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
