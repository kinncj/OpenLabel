import { describe, it, expect, beforeEach } from "vitest";
import { useProjectStore } from "@/ui/stores/projectStore";
import type { Project, ImageRecord } from "@/common/domain/dataset/types";

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "proj-0000-0000-0000-000000000001",
    name: "Test Project",
    version: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    classes: [],
    images: [],
    exportOptions: {
      includeYaml: true,
      includeTxtLabels: true,
      includeLabelStudio: false,
      blockIncompleteImages: false,
    },
    ...overrides,
  };
}

function makeImage(id: string, overrides: Partial<ImageRecord> = {}): ImageRecord {
  return {
    id,
    fileName: `image-${id}.jpg`,
    storedBlobKey: `key-${id}`,
    width: 640,
    height: 480,
    split: "train",
    reviewState: "incomplete",
    annotations: [],
    hash: `hash-${id}`,
    ...overrides,
  };
}

beforeEach(() => {
  useProjectStore.setState({ projects: [], activeProject: null });
});

describe("projectStore — setActiveProject", () => {
  it("sets activeProject when given a project", () => {
    const project = makeProject();
    useProjectStore.getState().setActiveProject(project);
    expect(useProjectStore.getState().activeProject).toEqual(project);
  });

  it("clears activeProject when given null", () => {
    useProjectStore.getState().setActiveProject(makeProject());
    useProjectStore.getState().setActiveProject(null);
    expect(useProjectStore.getState().activeProject).toBeNull();
  });
});

describe("projectStore — updateActiveProject", () => {
  it("merges partial fields into activeProject", () => {
    const project = makeProject({ name: "Old Name" });
    useProjectStore.getState().setActiveProject(project);
    useProjectStore.getState().updateActiveProject({ name: "New Name" });
    expect(useProjectStore.getState().activeProject!.name).toBe("New Name");
  });

  it("preserves unpatched fields", () => {
    const project = makeProject({ name: "Keep Me", version: 3 });
    useProjectStore.getState().setActiveProject(project);
    useProjectStore.getState().updateActiveProject({ version: 4 });
    const active = useProjectStore.getState().activeProject!;
    expect(active.name).toBe("Keep Me");
    expect(active.version).toBe(4);
  });

  it("is a no-op when activeProject is null", () => {
    useProjectStore.getState().updateActiveProject({ name: "Ghost" });
    expect(useProjectStore.getState().activeProject).toBeNull();
  });
});

describe("projectStore — upsertImage", () => {
  it("adds a new image when the id is not present", () => {
    const project = makeProject();
    useProjectStore.getState().setActiveProject(project);
    const image = makeImage("img-1");
    useProjectStore.getState().upsertImage(image);
    const images = useProjectStore.getState().activeProject!.images;
    expect(images).toHaveLength(1);
    expect(images[0]).toEqual(image);
  });

  it("updates existing image when id matches", () => {
    const image = makeImage("img-1");
    const project = makeProject({ images: [image] });
    useProjectStore.getState().setActiveProject(project);
    const updated = { ...image, fileName: "updated.jpg" };
    useProjectStore.getState().upsertImage(updated);
    const images = useProjectStore.getState().activeProject!.images;
    expect(images).toHaveLength(1);
    expect(images[0]!.fileName).toBe("updated.jpg");
  });

  it("does not add duplicate when updating existing image", () => {
    const image = makeImage("img-1");
    const project = makeProject({ images: [image] });
    useProjectStore.getState().setActiveProject(project);
    useProjectStore.getState().upsertImage({ ...image, fileName: "second.jpg" });
    expect(useProjectStore.getState().activeProject!.images).toHaveLength(1);
  });

  it("appends to existing images without affecting others", () => {
    const img1 = makeImage("img-1");
    const img2 = makeImage("img-2");
    const project = makeProject({ images: [img1] });
    useProjectStore.getState().setActiveProject(project);
    useProjectStore.getState().upsertImage(img2);
    const images = useProjectStore.getState().activeProject!.images;
    expect(images).toHaveLength(2);
    expect(images.find((i) => i.id === "img-1")).toBeDefined();
    expect(images.find((i) => i.id === "img-2")).toBeDefined();
  });

  it("is a no-op when activeProject is null", () => {
    // Should not throw
    useProjectStore.getState().upsertImage(makeImage("img-1"));
    expect(useProjectStore.getState().activeProject).toBeNull();
  });
});

describe("projectStore — removeImage", () => {
  it("removes image by id", () => {
    const img1 = makeImage("img-1");
    const img2 = makeImage("img-2");
    const project = makeProject({ images: [img1, img2] });
    useProjectStore.getState().setActiveProject(project);
    useProjectStore.getState().removeImage("img-1");
    const images = useProjectStore.getState().activeProject!.images;
    expect(images).toHaveLength(1);
    expect(images[0]!.id).toBe("img-2");
  });

  it("is a no-op for an id that does not exist", () => {
    const img1 = makeImage("img-1");
    const project = makeProject({ images: [img1] });
    useProjectStore.getState().setActiveProject(project);
    useProjectStore.getState().removeImage("nonexistent");
    expect(useProjectStore.getState().activeProject!.images).toHaveLength(1);
  });

  it("is a no-op when activeProject is null", () => {
    useProjectStore.getState().removeImage("img-1");
    expect(useProjectStore.getState().activeProject).toBeNull();
  });

  it("empties images array when last image is removed", () => {
    const img = makeImage("img-only");
    const project = makeProject({ images: [img] });
    useProjectStore.getState().setActiveProject(project);
    useProjectStore.getState().removeImage("img-only");
    expect(useProjectStore.getState().activeProject!.images).toHaveLength(0);
  });
});

describe("projectStore — updateClasses", () => {
  it("replaces classes array", () => {
    const project = makeProject({
      classes: [{ id: 0, name: "cat", color: "#ff0000", source: "preset" }],
    });
    useProjectStore.getState().setActiveProject(project);
    const newClasses = [
      { id: 0, name: "dog", color: "#00ff00", source: "custom" as const },
      { id: 1, name: "bird", color: "#0000ff", source: "custom" as const },
    ];
    useProjectStore.getState().updateClasses(newClasses);
    expect(useProjectStore.getState().activeProject!.classes).toEqual(newClasses);
  });

  it("can set an empty classes array", () => {
    const project = makeProject({
      classes: [{ id: 0, name: "cat", color: "#ff0000", source: "preset" }],
    });
    useProjectStore.getState().setActiveProject(project);
    useProjectStore.getState().updateClasses([]);
    expect(useProjectStore.getState().activeProject!.classes).toHaveLength(0);
  });

  it("is a no-op when activeProject is null", () => {
    useProjectStore.getState().updateClasses([
      { id: 0, name: "ghost", color: "#aabbcc", source: "custom" },
    ]);
    expect(useProjectStore.getState().activeProject).toBeNull();
  });
});

describe("projectStore — setProjects", () => {
  it("sets the projects list", () => {
    const p1 = makeProject({ id: "proj-1", name: "P1" });
    const p2 = makeProject({ id: "proj-2", name: "P2" });
    useProjectStore.getState().setProjects([p1, p2]);
    expect(useProjectStore.getState().projects).toHaveLength(2);
  });

  it("replaces existing projects list", () => {
    useProjectStore.getState().setProjects([makeProject({ id: "old" })]);
    useProjectStore.getState().setProjects([]);
    expect(useProjectStore.getState().projects).toHaveLength(0);
  });
});
