import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { STORAGE_KEYS } from "../../src/shared/constants.js";
import {
  getStats,
  initStats,
  recordUnload,
  resetStats,
} from "../../src/background/stats-collector.js";

const KEY = STORAGE_KEYS.STATS;
const MB_PER_TAB = 150;

const today = () => new Date().toISOString().split("T")[0];

describe("stats-collector", () => {
  describe("initStats", () => {
    it("seeds defaults when no stats exist", async () => {
      chrome.storage.local.get.mockResolvedValue({});
      chrome.storage.local.set.mockResolvedValue();

      await initStats();

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        [KEY]: expect.objectContaining({
          totalTabsSuspended: 0,
          totalTabsSuspendedToday: 0,
          memorySaved: 0,
          todayDate: today(),
          installDate: expect.any(Number),
        }),
      });
    });

    it("does not overwrite existing stats", async () => {
      chrome.storage.local.get.mockResolvedValue({ [KEY]: { totalTabsSuspended: 5 } });
      chrome.storage.local.set.mockResolvedValue();

      await initStats();

      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });
  });

  describe("getStats", () => {
    it("returns defaults with derived estimatedRamSaved when no stats", async () => {
      chrome.storage.local.get.mockResolvedValue({});
      const stats = await getStats();
      expect(stats.totalTabsSuspended).toBe(0);
      expect(stats.estimatedRamSaved).toBe(0);
    });

    it("computes estimatedRamSaved from totalTabsSuspended", async () => {
      chrome.storage.local.get.mockResolvedValue({
        [KEY]: {
          totalTabsSuspended: 10,
          totalTabsSuspendedToday: 2,
          todayDate: today(),
          installDate: 1700000000000,
          memorySaved: 0,
        },
      });
      const stats = await getStats();
      expect(stats.estimatedRamSaved).toBe(10 * MB_PER_TAB);
    });

    it("resets daily counter when day rolls over", async () => {
      chrome.storage.local.get.mockResolvedValue({
        [KEY]: {
          totalTabsSuspended: 50,
          totalTabsSuspendedToday: 30,
          todayDate: "2000-01-01",
          installDate: 1,
          memorySaved: 0,
        },
      });
      chrome.storage.local.set.mockResolvedValue();

      const stats = await getStats();

      expect(stats.totalTabsSuspendedToday).toBe(0);
      expect(stats.todayDate).toBe(today());
      expect(stats.totalTabsSuspended).toBe(50);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        [KEY]: expect.objectContaining({ totalTabsSuspendedToday: 0, todayDate: today() }),
      });
    });

    it("does not write when day matches", async () => {
      chrome.storage.local.get.mockResolvedValue({
        [KEY]: {
          totalTabsSuspended: 5,
          totalTabsSuspendedToday: 1,
          todayDate: today(),
          installDate: 1,
          memorySaved: 0,
        },
      });
      chrome.storage.local.set.mockResolvedValue();

      await getStats();

      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });
  });

  describe("recordUnload", () => {
    it("increments totals by default count of 1", async () => {
      chrome.storage.local.get.mockResolvedValue({
        [KEY]: {
          totalTabsSuspended: 10,
          totalTabsSuspendedToday: 3,
          todayDate: today(),
          installDate: 1,
          memorySaved: 0,
        },
      });
      chrome.storage.local.set.mockResolvedValue();

      const stats = await recordUnload();

      expect(stats.totalTabsSuspended).toBe(11);
      expect(stats.totalTabsSuspendedToday).toBe(4);
      expect(stats.memorySaved).toBe(MB_PER_TAB * 1024 * 1024);
    });

    it("supports batch counts", async () => {
      chrome.storage.local.get.mockResolvedValue({
        [KEY]: {
          totalTabsSuspended: 0,
          totalTabsSuspendedToday: 0,
          todayDate: today(),
          installDate: 1,
          memorySaved: 0,
        },
      });
      chrome.storage.local.set.mockResolvedValue();

      const stats = await recordUnload(5);

      expect(stats.totalTabsSuspended).toBe(5);
      expect(stats.totalTabsSuspendedToday).toBe(5);
      expect(stats.memorySaved).toBe(5 * MB_PER_TAB * 1024 * 1024);
    });

    it("resets daily counter before adding when day rolls over", async () => {
      chrome.storage.local.get.mockResolvedValue({
        [KEY]: {
          totalTabsSuspended: 100,
          totalTabsSuspendedToday: 50,
          todayDate: "2000-01-01",
          installDate: 1,
          memorySaved: 0,
        },
      });
      chrome.storage.local.set.mockResolvedValue();

      const stats = await recordUnload(2);

      expect(stats.totalTabsSuspendedToday).toBe(2);
      expect(stats.totalTabsSuspended).toBe(102);
      expect(stats.todayDate).toBe(today());
    });

    it("seeds defaults when no prior stats", async () => {
      chrome.storage.local.get.mockResolvedValue({});
      chrome.storage.local.set.mockResolvedValue();

      const stats = await recordUnload(1);

      expect(stats.totalTabsSuspended).toBe(1);
    });
  });

  describe("resetStats", () => {
    it("returns and persists default stats", async () => {
      chrome.storage.local.set.mockResolvedValue();

      const stats = await resetStats();

      expect(stats.totalTabsSuspended).toBe(0);
      expect(stats.todayDate).toBe(today());
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ [KEY]: expect.any(Object) });
    });
  });
});
