import { describe, it, expect, vi, beforeEach } from "vitest";
import { __test__ } from "../../src/shared/error-reporter.js";

const {
  fnv1a,
  computeFingerprint,
  computeMessageFingerprint,
  getTodayUtc,
  checkAndIncrementQuota,
  checkDedup,
  recordSend,
} = __test__;

const ERROR_QUOTA_KEY = "error_reporter_quota";
const ERROR_DEDUP_KEY = "error_reporter_dedup";
const ERROR_DAILY_CAP = 100;

// ---- fnv1a -------------------------------------------------------------------

describe("fnv1a", () => {
  it("returns a hex string", () => {
    expect(fnv1a("hello")).toMatch(/^[0-9a-f]+$/);
  });

  it("is deterministic — same input, same output", () => {
    expect(fnv1a("test input")).toBe(fnv1a("test input"));
  });

  it("produces different hashes for different inputs", () => {
    expect(fnv1a("abc")).not.toBe(fnv1a("xyz"));
  });

  it("handles empty string", () => {
    expect(typeof fnv1a("")).toBe("string");
  });
});

// ---- computeFingerprint -----------------------------------------------------

describe("computeFingerprint", () => {
  it("same name+stack → same fingerprint", () => {
    const err = { name: "TypeError", stack: "TypeError: bad\n    at foo (a.js:1:1)\n    at bar (b.js:2:2)" };
    expect(computeFingerprint(err)).toBe(computeFingerprint(err));
  });

  it("different stack → different fingerprint", () => {
    const e1 = { name: "Error", stack: "Error\n    at fn1 (a.js:1:1)" };
    const e2 = { name: "Error", stack: "Error\n    at fn2 (b.js:9:9)" };
    expect(computeFingerprint(e1)).not.toBe(computeFingerprint(e2));
  });

  it("handles null/missing stack — falls back to no-stack", () => {
    const e1 = { name: "Error", stack: null };
    const e2 = { name: "Error", stack: "" };
    // Both should use "no-stack" fallback → same fingerprint
    expect(computeFingerprint(e1)).toBe(computeFingerprint(e2));
  });

  it("uses only first 3 stack lines for fingerprint stability", () => {
    const base = "Error\n    at fn1 (a.js:1:1)\n    at fn2 (b.js:2:2)\n    at fn3 (c.js:3:3)";
    const withExtra = base + "\n    at fn4 (d.js:4:4)\n    at fn5 (e.js:5:5)";
    const e1 = { name: "Error", stack: base };
    const e2 = { name: "Error", stack: withExtra };
    // First 3 lines are identical, so fingerprints match
    expect(computeFingerprint(e1)).toBe(computeFingerprint(e2));
  });
});

// ---- computeMessageFingerprint ----------------------------------------------

describe("computeMessageFingerprint", () => {
  it("same message+level → same fingerprint", () => {
    expect(computeMessageFingerprint("hello", "info")).toBe(computeMessageFingerprint("hello", "info"));
  });

  it("different level → different fingerprint", () => {
    expect(computeMessageFingerprint("hello", "info")).not.toBe(computeMessageFingerprint("hello", "error"));
  });

  it("handles null/undefined message gracefully", () => {
    expect(() => computeMessageFingerprint(null, "info")).not.toThrow();
    expect(() => computeMessageFingerprint(undefined, "info")).not.toThrow();
  });
});

// ---- getTodayUtc ------------------------------------------------------------

