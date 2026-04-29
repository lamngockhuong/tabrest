import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/shared/storage.js", () => ({
  getSettings: vi.fn(),
}));

import {
  captureError,
  captureMessage,
  clearStoredErrors,
  getStoredErrors,
  initErrorReporter,
  reportBug,
} from "../../src/shared/error-reporter.js";
import { getSettings } from "../../src/shared/storage.js";

const ERROR_BUFFER_KEY = "tabrest_error_buffer";
const BUG_REPORTS_KEY = "tabrest_bug_reports";

describe("error-reporter (storage + capture)", () => {
  let logSpy;
  let errorSpy;
  let warnSpy;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  describe("captureError", () => {
    it("logs sanitized message and persists into bounded buffer", async () => {
      chrome.storage.local.get.mockResolvedValue({});
      chrome.storage.local.set.mockResolvedValue();

      captureError(new Error("Boom https://leak.com/x"), { source: "uncaught" });

      expect(errorSpy).toHaveBeenCalledWith(
        "[ErrorReporter] Captured:",
        "Boom [REDACTED]",
        expect.objectContaining({ source: "uncaught" }),
      );
      await vi.waitFor(() => expect(chrome.storage.local.set).toHaveBeenCalled());
    });

    it("sanitizes nested object context", async () => {
      chrome.storage.local.get.mockResolvedValue({});
      chrome.storage.local.set.mockResolvedValue();

      captureError(new Error("oops"), {
        source: "x",
        meta: { url: "https://leak.com/path", count: 1 },
      });

      const passed = errorSpy.mock.calls[0][2];
      expect(JSON.stringify(passed)).not.toContain("leak.com");
    });

    it("trims buffer to MAX_STORED_ERRORS (10)", async () => {
      const existing = Array.from({ length: 10 }, (_, i) => ({ id: i }));
      chrome.storage.local.get.mockResolvedValue({ [ERROR_BUFFER_KEY]: existing });
      chrome.storage.local.set.mockResolvedValue();

      captureError(new Error("11th"));
      await vi.waitFor(() => expect(chrome.storage.local.set).toHaveBeenCalled());

      const written = chrome.storage.local.set.mock.calls[0][0][ERROR_BUFFER_KEY];
      expect(written).toHaveLength(10);
      expect(written[0]).toEqual({ id: 1 });
      expect(written[9].error.message).toBe("11th");
    });

    it("warns and continues when storage write fails", async () => {
      chrome.storage.local.get.mockResolvedValue({});
      chrome.storage.local.set.mockRejectedValue(new Error("disk full"));

      expect(() => captureError(new Error("e"))).not.toThrow();
      await vi.waitFor(() => expect(warnSpy).toHaveBeenCalled());
    });
  });

  describe("captureMessage", () => {
    it("logs sanitized message at given level", () => {
      captureMessage("Visited https://leak.com", "warning");
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("WARNING"));
      const logged = logSpy.mock.calls[0][0];
      expect(logged).not.toContain("leak.com");
    });

    it("defaults to info level", () => {
      captureMessage("hello");
      const logged = logSpy.mock.calls[0][0];
      expect(logged).toContain("INFO");
    });
  });

  describe("reportBug", () => {
    it("returns ok and stores sanitized report", async () => {
      chrome.storage.local.get.mockResolvedValue({});
      chrome.storage.local.set.mockResolvedValue();
      chrome.runtime.getManifest.mockReturnValue({ version: "0.0.5" });

      const result = await reportBug("Bug at https://leak.com", { tabs: 5 });
      expect(result).toEqual({ ok: true, reason: "no_dsn" });

      await vi.waitFor(() => expect(chrome.storage.local.set).toHaveBeenCalled());
      const written = chrome.storage.local.set.mock.calls[0][0][BUG_REPORTS_KEY];
      expect(written).toHaveLength(1);
      expect(written[0].description).not.toContain("leak.com");
      expect(written[0].version).toBe("0.0.5");
      expect(written[0].diagnostics).toEqual({ tabs: 5 });
    });

    it("trims report buffer to 5", async () => {
      const existing = Array.from({ length: 5 }, (_, i) => ({ id: i }));
      chrome.storage.local.get.mockResolvedValue({ [BUG_REPORTS_KEY]: existing });
      chrome.storage.local.set.mockResolvedValue();
      chrome.runtime.getManifest.mockReturnValue({ version: "0.0.5" });

      reportBug("new", {});
      await vi.waitFor(() => expect(chrome.storage.local.set).toHaveBeenCalled());
      const written = chrome.storage.local.set.mock.calls[0][0][BUG_REPORTS_KEY];
      expect(written).toHaveLength(5);
    });
  });

  describe("getStoredErrors / clearStoredErrors", () => {
    it("getStoredErrors returns stored buffer or empty array", async () => {
      chrome.storage.local.get.mockResolvedValue({ [ERROR_BUFFER_KEY]: [{ a: 1 }] });
      expect(await getStoredErrors()).toEqual([{ a: 1 }]);

      chrome.storage.local.get.mockResolvedValue({});
      expect(await getStoredErrors()).toEqual([]);
    });

    it("getStoredErrors swallows errors and returns empty array", async () => {
      chrome.storage.local.get.mockRejectedValue(new Error("nope"));
      expect(await getStoredErrors()).toEqual([]);
    });

    it("clearStoredErrors removes both buffers", async () => {
      chrome.storage.local.remove.mockResolvedValue();
      await clearStoredErrors();
      expect(chrome.storage.local.remove).toHaveBeenCalledWith([ERROR_BUFFER_KEY, BUG_REPORTS_KEY]);
    });
  });

  describe("initErrorReporter", () => {
    it("returns early when user opted out", async () => {
      getSettings.mockResolvedValue({ enableErrorReporting: false });
      await initErrorReporter();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Disabled"));
    });
  });
});
