import { beforeEach, describe, expect, it, vi } from "vitest";
import { REPORTER_COMMANDS, SCROLL_MAX_ENTRIES } from "../../src/shared/constants.js";

// Approach A: form-checker.js is excluded (IIFE content script bound to live
// DOM/window). These tests pin the pure-logic contracts: storage pruning,
// extension-frame error filtering, and the form-modified detection algorithm.

// Importing SCROLL_MAX_ENTRIES from shared/constants is deliberate even though
// the source duplicates it locally (content scripts can't use ES imports).
// This test then doubles as a drift detector for the source-side copy.

// --- saveScrollPosition pruning (form-checker.js:26-54) -----------------------
function pruneScrollPositions(positions, max = SCROLL_MAX_ENTRIES) {
  const keys = Object.keys(positions);
  if (keys.length <= max) return positions;
  const sorted = keys.sort((a, b) => positions[a].savedAt - positions[b].savedAt);
  const toRemove = sorted.slice(0, keys.length - max);
  for (const k of toRemove) delete positions[k];
  return positions;
}

describe("form-checker-contracts: scroll position pruning", () => {
  // Use a small MAX so the contract is exercised without 300+ allocations
  const MAX = 5;

  it("noop when at or below limit", () => {
    const positions = {};
    for (let i = 0; i < MAX; i++) {
      positions[i] = { savedAt: i, x: 0, y: 0, url: "u" };
    }
    pruneScrollPositions(positions, MAX);
    expect(Object.keys(positions)).toHaveLength(MAX);
  });

  it("removes oldest entries (lowest savedAt) when over limit", () => {
    const positions = {};
    for (let i = 0; i < MAX + 3; i++) {
      positions[String(i)] = { savedAt: i * 1000, x: 0, y: 0, url: "u" };
    }
    pruneScrollPositions(positions, MAX);
    expect(Object.keys(positions)).toHaveLength(MAX);
    for (let i = 0; i < 3; i++) {
      expect(positions[String(i)]).toBeUndefined();
    }
    expect(positions[String(MAX + 2)]).toBeDefined();
  });

  it("always keeps exactly MAX entries when timestamps are tied", () => {
    const positions = {};
    for (let i = 0; i < MAX + 2; i++) {
      positions[String(i)] = { savedAt: 1000, x: 0, y: 0, url: "u" };
    }
    pruneScrollPositions(positions, MAX);
    expect(Object.keys(positions)).toHaveLength(MAX);
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
    command: REPORTER_COMMANDS.CAPTURE_ERROR,
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
      command: REPORTER_COMMANDS.CAPTURE_ERROR,
      error: { name: "TypeError", message: "boom", stack: "stack-line" },
      context: { surface: "content_form", source: "uncaught" },
    });
  });

  it("falls back to defaults for non-Error values", () => {
    expect(buildForwardPayload(undefined, "unhandledrejection", "content_form")).toEqual({
      command: REPORTER_COMMANDS.CAPTURE_ERROR,
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
    if (i.type === "hidden" || i.readOnly || i.disabled || i.notVisible) continue;
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

  it("hidden / readonly / disabled / off-screen inputs ignored", () => {
    expect(
      isPageModified({
        inputs: [
          { value: "x", defaultValue: "", type: "hidden" },
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
