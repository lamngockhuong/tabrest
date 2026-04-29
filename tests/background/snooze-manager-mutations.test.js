import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelDomainSnooze,
  cancelTabSnooze,
  cleanupExpiredSnooze,
  getActiveSnoozes,
  getSnoozeData,
  snoozeDomain,
  snoozeTab,
} from "../../src/background/snooze-manager.js";
import { SNOOZE_KEY } from "../../src/shared/constants.js";

describe("snooze-manager (mutations)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1700000000000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getSnoozeData", () => {
    it("returns empty buckets when no data stored", async () => {
      chrome.storage.local.get.mockResolvedValue({});
      expect(await getSnoozeData()).toEqual({ tabs: {}, domains: {} });
    });

    it("returns stored data", async () => {
      const data = { tabs: { 1: { until: 999 } }, domains: { "a.com": { until: -1 } } };
      chrome.storage.local.get.mockResolvedValue({ [SNOOZE_KEY]: data });
      expect(await getSnoozeData()).toEqual(data);
    });
  });

  describe("snoozeTab", () => {
    it("stores absolute expiry for finite minutes", async () => {
      chrome.storage.local.get.mockResolvedValue({ [SNOOZE_KEY]: { tabs: {}, domains: {} } });
      chrome.storage.local.set.mockResolvedValue();

      await snoozeTab(123, 30);

      const written = chrome.storage.local.set.mock.calls[0][0][SNOOZE_KEY];
      expect(written.tabs[123]).toEqual({ until: Date.now() + 30 * 60 * 1000 });
    });

    it("stores -1 sentinel for forever", async () => {
      chrome.storage.local.get.mockResolvedValue({ [SNOOZE_KEY]: { tabs: {}, domains: {} } });
      chrome.storage.local.set.mockResolvedValue();

      await snoozeTab(7, -1);

      const written = chrome.storage.local.set.mock.calls[0][0][SNOOZE_KEY];
      expect(written.tabs[7]).toEqual({ until: -1 });
    });
  });

  describe("snoozeDomain", () => {
    it("stores absolute expiry", async () => {
      chrome.storage.local.get.mockResolvedValue({ [SNOOZE_KEY]: { tabs: {}, domains: {} } });
      chrome.storage.local.set.mockResolvedValue();

      await snoozeDomain("a.com", 60);

      const written = chrome.storage.local.set.mock.calls[0][0][SNOOZE_KEY];
      expect(written.domains["a.com"]).toEqual({ until: Date.now() + 60 * 60 * 1000 });
    });

    it("stores forever sentinel", async () => {
      chrome.storage.local.get.mockResolvedValue({ [SNOOZE_KEY]: { tabs: {}, domains: {} } });
      chrome.storage.local.set.mockResolvedValue();

      await snoozeDomain("a.com", -1);
      const written = chrome.storage.local.set.mock.calls[0][0][SNOOZE_KEY];
      expect(written.domains["a.com"].until).toBe(-1);
    });
  });

  describe("cleanupExpiredSnooze", () => {
    it("removes only expired entries and writes once when changes happen", async () => {
      const now = Date.now();
      chrome.storage.local.get.mockResolvedValue({
        [SNOOZE_KEY]: {
          tabs: {
            1: { until: now - 1000 }, // expired
            2: { until: now + 60000 }, // active
            3: { until: -1 }, // forever
          },
          domains: {
            "old.com": { until: now - 5000 }, // expired
            "live.com": { until: now + 5000 }, // active
          },
        },
      });
      chrome.storage.local.set.mockResolvedValue();

      await cleanupExpiredSnooze();

      const written = chrome.storage.local.set.mock.calls[0][0][SNOOZE_KEY];
      expect(written.tabs).toEqual({
        2: { until: now + 60000 },
        3: { until: -1 },
      });
      expect(written.domains).toEqual({ "live.com": { until: now + 5000 } });
    });

    it("does not write when nothing expired", async () => {
      const now = Date.now();
      chrome.storage.local.get.mockResolvedValue({
        [SNOOZE_KEY]: {
          tabs: { 1: { until: now + 1000 } },
          domains: { "a.com": { until: -1 } },
        },
      });
      chrome.storage.local.set.mockResolvedValue();

      await cleanupExpiredSnooze();

      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });
  });

  describe("cancelTabSnooze / cancelDomainSnooze", () => {
    it("cancelTabSnooze removes the entry and writes", async () => {
      chrome.storage.local.get.mockResolvedValue({
        [SNOOZE_KEY]: { tabs: { 1: { until: -1 } }, domains: {} },
      });
      chrome.storage.local.set.mockResolvedValue();

      await cancelTabSnooze(1);

      const written = chrome.storage.local.set.mock.calls[0][0][SNOOZE_KEY];
      expect(written.tabs).toEqual({});
    });

    it("cancelTabSnooze is a no-op when not snoozed", async () => {
      chrome.storage.local.get.mockResolvedValue({ [SNOOZE_KEY]: { tabs: {}, domains: {} } });
      await cancelTabSnooze(1);
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });

    it("cancelDomainSnooze removes the entry", async () => {
      chrome.storage.local.get.mockResolvedValue({
        [SNOOZE_KEY]: { tabs: {}, domains: { "a.com": { until: -1 } } },
      });
      chrome.storage.local.set.mockResolvedValue();

      await cancelDomainSnooze("a.com");

      const written = chrome.storage.local.set.mock.calls[0][0][SNOOZE_KEY];
      expect(written.domains).toEqual({});
    });

    it("cancelDomainSnooze is a no-op when not snoozed", async () => {
      chrome.storage.local.get.mockResolvedValue({ [SNOOZE_KEY]: { tabs: {}, domains: {} } });
      await cancelDomainSnooze("a.com");
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });
  });

  describe("getActiveSnoozes", () => {
    it("returns only active entries with normalized shape", async () => {
      const now = Date.now();
      chrome.storage.local.get.mockResolvedValue({
        [SNOOZE_KEY]: {
          tabs: {
            5: { until: now - 1000 }, // expired
            6: { until: now + 1000 }, // active
            7: { until: -1 }, // forever
          },
          domains: {
            "old.com": { until: now - 1 },
            "live.com": { until: now + 1000 },
          },
        },
      });

      const result = await getActiveSnoozes();
      expect(result.tabs).toEqual([
        { tabId: 6, until: now + 1000 },
        { tabId: 7, until: -1 },
      ]);
      expect(result.domains).toEqual([{ domain: "live.com", until: now + 1000 }]);
    });
  });
});
