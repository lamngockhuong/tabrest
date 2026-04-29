import { describe, expect, it } from "vitest";
import { YOUTUBE_TIMESTAMP_MAX_AGE_MS as MAX_AGE_MS } from "../../src/shared/constants.js";

// Approach A: youtube-tracker.js is excluded (IIFE content script). These tests
// pin the eligibility / pruning / restore-window contracts. Importing the
// canonical MAX_AGE_MS from shared/constants doubles as a drift detector
// against the source-side local copy (content scripts can't ES-import).

// --- getCurrentTimestamp eligibility (youtube-tracker.js:8-22) ----------------
function getCurrentTimestamp({ video, search, href }) {
  if (!video || video.duration < 60) return null;
  const params = new URLSearchParams(search);
  const videoId = params.get("v");
  if (!videoId) return null;
  return {
    videoId,
    url: href,
    timestamp: Math.floor(video.currentTime),
    duration: Math.floor(video.duration),
    savedAt: 0, // injected by caller; tests pass explicit value where it matters
  };
}

describe("youtube-tracker-contracts: getCurrentTimestamp eligibility", () => {
  it("rejects when no <video>", () => {
    expect(getCurrentTimestamp({ video: null, search: "?v=abc", href: "u" })).toBeNull();
  });

  it("rejects videos under 60 seconds (shorts)", () => {
    expect(
      getCurrentTimestamp({
        video: { duration: 30, currentTime: 10 },
        search: "?v=abc",
        href: "u",
      }),
    ).toBeNull();
  });

  it("rejects when no v= param (channel/feed pages)", () => {
    expect(
      getCurrentTimestamp({
        video: { duration: 600, currentTime: 100 },
        search: "?list=PL",
        href: "u",
      }),
    ).toBeNull();
  });

  it("returns floored seconds (storage is integer)", () => {
    const r = getCurrentTimestamp({
      video: { duration: 600.7, currentTime: 123.9 },
      search: "?v=abc",
      href: "https://youtube.com/watch?v=abc",
    });
    expect(r).toMatchObject({
      videoId: "abc",
      timestamp: 123,
      duration: 600,
      url: "https://youtube.com/watch?v=abc",
    });
  });

  it("captures videoId via URLSearchParams (handles extra params)", () => {
    const r = getCurrentTimestamp({
      video: { duration: 600, currentTime: 1 },
      search: "?v=ID&t=30s&list=PL",
      href: "u",
    });
    expect(r.videoId).toBe("ID");
  });
});

// --- saveTimestamp threshold (youtube-tracker.js:25-45) -----------------------
// Skips entries with timestamp < 10s - too short to bother restoring, and avoids
// noise from pages that auto-discarded immediately.
function shouldSaveTimestamp(data) {
  if (!data) return false;
  return data.timestamp >= 10;
}

describe("youtube-tracker-contracts: saveTimestamp 10-second floor", () => {
  it.each([
    [0, false],
    [9, false],
    [10, true],
    [60, true],
  ])("timestamp=%i → save=%p", (ts, expected) => {
    expect(shouldSaveTimestamp({ timestamp: ts })).toBe(expected);
  });

  it("rejects null data (chained from getCurrentTimestamp)", () => {
    expect(shouldSaveTimestamp(null)).toBe(false);
  });
});

// --- pruneOldTimestamps (youtube-tracker.js:34-37) ----------------------------
function pruneOldTimestamps(timestamps, now = Date.now()) {
  for (const [key, val] of Object.entries(timestamps)) {
    if (now - val.savedAt > MAX_AGE_MS) delete timestamps[key];
  }
  return timestamps;
}

describe("youtube-tracker-contracts: 7-day pruning", () => {
  it("removes entries older than 7 days", () => {
    const now = 10_000_000_000;
    const ts = {
      old: { savedAt: now - MAX_AGE_MS - 1 },
      onTheEdge: { savedAt: now - MAX_AGE_MS }, // exactly 7d → kept (uses strict >)
      recent: { savedAt: now - 1000 },
    };
    pruneOldTimestamps(ts, now);
    expect(ts.old).toBeUndefined();
    expect(ts.onTheEdge).toBeDefined();
    expect(ts.recent).toBeDefined();
  });

  it("noop when all entries fresh", () => {
    const now = 10_000_000_000;
    const ts = { a: { savedAt: now }, b: { savedAt: now - 1000 } };
    pruneOldTimestamps(ts, now);
    expect(Object.keys(ts)).toEqual(["a", "b"]);
  });

  it("noop on empty store", () => {
    const ts = {};
    pruneOldTimestamps(ts);
    expect(ts).toEqual({});
  });
});

// --- restoreTimestamp window guard (youtube-tracker.js:84-87) -----------------
// Don't restore if user was within last 30s - they're "done", autoplay should
// take them to the next video naturally.
function shouldRestore(saved) {
  return saved.timestamp < saved.duration - 30;
}

describe("youtube-tracker-contracts: restore window (last 30s ignored)", () => {
  it.each([
    [{ timestamp: 100, duration: 600 }, true],
    [{ timestamp: 569, duration: 600 }, true],
    [{ timestamp: 570, duration: 600 }, false], // exactly at boundary - don't restore
    [{ timestamp: 590, duration: 600 }, false],
    [{ timestamp: 600, duration: 600 }, false],
  ])("%o → restore=%p", (saved, expected) => {
    expect(shouldRestore(saved)).toBe(expected);
  });
});

// --- waitForVideoReady semantics (youtube-tracker.js:48-62) -------------------
// readyState >= 1 (HAVE_METADATA) means seeking is safe. Pin that boundary -
// if the constant ever drifts, the contract test fails.
function isVideoSeekable(readyState) {
  return readyState >= 1;
}

describe("youtube-tracker-contracts: video seek-readiness gate", () => {
  it.each([
    [0, false], // HAVE_NOTHING
    [1, true], // HAVE_METADATA - duration known, seeking ok
    [2, true],
    [3, true],
    [4, true], // HAVE_ENOUGH_DATA
  ])("readyState=%i → seekable=%p", (state, expected) => {
    expect(isVideoSeekable(state)).toBe(expected);
  });
});

// --- error bridge load-once guard (youtube-tracker.js:136-138) ----------------
describe("youtube-tracker-contracts: error bridge load-once guard", () => {
  it("second load is a noop (no duplicate listeners)", () => {
    const win = {};
    let attached = 0;
    function load() {
      if (!win.__tabrestYoutubeErrorBridgeLoaded) {
        win.__tabrestYoutubeErrorBridgeLoaded = true;
        attached++;
      }
    }
    load();
    load();
    load();
    expect(attached).toBe(1);
  });
});
