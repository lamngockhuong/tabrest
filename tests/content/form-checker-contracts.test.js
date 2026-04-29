import { beforeEach, describe, expect, it, vi } from "vitest";

// Approach A: form-checker.js is excluded (IIFE content script bound to live
// DOM/window). These tests pin the pure-logic contracts: storage pruning,
// extension-frame error filtering, and the form-modified detection algorithm.

// --- saveScrollPosition pruning (form-checker.js:26-54) -----------------------
const SCROLL_MAX_ENTRIES = 100;

function pruneScrollPositions(positions) {
  const keys = Object.keys(positions);
  if (keys.length <= SCROLL_MAX_ENTRIES) return positions;
  const sorted = keys.sort((a, b) => positions[a].savedAt - positions[b].savedAt);
  const toRemove = sorted.slice(0, keys.length - SCROLL_MAX_ENTRIES);
  for (const k of toRemove) delete positions[k];
  return positions;
}

describe("form-checker-contracts: scroll position pruning", () => {
  it("noop when at or below limit", () => {
    const positions = {};
    for (let i = 0; i < SCROLL_MAX_ENTRIES; i++) {
      positions[i] = { savedAt: i, x: 0, y: 0, url: "u" };
    }
    pruneScrollPositions(positions);
    expect(Object.keys(positions)).toHaveLength(SCROLL_MAX_ENTRIES);
  });

  it("removes oldest entries (lowest savedAt) when over limit", () => {
    const positions = {};
    for (let i = 0; i < SCROLL_MAX_ENTRIES + 5; i++) {
      positions[String(i)] = { savedAt: i * 1000, x: 0, y: 0, url: "u" };
    }
    pruneScrollPositions(positions);
    expect(Object.keys(positions)).toHaveLength(SCROLL_MAX_ENTRIES);
    // 5 oldest gone
    for (let i = 0; i < 5; i++) {
      expect(positions[String(i)]).toBeUndefined();
    }
    // newest survive
    expect(positions[String(SCROLL_MAX_ENTRIES + 4)]).toBeDefined();
  });

  it("breaks ties by sort stability - but always keeps exactly MAX entries", () => {
    const positions = {};
    for (let i = 0; i < SCROLL_MAX_ENTRIES + 3; i++) {
      // All same timestamp
      positions[String(i)] = { savedAt: 1000, x: 0, y: 0, url: "u" };
    }
    pruneScrollPositions(positions);
    expect(Object.keys(positions)).toHaveLength(SCROLL_MAX_ENTRIES);
  });
});

// --- restoreScrollPosition URL match guard (form-checker.js:72) ---------------
// Saved entry only restored if its URL matches the current page URL - prevents
// wrong-page jumps if the tab was reused for navigation.
function shouldRestore(saved, currentUrl) {
  if (!saved) return false;
  return saved.url === currentUrl;
}

describe("form-checker-contracts: scroll restore URL match", () => {
  it("matches exact URL", () => {
    expect(shouldRestore({ url: "https://x.com/page" }, "https://x.com/page")).toBe(true);
  });

  it("rejects path-only divergence", () => {
    expect(shouldRestore({ url: "https://x.com/page" }, "https://x.com/other")).toBe(false);
  });

  it("rejects query/hash divergence (intentional - different scroll context)", () => {
    expect(shouldRestore({ url: "https://x.com/page" }, "https://x.com/page?q=1")).toBe(false);
  });

  it("rejects when no saved entry", () => {
    expect(shouldRestore(null, "https://x.com/page")).toBe(false);
    expect(shouldRestore(undefined, "https://x.com/page")).toBe(false);
  });
});

// --- isExtensionFrame (form-checker.js:216-218) -------------------------------
function makeIsExtensionFrame(runtimeId) {
  return (stack) =>
    typeof stack === "string" &&
    (stack.includes("chrome-extension://") || stack.includes(runtimeId));
}

describe("form-checker-contracts: extension-frame error filter", () => {
  const isExtFrame = makeIsExtensionFrame("abcd1234");

  it("matches chrome-extension:// scheme", () => {
    expect(isExtFrame("at f (chrome-extension://abc/foo.js:1:1)")).toBe(true);
  });

  it("matches by runtime id (covers minified/bundled stacks without scheme)", () => {
    expect(isExtFrame("at f (https://x.com/bundle.js with abcd1234)")).toBe(true);
  });

  it("rejects page-origin errors (must not forward third-party errors to Sentry)", () => {
    expect(isExtFrame("at f (https://example.com/app.js:1:1)")).toBe(false);
  });

  it("rejects non-string stacks (defensive)", () => {
    expect(isExtFrame(undefined)).toBe(false);
    expect(isExtFrame(null)).toBe(false);
    expect(isExtFrame({})).toBe(false);
    expect(isExtFrame(123)).toBe(false);
  });

  it("rejects empty stack", () => {
    expect(isExtFrame("")).toBe(false);
  });
});

// --- forwardError shape (form-checker.js:220-234) -----------------------------
// Pin the message shape sent to the SW: command + error + context.
function buildForwardPayload(err, source, surface) {
  return {
    command: "captureError",
    error: {
      name: err?.name || "Error",
      message: err?.message || String(err),
      stack: err?.stack || "",
    },
    context: { surface, source },
  };
}

