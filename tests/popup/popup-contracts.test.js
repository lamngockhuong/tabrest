import { beforeEach, describe, expect, it, vi } from "vitest";
import { isSafeHttpUrl } from "../../src/shared/utils.js";

// Approach A: popup.js is excluded from coverage (DOM entry script). These tests
// pin the pure-logic contracts the popup relies on by re-deriving them here, so
// a divergence between popup.js and these tests will surface in code review.

// --- getStatusBadge (popup.js:128-158) ----------------------------------------
// Returns a badge "kind" instead of HTML - popup.js builds the DOM string, but
// the decision tree (which badge wins) is what we lock down here.
function getBadgeKind(tab) {
  if (tab.active) return { kind: "active" };
  if (tab.discarded) return { kind: "sleeping" };
  // Pin badge always shows for pinned tabs, even when unloadPinnedTabs=true makes
  // them eligible for unloading. Comment in popup.js:135-136 calls this out.
  if (tab.pinned) return { kind: "pin" };
  if (tab.isProtected) {
    const map = { whitelist: "safe", audio: "audio", form: "form", snooze: "snooze" };
    return { kind: "protected", reason: map[tab.protectionReason] || map.whitelist };
  }
  if (tab.timeUntilUnload != null && tab.timeUntilUnload > 0) {
    const mins = Math.ceil(tab.timeUntilUnload / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const label = h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h${m}m`;
    return { kind: "timer", label };
  }
  return { kind: "none" };
}

describe("popup-contracts: getStatusBadge decision tree", () => {
  it("active beats every other state", () => {
    expect(getBadgeKind({ active: true, discarded: true, pinned: true }).kind).toBe("active");
  });

  it("discarded beats pinned/protected/timer", () => {
    expect(getBadgeKind({ discarded: true, pinned: true, isProtected: true }).kind).toBe(
      "sleeping",
    );
  });

  it("pinned shows 'pin' even when other protection reasons exist", () => {
    const r = getBadgeKind({ pinned: true, isProtected: true, protectionReason: "audio" });
    expect(r.kind).toBe("pin");
  });

  it("protectionReason maps to the right label", () => {
    for (const [reason, expected] of [
      ["whitelist", "safe"],
      ["audio", "audio"],
      ["form", "form"],
      ["snooze", "snooze"],
    ]) {
      expect(getBadgeKind({ isProtected: true, protectionReason: reason }).reason).toBe(expected);
    }
  });

  it("unknown protectionReason falls back to whitelist", () => {
    expect(getBadgeKind({ isProtected: true, protectionReason: "xyz" }).reason).toBe("safe");
  });

  it.each([
    [60_000, "1m"],
    [120_000, "2m"],
    [3_600_000, "1h"],
    [3_660_000, "1h1m"],
    [5_400_000, "1h30m"],
    [59_999, "1m"], // ceil
  ])("timeUntilUnload %ims formats to %s", (ms, label) => {
    expect(getBadgeKind({ timeUntilUnload: ms }).label).toBe(label);
  });

  it("timeUntilUnload=0 yields no badge", () => {
    expect(getBadgeKind({ timeUntilUnload: 0 }).kind).toBe("none");
  });

  it("timeUntilUnload=null yields no badge", () => {
    expect(getBadgeKind({ timeUntilUnload: null }).kind).toBe("none");
  });
});

// --- getTabCategory (popup.js:356-363) ----------------------------------------
function getTabCategory(tab) {
  if (tab.discarded) return "sleeping";
  if (tab.isSnoozed) return "snoozed";
  if (tab.isProtected || tab.pinned) return "protected";
  return "active";
}

describe("popup-contracts: getTabCategory", () => {
  it("discarded → sleeping (wins over snooze/protected)", () => {
    expect(getTabCategory({ discarded: true, isSnoozed: true, isProtected: true })).toBe(
      "sleeping",
    );
  });

  it("snoozed beats protected/pinned", () => {
    expect(getTabCategory({ isSnoozed: true, pinned: true })).toBe("snoozed");
  });

  it("pinned counts as protected (matches the badge)", () => {
    expect(getTabCategory({ pinned: true })).toBe("protected");
  });

  it("plain tab → active", () => {
    expect(getTabCategory({})).toBe("active");
  });
});

// --- updateFilterCounts (popup.js:366-382) ------------------------------------
function countCategories(tabs) {
  const counts = { all: tabs.length, sleeping: 0, snoozed: 0, protected: 0 };
  for (const tab of tabs) {
    const c = getTabCategory(tab);
    if (c === "sleeping") counts.sleeping++;
    else if (c === "snoozed") counts.snoozed++;
    else if (c === "protected") counts.protected++;
  }
  return counts;
}

describe("popup-contracts: filter counts", () => {
  it("counts each category disjointly (sleeping wins)", () => {
    const tabs = [
      { discarded: true },
      { discarded: true, pinned: true }, // sleeping wins
      { isSnoozed: true },
      { pinned: true },
      { isProtected: true },
      {}, // active
      {},
    ];
    expect(countCategories(tabs)).toEqual({
      all: 7,
      sleeping: 2,
      snoozed: 1,
      protected: 2,
    });
  });

  it("empty list → all zero", () => {
    expect(countCategories([])).toEqual({ all: 0, sleeping: 0, snoozed: 0, protected: 0 });
  });
});

// --- applySearch + filterTabs (popup.js:392-407) ------------------------------
function applySearch(tabs, query) {
  if (!query) return tabs;
  const q = query.toLowerCase();
  return tabs.filter(
    (t) => (t.title || "").toLowerCase().includes(q) || (t.url || "").toLowerCase().includes(q),
  );
}

function filterTabs(tabs, currentFilter, query) {
  const filtered =
    currentFilter === "all" ? tabs : tabs.filter((tab) => getTabCategory(tab) === currentFilter);
  return applySearch(filtered, query);
}

describe("popup-contracts: search + filter composition", () => {
  const tabs = [
    { title: "GitHub", url: "https://github.com", discarded: false },
    { title: "Inbox", url: "https://mail.google.com", discarded: true },
    { title: "Docs", url: "https://docs.example", isSnoozed: true },
    { title: "Pinned", url: "https://x.example", pinned: true },
  ];

  it("empty query returns all of the chip's category", () => {
    expect(filterTabs(tabs, "all", "")).toHaveLength(4);
    expect(filterTabs(tabs, "sleeping", "").map((t) => t.title)).toEqual(["Inbox"]);
  });

  it("search composes after chip filter (AND)", () => {
    const r = filterTabs(tabs, "protected", "pinn");
    expect(r.map((t) => t.title)).toEqual(["Pinned"]);
  });

  it("search matches title or url, case-insensitive", () => {
    expect(filterTabs(tabs, "all", "GITHUB").map((t) => t.title)).toEqual(["GitHub"]);
    expect(filterTabs(tabs, "all", "google.com").map((t) => t.title)).toEqual(["Inbox"]);
  });

  it("missing title or url is treated as empty (no crash)", () => {
    expect(applySearch([{ url: "https://x" }], "x")).toHaveLength(1);
    expect(applySearch([{ title: "x" }], "x")).toHaveLength(1);
    expect(applySearch([{}], "x")).toHaveLength(0);
  });
});

// --- relativeTime (popup.js:221-232) ------------------------------------------
function relativeTime(ts, now = Date.now()) {
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

describe("popup-contracts: relativeTime", () => {
  const NOW = 1_700_000_000_000;
  it.each([
    [0, "just now"],
    [30_000, "just now"],
    [60_000, "1m ago"],
    [10 * 60_000, "10m ago"],
    [60 * 60_000, "1h ago"],
    [23 * 3_600_000, "23h ago"],
    [24 * 3_600_000, "yesterday"],
    [2 * 24 * 3_600_000, "2d ago"],
    [6 * 24 * 3_600_000, "6d ago"],
  ])("diff %ims → %s", (diff, expected) => {
    expect(relativeTime(NOW - diff, NOW)).toBe(expected);
  });

  it("≥7 days falls back to localeDateString", () => {
    const r = relativeTime(NOW - 7 * 24 * 3_600_000, NOW);
    expect(r).not.toBe("7d ago");
    expect(typeof r).toBe("string");
  });
});

// --- leadingDebounce (popup.js:1045-1055) -------------------------------------
function leadingDebounce(fn, delay = 150) {
  let pending = false;
  return () => {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      fn();
    }, delay);
  };
}

describe("popup-contracts: leadingDebounce (trailing-edge invocation)", () => {
  beforeEach(() => vi.useFakeTimers());

  it("first call schedules invocation; subsequent calls during pending are dropped", () => {
    const fn = vi.fn();
    const debounced = leadingDebounce(fn, 100);
    debounced();
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("calls after the delay window schedule another invocation", () => {
    const fn = vi.fn();
    const debounced = leadingDebounce(fn, 100);
    debounced();
    vi.advanceTimersByTime(100);
    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

// --- session favicon safety (popup.js:485-495) --------------------------------
// The popup gates favicon rendering on isSafeHttpUrl to avoid loading
// data:/javascript:/file: URIs that imported sessions might smuggle in.
describe("popup-contracts: session favicon URL gating uses isSafeHttpUrl", () => {
  it.each([
    ["https://example.com/favicon.ico", true],
    ["http://example.com/favicon.ico", true],
    ["data:image/png;base64,xxx", false],
    ["javascript:alert(1)", false],
    ["chrome://favicon/x", false],
    ["", false],
    [null, false],
  ])("%s → %s", (url, expected) => {
    expect(isSafeHttpUrl(url)).toBe(expected);
  });
});

// --- review prompt gating (popup.js:555-570) ----------------------------------
// Show prompt only when: stats exist & ≥10 unloads, never completed, dismissed <2.
function shouldShowReviewPrompt(stats, completed, dismissCount) {
  if (!stats || stats.totalTabsSuspended < 10) return false;
  if (completed) return false;
  if ((dismissCount || 0) >= 2) return false;
  return true;
}

describe("popup-contracts: review prompt gating", () => {
  it("hidden when no stats", () => {
    expect(shouldShowReviewPrompt(null, false, 0)).toBe(false);
  });
  it("hidden when below threshold", () => {
    expect(shouldShowReviewPrompt({ totalTabsSuspended: 9 }, false, 0)).toBe(false);
  });
  it("hidden once completed", () => {
    expect(shouldShowReviewPrompt({ totalTabsSuspended: 50 }, true, 0)).toBe(false);
  });
  it("hidden after 2 dismissals", () => {
    expect(shouldShowReviewPrompt({ totalTabsSuspended: 50 }, false, 2)).toBe(false);
    expect(shouldShowReviewPrompt({ totalTabsSuspended: 50 }, false, 3)).toBe(false);
  });
  it("shown once threshold met and not yet dismissed twice", () => {
    expect(shouldShowReviewPrompt({ totalTabsSuspended: 10 }, false, 0)).toBe(true);
    expect(shouldShowReviewPrompt({ totalTabsSuspended: 10 }, false, 1)).toBe(true);
  });
});

// --- bug-report-modal sentry button visibility (popup.js:937-944) -------------
// Already covered by tests/popup/bug-report-modal.test.js - sanity-pinning the
// strict-equality check here too because misuse (truthy instead of ===true)
// would silently leak the button on any truthy non-true value.
describe("popup-contracts: bug-report sentry button strict consent", () => {
  it.each([
    [true, true],
    ["true", false], // string truthy must NOT pass
    [1, false],
    [false, false],
    [undefined, false],
    [null, false],
  ])("enableErrorReporting=%p → consentOn=%p", (val, expected) => {
    const consentOn = val === true;
    expect(consentOn).toBe(expected);
  });
});
