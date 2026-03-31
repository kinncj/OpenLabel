import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useThemeStore } from "@/ui/stores/themeStore";

beforeEach(() => {
  localStorage.clear();
  // Reset store to dark baseline
  useThemeStore.setState({ theme: "dark" });
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("themeStore — initial state", () => {
  it("default theme is 'dark'", () => {
    expect(useThemeStore.getState().theme).toBe("dark");
  });
});

describe("themeStore — toggleTheme", () => {
  it("changes dark → light on first toggle", () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("changes light → dark on second toggle", () => {
    useThemeStore.getState().toggleTheme(); // dark → light
    useThemeStore.getState().toggleTheme(); // light → dark
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("three toggles end up at light", () => {
    useThemeStore.getState().toggleTheme(); // light
    useThemeStore.getState().toggleTheme(); // dark
    useThemeStore.getState().toggleTheme(); // light
    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("toggleTheme calls document.documentElement.setAttribute with 'data-theme'", () => {
    const spy = vi.spyOn(document.documentElement, "setAttribute");
    useThemeStore.getState().toggleTheme();
    expect(spy).toHaveBeenCalledWith("data-theme", "light");
  });

  it("toggleTheme sets data-theme to 'light' after first toggle from dark", () => {
    const spy = vi.spyOn(document.documentElement, "setAttribute");
    useThemeStore.getState().toggleTheme();
    const calls = spy.mock.calls.filter(([attr]) => attr === "data-theme");
    expect(calls[calls.length - 1]).toEqual(["data-theme", "light"]);
  });

  it("toggleTheme sets data-theme to 'dark' after second toggle", () => {
    const spy = vi.spyOn(document.documentElement, "setAttribute");
    useThemeStore.getState().toggleTheme(); // → light
    useThemeStore.getState().toggleTheme(); // → dark
    expect(spy).toHaveBeenLastCalledWith("data-theme", "dark");
  });

  it("setAttribute called exactly once per single toggle", () => {
    const spy = vi.spyOn(document.documentElement, "setAttribute");
    useThemeStore.getState().toggleTheme();
    const calls = spy.mock.calls.filter(([attr]) => attr === "data-theme");
    expect(calls).toHaveLength(1);
  });

  it("setAttribute called twice for two toggles", () => {
    const spy = vi.spyOn(document.documentElement, "setAttribute");
    useThemeStore.getState().toggleTheme();
    useThemeStore.getState().toggleTheme();
    const calls = spy.mock.calls.filter(([attr]) => attr === "data-theme");
    expect(calls).toHaveLength(2);
  });
});

describe("themeStore — theme values", () => {
  it("theme is always 'dark' or 'light' regardless of toggle count", () => {
    const validThemes = new Set<string>(["dark", "light"]);
    for (let i = 0; i < 5; i++) {
      useThemeStore.getState().toggleTheme();
      expect(validThemes.has(useThemeStore.getState().theme)).toBe(true);
    }
  });

  it("setState to 'light' then toggleTheme returns 'dark'", () => {
    useThemeStore.setState({ theme: "light" });
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("starting from dark, 2 toggles restore back to dark", () => {
    useThemeStore.getState().toggleTheme();
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("dark");
  });
});
