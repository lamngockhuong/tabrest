import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkMemoryAndUnload,
  checkPerTabMemory,
  calculateMemoryUsagePercent,
} from "../../src/background/memory-monitor.js";

// Mock dependencies
vi.mock("../../src/shared/storage.js", () => ({
  getSettings: vi.fn(),
}));

vi.mock("../../src/background/snooze-manager.js", () => ({
  getSnoozeData: vi.fn(),
  isTabSnoozed: vi.fn(),
}));

vi.mock("../../src/background/tab-tracker.js", () => ({
  getLRUSortedTabs: vi.fn(),
}));

vi.mock("../../src/background/unload-manager.js", () => ({
  discardTab: vi.fn(),
}));

vi.mock("../../src/shared/utils.js", () => ({
  notifyAutoUnload: vi.fn(),
}));

import { getSettings } from "../../src/shared/storage.js";
import { getSnoozeData, isTabSnoozed } from "../../src/background/snooze-manager.js";
import { getLRUSortedTabs } from "../../src/background/tab-tracker.js";
import { discardTab } from "../../src/background/unload-manager.js";

describe("memory-monitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigator.onLine mock
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  describe("calculateMemoryUsagePercent", () => {
    it("calculates correct percentage", () => {
      const memoryInfo = {
        capacity: 8589934592, // 8GB
        availableCapacity: 4294967296, // 4GB available = 50% used
      };
      expect(calculateMemoryUsagePercent(memoryInfo)).toBe(50);
    });

    it("returns 0 for null input", () => {
      expect(calculateMemoryUsagePercent(null)).toBe(0);
    });

    it("rounds to nearest integer", () => {
      const memoryInfo = {
        capacity: 1000,
        availableCapacity: 333, // 66.7% used
      };
      expect(calculateMemoryUsagePercent(memoryInfo)).toBe(67);
    });
  });

  describe("checkMemoryAndUnload", () => {
    const defaultSettings = {
      memoryThresholdPercent: 80,
      skipWhenOffline: true,
      powerMode: "normal",
      notifyOnAutoUnload: false,
    };

    beforeEach(() => {
      getSettings.mockResolvedValue(defaultSettings);
      getSnoozeData.mockResolvedValue({ tabs: {}, domains: {} });
      getLRUSortedTabs.mockReturnValue([1, 2, 3]);
      discardTab.mockResolvedValue(true);
      isTabSnoozed.mockResolvedValue(false);

      // Mock high memory usage (85%)
      chrome.system.memory.getInfo.mockResolvedValue({
        capacity: 8589934592,
        availableCapacity: 1288490189, // ~15% available = 85% used
      });

      chrome.tabs.get.mockImplementation((tabId) =>
        Promise.resolve({
          id: tabId,
          url: `https://example${tabId}.com`,
          title: `Tab ${tabId}`,
        })
      );
    });

    it("returns 0 when memoryThresholdPercent is disabled (0)", async () => {
      getSettings.mockResolvedValue({ ...defaultSettings, memoryThresholdPercent: 0 });
      const result = await checkMemoryAndUnload();
      expect(result).toBe(0);
      expect(chrome.system.memory.getInfo).not.toHaveBeenCalled();
    });

    it("returns 0 when offline and skipWhenOffline is enabled", async () => {
      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
      const result = await checkMemoryAndUnload();
      expect(result).toBe(0);
      expect(chrome.system.memory.getInfo).not.toHaveBeenCalled();
    });

    it("proceeds when offline but skipWhenOffline is disabled", async () => {
      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
      getSettings.mockResolvedValue({ ...defaultSettings, skipWhenOffline: false });
      await checkMemoryAndUnload();
      expect(chrome.system.memory.getInfo).toHaveBeenCalled();
    });

    it("returns 0 when memory usage is below threshold", async () => {
      // Mock low memory usage (50%)
      chrome.system.memory.getInfo.mockResolvedValue({
        capacity: 8589934592,
        availableCapacity: 4294967296, // 50% available = 50% used
      });
      const result = await checkMemoryAndUnload();
      expect(result).toBe(0);
      expect(discardTab).not.toHaveBeenCalled();
    });

    it("skips snoozed tabs", async () => {
      isTabSnoozed.mockImplementation((tabId) => Promise.resolve(tabId === 1));
      await checkMemoryAndUnload();

      // Tab 1 is snoozed, should not be discarded
      expect(discardTab).not.toHaveBeenCalledWith(1, expect.anything());
      // Tabs 2 and 3 should be discarded
      expect(discardTab).toHaveBeenCalledWith(2, expect.anything());
      expect(discardTab).toHaveBeenCalledWith(3, expect.anything());
    });

    it("unloads tabs when memory exceeds threshold", async () => {
      const result = await checkMemoryAndUnload();
      expect(result).toBeGreaterThan(0);
      expect(discardTab).toHaveBeenCalled();
    });

    it("continues to next tab when chrome.tabs.get fails", async () => {
      chrome.tabs.get.mockImplementation((tabId) => {
        if (tabId === 1) return Promise.reject(new Error("Tab not found"));
        return Promise.resolve({ id: tabId, url: `https://example${tabId}.com`, title: `Tab ${tabId}` });
      });

      await checkMemoryAndUnload();

      // Should still try to discard other tabs
      expect(discardTab).toHaveBeenCalledWith(2, expect.anything());
    });
  });

  describe("checkPerTabMemory", () => {
    const defaultSettings = {
      perTabJsHeapThresholdMB: 100,
      skipWhenOffline: true,
    };

    beforeEach(() => {
      getSettings.mockResolvedValue(defaultSettings);
      getSnoozeData.mockResolvedValue({ tabs: {}, domains: {} });
      isTabSnoozed.mockResolvedValue(false);
      discardTab.mockResolvedValue(true);

      chrome.tabs.query.mockResolvedValue([
        { id: 1, url: "https://example1.com", active: false, discarded: false },
        { id: 2, url: "https://example2.com", active: false, discarded: false },
        { id: 3, url: "https://example3.com", active: true, discarded: false },
      ]);
    });

    it("returns 0 when perTabJsHeapThresholdMB is disabled (0)", async () => {
      getSettings.mockResolvedValue({ ...defaultSettings, perTabJsHeapThresholdMB: 0 });
      const result = await checkPerTabMemory();
      expect(result).toBe(0);
    });

    it("returns 0 when offline and skipWhenOffline is enabled", async () => {
      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
      const result = await checkPerTabMemory();
      expect(result).toBe(0);
    });

    it("skips active tabs", async () => {
      await checkPerTabMemory();
      // Tab 3 is active, should never be considered for discard
      expect(isTabSnoozed).not.toHaveBeenCalledWith(3, expect.anything(), expect.anything());
    });

    it("skips snoozed tabs", async () => {
      isTabSnoozed.mockImplementation((tabId) => Promise.resolve(tabId === 1));
      await checkPerTabMemory();

      // Tab 1 is snoozed, should not be discarded
      expect(discardTab).not.toHaveBeenCalledWith(1, expect.anything());
    });
  });
});
