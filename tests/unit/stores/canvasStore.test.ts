import { describe, it, expect, beforeEach } from "vitest";
import { useCanvasStore } from "@/ui/stores/canvasStore";

const INITIAL_STATE = {
  zoom: 1,
  panX: 0,
  panY: 0,
  tool: "draw" as const,
  selectedBoxId: null,
  drawing: null,
  editingBox: null,
  activeClassId: 0,
};

beforeEach(() => {
  useCanvasStore.setState(INITIAL_STATE);
});

describe("canvasStore — tool", () => {
  it("defaults to 'draw'", () => {
    expect(useCanvasStore.getState().tool).toBe("draw");
  });

  it("setTool changes tool to 'pan'", () => {
    useCanvasStore.getState().setTool("pan");
    expect(useCanvasStore.getState().tool).toBe("pan");
  });

  it("setTool changes tool to 'select'", () => {
    useCanvasStore.getState().setTool("select");
    expect(useCanvasStore.getState().tool).toBe("select");
  });

  it("setTool can switch back to 'draw'", () => {
    useCanvasStore.getState().setTool("pan");
    useCanvasStore.getState().setTool("draw");
    expect(useCanvasStore.getState().tool).toBe("draw");
  });
});

describe("canvasStore — zoom", () => {
  it("setZoom clamps to ZOOM_MIN (0.1) when given 0", () => {
    useCanvasStore.getState().setZoom(0);
    expect(useCanvasStore.getState().zoom).toBe(0.1);
  });

  it("setZoom clamps to ZOOM_MIN (0.1) when given negative", () => {
    useCanvasStore.getState().setZoom(-5);
    expect(useCanvasStore.getState().zoom).toBe(0.1);
  });

  it("setZoom clamps to ZOOM_MAX (20) when given 100", () => {
    useCanvasStore.getState().setZoom(100);
    expect(useCanvasStore.getState().zoom).toBe(20);
  });

  it("setZoom clamps to ZOOM_MAX (20) when given exactly 21", () => {
    useCanvasStore.getState().setZoom(21);
    expect(useCanvasStore.getState().zoom).toBe(20);
  });

  it("setZoom accepts a valid value within range", () => {
    useCanvasStore.getState().setZoom(2.5);
    expect(useCanvasStore.getState().zoom).toBe(2.5);
  });

  it("setZoom accepts exactly ZOOM_MIN (0.1)", () => {
    useCanvasStore.getState().setZoom(0.1);
    expect(useCanvasStore.getState().zoom).toBe(0.1);
  });

  it("setZoom accepts exactly ZOOM_MAX (20)", () => {
    useCanvasStore.getState().setZoom(20);
    expect(useCanvasStore.getState().zoom).toBe(20);
  });
});

describe("canvasStore — startDraw / updateDraw / cancelDraw", () => {
  it("drawing is null by default", () => {
    expect(useCanvasStore.getState().drawing).toBeNull();
  });

  it("startDraw sets the drawing state", () => {
    useCanvasStore.getState().startDraw(0.1, 0.2);
    const { drawing } = useCanvasStore.getState();
    expect(drawing).not.toBeNull();
    expect(drawing!.startX).toBe(0.1);
    expect(drawing!.startY).toBe(0.2);
    expect(drawing!.currentX).toBe(0.1);
    expect(drawing!.currentY).toBe(0.2);
  });

  it("updateDraw mutates currentX/currentY when drawing is active", () => {
    useCanvasStore.getState().startDraw(0.1, 0.2);
    useCanvasStore.getState().updateDraw(0.5, 0.6);
    const { drawing } = useCanvasStore.getState();
    expect(drawing!.currentX).toBe(0.5);
    expect(drawing!.currentY).toBe(0.6);
  });

  it("updateDraw does not mutate when drawing is null", () => {
    // drawing is null from beforeEach reset
    useCanvasStore.getState().updateDraw(0.9, 0.9);
    expect(useCanvasStore.getState().drawing).toBeNull();
  });

  it("cancelDraw clears drawing state", () => {
    useCanvasStore.getState().startDraw(0.1, 0.2);
    useCanvasStore.getState().cancelDraw();
    expect(useCanvasStore.getState().drawing).toBeNull();
  });
});

