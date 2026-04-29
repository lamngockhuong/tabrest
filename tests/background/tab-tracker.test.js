import { beforeEach, describe, expect, it, vi } from "vitest";
import { ALARM_NAMES } from "../../src/shared/constants.js";

vi.mock("../../src/shared/storage.js", () => ({
  getSettings: vi.fn(),
  getTabActivity: vi.fn(),
  saveTabActivity: vi.fn(),
}));

vi.mock("../../src/shared/utils.js", () => ({
  notifyAutoUnload: vi.fn(),
}));

vi.mock("../../src/background/snooze-manager.js", () => ({
  getSnoozeData: vi.fn(),
  isTabSnoozed: vi.fn(),
}));

vi.mock("../../src/background/unload-manager.js", () => ({
  discardTab: vi.fn(),
  isUrlBlacklisted: vi.fn(),
  isUrlWhitelisted: vi.fn(),
}));

import { getSnoozeData, isTabSnoozed } from "../../src/background/snooze-manager.js";
import {
  discardTab,
  isUrlBlacklisted,
  isUrlWhitelisted,
} from "../../src/background/unload-manager.js";
import { getSettings, getTabActivity, saveTabActivity } from "../../src/shared/storage.js";
import { notifyAutoUnload } from "../../src/shared/utils.js";

const importTracker = () => import("../../src/background/tab-tracker.js");

const baseSettings = {
  unloadDelayMinutes: 30,
  skipWhenOffline: false,
  onlyDiscardWhenIdle: false,
  idleThresholdMinutes: 5,
  powerMode: "normal",
  minTabsBeforeAutoDiscard: 0,
  notifyOnAutoUnload: false,
};

