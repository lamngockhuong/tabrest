import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanupExpiredPause,
  clearPause,
  getPauseInfo,
  isPaused,
  setPause,
} from "../../src/background/pause-manager.js";
import { PAUSE_KEY } from "../../src/shared/constants.js";

describe("pause-manager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1700000000000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("setPause", () => {
    it("stores an absolute deadline for finite minutes", async () => {
      chrome.storage.local.set.mockResolvedValue();
      await setPause(60);
      const written = chrome.storage.local.set.mock.calls[0][0][PAUSE_KEY];
      expect(written).toEqual({ until: Date.now() + 60 * 60 * 1000 });
    });

    it("stores the -1 sentinel for pause-until-resumed", async () => {
      chrome.storage.local.set.mockResolvedValue();
      await setPause(-1);
      const written = chrome.storage.local.set.mock.calls[0][0][PAUSE_KEY];
      expect(written).toEqual({ until: -1 });
    });

    it("returns true on a valid write", async () => {
      chrome.storage.local.set.mockResolvedValue();
      expect(await setPause(30)).toBe(true);
    });

    it.each([
      ["undefined", undefined],
      ["NaN", Number.NaN],
      ["zero", 0],
      ["a negative other than -1", -30],
    ])("rejects %s without writing", async (_label, value) => {
      chrome.storage.local.set.mockResolvedValue();
      expect(await setPause(value)).toBe(false);
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });

    it("truncates fractional minutes", async () => {
      chrome.storage.local.set.mockResolvedValue();
      await setPause(30.9);
      const written = chrome.storage.local.set.mock.calls[0][0][PAUSE_KEY];
      expect(written).toEqual({ until: Date.now() + 30 * 60 * 1000 });
    });
  });

  describe("clearPause", () => {
    it("removes the pause key", async () => {
      chrome.storage.local.remove.mockResolvedValue();
      await clearPause();
      expect(chrome.storage.local.remove).toHaveBeenCalledWith(PAUSE_KEY);
    });
  });

  describe("isPaused", () => {
    it("returns false when nothing is stored", async () => {
      chrome.storage.local.get.mockResolvedValue({});
      expect(await isPaused()).toBe(false);
    });

    it("returns true for an indefinite pause", async () => {
      chrome.storage.local.get.mockResolvedValue({ [PAUSE_KEY]: { until: -1 } });
      expect(await isPaused()).toBe(true);
    });

    it("returns true for a future deadline", async () => {
      chrome.storage.local.get.mockResolvedValue({ [PAUSE_KEY]: { until: Date.now() + 1000 } });
      expect(await isPaused()).toBe(true);
    });

    it("returns false for an expired deadline", async () => {
      chrome.storage.local.get.mockResolvedValue({ [PAUSE_KEY]: { until: Date.now() - 1000 } });
      expect(await isPaused()).toBe(false);
    });
  });

  describe("getPauseInfo", () => {
    it("reports not paused when nothing is stored", async () => {
      chrome.storage.local.get.mockResolvedValue({});
      expect(await getPauseInfo()).toEqual({ paused: false });
    });

    it("reports the deadline while active", async () => {
      const until = Date.now() + 5000;
      chrome.storage.local.get.mockResolvedValue({ [PAUSE_KEY]: { until } });
      expect(await getPauseInfo()).toEqual({ paused: true, until });
    });

    it("reports not paused once the deadline has elapsed", async () => {
      chrome.storage.local.get.mockResolvedValue({ [PAUSE_KEY]: { until: Date.now() - 1 } });
      expect(await getPauseInfo()).toEqual({ paused: false });
    });
  });

  describe("cleanupExpiredPause", () => {
    it("clears an expired timed pause and reports it", async () => {
      chrome.storage.local.get.mockResolvedValue({ [PAUSE_KEY]: { until: Date.now() - 1 } });
      chrome.storage.local.remove.mockResolvedValue();
      expect(await cleanupExpiredPause()).toBe(true);
      expect(chrome.storage.local.remove).toHaveBeenCalledWith(PAUSE_KEY);
    });

    it("leaves an active pause untouched", async () => {
      chrome.storage.local.get.mockResolvedValue({ [PAUSE_KEY]: { until: Date.now() + 1000 } });
      expect(await cleanupExpiredPause()).toBe(false);
      expect(chrome.storage.local.remove).not.toHaveBeenCalled();
    });

    it("leaves an indefinite pause untouched", async () => {
      chrome.storage.local.get.mockResolvedValue({ [PAUSE_KEY]: { until: -1 } });
      expect(await cleanupExpiredPause()).toBe(false);
      expect(chrome.storage.local.remove).not.toHaveBeenCalled();
    });

    it("is a no-op when nothing is stored", async () => {
      chrome.storage.local.get.mockResolvedValue({});
      expect(await cleanupExpiredPause()).toBe(false);
      expect(chrome.storage.local.remove).not.toHaveBeenCalled();
    });
  });
});
