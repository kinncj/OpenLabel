import Dexie, { type Table } from "dexie";
import type { BoxAnnotation } from "@/common/domain/annotations/types";
import type { ClassDef } from "@/common/domain/classes/types";
import type { Split, ImageReviewState, ExportOptions } from "@/common/domain/dataset/types";

// Persisted shapes — split Project/ImageRecord to avoid storing images array inside project row
export type PersistedProject = {
  id: string;
  name: string;
  description?: string | undefined;
  version: number;
  createdAt: string;
  updatedAt: string;
  classes: ClassDef[];
  exportOptions: ExportOptions;
};

export type PersistedImage = {
  id: string;
  projectId: string;
  fileName: string;
  storedBlobKey: string;
  width: number;
  height: number;
  split: Split;
  reviewState: ImageReviewState;
  annotations: BoxAnnotation[];
  hash: string;
};

export type PersistedBlob = {
  key: string;
  blob: Blob;
};

class OpenLabelDb extends Dexie {
  projects!: Table<PersistedProject, string>;
  images!: Table<PersistedImage, string>;
  blobs!: Table<PersistedBlob, string>;

  constructor() {
    super("openlabel");
    this.version(1).stores({
      projects: "id, name, updatedAt",
      images: "id, projectId, hash, [projectId+split]",
      blobs: "key",
    });
  }
}

// Singleton — the module holds one instance
let _db: OpenLabelDb | null = null;

export function getDb(): OpenLabelDb {
  if (!_db) {
    _db = new OpenLabelDb();
  }
  return _db;
}

// Allow tests to inject a fresh instance (e.g. with fake-indexeddb)
export function setDb(db: OpenLabelDb): void {
  _db = db;
}

export { OpenLabelDb };
