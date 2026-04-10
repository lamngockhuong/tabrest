import { describe, it, expect, vi, beforeEach } from "vitest";
import { isTabSnoozed, getTabSnoozeInfo } from "../../src/background/snooze-manager.js";

describe("snooze-manager", () => {
  describe("isTabSnoozed with preloaded data", () => {
    const futureTime = Date.now() + 60 * 60 * 1000; // 1 hour from now
    const pastTime = Date.now() - 60 * 60 * 1000; // 1 hour ago

    describe("tab snooze", () => {
      it("returns true for snoozed tab with future expiry", async () => {
        const snoozeData = {
          tabs: { 123: { until: futureTime } },
          domains: {},
        };
        expect(await isTabSnoozed(123, "https://example.com", snoozeData)).toBe(true);
      });

      it("returns true for permanently snoozed tab (until = -1)", async () => {
        const snoozeData = {
          tabs: { 123: { until: -1 } },
          domains: {},
        };
        expect(await isTabSnoozed(123, "https://example.com", snoozeData)).toBe(true);
      });

      it("returns false for expired tab snooze", async () => {
        const snoozeData = {
          tabs: { 123: { until: pastTime } },
          domains: {},
        };
        expect(await isTabSnoozed(123, "https://example.com", snoozeData)).toBe(false);
      });

      it("returns false for non-snoozed tab", async () => {
        const snoozeData = {
          tabs: { 456: { until: futureTime } },
          domains: {},
        };
        expect(await isTabSnoozed(123, "https://example.com", snoozeData)).toBe(false);
      });
    });

    describe("domain snooze", () => {
      it("returns true for exact domain match", async () => {
        const snoozeData = {
          tabs: {},
          domains: { "example.com": { until: futureTime } },
        };
        expect(await isTabSnoozed(123, "https://example.com/page", snoozeData)).toBe(true);
      });

      it("returns true for subdomain match", async () => {
        const snoozeData = {
          tabs: {},
          domains: { "example.com": { until: futureTime } },
        };
        expect(await isTabSnoozed(123, "https://www.example.com/page", snoozeData)).toBe(true);
        expect(await isTabSnoozed(123, "https://sub.example.com/page", snoozeData)).toBe(true);
      });

      it("returns false for different domain", async () => {
        const snoozeData = {
          tabs: {},
          domains: { "example.com": { until: futureTime } },
        };
        expect(await isTabSnoozed(123, "https://other.com/page", snoozeData)).toBe(false);
      });

      it("returns false for domain that contains snoozed domain as substring", async () => {
        const snoozeData = {
          tabs: {},
          domains: { "example.com": { until: futureTime } },
        };
        // "fakeexample.com" contains "example.com" but is not a subdomain
        expect(await isTabSnoozed(123, "https://fakeexample.com/page", snoozeData)).toBe(false);
      });

      it("returns true for permanently snoozed domain", async () => {
        const snoozeData = {
          tabs: {},
          domains: { "example.com": { until: -1 } },
        };
        expect(await isTabSnoozed(123, "https://example.com/page", snoozeData)).toBe(true);
      });

      it("returns false for expired domain snooze", async () => {
        const snoozeData = {
          tabs: {},
          domains: { "example.com": { until: pastTime } },
        };
        expect(await isTabSnoozed(123, "https://example.com/page", snoozeData)).toBe(false);
      });
    });

    describe("priority: tab snooze over domain snooze", () => {
      it("tab snooze takes precedence when both exist", async () => {
        const snoozeData = {
          tabs: { 123: { until: futureTime } },
          domains: { "example.com": { until: futureTime } },
        };
        const info = await getTabSnoozeInfo(123, "https://example.com", snoozeData);
        expect(info.snoozed).toBe(true);
        expect(info.type).toBe("tab");
      });
    });

    describe("edge cases", () => {
      it("returns false for empty snooze data", async () => {
        const snoozeData = { tabs: {}, domains: {} };
        expect(await isTabSnoozed(123, "https://example.com", snoozeData)).toBe(false);
      });

      it("returns false for null URL", async () => {
        const snoozeData = {
          tabs: {},
          domains: { "example.com": { until: futureTime } },
        };
        expect(await isTabSnoozed(123, null, snoozeData)).toBe(false);
      });

      it("returns false for invalid URL", async () => {
        const snoozeData = {
          tabs: {},
          domains: { "example.com": { until: futureTime } },
        };
        expect(await isTabSnoozed(123, "not-a-valid-url", snoozeData)).toBe(false);
      });

      it("handles chrome:// URLs", async () => {
        const snoozeData = {
          tabs: {},
          domains: { "extensions": { until: futureTime } },
        };
        expect(await isTabSnoozed(123, "chrome://extensions", snoozeData)).toBe(true);
      });
    });
  });

  describe("getTabSnoozeInfo", () => {
    const futureTime = Date.now() + 60 * 60 * 1000;

    it("returns snooze info with type and until for tab snooze", async () => {
      const snoozeData = {
        tabs: { 123: { until: futureTime } },
        domains: {},
      };
      const info = await getTabSnoozeInfo(123, "https://example.com", snoozeData);
      expect(info).toEqual({
        snoozed: true,
        type: "tab",
        until: futureTime,
      });
    });

    it("returns snooze info with domain for domain snooze", async () => {
      const snoozeData = {
        tabs: {},
        domains: { "example.com": { until: futureTime } },
      };
      const info = await getTabSnoozeInfo(123, "https://example.com", snoozeData);
      expect(info).toEqual({
        snoozed: true,
        type: "domain",
        domain: "example.com",
        until: futureTime,
      });
    });

    it("returns snoozed: false for non-snoozed tab", async () => {
      const snoozeData = { tabs: {}, domains: {} };
      const info = await getTabSnoozeInfo(123, "https://example.com", snoozeData);
      expect(info).toEqual({ snoozed: false });
    });
  });
});
