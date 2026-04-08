import { describe, it, expect, vi, beforeEach } from "vitest";
import { SETTINGS_DEFAULTS, STORAGE_KEYS } from "../../src/shared/constants.js";

// Fresh import needed per test to reset module-level settingsCache
const importStorage = () => import("../../src/shared/storage.js");

describe("storage", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("getSettings", () => {
    it("returns defaults when storage is empty", async () => {
      chrome.storage.sync.get.mockResolvedValue({});
      const { getSettings } = await importStorage();

      const settings = await getSettings();

      expect(settings.unloadDelayMinutes).toBe(SETTINGS_DEFAULTS.unloadDelayMinutes);
      expect(settings.memoryThresholdPercent).toBe(SETTINGS_DEFAULTS.memoryThresholdPercent);
    });

    it("merges stored settings with defaults", async () => {
      chrome.storage.sync.get.mockResolvedValue({
        [STORAGE_KEYS.SETTINGS]: { unloadDelayMinutes: 60 },
      });
      const { getSettings } = await importStorage();

      const settings = await getSettings();

      expect(settings.unloadDelayMinutes).toBe(60);
      expect(settings.memoryThresholdPercent).toBe(SETTINGS_DEFAULTS.memoryThresholdPercent);
    });

    it("caches settings after first call", async () => {
      chrome.storage.sync.get.mockResolvedValue({});
      const { getSettings } = await importStorage();

      await getSettings();
      await getSettings();

      expect(chrome.storage.sync.get).toHaveBeenCalledTimes(1);
    });
  });

  describe("saveSettings", () => {
    it("saves settings to sync storage", async () => {
      chrome.storage.sync.set.mockResolvedValue();
      const { saveSettings } = await importStorage();

      await saveSettings({ unloadDelayMinutes: 45 });

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        [STORAGE_KEYS.SETTINGS]: { unloadDelayMinutes: 45 },
      });
    });
  });

  describe("getTabActivity", () => {
    it("returns empty object when no activity stored", async () => {
      chrome.storage.local.get.mockResolvedValue({});
      const { getTabActivity } = await importStorage();

      const activity = await getTabActivity();

      expect(activity).toEqual({});
    });

    it("returns stored tab activity", async () => {
      const mockActivity = { 123: Date.now(), 456: Date.now() - 1000 };
      chrome.storage.local.get.mockResolvedValue({
        [STORAGE_KEYS.TAB_ACTIVITY]: mockActivity,
      });
      const { getTabActivity } = await importStorage();

      const activity = await getTabActivity();

      expect(activity).toEqual(mockActivity);
    });
  });

  describe("saveTabActivity", () => {
    it("saves activity to local storage", async () => {
      chrome.storage.local.set.mockResolvedValue();
      const { saveTabActivity } = await importStorage();

      await saveTabActivity({ 123: Date.now() });

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({ [STORAGE_KEYS.TAB_ACTIVITY]: expect.any(Object) }),
      );
    });
  });
});
