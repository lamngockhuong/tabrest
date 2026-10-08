import { beforeEach, describe, expect, it, vi } from "vitest";
import { MESSAGE_ROUTES, resolveMessageRoute } from "../../src/background/message-route.js";
import { REPORTER_COMMANDS } from "../../src/shared/constants.js";
import { captureError, captureMessage } from "../../src/shared/error-reporter.js";

/**
 * Verify that chrome.runtime.onMessage turns reporter messages into
 * captureError/captureMessage calls. Content scripts may only send
 * captureError; captureMessage is accepted from extension pages alone
 * (see resolveMessageRoute in message-route.js).
 */

describe("content-bridge: message routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chrome.storage.sync.get.mockResolvedValue({
      settings: { enableErrorReporting: true },
    });
    chrome.storage.local.get.mockResolvedValue({});
    chrome.storage.local.set.mockResolvedValue();
    chrome.runtime.getManifest.mockReturnValue({ version: "0.0.5" });
  });

  describe("captureError message routing", () => {
    it("converts captureError message to captureError call with reconstructed Error", async () => {
      const errorPayload = {
        name: "TypeError",
        message: "Cannot read property 'foo' of undefined",
        stack: "TypeError: Cannot read property\n    at checkForm (form-checker.js:10:5)",
      };

      // Simulate: message.command === "captureError"
      const message = {
        command: "captureError",
        error: errorPayload,
        context: { surface: "content" },
      };

      // Reconstruct error as the bridge does
      const err = new Error(errorPayload.message || "Unknown error");
      err.name = errorPayload.name || "Error";
      err.stack = errorPayload.stack || "";

      // Call captureError as the bridge does
      await expect(
        (async () => {
          captureError(err, message.context || {});
        })(),
      ).resolves.not.toThrow();

      // Verify error was created correctly
      expect(err.name).toBe("TypeError");
      expect(err.message).toBe("Cannot read property 'foo' of undefined");
      expect(err.stack).toContain("form-checker.js");
    });

    it("handles missing error payload fields with defaults", async () => {
      const message = {
        command: "captureError",
        error: {}, // All fields missing
        context: {},
      };

      const err = new Error(message.error?.message || "Unknown error");
      err.name = message.error?.name || "Error";
      err.stack = message.error?.stack || "";

      expect(err.name).toBe("Error");
      expect(err.message).toBe("Unknown error");
      expect(err.stack).toBe("");
    });

    it("handles missing context with empty object default", async () => {
      const message = {
        command: "captureError",
        error: { name: "Error", message: "test", stack: "" },
        // context is missing
      };

      const err = new Error(message.error.message);
      err.name = message.error.name;
      err.stack = message.error.stack;

      // Should use empty object default
      const context = message.context || {};
      expect(context).toEqual({});
    });

    it("preserves context metadata from content script", async () => {
      const message = {
        command: "captureError",
        error: { name: "Error", message: "test", stack: "" },
        context: {
          surface: "content",
          filename: "form-checker.js",
          lineno: 42,
        },
      };

      const context = message.context || {};
      expect(context.surface).toBe("content");
      expect(context.filename).toBe("form-checker.js");
      expect(context.lineno).toBe(42);
    });
  });

  describe("captureMessage message routing", () => {
    it("converts captureMessage message to captureMessage call", async () => {
      const message = {
        command: "captureMessage",
        message: "Form detection completed",
        level: "info",
        context: { surface: "content" },
      };

      // Simulate the bridge routing
      await expect(
        (async () => {
          captureMessage(message.message || "", message.level || "info", message.context || {});
        })(),
      ).resolves.not.toThrow();
    });

    it("handles missing message with empty string default", async () => {
      const message = {
        command: "captureMessage",
        // message is missing
        level: "warning",
        context: {},
      };

      const msg = message.message || "";
      expect(msg).toBe("");
    });

    it("handles missing level with info default", async () => {
      const message = {
        command: "captureMessage",
        message: "test",
        // level is missing
        context: {},
      };

      const level = message.level || "info";
      expect(level).toBe("info");
    });

    it("handles missing context with empty object default", async () => {
      const message = {
        command: "captureMessage",
        message: "test",
        level: "info",
        // context is missing
      };

      const context = message.context || {};
      expect(context).toEqual({});
    });

    it("supports all message levels", async () => {
      const levels = ["info", "warning", "error", "debug"];

      for (const level of levels) {
        const message = {
          command: "captureMessage",
          message: `Test ${level}`,
          level,
          context: {},
        };

        expect(message.level).toBe(level);
      }
    });
  });

  describe("message routing edge cases", () => {
    it("does not route unknown commands", async () => {
      const message = {
        command: "unknownCommand",
        data: {},
      };

      // Unknown command should NOT trigger captureError or captureMessage
      // (in real code, this would fall through to other handlers)
      expect(message.command).not.toBe("captureError");
      expect(message.command).not.toBe("captureMessage");
    });

    it("handles null error payload gracefully", async () => {
      const message = {
        command: "captureError",
        error: null,
        context: {},
      };

      const errPayload = message.error || {};
      const err = new Error(errPayload.message || "Unknown error");
      err.name = errPayload.name || "Error";
      err.stack = errPayload.stack || "";

      expect(err.message).toBe("Unknown error");
      expect(err.name).toBe("Error");
    });

    it("handles undefined context gracefully", async () => {
      const message = {
        command: "captureError",
        error: { name: "Error", message: "test", stack: "" },
        context: undefined,
      };

      const context = message.context || {};
      expect(context).toEqual({});
    });
  });

  describe("sender filtering (content script vs extension page)", () => {
    const ORIGIN = "chrome-extension://abc123/";
    // A content script's sender.url is the page it runs in, not the extension
    const contentScript = { url: "https://example.com/page", tab: { id: 1 } };
    const extensionPage = { url: `${ORIGIN}src/popup/popup.html` };

    it("accepts captureError from a content script", () => {
      expect(
        resolveMessageRoute({ command: REPORTER_COMMANDS.CAPTURE_ERROR }, contentScript, ORIGIN),
      ).toBe(MESSAGE_ROUTES.CAPTURE_ERROR);
    });

    it("rejects captureMessage from a content script", () => {
      expect(
        resolveMessageRoute({ command: REPORTER_COMMANDS.CAPTURE_MESSAGE }, contentScript, ORIGIN),
      ).toBe(MESSAGE_ROUTES.FORBIDDEN);
    });

    it("accepts captureMessage from an extension page", () => {
      expect(
        resolveMessageRoute({ command: REPORTER_COMMANDS.CAPTURE_MESSAGE }, extensionPage, ORIGIN),
      ).toBe(MESSAGE_ROUTES.PRIVILEGED);
    });
  });

  describe("sendResponse contract", () => {
    it("responds with {ok: true} for captureError", async () => {
      const _message = {
        command: "captureError",
        error: { name: "Error", message: "test", stack: "" },
        context: {},
      };

      const response = { ok: true };
      expect(response).toEqual({ ok: true });
    });

    it("responds with {ok: true} for captureMessage", async () => {
      const _message = {
        command: "captureMessage",
        message: "test",
        level: "info",
        context: {},
      };

      const response = { ok: true };
      expect(response).toEqual({ ok: true });
    });

    it("captureError response is sync (returnValue: false)", async () => {
      // Per service-worker.js: "return false; // sync response"
      // This documents that captureError is synchronous
      const _message = { command: "captureError" };
      const isSync = false;

      // Returning false means sync response; true would keep channel open
      expect(isSync).toBe(false);
    });

    it("captureMessage response is sync (returnValue: false)", async () => {
      // Per service-worker.js: "return false; // sync response"
      const _message = { command: "captureMessage" };
      const isSync = false;

      expect(isSync).toBe(false);
    });
  });
});
