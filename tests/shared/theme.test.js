import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  applyTheme,
  getTheme,
  initTheme,
  onThemeChange,
  setTheme,
  THEME_KEY,
  THEMES,
  toggleTheme,
  updateThemeIcon,
} from "../../src/shared/theme.js";

const setupDocument = (initialAttr = null) => {
  const attrs = initialAttr ? { "data-theme": initialAttr } : {};
  globalThis.document = {
    documentElement: {
      setAttribute: vi.fn((k, v) => {
        attrs[k] = v;
      }),
      getAttribute: vi.fn((k) => attrs[k] ?? null),
    },
  };
  return attrs;
};

describe("theme", () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;

  afterEach(() => {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  });

  describe("constants", () => {
    it("exports stable storage key + theme names", () => {
      expect(THEME_KEY).toBe("tabrest_theme");
      expect(THEMES).toEqual({ LIGHT: "light", DARK: "dark" });
    });
  });

  describe("getTheme", () => {
    it("returns stored value when present", async () => {
      chrome.storage.local.get.mockResolvedValue({ [THEME_KEY]: "dark" });
      expect(await getTheme()).toBe("dark");
    });

    it("falls back to system preference - dark", async () => {
      chrome.storage.local.get.mockResolvedValue({});
      globalThis.window = { matchMedia: vi.fn(() => ({ matches: true })) };
      expect(await getTheme()).toBe(THEMES.DARK);
      expect(window.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });

    it("falls back to system preference - light", async () => {
      chrome.storage.local.get.mockResolvedValue({});
      globalThis.window = { matchMedia: vi.fn(() => ({ matches: false })) };
      expect(await getTheme()).toBe(THEMES.LIGHT);
    });
  });

  describe("setTheme", () => {
    it("persists to local storage", async () => {
      chrome.storage.local.set.mockResolvedValue();
      await setTheme("dark");
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ [THEME_KEY]: "dark" });
    });
  });

  describe("applyTheme", () => {
    it("sets data-theme attribute on documentElement", () => {
      setupDocument();
      applyTheme("dark");
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith("data-theme", "dark");
    });
  });

  describe("initTheme", () => {
    it("reads theme then applies it", async () => {
      chrome.storage.local.get.mockResolvedValue({ [THEME_KEY]: "dark" });
      setupDocument();

      const result = await initTheme();

      expect(result).toBe("dark");
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith("data-theme", "dark");
    });
  });

  describe("toggleTheme", () => {
    it("flips dark -> light and persists", async () => {
      setupDocument("dark");
      chrome.storage.local.set.mockResolvedValue();

      const next = await toggleTheme();

      expect(next).toBe("light");
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith("data-theme", "light");
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ [THEME_KEY]: "light" });
    });

    it("flips light -> dark", async () => {
      setupDocument("light");
      chrome.storage.local.set.mockResolvedValue();

      expect(await toggleTheme()).toBe("dark");
    });

    it("treats missing attribute as light (defaults to dark on toggle)", async () => {
      setupDocument(null);
      chrome.storage.local.set.mockResolvedValue();

      expect(await toggleTheme()).toBe("dark");
    });
  });

  describe("onThemeChange", () => {
    it("ignores changes from other storage areas", () => {
      setupDocument("light");
      const cb = vi.fn();
      onThemeChange(cb);
      const listener = chrome.storage.onChanged.addListener.mock.calls[0][0];

      listener({ [THEME_KEY]: { newValue: "dark", oldValue: "light" } }, "sync");

      expect(cb).not.toHaveBeenCalled();
      expect(document.documentElement.setAttribute).not.toHaveBeenCalled();
    });

    it("ignores changes that don't touch THEME_KEY", () => {
      setupDocument("light");
      const cb = vi.fn();
      onThemeChange(cb);
      const listener = chrome.storage.onChanged.addListener.mock.calls[0][0];

      listener({ otherKey: { newValue: "x", oldValue: "y" } }, "local");
      expect(cb).not.toHaveBeenCalled();
    });

    it("is a no-op when newValue === oldValue", () => {
      setupDocument("dark");
      const cb = vi.fn();
      onThemeChange(cb);
      const listener = chrome.storage.onChanged.addListener.mock.calls[0][0];

      listener({ [THEME_KEY]: { newValue: "dark", oldValue: "dark" } }, "local");
      expect(cb).not.toHaveBeenCalled();
    });

    it("does not re-apply if DOM is already in sync but still fires callback", () => {
      setupDocument("dark");
      const cb = vi.fn();
      onThemeChange(cb);
      const listener = chrome.storage.onChanged.addListener.mock.calls[0][0];

      listener({ [THEME_KEY]: { newValue: "dark", oldValue: "light" } }, "local");

      expect(document.documentElement.setAttribute).not.toHaveBeenCalled();
      expect(cb).toHaveBeenCalledWith("dark");
    });

    it("applies and notifies on cross-page change", () => {
      setupDocument("light");
      const cb = vi.fn();
      onThemeChange(cb);
      const listener = chrome.storage.onChanged.addListener.mock.calls[0][0];

      listener({ [THEME_KEY]: { newValue: "dark", oldValue: "light" } }, "local");

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith("data-theme", "dark");
      expect(cb).toHaveBeenCalledWith("dark");
    });

    it("uses no-op callback when called without arguments", () => {
      setupDocument("light");
      onThemeChange();
      const listener = chrome.storage.onChanged.addListener.mock.calls[0][0];

      expect(() =>
        listener({ [THEME_KEY]: { newValue: "dark", oldValue: "light" } }, "local"),
      ).not.toThrow();
    });
  });

  describe("updateThemeIcon", () => {
    it("uses 'sun' icon and 'switch to light' title in dark mode", () => {
      const iconEl = { innerHTML: "" };
      const toggleEl = { title: "" };
      updateThemeIcon(iconEl, toggleEl, THEMES.DARK);

      expect(iconEl.innerHTML).toContain("<svg");
      expect(toggleEl.title).toBe("Switch to light mode");
    });

    it("uses 'moon' icon and 'switch to dark' title in light mode", () => {
      const iconEl = { innerHTML: "" };
      const toggleEl = { title: "" };
      updateThemeIcon(iconEl, toggleEl, THEMES.LIGHT);

      expect(iconEl.innerHTML).toContain("<svg");
      expect(toggleEl.title).toBe("Switch to dark mode");
    });
  });
});
