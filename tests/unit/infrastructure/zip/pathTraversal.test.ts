// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readZip } from "@/common/infrastructure/zip/ZipReader";
import { buildZip } from "@/common/infrastructure/zip/ZipWriter";
import { strToU8, zipSync } from "fflate";

function makeZipWith(entries: Record<string, string>): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  for (const [k, v] of Object.entries(entries)) {
    files[k] = strToU8(v);
  }
  // Use fflate directly to bypass our writer's safety checks (so we can test malicious zips)
  return zipSync(files);
}

describe("ZipReader path traversal protection", () => {
  it("keeps a safe path", () => {
    const zip = makeZipWith({ "images/train/cat.jpg": "data" });
    const result = readZip(zip);
    expect(result.has("images/train/cat.jpg")).toBe(true);
  });

  it("drops ../etc/passwd", () => {
    const zip = makeZipWith({ "../etc/passwd": "evil" });
    const result = readZip(zip);
    expect(result.size).toBe(0);
  });

  it("drops images/../../etc/passwd", () => {
    const zip = makeZipWith({ "images/../../etc/passwd": "evil" });
    const result = readZip(zip);
    expect(result.size).toBe(0);
  });

  it("drops absolute path /etc/passwd", () => {
    const zip = makeZipWith({ "/etc/passwd": "evil" });
    const result = readZip(zip);
    expect(result.size).toBe(0);
  });

  it("drops Windows reserved name CON", () => {
    const zip = makeZipWith({ "CON": "evil" });
    const result = readZip(zip);
    expect(result.size).toBe(0);
  });

  it("drops Windows reserved name NUL", () => {
    const zip = makeZipWith({ "subdir/NUL": "evil" });
    const result = readZip(zip);
    expect(result.size).toBe(0);
  });

  it("drops entry with null byte in path", () => {
    const zip = makeZipWith({ "foo\x00bar.txt": "evil" });
    const result = readZip(zip);
    expect(result.size).toBe(0);
  });

  it("normalizes ./images/train/cat.jpg", () => {
    const zip = makeZipWith({ "./images/train/cat.jpg": "data" });
    const result = readZip(zip);
    expect(result.has("images/train/cat.jpg")).toBe(true);
  });
});

describe("ZipWriter path safety", () => {
  it("throws on traversal path", () => {
    const entries = new Map<string, Uint8Array | string>([["../evil.txt", "bad"]]);
    expect(() => buildZip(entries)).toThrow();
  });

  it("builds a clean zip", () => {
    const entries = new Map<string, Uint8Array | string>([
      ["dataset.ndjson", "{}"],
      ["images/train/test.jpg", strToU8("img")],
    ]);
    const bytes = buildZip(entries);
    expect(bytes.byteLength).toBeGreaterThan(0);
  });
});
