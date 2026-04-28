import { describe, it, expect, vi, afterEach } from "vitest";
import { icon, injectIcons } from "../../src/shared/icons.js";

describe("icon", () => {
  it("returns SVG with default size 16", () => {
    const svg = icon("moon");
    expect(svg).toMatch(/^<svg [^>]*width="16"/);
    expect(svg).toMatch(/height="16"/);
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain("</svg>");
    expect(svg).toContain("<path");
  });

  it("respects custom size", () => {
    const svg = icon("sun", 32);
    expect(svg).toMatch(/width="32"/);
    expect(svg).toMatch(/height="32"/);
  });

  it("applies stroke styling for crisp icons", () => {
    const svg = icon("moon");
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).toContain('stroke-width="2"');
    expect(svg).toContain('fill="none"');
  });

  it("returns empty string for unknown icon and warns", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(icon("does-not-exist")).toBe("");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("does-not-exist"));
    warnSpy.mockRestore();
  });

  it("contains every documented icon name", () => {
    const names = [
      "moon",
      "sun",
      "settings",
      "shield",
      "shieldCheck",
      "eye",
      "clock",
      "pause",
      "play",
      "refresh",
      "clipboard",
      "chevronDown",
      "chevronRight",
      "pin",
      "volume",
      "star",
      "x",
      "check",
      "plus",
      "trash",
      "folderOpen",
      "barChart",
      "zap",
      "memory",
      "bug",
      "github",
      "messageCircle",
      "layers",
      "globe",
      "fileText",
      "copy",
      "search",
      "keyboard",
      "sliders",
      "heart",
    ];
    for (const name of names) {
      expect(icon(name)).toContain("<svg");
    }
  });
});

describe("injectIcons", () => {
  const originalDocument = globalThis.document;

  afterEach(() => {
    if (originalDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = originalDocument;
    }
  });

  it("replaces innerHTML on every [data-icon] element using the dataset name + size", () => {
    const elements = [
      { dataset: { icon: "moon" }, innerHTML: "" },
      { dataset: { icon: "sun", iconSize: "20" }, innerHTML: "" },
    ];
    globalThis.document = {
      querySelectorAll: vi.fn(() => elements),
    };

    injectIcons();

    expect(document.querySelectorAll).toHaveBeenCalledWith("[data-icon]");
    expect(elements[0].innerHTML).toContain('width="14"'); // default fallback
    expect(elements[1].innerHTML).toContain('width="20"');
  });

  it("clears innerHTML when icon name is unknown", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = { dataset: { icon: "missing" }, innerHTML: "<old/>" };
    globalThis.document = { querySelectorAll: vi.fn(() => [el]) };

    injectIcons();

    expect(el.innerHTML).toBe("");
    warnSpy.mockRestore();
  });
});
