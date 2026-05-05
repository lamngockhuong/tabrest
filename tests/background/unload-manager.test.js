import { afterEach, describe, expect, it, vi } from "vitest";
import { STARTUP_DISCARD_DELAY_MS } from "../../src/shared/constants.js";

vi.mock("../../src/shared/storage.js", () => ({
  getSettings: vi.fn(),
}));

vi.mock("../../src/background/form-injector.js", () => ({
  ensureFormCheckerInjected: vi.fn(() => Promise.resolve(true)),
}));

vi.mock("../../src/background/stats-collector.js", () => ({
  recordUnload: vi.fn(),
}));

import { ensureFormCheckerInjected } from "../../src/background/form-injector.js";
import { recordUnload } from "../../src/background/stats-collector.js";
import {
  closeDuplicateTabs,
  discardAllTabsOnStartup,
  discardCurrentTab,
  discardOtherTabs,
  discardTab,
  discardTabGroup,
  discardTabsToLeft,
  discardTabsToRight,
  isUrlBlacklisted,
  isUrlWhitelisted,
} from "../../src/background/unload-manager.js";
import { getSettings } from "../../src/shared/storage.js";

const baseSettings = {
  unloadPinnedTabs: false,
  protectAudioTabs: true,
  protectFormTabs: false,
  showSuspendWarning: false,
  saveYouTubeTimestamp: false,
  restoreScrollPosition: false,
  showDiscardedPrefix: false,
  discardedPrefix: "",
  enableStats: false,
  whitelist: [],
  blacklist: [],
  autoUnloadOnStartup: true,
};

// Wires chrome.tabs.{query,get,update,discard} against the supplied window
// list. tabs.update flips active state so a follow-up tabs.get sees the
// previously-active tab as inactive (mirrors real Chrome behavior).
function setupWindowTabs(tabs, { settings = baseSettings } = {}) {
  chrome.tabs.query.mockImplementation((q) => {
    if (q.active) {
      const active = tabs.find((t) => t.active);
      return Promise.resolve(active ? [active] : []);
    }
    return Promise.resolve(tabs);
  });
  chrome.tabs.get.mockImplementation((id) => {
    const t = tabs.find((tab) => tab.id === id);
    return t ? Promise.resolve(t) : Promise.reject(new Error(`No tab with id ${id}`));
  });
  chrome.tabs.update.mockImplementation((id, props) => {
    if (props?.active === true) {
      for (const t of tabs) t.active = t.id === id;
    }
    return Promise.resolve(tabs.find((t) => t.id === id) || null);
  });
  chrome.tabs.discard.mockResolvedValue();
  getSettings.mockResolvedValue(settings);
}

