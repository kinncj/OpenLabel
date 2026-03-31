import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "@/ui/stores/uiStore";

const INITIAL_STATE = {
  activeImageId: null,
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  toasts: [] as ReturnType<typeof useUiStore.getState>["toasts"],
  importDialogOpen: false,
  createProjectDialogOpen: false,
};

beforeEach(() => {
  useUiStore.setState(INITIAL_STATE);
});

describe("uiStore — setActiveImage", () => {
  it("defaults to null", () => {
    expect(useUiStore.getState().activeImageId).toBeNull();
  });

  it("sets activeImageId", () => {
    useUiStore.getState().setActiveImage("img-abc");
    expect(useUiStore.getState().activeImageId).toBe("img-abc");
  });

  it("clears activeImageId when set to null", () => {
    useUiStore.getState().setActiveImage("img-abc");
    useUiStore.getState().setActiveImage(null);
    expect(useUiStore.getState().activeImageId).toBeNull();
  });

  it("overwrites a previous value", () => {
    useUiStore.getState().setActiveImage("img-first");
    useUiStore.getState().setActiveImage("img-second");
    expect(useUiStore.getState().activeImageId).toBe("img-second");
  });
});

describe("uiStore — addToast", () => {
  it("starts with empty toasts", () => {
    expect(useUiStore.getState().toasts).toHaveLength(0);
  });

  it("appends a toast with an auto-generated id", () => {
    useUiStore.getState().addToast({ message: "Hello", variant: "info" });
    const { toasts } = useUiStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]!.id).toBeTruthy();
    expect(typeof toasts[0]!.id).toBe("string");
  });

  it("preserves message and variant on added toast", () => {
    useUiStore.getState().addToast({ message: "Saved!", variant: "success" });
    const toast = useUiStore.getState().toasts[0]!;
    expect(toast.message).toBe("Saved!");
    expect(toast.variant).toBe("success");
  });

  it("two toasts have different auto-generated ids", () => {
    useUiStore.getState().addToast({ message: "First", variant: "info" });
    useUiStore.getState().addToast({ message: "Second", variant: "error" });
    const { toasts } = useUiStore.getState();
    expect(toasts).toHaveLength(2);
    expect(toasts[0]!.id).not.toBe(toasts[1]!.id);
  });

  it("appends without removing existing toasts", () => {
    useUiStore.getState().addToast({ message: "One", variant: "info" });
    useUiStore.getState().addToast({ message: "Two", variant: "warning" });
    useUiStore.getState().addToast({ message: "Three", variant: "error" });
    expect(useUiStore.getState().toasts).toHaveLength(3);
  });
});

describe("uiStore — dismissToast", () => {
  it("removes a toast by id", () => {
    useUiStore.getState().addToast({ message: "Remove me", variant: "info" });
    const { toasts } = useUiStore.getState();
    const id = toasts[0]!.id;
    useUiStore.getState().dismissToast(id);
    expect(useUiStore.getState().toasts).toHaveLength(0);
  });

  it("only removes the toast with the matching id", () => {
    useUiStore.getState().addToast({ message: "Keep", variant: "success" });
    useUiStore.getState().addToast({ message: "Remove", variant: "error" });
    const ids = useUiStore.getState().toasts.map((t) => t.id);
    useUiStore.getState().dismissToast(ids[1]!);
    const remaining = useUiStore.getState().toasts;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.message).toBe("Keep");
  });

  it("is a no-op for an unknown id", () => {
    useUiStore.getState().addToast({ message: "Stay", variant: "info" });
    useUiStore.getState().dismissToast("nonexistent-id");
    expect(useUiStore.getState().toasts).toHaveLength(1);
  });

  it("is a no-op on empty toasts list", () => {
    // Should not throw
    useUiStore.getState().dismissToast("some-id");
    expect(useUiStore.getState().toasts).toHaveLength(0);
  });
});

describe("uiStore — panel collapse toggles", () => {
  it("leftPanelCollapsed defaults to false", () => {
    expect(useUiStore.getState().leftPanelCollapsed).toBe(false);
  });

  it("toggleLeftPanel flips false → true", () => {
    useUiStore.getState().toggleLeftPanel();
    expect(useUiStore.getState().leftPanelCollapsed).toBe(true);
  });

  it("toggleLeftPanel flips true → false", () => {
    useUiStore.getState().toggleLeftPanel();
    useUiStore.getState().toggleLeftPanel();
    expect(useUiStore.getState().leftPanelCollapsed).toBe(false);
  });

  it("rightPanelCollapsed defaults to false", () => {
    expect(useUiStore.getState().rightPanelCollapsed).toBe(false);
  });

  it("toggleRightPanel flips false → true", () => {
    useUiStore.getState().toggleRightPanel();
    expect(useUiStore.getState().rightPanelCollapsed).toBe(true);
  });

  it("toggleRightPanel flips true → false on second call", () => {
    useUiStore.getState().toggleRightPanel();
    useUiStore.getState().toggleRightPanel();
    expect(useUiStore.getState().rightPanelCollapsed).toBe(false);
  });
});

describe("uiStore — dialog open flags", () => {
  it("importDialogOpen defaults to false", () => {
    expect(useUiStore.getState().importDialogOpen).toBe(false);
  });

  it("setImportDialogOpen sets to true", () => {
    useUiStore.getState().setImportDialogOpen(true);
    expect(useUiStore.getState().importDialogOpen).toBe(true);
  });

  it("setImportDialogOpen sets back to false", () => {
    useUiStore.getState().setImportDialogOpen(true);
    useUiStore.getState().setImportDialogOpen(false);
    expect(useUiStore.getState().importDialogOpen).toBe(false);
  });

  it("createProjectDialogOpen defaults to false", () => {
    expect(useUiStore.getState().createProjectDialogOpen).toBe(false);
  });

  it("setCreateProjectDialogOpen sets to true", () => {
    useUiStore.getState().setCreateProjectDialogOpen(true);
    expect(useUiStore.getState().createProjectDialogOpen).toBe(true);
  });

  it("setCreateProjectDialogOpen sets back to false", () => {
    useUiStore.getState().setCreateProjectDialogOpen(true);
    useUiStore.getState().setCreateProjectDialogOpen(false);
    expect(useUiStore.getState().createProjectDialogOpen).toBe(false);
  });

  it("two dialogs are independent — toggling one does not affect the other", () => {
    useUiStore.getState().setImportDialogOpen(true);
    expect(useUiStore.getState().createProjectDialogOpen).toBe(false);
  });
});
