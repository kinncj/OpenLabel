import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Dexie, { type Table } from "dexie";
import { setDb } from "@/common/infrastructure/persistence/db";
import { BlobRepository } from "@/common/infrastructure/persistence/BlobRepository";
import type { PersistedProject, PersistedImage, PersistedBlob } from "@/common/infrastructure/persistence/db";

// Fresh DB per test — fake-indexeddb shares global state for same-named DBs.
class TestDb extends Dexie {
  projects!: Table<PersistedProject, string>;
  images!: Table<PersistedImage, string>;
  blobs!: Table<PersistedBlob, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      projects: "id, name, updatedAt",
      images: "id, projectId, hash, [projectId+split]",
      blobs: "key",
    });
  }
}

let _counter = 0;
function freshDb() {
  return new TestDb(`openlabel-blob-test-${++_counter}`);
}

// NOTE: fake-indexeddb runs inside jsdom, which does not fully implement
// the structured clone algorithm for Blob. A Blob retrieved from fake-indexeddb
// comes back as an empty plain object — its .size, .type, .text(), and
// .arrayBuffer() are all absent. Tests that verify blob _content_ are therefore
// skipped; tests that verify _storage/retrieval/deletion semantics_ (i.e. the
// key-value contract) are fully meaningful and are all included.

describe("BlobRepository", () => {
  let db: TestDb;
  let repo: BlobRepository;

  beforeEach(() => {
    db = freshDb();
    setDb(db as any);
    repo = new BlobRepository(db as any);
  });

  afterEach(async () => {
    await db.delete();
  });

  describe("save()", () => {
    it("stores a blob under the given key (row exists in DB)", async () => {
      const blob = new Blob(["hello world"], { type: "image/jpeg" });
      await repo.save("key-001", blob);
      const row = await db.blobs.get("key-001");
      expect(row).toBeDefined();
      expect(row!.key).toBe("key-001");
    });

    it("overwrites an existing blob: row still exists after second put", async () => {
      const original = new Blob(["original"]);
      const replacement = new Blob(["replacement"]);
      await repo.save("dup-key", original);
      await repo.save("dup-key", replacement);
      const row = await db.blobs.get("dup-key");
      // Row must still be present — overwrite did not delete the entry
      expect(row).toBeDefined();
      expect(row!.key).toBe("dup-key");
    });

    it("overwrites: only one row exists for the key after two saves", async () => {
      await repo.save("single-key", new Blob(["v1"]));
      await repo.save("single-key", new Blob(["v2"]));
      const count = await db.blobs.where("key").equals("single-key").count();
      expect(count).toBe(1);
    });

    it("stores two distinct keys as two separate rows", async () => {
      await repo.save("key-a", new Blob(["aaa"]));
      await repo.save("key-b", new Blob(["bbb"]));
      const rowA = await db.blobs.get("key-a");
      const rowB = await db.blobs.get("key-b");
      expect(rowA).toBeDefined();
      expect(rowB).toBeDefined();
    });

    it("resolves without throwing", async () => {
      await expect(repo.save("any-key", new Blob(["data"]))).resolves.toBeUndefined();
    });
  });

  describe("get()", () => {
    it("returns a defined value for a stored key", async () => {
      const blob = new Blob(["blob content"], { type: "image/png" });
      await repo.save("retrieve-key", blob);
      const result = await repo.get("retrieve-key");
      // The object is truthy — verifying content is not possible in this env (see note above)
      expect(result).toBeDefined();
    });

    it("returns undefined for a missing key", async () => {
      const result = await repo.get("does-not-exist");
      expect(result).toBeUndefined();
    });

    it("returns a defined value after an overwrite", async () => {
      await repo.save("overwrite-key", new Blob(["v1"]));
      await repo.save("overwrite-key", new Blob(["v2"]));
      const result = await repo.get("overwrite-key");
      expect(result).toBeDefined();
    });

    it("returns undefined after the key is deleted", async () => {
      await repo.save("gone-key", new Blob(["bye"]));
      await repo.delete("gone-key");
      const result = await repo.get("gone-key");
      expect(result).toBeUndefined();
    });
  });

  describe("delete()", () => {
    it("removes the blob so get() returns undefined", async () => {
      await repo.save("to-delete", new Blob(["bye"]));
      await repo.delete("to-delete");
      const result = await repo.get("to-delete");
      expect(result).toBeUndefined();
    });

    it("does not throw when deleting a non-existent key", async () => {
      await expect(repo.delete("ghost-key")).resolves.toBeUndefined();
    });

    it("does not affect other blobs", async () => {
      await repo.save("keep", new Blob(["keep"]));
      await repo.save("delete-me", new Blob(["gone"]));
      await repo.delete("delete-me");
      const kept = await repo.get("keep");
      const gone = await repo.get("delete-me");
      expect(kept).toBeDefined();
      expect(gone).toBeUndefined();
    });

    it("removes the row from the DB table", async () => {
      await repo.save("row-check", new Blob(["data"]));
      await repo.delete("row-check");
      const row = await db.blobs.get("row-check");
      expect(row).toBeUndefined();
    });

    it("resolves without throwing on valid key", async () => {
      await repo.save("del-valid", new Blob(["x"]));
      await expect(repo.delete("del-valid")).resolves.toBeUndefined();
    });
  });
});