describe("unload-manager", () => {
  // Global setup.js handles mock reset via vi.clearAllMocks() in beforeEach.

  describe("isUrlWhitelisted / isUrlBlacklisted", () => {
    it("checks against settings.whitelist", () => {
      const settings = { whitelist: ["a.com"] };
      expect(isUrlWhitelisted("https://a.com/x", settings)).toBe(true);
      expect(isUrlWhitelisted("https://b.com", settings)).toBe(false);
    });

    it("checks against settings.blacklist", () => {
      const settings = { blacklist: ["bad.com"] };
      expect(isUrlBlacklisted("https://bad.com", settings)).toBe(true);
      expect(isUrlBlacklisted("https://ok.com", settings)).toBe(false);
    });
  });

  describe("discardTab", () => {
    it("returns false when tab is active", async () => {
      chrome.tabs.get.mockResolvedValue({ id: 1, active: true });
      expect(await discardTab(1, { settings: baseSettings })).toBe(false);
      expect(chrome.tabs.discard).not.toHaveBeenCalled();
    });

    it("returns false when tab is already discarded", async () => {
      chrome.tabs.get.mockResolvedValue({ id: 1, discarded: true });
      expect(await discardTab(1, { settings: baseSettings })).toBe(false);
    });

    it("respects pinned protection", async () => {
      chrome.tabs.get.mockResolvedValue({
        id: 1,
        pinned: true,
        url: "https://a.com",
      });
      expect(await discardTab(1, { settings: baseSettings })).toBe(false);
      expect(chrome.tabs.discard).not.toHaveBeenCalled();
    });

    it("unloads pinned when unloadPinnedTabs enabled", async () => {
      chrome.tabs.get.mockResolvedValue({
        id: 1,
        pinned: true,
        url: "https://a.com",
        active: false,
        discarded: false,
      });
      chrome.tabs.discard.mockResolvedValue();
      const settings = { ...baseSettings, unloadPinnedTabs: true };
      expect(await discardTab(1, { settings })).toBe(true);
      expect(chrome.tabs.discard).toHaveBeenCalledWith(1);
    });

    it("respects whitelist", async () => {
      chrome.tabs.get.mockResolvedValue({
        id: 1,
        url: "https://protected.com/page",
        active: false,
      });
      const settings = { ...baseSettings, whitelist: ["protected.com"] };
      expect(await discardTab(1, { settings })).toBe(false);
    });

    it("skips audible tabs when protectAudioTabs is true", async () => {
      chrome.tabs.get.mockResolvedValue({
        id: 1,
        url: "https://a.com",
        audible: true,
        active: false,
      });
      expect(await discardTab(1, { settings: baseSettings })).toBe(false);
    });

    it("skips when form checker reports unsaved data", async () => {
      chrome.tabs.get.mockResolvedValue({
        id: 1,
        url: "https://a.com",
        active: false,
      });
      ensureFormCheckerInjected.mockResolvedValue(true);
      chrome.tabs.sendMessage.mockResolvedValue({ hasFormData: true });

      const settings = { ...baseSettings, protectFormTabs: true };
      expect(await discardTab(1, { settings })).toBe(false);
    });

    it("force=true bypasses all protections", async () => {
      chrome.tabs.get.mockResolvedValue({
        id: 1,
        url: "https://a.com",
        pinned: true,
        audible: true,
        active: false,
        discarded: false,
      });
      chrome.tabs.discard.mockResolvedValue();

      const settings = { ...baseSettings, whitelist: ["a.com"] };
      expect(await discardTab(1, { settings, force: true })).toBe(true);
      expect(chrome.tabs.discard).toHaveBeenCalledWith(1);
    });

    it("fetches settings when not provided", async () => {
      chrome.tabs.get.mockResolvedValue({
        id: 1,
        url: "https://a.com",
        active: false,
        discarded: false,
      });
      chrome.tabs.discard.mockResolvedValue();
      getSettings.mockResolvedValue(baseSettings);

      const result = await discardTab(1);
      expect(result).toBe(true);
      expect(getSettings).toHaveBeenCalledTimes(1);
    });

    it("records stats when enableStats enabled", async () => {
      chrome.tabs.get.mockResolvedValue({
        id: 1,
        url: "https://a.com",
        active: false,
      });
      chrome.tabs.discard.mockResolvedValue();
      const settings = { ...baseSettings, enableStats: true };

      expect(await discardTab(1, { settings })).toBe(true);
      expect(recordUnload).toHaveBeenCalledWith(1);
    });

    it("returns false silently when tab no longer exists", async () => {
      chrome.tabs.get.mockRejectedValue(new Error("No tab with id 99"));
      const result = await discardTab(99, { settings: baseSettings });
      expect(result).toBe(false);
    });

    it("calls scripting.executeScript when showDiscardedPrefix enabled", async () => {
      chrome.tabs.get.mockResolvedValue({
        id: 1,
        url: "https://a.com",
        active: false,
      });
      chrome.tabs.discard.mockResolvedValue();
      chrome.scripting.executeScript.mockResolvedValue([]);
      const settings = { ...baseSettings, showDiscardedPrefix: true, discardedPrefix: "💤" };

      expect(await discardTab(1, { settings })).toBe(true);
      expect(chrome.scripting.executeScript).toHaveBeenCalled();
    });
  });

  describe("discardCurrentTab", () => {
    it("returns false when no active tab", async () => {
      chrome.tabs.query.mockResolvedValue([]);
      expect(await discardCurrentTab()).toBe(false);
    });

    it("switches to next tab and discards previous active", async () => {
      setupWindowTabs([
        { id: 1, url: "https://prev.com", active: false, discarded: false },
        { id: 2, url: "https://a.com", active: true, discarded: false },
        { id: 3, url: "https://next.com", active: false, discarded: false },
      ]);

      const result = await discardCurrentTab();
      expect(result).toBe(true);
      expect(chrome.tabs.update).toHaveBeenCalledWith(3, { active: true });
    });

    it("falls back to previous tab when active is last", async () => {
      setupWindowTabs([
        { id: 1, url: "https://prev.com", active: false, discarded: false },
        { id: 2, url: "https://a.com", active: true, discarded: false },
      ]);

      await discardCurrentTab();
      expect(chrome.tabs.update).toHaveBeenCalledWith(1, { active: true });
    });

    it("returns false when active is the only tab", async () => {
      setupWindowTabs([{ id: 1, url: "https://a.com", active: true, discarded: false }]);
      expect(await discardCurrentTab()).toBe(false);
    });
  });

  describe("discardTabsToRight / discardTabsToLeft", () => {
    const fourTabsActiveSecond = () => [
      { id: 1, url: "https://a.com", active: false, discarded: false },
      { id: 2, url: "https://b.com", active: true, discarded: false },
      { id: 3, url: "https://c.com", active: false, discarded: false },
      { id: 4, url: "https://d.com", active: false, discarded: false },
    ];

    it("discards only tabs to the right of active", async () => {
      setupWindowTabs(fourTabsActiveSecond());
      const count = await discardTabsToRight();
      expect(count).toBe(2);
      expect(chrome.tabs.discard).toHaveBeenCalledWith(3);
      expect(chrome.tabs.discard).toHaveBeenCalledWith(4);
      expect(chrome.tabs.discard).not.toHaveBeenCalledWith(1);
    });

    it("discards only tabs to the left of active", async () => {
      setupWindowTabs(fourTabsActiveSecond());
      const count = await discardTabsToLeft();
      expect(count).toBe(1);
      expect(chrome.tabs.discard).toHaveBeenCalledWith(1);
    });

    it("returns 0 when no active tab", async () => {
      setupWindowTabs([]);
      expect(await discardTabsToRight()).toBe(0);
      expect(await discardTabsToLeft()).toBe(0);
    });
  });

  describe("discardOtherTabs", () => {
    it("skips active tab and discards the rest", async () => {
      setupWindowTabs([
        { id: 1, url: "https://a.com", active: false, discarded: false },
        { id: 2, url: "https://b.com", active: true, discarded: false },
        { id: 3, url: "https://c.com", active: false, discarded: false },
      ]);

      const count = await discardOtherTabs();
      expect(count).toBe(2);
      expect(chrome.tabs.discard).not.toHaveBeenCalledWith(2);
    });
  });

  describe("discardAllTabsOnStartup", () => {
    afterEach(() => vi.useRealTimers());

    it("returns 0 when autoUnloadOnStartup is disabled", async () => {
      getSettings.mockResolvedValue({ ...baseSettings, autoUnloadOnStartup: false });
      expect(await discardAllTabsOnStartup()).toBe(0);
    });

    it("discards non-active tabs across all windows after delay", async () => {
      vi.useFakeTimers();
      setupWindowTabs([
        { id: 1, url: "https://a.com", active: false, discarded: false },
        { id: 2, url: "https://b.com", active: true, discarded: false },
        { id: 3, url: "https://c.com", active: false, discarded: false },
      ]);

      const promise = discardAllTabsOnStartup();
      await vi.advanceTimersByTimeAsync(STARTUP_DISCARD_DELAY_MS);
      const result = await promise;

      expect(result).toBe(2);
      expect(chrome.tabs.discard).toHaveBeenCalledWith(1);
      expect(chrome.tabs.discard).toHaveBeenCalledWith(3);
      expect(chrome.tabs.discard).not.toHaveBeenCalledWith(2);
    });

    it("force-discards protected tabs (pinned, whitelisted)", async () => {
      vi.useFakeTimers();
      setupWindowTabs(
        [
          { id: 1, url: "https://a.com", active: false, discarded: false, pinned: true },
          { id: 2, url: "https://b.com", active: true, discarded: false },
          { id: 3, url: "https://safe.com/page", active: false, discarded: false },
        ],
        { settings: { ...baseSettings, unloadPinnedTabs: false, whitelist: ["safe.com"] } },
      );

      const promise = discardAllTabsOnStartup();
      await vi.advanceTimersByTimeAsync(STARTUP_DISCARD_DELAY_MS);
      const result = await promise;

      expect(result).toBe(2);
      expect(chrome.tabs.discard).toHaveBeenCalledWith(1);
      expect(chrome.tabs.discard).toHaveBeenCalledWith(3);
    });

    it("skips already-discarded tabs", async () => {
      vi.useFakeTimers();
      setupWindowTabs([
        { id: 1, url: "https://a.com", active: false, discarded: true },
        { id: 2, url: "https://b.com", active: true, discarded: false },
        { id: 3, url: "https://c.com", active: false, discarded: false },
      ]);

      const promise = discardAllTabsOnStartup();
      await vi.advanceTimersByTimeAsync(STARTUP_DISCARD_DELAY_MS);
      const result = await promise;

      expect(result).toBe(1);
      expect(chrome.tabs.discard).toHaveBeenCalledWith(3);
      expect(chrome.tabs.discard).not.toHaveBeenCalledWith(1);
    });
  });

  describe("discardTabGroup", () => {
    it("rejects negative or non-integer group IDs", async () => {
      expect(await discardTabGroup(-1)).toBe(0);
      expect(await discardTabGroup("not-a-number")).toBe(0);
      expect(chrome.tabs.query).not.toHaveBeenCalled();
    });

    it("discards eligible tabs in group", async () => {
      // groupId query returns members; skipped tabs (active/discarded) bypass discardTab.
      // chrome.tabs.get returns a fresh non-active/non-discarded view for the discard pass.
      chrome.tabs.query.mockResolvedValue([
        { id: 1, active: false, discarded: false },
        { id: 2, active: true, discarded: false },
        { id: 3, active: false, discarded: true },
        { id: 4, active: false, discarded: false },
      ]);
      chrome.tabs.get.mockImplementation((id) =>
        Promise.resolve({ id, url: `https://${id}.com`, active: false, discarded: false }),
      );
      chrome.tabs.discard.mockResolvedValue();
      getSettings.mockResolvedValue(baseSettings);

      const count = await discardTabGroup(7);
      expect(count).toBe(2);
      expect(chrome.tabs.query).toHaveBeenCalledWith({ groupId: 7 });
    });
  });

  describe("closeDuplicateTabs", () => {
    it("returns 0 when no duplicates exist", async () => {
      chrome.tabs.query.mockResolvedValue([
        { id: 1, url: "https://a.com", index: 0 },
        { id: 2, url: "https://b.com", index: 1 },
      ]);
      const result = await closeDuplicateTabs();
      expect(result).toEqual({ closed: 0 });
      expect(chrome.tabs.remove).not.toHaveBeenCalled();
    });

    it("normalizes URLs (trailing slash, fragment, case) and closes dups", async () => {
      chrome.tabs.query.mockResolvedValue([
        { id: 1, url: "https://a.com/page", index: 0 },
        { id: 2, url: "https://A.COM/page/#frag", index: 1 },
        { id: 3, url: "https://other.com", index: 2 },
      ]);
      chrome.tabs.remove.mockResolvedValue();

      const result = await closeDuplicateTabs();
      expect(result.closed).toBe(1);
      expect(chrome.tabs.remove).toHaveBeenCalledWith([2]);
    });

    it("keeps pinned tab over others in duplicate group", async () => {
      chrome.tabs.query.mockResolvedValue([
        { id: 1, url: "https://a.com", index: 0 },
        { id: 2, url: "https://a.com", index: 1, pinned: true },
        { id: 3, url: "https://a.com", index: 2 },
      ]);
      chrome.tabs.remove.mockResolvedValue();

      const result = await closeDuplicateTabs();
      expect(result.closed).toBe(2);
      const closed = chrome.tabs.remove.mock.calls[0][0].sort();
      expect(closed).toEqual([1, 3]);
    });

    it("pinned beats active for keeper selection; non-pinned active gets closed", async () => {
      chrome.tabs.query.mockResolvedValue([
        { id: 1, url: "https://a.com", index: 0, active: true },
        { id: 2, url: "https://a.com", index: 1, pinned: true },
      ]);
      chrome.tabs.remove.mockResolvedValue();

      const result = await closeDuplicateTabs();
      expect(result.closed).toBe(1);
      expect(chrome.tabs.remove).toHaveBeenCalledWith([1]);
    });

    it("never closes a pinned duplicate even when another pinned is the keeper", async () => {
      chrome.tabs.query.mockResolvedValue([
        { id: 1, url: "https://a.com", index: 0, pinned: true },
        { id: 2, url: "https://a.com", index: 1, pinned: true },
      ]);
      chrome.tabs.remove.mockResolvedValue();

      const result = await closeDuplicateTabs();
      expect(result.closed).toBe(0);
    });

    it("ignores non-http URLs", async () => {
      chrome.tabs.query.mockResolvedValue([
        { id: 1, url: "chrome://extensions", index: 0 },
        { id: 2, url: "chrome://extensions", index: 1 },
      ]);
      const result = await closeDuplicateTabs();
      expect(result.closed).toBe(0);
    });

    it("returns 0 closed when chrome.tabs.remove rejects", async () => {
      chrome.tabs.query.mockResolvedValue([
        { id: 1, url: "https://a.com", index: 0 },
        { id: 2, url: "https://a.com", index: 1 },
      ]);
      chrome.tabs.remove.mockRejectedValue(new Error("No tab with id 2"));

      const result = await closeDuplicateTabs();
      expect(result.closed).toBe(0);
    });
  });
});
