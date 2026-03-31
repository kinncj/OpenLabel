import { unzipSync } from "fflate";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
const MAX_TOTAL_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB total

const WINDOWS_RESERVED = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;

function normalizePath(raw: string): string | null {
  // Normalize separators
  let p = raw.replace(/\\/g, "/");
  // Reject absolute paths (leading slash)
  if (p.startsWith("/")) return null;
  // Strip any remaining leading slashes (shouldn't be needed after above check, but belt-and-suspenders)
  p = p.replace(/^\/+/, "");
  // Resolve . and .. segments
  const parts = p.split("/");
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (resolved.length === 0) return null; // traversal above root
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  if (resolved.length === 0) return null;

  // Check each segment for unsafe names
  for (const seg of resolved) {
    // Null bytes or control chars
    if (/[\x00-\x1f\x7f]/.test(seg)) return null;
    // Windows reserved names
    if (WINDOWS_RESERVED.test(seg)) return null;
  }

  return resolved.join("/");
}

export function readZip(bytes: Uint8Array): Map<string, Uint8Array> {
  const raw = unzipSync(bytes);
  const result = new Map<string, Uint8Array>();
  let totalSize = 0;

  for (const [rawPath, data] of Object.entries(raw)) {
    // Skip directory entries
    if (rawPath.endsWith("/")) continue;

    const normalized = normalizePath(rawPath);
    if (!normalized) {
      console.warn(`[ZipReader] Dropping unsafe path: ${rawPath}`);
      continue;
    }

    if (data.byteLength > MAX_FILE_SIZE) {
      console.warn(`[ZipReader] Dropping oversized file: ${normalized} (${data.byteLength} bytes)`);
      continue;
    }

    totalSize += data.byteLength;
    if (totalSize > MAX_TOTAL_SIZE) {
      throw new Error("Zip total decompressed size exceeds limit (2 GB)");
    }

    result.set(normalized, data);
  }

  return result;
}
