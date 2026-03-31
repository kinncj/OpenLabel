import { zipSync, strToU8 } from "fflate";

function isTraversalPath(p: string): boolean {
  // Normalize: replace backslashes, collapse repeated slashes
  const normalized = p.replace(/\\/g, "/").replace(/\/+/g, "/");
  // Block absolute paths and traversal sequences
  if (normalized.startsWith("/")) return true;
  const parts = normalized.split("/");
  let depth = 0;
  for (const part of parts) {
    if (part === "..") {
      depth--;
      if (depth < 0) return true;
    } else if (part !== ".") {
      depth++;
    }
  }
  return false;
}

export function buildZip(entries: Map<string, Uint8Array | string>): Uint8Array {
  const files: Record<string, Uint8Array> = {};

  for (const [rawPath, content] of entries) {
    if (isTraversalPath(rawPath)) {
      throw new Error(`Zip entry path is unsafe: ${rawPath}`);
    }
    files[rawPath] = typeof content === "string" ? strToU8(content) : content;
  }

  return zipSync(files, { level: 6 });
}
