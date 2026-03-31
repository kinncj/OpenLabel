import { describe, it, expect } from "vitest";
import { serializeToDataYaml } from "@/common/infrastructure/serializers/YamlSerializer";
import type { Project } from "@/common/domain/dataset/types";

// ── factory helpers ───────────────────────────────────────────────────────────

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    name: "test-project",
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

function makeClass(id: number, name: string) {
  return { id, name, color: "#ffffff", source: "custom" as const };
}

// ── tests ────────────────────────────────────────────────────────────────────

describe("YamlSerializer", () => {
  it("includes path, train, and val splits in every output", () => {
    const yaml = serializeToDataYaml(makeProject(), false);
    expect(yaml).toContain("path: .");
    expect(yaml).toContain("train: images/train");
    expect(yaml).toContain("val: images/val");
  });

  it("includes test split when hasTest=true", () => {
    const yaml = serializeToDataYaml(makeProject(), true);
    expect(yaml).toContain("test: images/test");
  });

  it("omits test split when hasTest=false", () => {
    const yaml = serializeToDataYaml(makeProject(), false);
    expect(yaml).not.toContain("test:");
  });

  it("serializes nc as the number of classes", () => {
    const project = makeProject({
      classes: [makeClass(0, "cat"), makeClass(1, "dog")],
    });
    const yaml = serializeToDataYaml(project, false);
    expect(yaml).toContain("nc: 2");
  });

  it("lists class names sorted by id ascending", () => {
    const project = makeProject({
      classes: [makeClass(2, "cat"), makeClass(0, "dog"), makeClass(1, "bird")],
    });
    const yaml = serializeToDataYaml(project, false);
    const nameLines = yaml
      .split("\n")
      .filter((l) => l.trim().startsWith("- "))
      .map((l) => l.trim().replace("- ", ""));
    expect(nameLines).toEqual(["dog", "bird", "cat"]);
  });

  it("produces empty names list for project with no classes", () => {
    const yaml = serializeToDataYaml(makeProject({ classes: [] }), false);
    expect(yaml).toContain("names:");
    // No list items
    expect(yaml).not.toContain("  - ");
  });

  it("serializes correctly for a project with no images", () => {
    const project = makeProject({
      classes: [makeClass(0, "person")],
      images: [],
    });
    const yaml = serializeToDataYaml(project, false);
    expect(yaml).toContain("  - person");
  });

  it("ends with a newline", () => {
    const yaml = serializeToDataYaml(makeProject(), false);
    expect(yaml.endsWith("\n")).toBe(true);
  });

  it("includes a single class correctly", () => {
    const project = makeProject({ classes: [makeClass(0, "vehicle")] });
    const yaml = serializeToDataYaml(project, false);
    expect(yaml).toContain("  - vehicle");
  });

  it("output with hasTest=true contains test line after val line", () => {
    const yaml = serializeToDataYaml(makeProject(), true);
    const lines = yaml.split("\n");
    const valIdx = lines.findIndex((l) => l.startsWith("val:"));
    const testIdx = lines.findIndex((l) => l.startsWith("test:"));
    expect(valIdx).toBeGreaterThan(-1);
    expect(testIdx).toBeGreaterThan(valIdx);
  });

  it("names section appears after splits section", () => {
    const project = makeProject({ classes: [makeClass(0, "cat")] });
    const yaml = serializeToDataYaml(project, false);
    const lines = yaml.split("\n");
    const valIdx = lines.findIndex((l) => l.startsWith("val:"));
    const namesIdx = lines.findIndex((l) => l.startsWith("names:"));
    expect(namesIdx).toBeGreaterThan(valIdx);
  });
});
