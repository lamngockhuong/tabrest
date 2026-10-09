import { beforeEach, describe, expect, it } from "vitest";
import {
  saveScrollPosition,
  saveYouTubeTimestamp,
  takeScrollPosition,
  takeYouTubeTimestamp,
  youTubeVideoId,
} from "../../src/background/page-state-store.js";
import {
  SCROLL_MAX_ENTRIES,
  SCROLL_POSITIONS_KEY,
  YOUTUBE_TIMESTAMP_MAX_AGE_MS,
  YOUTUBE_TIMESTAMPS_KEY,
} from "../../src/shared/constants.js";

// In-memory chrome.storage.local, so save and take run against the same data
let store;
beforeEach(() => {
  store = {};
  chrome.storage.local.get.mockImplementation(async (key) => ({ [key]: store[key] }));
  chrome.storage.local.set.mockImplementation(async (items) => {
    Object.assign(store, structuredClone(items));
  });
});

describe("page-state-store: scroll positions", () => {
  it("saves under the tab with the browser-reported URL and hands it back once", async () => {
    await saveScrollPosition(3, "https://a.com/p", { x: 0, y: 250 });
    expect(await takeScrollPosition(3, "https://a.com/p")).toEqual({ x: 0, y: 250 });
    expect(await takeScrollPosition(3, "https://a.com/p")).toBeNull();
  });

  it("keeps the entry when the tab now shows another URL", async () => {
    await saveScrollPosition(3, "https://a.com/p", { x: 0, y: 250 });
    expect(await takeScrollPosition(3, "https://a.com/other")).toBeNull();
    expect(store[SCROLL_POSITIONS_KEY][3]).toBeDefined();
  });

  it("drops positions the page reported as anything but finite non-negative numbers", async () => {
    for (const position of [null, { x: "1", y: 2 }, { x: 1, y: -2 }, { x: Number.NaN, y: 0 }]) {
      await saveScrollPosition(3, "https://a.com/p", position);
    }
    expect(store[SCROLL_POSITIONS_KEY]).toBeUndefined();
  });

  it("prunes the oldest entries beyond the cap", async () => {
    for (let i = 0; i < SCROLL_MAX_ENTRIES + 2; i++) {
      await saveScrollPosition(i, `https://a.com/${i}`, { x: 0, y: i });
    }
    expect(Object.keys(store[SCROLL_POSITIONS_KEY])).toHaveLength(SCROLL_MAX_ENTRIES);
  });
});

describe("page-state-store: YouTube timestamps", () => {
  const watch = (id) => `https://www.youtube.com/watch?v=${id}`;

  it("saves under the video id from the tab URL and hands it back once", async () => {
    await saveYouTubeTimestamp(watch("abc_-1"), { timestamp: 95, duration: 600 });
    expect(await takeYouTubeTimestamp(watch("abc_-1"))).toEqual({ timestamp: 95, duration: 600 });
    expect(await takeYouTubeTimestamp(watch("abc_-1"))).toBeNull();
  });

  it("stores no URL, only the playback numbers", async () => {
    await saveYouTubeTimestamp(watch("abc"), { timestamp: 95, duration: 600 });
    expect(Object.keys(store[YOUTUBE_TIMESTAMPS_KEY].abc).sort()).toEqual([
      "duration",
      "savedAt",
      "timestamp",
    ]);
  });

  it("drops bad playback numbers and URLs with no valid video id", async () => {
    await saveYouTubeTimestamp(watch("abc"), { timestamp: "95", duration: 600 });
    await saveYouTubeTimestamp("https://www.youtube.com/watch", { timestamp: 95, duration: 600 });
    await saveYouTubeTimestamp(watch("a%20b"), { timestamp: 95, duration: 600 });
    expect(store[YOUTUBE_TIMESTAMPS_KEY]).toBeUndefined();
  });

  it("expires entries older than the max age when saving", async () => {
    store[YOUTUBE_TIMESTAMPS_KEY] = {
      old: { timestamp: 1, duration: 100, savedAt: Date.now() - YOUTUBE_TIMESTAMP_MAX_AGE_MS - 1 },
    };
    await saveYouTubeTimestamp(watch("new"), { timestamp: 95, duration: 600 });
    expect(Object.keys(store[YOUTUBE_TIMESTAMPS_KEY])).toEqual(["new"]);
  });

  it("youTubeVideoId reads only the v parameter", () => {
    expect(youTubeVideoId(watch("dQw4w9WgXcQ"))).toBe("dQw4w9WgXcQ");
    expect(youTubeVideoId("not a url")).toBeNull();
  });
});