describe("canvasStore — commitDraw", () => {
  it("returns null when no drawing is active", () => {
    const result = useCanvasStore.getState().commitDraw();
    expect(result).toBeNull();
  });

  it("returns null and clears drawing for a tiny box (w < 0.005)", () => {
    useCanvasStore.getState().startDraw(0.5, 0.5);
    useCanvasStore.getState().updateDraw(0.5005, 0.5 + 0.01); // w=0.0005, h=0.01
    const result = useCanvasStore.getState().commitDraw();
    expect(result).toBeNull();
    expect(useCanvasStore.getState().drawing).toBeNull();
  });

  it("returns null and clears drawing for a tiny box (h < 0.005)", () => {
    useCanvasStore.getState().startDraw(0.5, 0.5);
    useCanvasStore.getState().updateDraw(0.5 + 0.01, 0.5002); // w=0.01, h=0.0002
    const result = useCanvasStore.getState().commitDraw();
    expect(result).toBeNull();
    expect(useCanvasStore.getState().drawing).toBeNull();
  });

  it("returns a BoxAnnotation for a valid box", () => {
    useCanvasStore.getState().startDraw(0.1, 0.2);
    useCanvasStore.getState().updateDraw(0.4, 0.5);
    const box = useCanvasStore.getState().commitDraw();
    expect(box).not.toBeNull();
    expect(box!.id).toBeTruthy();
    expect(typeof box!.id).toBe("string");
  });

  it("returned box has correct center coords", () => {
    useCanvasStore.getState().startDraw(0.1, 0.2);
    useCanvasStore.getState().updateDraw(0.3, 0.6);
    const box = useCanvasStore.getState().commitDraw();
    // x = (0.1+0.3)/2 = 0.2, y = (0.2+0.6)/2 = 0.4
    expect(box!.x).toBeCloseTo(0.2);
    expect(box!.y).toBeCloseTo(0.4);
    expect(box!.w).toBeCloseTo(0.2);
    expect(box!.h).toBeCloseTo(0.4);
  });

  it("returned box uses activeClassId from store", () => {
    useCanvasStore.setState({ activeClassId: 7 });
    useCanvasStore.getState().startDraw(0.1, 0.1);
    useCanvasStore.getState().updateDraw(0.5, 0.5);
    const box = useCanvasStore.getState().commitDraw();
    expect(box!.classId).toBe(7);
  });

  it("clears drawing state after successful commit", () => {
    useCanvasStore.getState().startDraw(0.1, 0.1);
    useCanvasStore.getState().updateDraw(0.5, 0.5);
    useCanvasStore.getState().commitDraw();
    expect(useCanvasStore.getState().drawing).toBeNull();
  });

  it("sets selectedBoxId to the new box id after commit", () => {
    useCanvasStore.getState().startDraw(0.1, 0.1);
    useCanvasStore.getState().updateDraw(0.5, 0.5);
    const box = useCanvasStore.getState().commitDraw();
    expect(useCanvasStore.getState().selectedBoxId).toBe(box!.id);
  });

  it("returned box has review:'tp', locked:false, hidden:false", () => {
    useCanvasStore.getState().startDraw(0.0, 0.0);
    useCanvasStore.getState().updateDraw(0.5, 0.5);
    const box = useCanvasStore.getState().commitDraw();
    expect(box!.review).toBe("tp");
    expect(box!.locked).toBe(false);
    expect(box!.hidden).toBe(false);
  });
});

describe("canvasStore — resetView", () => {
  it("resets zoom, panX, panY to defaults", () => {
    useCanvasStore.getState().setZoom(5);
    useCanvasStore.getState().setPan(100, 200);
    useCanvasStore.getState().resetView();
    const { zoom, panX, panY } = useCanvasStore.getState();
    expect(zoom).toBe(1);
    expect(panX).toBe(0);
    expect(panY).toBe(0);
  });
});
