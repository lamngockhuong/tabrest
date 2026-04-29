import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteSession,
  getSessions,
  importSessions,
  restoreSession,
  saveSession,
} from "../../src/background/session-manager.js";

const SESSIONS_KEY = "tabrest_sessions";

describe("session-manager", () => {
  beforeEach(() => {
    if (!globalThis.crypto?.randomUUID) {
      globalThis.crypto = { ...(globalThis.crypto || {}), randomUUID: () => "uuid-test" };
    }
  });

  describe("getSessions", () => {
    it("returns empty array when none stored", async () => {
      chrome.storage.local.get.mockResolvedValue({});
      expect(await getSessions()).toEqual([]);
    });

    it("returns stored sessions", async () => {
      const sessions = [{ id: "s1", name: "First", tabs: [] }];
      chrome.storage.local.get.mockResolvedValue({ [SESSIONS_KEY]: sessions });
      expect(await getSessions()).toEqual(sessions);
    });
  });

  describe("saveSession", () => {
    it("filters internal URLs and persists session at the front", async () => {
      chrome.storage.local.get.mockResolvedValue({ [SESSIONS_KEY]: [] });
      chrome.storage.local.set.mockResolvedValue();
      chrome.tabs.query.mockResolvedValue([
        { url: "https://a.com", title: "A", favIconUrl: "icon", pinned: true },
        { url: "chrome://extensions", title: "X" },
        { url: "about:blank", title: "Y" },
        { url: "https://b.com" },
      ]);

      const result = await saveSession("My session");

      expect(result.success).toBe(true);
      expect(result.session.name).toBe("My session");
      expect(result.session.tabs).toEqual([
        { url: "https://a.com", title: "A", favIconUrl: "icon", pinned: true },
        { url: "https://b.com", title: "Untitled", favIconUrl: "", pinned: false },
      ]);

      const written = chrome.storage.local.set.mock.calls[0][0][SESSIONS_KEY];
      expect(written[0]).toBe(result.session);
    });

    it("auto-generates name when omitted", async () => {
      chrome.storage.local.get.mockResolvedValue({ [SESSIONS_KEY]: [] });
      chrome.storage.local.set.mockResolvedValue();
      chrome.tabs.query.mockResolvedValue([{ url: "https://a.com" }]);

      const result = await saveSession();
      expect(result.success).toBe(true);
      expect(typeof result.session.name).toBe("string");
      expect(result.session.name.length).toBeGreaterThan(0);
    });

    it("truncates name to max length", async () => {
      chrome.storage.local.get.mockResolvedValue({ [SESSIONS_KEY]: [] });
      chrome.storage.local.set.mockResolvedValue();
      chrome.tabs.query.mockResolvedValue([{ url: "https://a.com" }]);

      const longName = "x".repeat(150);
      const result = await saveSession(longName);
      expect(result.session.name.length).toBe(100);
    });

    it("rejects when MAX_SESSIONS reached", async () => {
      const sessions = Array.from({ length: 20 }, (_, i) => ({
        id: `s${i}`,
        name: `n${i}`,
        tabs: [],
      }));
      chrome.storage.local.get.mockResolvedValue({ [SESSIONS_KEY]: sessions });
      chrome.tabs.query.mockResolvedValue([{ url: "https://a.com" }]);

      const result = await saveSession("New");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Maximum");
    });

    it("rejects when no saveable tabs in window", async () => {
      chrome.storage.local.get.mockResolvedValue({ [SESSIONS_KEY]: [] });
      chrome.tabs.query.mockResolvedValue([{ url: "chrome://extensions" }, { url: "" }]);

      const result = await saveSession();
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/No saveable/);
    });
  });

  describe("deleteSession", () => {
    it("removes the matching session", async () => {
      const sessions = [
        { id: "s1", name: "a", tabs: [] },
        { id: "s2", name: "b", tabs: [] },
      ];
      chrome.storage.local.get.mockResolvedValue({ [SESSIONS_KEY]: sessions });
      chrome.storage.local.set.mockResolvedValue();

      const result = await deleteSession("s1");
      expect(result.success).toBe(true);
      const written = chrome.storage.local.set.mock.calls[0][0][SESSIONS_KEY];
      expect(written).toEqual([sessions[1]]);
    });
  });

  describe("restoreSession", () => {
    it("returns error when session ID missing", async () => {
      chrome.storage.local.get.mockResolvedValue({ [SESSIONS_KEY]: [] });
      const result = await restoreSession("missing");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not found/);
    });

    it("returns error when no restorable tabs", async () => {
      const sessions = [
        { id: "s1", name: "a", tabs: [{ url: "chrome://extensions" }, { url: "" }] },
      ];
      chrome.storage.local.get.mockResolvedValue({ [SESSIONS_KEY]: sessions });
      const result = await restoreSession("s1");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/No restorable/);
    });

    it("opens tabs without closing existing in 'open' mode (default)", async () => {
      const sessions = [
        {
          id: "s1",
          name: "a",
          tabs: [
            { url: "https://a.com", pinned: true },
            { url: "https://b.com", pinned: false },
          ],
        },
      ];
      chrome.storage.local.get.mockResolvedValue({ [SESSIONS_KEY]: sessions });
      chrome.tabs.create.mockResolvedValue({ id: 99 });

      const result = await restoreSession("s1");

      expect(result).toEqual({ success: true, count: 2 });
      expect(chrome.tabs.create).toHaveBeenCalledTimes(2);
      expect(chrome.tabs.remove).not.toHaveBeenCalled();
    });

    it("replaces window in 'replace' mode", async () => {
      const sessions = [
        {
          id: "s1",
          name: "a",
          tabs: [
            { url: "https://a.com", pinned: false },
            { url: "https://b.com", pinned: false },
          ],
        },
      ];
      chrome.storage.local.get.mockResolvedValue({ [SESSIONS_KEY]: sessions });
      chrome.tabs.query.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      chrome.tabs.create.mockResolvedValue({ id: 99 });
      chrome.tabs.remove.mockResolvedValue();

      const result = await restoreSession("s1", "replace");

      expect(result.count).toBe(2);
      expect(chrome.tabs.remove).toHaveBeenCalledWith([1, 2]);
      expect(chrome.tabs.create).toHaveBeenCalledTimes(2);
    });

    it("replace mode does not call tabs.remove when no old tabs to close", async () => {
      const sessions = [{ id: "s1", name: "a", tabs: [{ url: "https://a.com", pinned: false }] }];
      chrome.storage.local.get.mockResolvedValue({ [SESSIONS_KEY]: sessions });
      chrome.tabs.query.mockResolvedValue([]);
      chrome.tabs.create.mockResolvedValue({ id: 99 });

      const result = await restoreSession("s1", "replace");
      expect(result.count).toBe(1);
      expect(chrome.tabs.remove).not.toHaveBeenCalled();
    });
  });

  describe("importSessions", () => {
    it("returns 0/0 for non-array input", async () => {
      expect(await importSessions(null)).toEqual({ added: 0, skipped: 0 });
      expect(await importSessions({})).toEqual({ added: 0, skipped: 0 });
    });

    it("imports valid sessions and skips duplicates by name", async () => {
      chrome.storage.local.get.mockResolvedValue({
        [SESSIONS_KEY]: [{ id: "s0", name: "Existing", tabs: [] }],
      });
      chrome.storage.local.set.mockResolvedValue();

      const result = await importSessions([
        { name: "Existing", tabs: [{ url: "https://a.com" }] }, // duplicate
        { name: "New", tabs: [{ url: "https://a.com", title: "A", pinned: true }] },
        { name: "Bad shape" }, // missing tabs
        null,
      ]);

      expect(result).toEqual({ added: 1, skipped: 3 });
      const written = chrome.storage.local.set.mock.calls[0][0][SESSIONS_KEY];
      expect(written[0].name).toBe("New");
      expect(written[0].tabs[0].url).toBe("https://a.com");
    });

    it("filters non-http URLs from imported tabs and skips empty results", async () => {
      chrome.storage.local.get.mockResolvedValue({ [SESSIONS_KEY]: [] });
      chrome.storage.local.set.mockResolvedValue();

      const result = await importSessions([
        { name: "OnlyBad", tabs: [{ url: "chrome://x" }, { url: "" }] },
        { name: "Mixed", tabs: [{ url: "javascript:alert(1)" }, { url: "https://ok.com" }] },
      ]);

      expect(result.added).toBe(1);
      const written = chrome.storage.local.set.mock.calls[0][0][SESSIONS_KEY];
      expect(written[0].name).toBe("Mixed");
      expect(written[0].tabs).toEqual([
        { url: "https://ok.com", title: "Untitled", favIconUrl: "", pinned: false },
      ]);
    });

    it("hard caps at MAX_SESSIONS during import", async () => {
      const existing = Array.from({ length: 20 }, (_, i) => ({
        id: `s${i}`,
        name: `n${i}`,
        tabs: [],
      }));
      chrome.storage.local.get.mockResolvedValue({ [SESSIONS_KEY]: existing });

      const result = await importSessions([{ name: "ZZ", tabs: [{ url: "https://a.com" }] }]);

      expect(result.added).toBe(0);
      expect(result.skipped).toBe(1);
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });

    it("does not write when nothing imported", async () => {
      chrome.storage.local.get.mockResolvedValue({ [SESSIONS_KEY]: [] });
      const result = await importSessions([{ name: "Bad", tabs: [{ url: "chrome://x" }] }]);
      expect(result.added).toBe(0);
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });
  });
});
