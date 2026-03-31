import { describe, it, expect } from "vitest";
import { sha256 } from "@/common/application/services/HashService";

// Known SHA-256 values (computed with standard tooling):
// echo -n "" | sha256sum  => e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
// echo -n "hello" | sha256sum => 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824

function strToBuffer(s: string): ArrayBuffer {
  return new TextEncoder().encode(s).buffer;
}

describe("sha256 (HashService)", () => {
  it("produces the known SHA-256 of the empty string", async () => {
    const result = await sha256(strToBuffer(""));
    expect(result).toBe(
      "e3b0c44298fc1c149afbf4c8996fb924" +
      "27ae41e4649b934ca495991b7852b855",
    );
  });

  it("produces the known SHA-256 of 'hello'", async () => {
    const result = await sha256(strToBuffer("hello"));
    expect(result).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e" +
      "1b161e5c1fa7425e73043362938b9824",
    );
  });

  it("produces a 64-character lowercase hex string", async () => {
    const result = await sha256(strToBuffer("test"));
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic — same input always yields same hash", async () => {
    const input = strToBuffer("determinism check");
    const a = await sha256(input);
    const b = await sha256(input);
    expect(a).toBe(b);
  });

  it("produces different hashes for different inputs", async () => {
    const h1 = await sha256(strToBuffer("foo"));
    const h2 = await sha256(strToBuffer("bar"));
    expect(h1).not.toBe(h2);
  });

  it("is sensitive to a single byte difference", async () => {
    const h1 = await sha256(strToBuffer("hello"));
    const h2 = await sha256(strToBuffer("hellp"));
    expect(h1).not.toBe(h2);
  });

  it("handles a buffer with a known single-byte value", async () => {
    // SHA-256 of a single 0x00 byte:
    // echo -ne '\x00' | sha256sum => 6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d
    const buf = new Uint8Array([0x00]).buffer;
    const result = await sha256(buf);
    expect(result).toBe(
      "6e340b9cffb37a989ca544e6bb780a2c" +
      "78901d3fb33738768511a30617afa01d",
    );
  });

  it("handles a longer binary buffer without throwing", async () => {
    const data = new Uint8Array(1024);
    for (let i = 0; i < data.length; i++) data[i] = i % 256;
    await expect(sha256(data.buffer)).resolves.toHaveLength(64);
  });
});