describe("tab-tracker", () => {
  beforeEach(() => {
    vi.resetModules();
    isUrlWhitelisted.mockReturnValue(false);
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  describe("initTabTracker", () => {
    it("loads persisted activity and creates an alarm when delay > 0", async () => {
      getTabActivity.mockResolvedValue({ 1: 100, 2: 200 });
      getSettings.mockResolvedValue(baseSettings);
      const { initTabTracker, getTabActivityMap } = await importTracker();

      await initTabTracker();

      expect(getTabActivityMap()).toEqual({ 1: 100, 2: 200 });
      expect(chrome.alarms.clear).toHaveBeenCalledWith(ALARM_NAMES.TAB_CHECK);
      expect(chrome.alarms.create).toHaveBeenCalledWith(ALARM_NAMES.TAB_CHECK, {
        periodInMinutes: 1,
      });
    });

    it("does not create alarm when delay is 0", async () => {
      getTabActivity.mockResolvedValue({});
      getSettings.mockResolvedValue({ ...baseSettings, unloadDelayMinutes: 0 });
      const { initTabTracker } = await importTracker();

      await initTabTracker();

      expect(chrome.alarms.create).not.toHaveBeenCalled();
    });
  });

  describe("updateTabActivity / removeTabActivity / debounced save", () => {
    it("debounces saves to storage on update", async () => {
      vi.useFakeTimers();
      try {
        getTabActivity.mockResolvedValue({});
        getSettings.mockResolvedValue(baseSettings);
        saveTabActivity.mockResolvedValue();
        const { initTabTracker, updateTabActivity } = await importTracker();
        await initTabTracker();

        updateTabActivity(1);
        updateTabActivity(1);
        updateTabActivity(2);
        expect(saveTabActivity).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1100);
        expect(saveTabActivity).toHaveBeenCalledTimes(1);
        const saved = saveTabActivity.mock.calls[0][0];
        expect(Object.keys(saved).sort()).toEqual(["1", "2"]);
      } finally {
        vi.useRealTimers();
      }
    });

    it("removeTabActivity drops the entry", async () => {
      getTabActivity.mockResolvedValue({ 1: 1, 2: 2 });
      getSettings.mockResolvedValue(baseSettings);
      saveTabActivity.mockResolvedValue();
      const { initTabTracker, removeTabActivity, getTabActivityMap } = await importTracker();
      await initTabTracker();

      removeTabActivity(1);
      expect(getTabActivityMap()).toEqual({ 2: 2 });
    });
  });

  describe("getLRUSortedTabs", () => {
    it("returns tab IDs ordered by oldest activity first", async () => {
      getTabActivity.mockResolvedValue({ 10: 3000, 20: 1000, 30: 2000 });
      getSettings.mockResolvedValue(baseSettings);
      const { initTabTracker, getLRUSortedTabs } = await importTracker();
      await initTabTracker();

      expect(getLRUSortedTabs()).toEqual([20, 30, 10]);
    });
  });

  describe("checkAndUnloadInactiveTabs", () => {
    const setupTracker = async (activity, settings = baseSettings) => {
      getTabActivity.mockResolvedValue(activity);
      getSettings.mockResolvedValue(settings);
      const mod = await importTracker();
      await mod.initTabTracker();
      return mod;
    };

    it("returns 0 when delay is 0", async () => {
      const { checkAndUnloadInactiveTabs } = await setupTracker(
        {},
        {
          ...baseSettings,
          unloadDelayMinutes: 0,
        },
      );
      expect(await checkAndUnloadInactiveTabs()).toBe(0);
    });

    it("skips when offline + skipWhenOffline true", async () => {
      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
      const { checkAndUnloadInactiveTabs } = await setupTracker(
        { 1: 0 },
        {
          ...baseSettings,
          skipWhenOffline: true,
        },
      );
      expect(await checkAndUnloadInactiveTabs()).toBe(0);
      expect(discardTab).not.toHaveBeenCalled();
    });

    it("skips when idle-only mode and user is active", async () => {
      chrome.idle.queryState.mockResolvedValue("active");
      const { checkAndUnloadInactiveTabs } = await setupTracker(
        { 1: 0 },
        {
          ...baseSettings,
          onlyDiscardWhenIdle: true,
        },
      );
      expect(await checkAndUnloadInactiveTabs()).toBe(0);
    });

    it("proceeds when idle-only mode and user is idle", async () => {
      const oldTime = Date.now() - 60 * 60 * 1000; // 1 hour ago
      chrome.idle.queryState.mockResolvedValue("idle");
      chrome.tabs.query.mockResolvedValue([
        { id: 1, url: "https://a.com", active: false, discarded: false, title: "A" },
      ]);
      isUrlBlacklisted.mockReturnValue(false);
      isTabSnoozed.mockResolvedValue(false);
      getSnoozeData.mockResolvedValue({ tabs: {}, domains: {} });
      discardTab.mockResolvedValue(true);

      const { checkAndUnloadInactiveTabs } = await setupTracker(
        { 1: oldTime },
        { ...baseSettings, onlyDiscardWhenIdle: true },
      );

      const result = await checkAndUnloadInactiveTabs();
      expect(result).toBe(1);
    });

    it("respects minTabsBeforeAutoDiscard threshold", async () => {
      const oldTime = Date.now() - 60 * 60 * 1000;
      chrome.tabs.query.mockResolvedValue([
        { id: 1, url: "https://a.com", active: false, discarded: false },
        { id: 2, url: "https://b.com", active: false, discarded: false },
      ]);
      isUrlBlacklisted.mockReturnValue(false);
      isTabSnoozed.mockResolvedValue(false);
      getSnoozeData.mockResolvedValue({ tabs: {}, domains: {} });

      const { checkAndUnloadInactiveTabs } = await setupTracker(
        { 1: oldTime, 2: oldTime },
        { ...baseSettings, minTabsBeforeAutoDiscard: 5 },
      );

      expect(await checkAndUnloadInactiveTabs()).toBe(0);
      expect(discardTab).not.toHaveBeenCalled();
    });

    it("unloads tabs whose lastActive exceeds effective delay", async () => {
      const cutoff = 30 * 60 * 1000;
      const recentTime = Date.now() - cutoff / 2; // recent: skip
      const oldTime = Date.now() - cutoff * 2; // old: unload

      chrome.tabs.query.mockResolvedValue([
        { id: 1, url: "https://recent.com", active: false, discarded: false, title: "Recent" },
        { id: 2, url: "https://old.com", active: false, discarded: false, title: "Old" },
      ]);
      isUrlBlacklisted.mockReturnValue(false);
      isTabSnoozed.mockResolvedValue(false);
      getSnoozeData.mockResolvedValue({ tabs: {}, domains: {} });
      discardTab.mockResolvedValue(true);

      const { checkAndUnloadInactiveTabs } = await setupTracker({ 1: recentTime, 2: oldTime });

      const count = await checkAndUnloadInactiveTabs();
      expect(count).toBe(1);
      expect(discardTab).toHaveBeenCalledWith(2, expect.objectContaining({ auto: true }));
      expect(discardTab).not.toHaveBeenCalledWith(1, expect.anything());
    });

    it("immediately unloads blacklisted tabs regardless of recency", async () => {
      const recentTime = Date.now() - 1000;
      chrome.tabs.query.mockResolvedValue([
        { id: 1, url: "https://blacklisted.com", active: false, discarded: false, title: "X" },
      ]);
      isUrlBlacklisted.mockReturnValue(true);
      isTabSnoozed.mockResolvedValue(false);
      getSnoozeData.mockResolvedValue({ tabs: {}, domains: {} });
      discardTab.mockResolvedValue(true);

      const { checkAndUnloadInactiveTabs } = await setupTracker({ 1: recentTime });
      expect(await checkAndUnloadInactiveTabs()).toBe(1);
    });

    it("whitelist wins over blacklist - never unloads", async () => {
      const oldTime = Date.now() - 60 * 60 * 1000;
      chrome.tabs.query.mockResolvedValue([
        { id: 1, url: "https://both.com", active: false, discarded: false, title: "X" },
      ]);
      isUrlWhitelisted.mockReturnValue(true);
      isUrlBlacklisted.mockReturnValue(true);
      isTabSnoozed.mockResolvedValue(false);
      getSnoozeData.mockResolvedValue({ tabs: {}, domains: {} });

      const { checkAndUnloadInactiveTabs } = await setupTracker({ 1: oldTime });
      expect(await checkAndUnloadInactiveTabs()).toBe(0);
      expect(discardTab).not.toHaveBeenCalled();
    });

    it("skips tabs that are active or already discarded", async () => {
      const oldTime = Date.now() - 60 * 60 * 1000;
      chrome.tabs.query.mockResolvedValue([
        { id: 1, url: "https://a.com", active: true, discarded: false },
        { id: 2, url: "https://b.com", active: false, discarded: true },
      ]);
      isUrlBlacklisted.mockReturnValue(false);
      isTabSnoozed.mockResolvedValue(false);
      getSnoozeData.mockResolvedValue({ tabs: {}, domains: {} });

      const { checkAndUnloadInactiveTabs } = await setupTracker({ 1: oldTime, 2: oldTime });
      expect(await checkAndUnloadInactiveTabs()).toBe(0);
      expect(discardTab).not.toHaveBeenCalled();
    });

    it("skips snoozed tabs", async () => {
      const oldTime = Date.now() - 60 * 60 * 1000;
      chrome.tabs.query.mockResolvedValue([
        { id: 1, url: "https://a.com", active: false, discarded: false },
      ]);
      isUrlBlacklisted.mockReturnValue(false);
      isTabSnoozed.mockResolvedValue(true);
      getSnoozeData.mockResolvedValue({ tabs: { 1: { until: -1 } }, domains: {} });

      const { checkAndUnloadInactiveTabs } = await setupTracker({ 1: oldTime });
      expect(await checkAndUnloadInactiveTabs()).toBe(0);
      expect(discardTab).not.toHaveBeenCalled();
    });

    it("notifies user when notifyOnAutoUnload is enabled", async () => {
      const oldTime = Date.now() - 60 * 60 * 1000;
      chrome.tabs.query.mockResolvedValue([
        { id: 1, url: "https://a.com", active: false, discarded: false, title: "Title" },
      ]);
      isUrlBlacklisted.mockReturnValue(false);
      isTabSnoozed.mockResolvedValue(false);
      getSnoozeData.mockResolvedValue({ tabs: {}, domains: {} });
      discardTab.mockResolvedValue(true);

      const { checkAndUnloadInactiveTabs } = await setupTracker(
        { 1: oldTime },
        { ...baseSettings, notifyOnAutoUnload: true },
      );

      await checkAndUnloadInactiveTabs();
      expect(notifyAutoUnload).toHaveBeenCalledWith("Title", "timer", expect.any(String));
    });
  });

  describe("cleanupStaleActivity", () => {
    it("removes activity entries for tabs that no longer exist", async () => {
      getTabActivity.mockResolvedValue({ 1: 1, 2: 2, 3: 3 });
      getSettings.mockResolvedValue(baseSettings);
      saveTabActivity.mockResolvedValue();
      chrome.tabs.query.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const { initTabTracker, cleanupStaleActivity, getTabActivityMap } = await importTracker();
      await initTabTracker();

      await cleanupStaleActivity();

      expect(getTabActivityMap()).toEqual({ 1: 1, 2: 2 });
      expect(saveTabActivity).toHaveBeenCalled();
    });

    it("does not write when nothing was cleaned", async () => {
      getTabActivity.mockResolvedValue({ 1: 1 });
      getSettings.mockResolvedValue(baseSettings);
      saveTabActivity.mockResolvedValue();
      chrome.tabs.query.mockResolvedValue([{ id: 1 }]);

      const { initTabTracker, cleanupStaleActivity } = await importTracker();
      await initTabTracker();
      saveTabActivity.mockClear();

      await cleanupStaleActivity();
      expect(saveTabActivity).not.toHaveBeenCalled();
    });
  });

  describe("syncAllTabs", () => {
    it("seeds activity for new tabs (active=now, others=now-60s)", async () => {
      vi.useFakeTimers();
      try {
        const fixedNow = 1700000000000;
        vi.setSystemTime(fixedNow);
        getTabActivity.mockResolvedValue({});
        getSettings.mockResolvedValue(baseSettings);
        saveTabActivity.mockResolvedValue();
        chrome.tabs.query.mockResolvedValue([
          { id: 1, active: true },
          { id: 2, active: false },
        ]);

        const { initTabTracker, syncAllTabs, getTabActivityMap } = await importTracker();
        await initTabTracker();

        await syncAllTabs();

        const map = getTabActivityMap();
        expect(map[1]).toBe(fixedNow);
        expect(map[2]).toBe(fixedNow - 60000);
      } finally {
        vi.useRealTimers();
      }
    });

    it("does not overwrite existing entries", async () => {
      getTabActivity.mockResolvedValue({ 1: 999 });
      getSettings.mockResolvedValue(baseSettings);
      saveTabActivity.mockResolvedValue();
      chrome.tabs.query.mockResolvedValue([{ id: 1, active: true }]);

      const { initTabTracker, syncAllTabs, getTabActivityMap } = await importTracker();
      await initTabTracker();

      await syncAllTabs();
      expect(getTabActivityMap()[1]).toBe(999);
    });
  });
});