describe("getTodayUtc", () => {
  it("returns YYYY-MM-DD format", () => {
    expect(getTodayUtc()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ---- checkAndIncrementQuota -------------------------------------------------

describe("checkAndIncrementQuota", () => {
  beforeEach(() => {
    chrome.storage.local.get.mockResolvedValue({});
    chrome.storage.local.set.mockResolvedValue();
  });

  it("first call returns allowed:true with count:1", async () => {
    chrome.storage.local.get.mockResolvedValue({});
    const result = await checkAndIncrementQuota();
    expect(result.allowed).toBe(true);
    expect(result.count).toBe(1);
    expect(result.cap).toBe(ERROR_DAILY_CAP);
  });

  it("100 increments all succeed; 101st returns allowed:false", async () => {
    const today = getTodayUtc();
    // Simulate quota at exactly 100 (cap reached)
    chrome.storage.local.get.mockResolvedValue({
      [ERROR_QUOTA_KEY]: { date: today, count: 100 },
    });
    const result = await checkAndIncrementQuota();
    expect(result.allowed).toBe(false);
    expect(result.count).toBe(100);
    // Should NOT call set when cap is exceeded
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it("count at 99 returns allowed:true", async () => {
    const today = getTodayUtc();
    chrome.storage.local.get.mockResolvedValue({
      [ERROR_QUOTA_KEY]: { date: today, count: 99 },
    });
    const result = await checkAndIncrementQuota();
    expect(result.allowed).toBe(true);
    expect(result.count).toBe(100);
  });

  it("resets count when date changes", async () => {
    chrome.storage.local.get.mockResolvedValue({
      [ERROR_QUOTA_KEY]: { date: "2020-01-01", count: 99 },
    });
    const result = await checkAndIncrementQuota();
    expect(result.allowed).toBe(true);
    expect(result.count).toBe(1); // reset to 0, then incremented
    // Verify persisted value has today's date
    const persisted = chrome.storage.local.set.mock.calls[0][0][ERROR_QUOTA_KEY];
    expect(persisted.date).toBe(getTodayUtc());
    expect(persisted.count).toBe(1);
  });

  it("increments correctly from existing count", async () => {
    const today = getTodayUtc();
    chrome.storage.local.get.mockResolvedValue({
      [ERROR_QUOTA_KEY]: { date: today, count: 42 },
    });
    const result = await checkAndIncrementQuota();
    expect(result.count).toBe(43);
  });
});

// ---- checkDedup + recordSend -------------------------------------------------

describe("checkDedup", () => {
  beforeEach(() => {
    chrome.storage.local.get.mockResolvedValue({});
    chrome.storage.local.set.mockResolvedValue();
  });

  it("first call → shouldSend:true, isFirst:true", async () => {
    chrome.storage.local.get.mockResolvedValue({});
    const result = await checkDedup("abc123");
    expect(result.shouldSend).toBe(true);
    expect(result.isFirst).toBe(true);
    expect(result.entry).toBeUndefined();
  });

  it("second call within window with Math.random < sampleRate → shouldSend:true, isFirst:false", async () => {
    const now = Date.now();
    chrome.storage.local.get.mockResolvedValue({
      [ERROR_DEDUP_KEY]: {
        abc123: { firstSeenAt: now - 1000, lastSeenAt: now - 1000, count: 1, sentCount: 1 },
      },
    });
    vi.spyOn(Math, "random").mockReturnValue(0.05); // < 0.1 sample rate
    const result = await checkDedup("abc123");
    expect(result.shouldSend).toBe(true);
    expect(result.isFirst).toBe(false);
    vi.restoreAllMocks();
  });

  it("second call within window with Math.random >= sampleRate → shouldSend:false", async () => {
    const now = Date.now();
    chrome.storage.local.get.mockResolvedValue({
      [ERROR_DEDUP_KEY]: {
        abc123: { firstSeenAt: now - 1000, lastSeenAt: now - 1000, count: 1, sentCount: 1 },
      },
    });
    vi.spyOn(Math, "random").mockReturnValue(0.5); // >= 0.1 sample rate
    const result = await checkDedup("abc123");
    expect(result.shouldSend).toBe(false);
    vi.restoreAllMocks();
  });

  it("expired entry (> 24h old) treated as first occurrence", async () => {
    const old = Date.now() - 90000000; // 25 hours ago
    chrome.storage.local.get.mockResolvedValue({
      [ERROR_DEDUP_KEY]: {
        abc123: { firstSeenAt: old, lastSeenAt: old, count: 5, sentCount: 2 },
      },
    });
    const result = await checkDedup("abc123");
    // Entry was GC'd, so treated as new
    expect(result.shouldSend).toBe(true);
    expect(result.isFirst).toBe(true);
    expect(result.entry).toBeUndefined();
  });

  it("LRU evict: 101 distinct fingerprints → map size stays ≤ 100", async () => {
    const now = Date.now();
    const map = {};
    for (let i = 0; i < 101; i++) {
      map[`fp${i}`] = { firstSeenAt: now - (101 - i) * 1000, lastSeenAt: now - (101 - i) * 1000, count: 1, sentCount: 1 };
    }
    chrome.storage.local.get.mockResolvedValue({ [ERROR_DEDUP_KEY]: map });

    const result = await checkDedup("new-fp");

    expect(Object.keys(result.map).length).toBeLessThanOrEqual(100);
  });
});

describe("recordSend", () => {
  beforeEach(() => {
    chrome.storage.local.get.mockResolvedValue({});
    chrome.storage.local.set.mockResolvedValue();
  });

  it("creates new entry when fingerprint not in map", async () => {
    chrome.storage.local.get.mockResolvedValue({});
    await recordSend("fp1", true);
    const persisted = chrome.storage.local.set.mock.calls[0][0][ERROR_DEDUP_KEY];
    expect(persisted.fp1).toBeDefined();
    expect(persisted.fp1.count).toBe(1);
    expect(persisted.fp1.sentCount).toBe(1);
  });

  it("increments count and sentCount on send=true", async () => {
    const now = Date.now();
    chrome.storage.local.get.mockResolvedValue({
      [ERROR_DEDUP_KEY]: { fp1: { firstSeenAt: now, lastSeenAt: now, count: 3, sentCount: 1 } },
    });
    await recordSend("fp1", true);
    const persisted = chrome.storage.local.set.mock.calls[0][0][ERROR_DEDUP_KEY];
    expect(persisted.fp1.count).toBe(4);
    expect(persisted.fp1.sentCount).toBe(2);
  });

  it("increments count but NOT sentCount on send=false", async () => {
    const now = Date.now();
    chrome.storage.local.get.mockResolvedValue({
      [ERROR_DEDUP_KEY]: { fp1: { firstSeenAt: now, lastSeenAt: now, count: 2, sentCount: 1 } },
    });
    await recordSend("fp1", false);
    const persisted = chrome.storage.local.set.mock.calls[0][0][ERROR_DEDUP_KEY];
    expect(persisted.fp1.count).toBe(3);
    expect(persisted.fp1.sentCount).toBe(1); // unchanged
  });
});