describe("form-checker-contracts: forwardError payload shape", () => {
  it("preserves Error fields", () => {
    const e = new TypeError("boom");
    e.stack = "stack-line";
    expect(buildForwardPayload(e, "uncaught", "content_form")).toEqual({
      command: "captureError",
      error: { name: "TypeError", message: "boom", stack: "stack-line" },
      context: { surface: "content_form", source: "uncaught" },
    });
  });

  it("falls back to defaults for non-Error values", () => {
    expect(buildForwardPayload(undefined, "unhandledrejection", "content_form")).toEqual({
      command: "captureError",
      error: { name: "Error", message: "undefined", stack: "" },
      context: { surface: "content_form", source: "unhandledrejection" },
    });
  });

  it("source label distinguishes uncaught vs unhandledrejection", () => {
    const e = new Error("x");
    expect(buildForwardPayload(e, "uncaught", "content_form").context.source).toBe("uncaught");
    expect(buildForwardPayload(e, "unhandledrejection", "content_form").context.source).toBe(
      "unhandledrejection",
    );
  });
});

// --- checkForUnsavedData decision tree (form-checker.js:98-152) ---------------
// Pure-data version: classifies the page state; the real impl reads the DOM.
function isPageModified({
  globalFlag,
  inputs = [],
  checkables = [],
  selects = [],
  editables = [],
}) {
  if (globalFlag) return true;

  for (const i of inputs) {
    if (i.hidden || i.readOnly || i.disabled || i.notVisible) continue;
    const cur = (i.value || "").trim();
    const def = (i.defaultValue || "").trim();
    if (cur !== def && cur.length > 0) return true;
  }

  for (const c of checkables) {
    if (c.checked !== c.defaultChecked) return true;
  }

  for (const s of selects) {
    for (const o of s.options || []) {
      if (o.selected !== o.defaultSelected) return true;
    }
  }

  for (const el of editables) {
    if (el.notVisible) continue;
    if ((el.text || "").trim().length > 0) return true;
  }

  return false;
}

describe("form-checker-contracts: form-modified detection", () => {
  it("global modified flag short-circuits to true", () => {
    expect(isPageModified({ globalFlag: true, inputs: [{ value: "", defaultValue: "" }] })).toBe(
      true,
    );
  });

  it("text input modified from default counts", () => {
    expect(
      isPageModified({
        inputs: [{ value: "hello", defaultValue: "" }],
      }),
    ).toBe(true);
  });

  it("text input matching default is NOT modified (avoids false positives on prefilled forms)", () => {
    expect(
      isPageModified({
        inputs: [{ value: "prefill", defaultValue: "prefill" }],
      }),
    ).toBe(false);
  });

  it("hidden / readonly / disabled inputs ignored", () => {
    expect(
      isPageModified({
        inputs: [
          { value: "x", defaultValue: "", hidden: true },
          { value: "y", defaultValue: "", readOnly: true },
          { value: "z", defaultValue: "", disabled: true },
          { value: "w", defaultValue: "", notVisible: true },
        ],
      }),
    ).toBe(false);
  });

  it("trim avoids whitespace-only false positives", () => {
    expect(
      isPageModified({
        inputs: [{ value: "   ", defaultValue: "" }],
      }),
    ).toBe(false);
  });

  it("checkbox/radio toggled from default counts", () => {
    expect(
      isPageModified({
        checkables: [{ checked: true, defaultChecked: false }],
      }),
    ).toBe(true);
  });

  it("select with re-selected option counts", () => {
    expect(
      isPageModified({
        selects: [
          {
            options: [
              { selected: false, defaultSelected: true },
              { selected: true, defaultSelected: false },
            ],
          },
        ],
      }),
    ).toBe(true);
  });

  it("non-empty contenteditable counts as modified (rich-editor case)", () => {
    expect(
      isPageModified({
        editables: [{ text: "GitHub issue body" }],
      }),
    ).toBe(true);
  });

  it("empty contenteditable does NOT count (placeholder-only)", () => {
    expect(
      isPageModified({
        editables: [{ text: "" }, { text: "   " }],
      }),
    ).toBe(false);
  });

  it("clean form returns false", () => {
    expect(
      isPageModified({
        inputs: [{ value: "", defaultValue: "" }],
        checkables: [{ checked: false, defaultChecked: false }],
        selects: [{ options: [{ selected: true, defaultSelected: true }] }],
        editables: [{ text: "" }],
      }),
    ).toBe(false);
  });
});

// --- IIFE load-once guard (form-checker.js:4) ---------------------------------
// Guards against duplicate listener registration on re-injection - the script
// sets a flag on window and bails out on second load.
describe("form-checker-contracts: load-once guard semantics", () => {
  it("first load runs body; second load is a noop", () => {
    const win = {};
    const ranBody = vi.fn();

    function load() {
      if (!win.__tabrestFormCheckLoaded) {
        win.__tabrestFormCheckLoaded = true;
        ranBody();
      }
    }

    load();
    load();
    load();
    expect(ranBody).toHaveBeenCalledOnce();
  });
});

// --- memory reporter context-validity guard (form-checker.js:172-195) ---------
// reportMemoryUsage clears its interval when chrome.runtime.id goes away
// (extension reloaded). Pin that contract.
describe("form-checker-contracts: memory reporter shutdown on context invalidation", () => {
  let intervalId;
  let clearInterval;
  let runtimeAvailable;

  beforeEach(() => {
    intervalId = 42;
    clearInterval = vi.fn();
    runtimeAvailable = true;
  });

  function tick() {
    if (!runtimeAvailable) {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      return "shutdown";
    }
    return "report";
  }

  it("reports when runtime alive", () => {
    expect(tick()).toBe("report");
    expect(clearInterval).not.toHaveBeenCalled();
  });

  it("clears interval and stops on invalidation (no leak)", () => {
    runtimeAvailable = false;
    expect(tick()).toBe("shutdown");
    expect(clearInterval).toHaveBeenCalledWith(42);
    expect(intervalId).toBeNull();
  });

  it("idempotent - second tick after shutdown does nothing", () => {
    runtimeAvailable = false;
    tick();
    clearInterval.mockClear();
    tick();
    expect(clearInterval).not.toHaveBeenCalled();
  });
});
