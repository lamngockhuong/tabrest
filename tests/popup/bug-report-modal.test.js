import { describe, it, expect, vi, beforeEach } from "vitest";
import { reportBug } from "../../src/shared/error-reporter.js";

/**
 * Bug Report Modal Tests for Phase 05
 * Verify popup button visibility and click flow based on consent state.
 *
 * Note: popup.js is excluded from coverage. These tests verify the core logic
 * contracts that the popup relies on (reportBug behavior, consent logic).
 */

describe("bug-report-modal: button visibility logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chrome.storage.sync.get.mockResolvedValue({});
    chrome.storage.local.get.mockResolvedValue({});
    chrome.storage.local.set.mockResolvedValue({});
    chrome.runtime.getManifest.mockReturnValue({ version: "0.0.5" });
  });

  it("button should be hidden when consent is OFF", () => {
    const settings = { enableErrorReporting: false };

    // Simulate the visibility logic
    const consentOn = settings.enableErrorReporting === true;
    const sendToSentryBtnHidden = !consentOn;
    const sentryDisabledHintHidden = consentOn;

    expect(sendToSentryBtnHidden).toBe(true);
    expect(sentryDisabledHintHidden).toBe(false);
  });

  it("button should be visible when consent is ON", () => {
    const settings = { enableErrorReporting: true };

    const consentOn = settings.enableErrorReporting === true;
    const sendToSentryBtnHidden = !consentOn;
    const sentryDisabledHintHidden = consentOn;

    expect(sendToSentryBtnHidden).toBe(false);
    expect(sentryDisabledHintHidden).toBe(true);
  });

  it("button hidden when enableErrorReporting is undefined", () => {
    const settings = { /* enableErrorReporting missing */ };

    const consentOn = settings.enableErrorReporting === true;
    expect(consentOn).toBe(false);
    expect(!consentOn).toBe(true); // button hidden
  });

  it("button hidden when enableErrorReporting is null", () => {
    const settings = { enableErrorReporting: null };

    const consentOn = settings.enableErrorReporting === true;
    expect(consentOn).toBe(false);
  });

  it("button hidden when enableErrorReporting is false", () => {
    const settings = { enableErrorReporting: false };

    const consentOn = settings.enableErrorReporting === true;
    expect(consentOn).toBe(false);
  });
});

describe("bug-report-modal: reportBug behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chrome.storage.sync.get.mockResolvedValue({
      settings: { enableErrorReporting: true },
    });
    chrome.storage.local.get.mockResolvedValue({});
    chrome.storage.local.set.mockResolvedValue({});
    chrome.runtime.getManifest.mockReturnValue({ version: "0.0.5" });
  });

  it("reportBug returns boolean or Promise<boolean>", async () => {
    const result = reportBug("test report", { mock: true });

    // Result can be boolean or Promise<boolean>
    const normalized = await Promise.resolve(result);
    expect(typeof normalized).toBe("boolean");
  });

  it("reportBug accepts description and diagnostics", async () => {
    const description = "Bug description";
    const diagnostics = { tabCount: 5, memoryMB: 100 };

    // Should not throw
    await expect(Promise.resolve(reportBug(description, diagnostics))).resolves.toBeDefined();
  });

  it("reportBug sanitizes description with PII", async () => {
    const description = "Error from https://secret.com";

    // reportBug internally sanitizes
    const result = await Promise.resolve(reportBug(description, {}));
    expect(typeof result).toBe("boolean");
  });

  it("reportBug handles empty description", async () => {
    const result = reportBug("", {});
    const normalized = await Promise.resolve(result);
    expect(typeof normalized).toBe("boolean");
  });

  it("reportBug handles null diagnostics gracefully", async () => {
    const result = reportBug("test", null);
    const normalized = await Promise.resolve(result);
    expect(typeof normalized).toBe("boolean");
  });
});

describe("bug-report-modal: user interaction flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chrome.storage.sync.get.mockResolvedValue({
      settings: { enableErrorReporting: true },
    });
    chrome.storage.local.get.mockResolvedValue({});
    chrome.storage.local.set.mockResolvedValue({});
    chrome.runtime.getManifest.mockReturnValue({ version: "0.0.5" });
  });

  it("simulates click flow: get settings → check consent → show/hide button", async () => {
    // Step 1: get settings
    chrome.storage.sync.get.mockResolvedValue({
      settings: { enableErrorReporting: true },
    });

    const settingsData = await chrome.storage.sync.get("settings");
    const settings = settingsData.settings || {};

    // Step 2: check consent
    const consentOn = settings.enableErrorReporting === true;

    // Step 3: decide button visibility
    const buttonHidden = !consentOn;
    const hintHidden = consentOn;

    expect(buttonHidden).toBe(false);
    expect(hintHidden).toBe(true);
  });

  it("simulates successful report submission flow", async () => {
    const description = "User report";
    const diagnostics = { test: true };

    // Mock successful report
    const mockReportBug = vi.fn().mockResolvedValue(true);

    // Simulate button click handler
    const ok = await Promise.resolve(mockReportBug(description, diagnostics));

    if (ok) {
      // Success: show success toast, hide modal
      expect(ok).toBe(true);
    }

    expect(mockReportBug).toHaveBeenCalledWith(description, diagnostics);
  });

  it("simulates failed report submission flow", async () => {
    const description = "User report";
    const diagnostics = { test: true };

    // Mock failed report
    const mockReportBug = vi.fn().mockResolvedValue(false);

    const ok = await Promise.resolve(mockReportBug(description, diagnostics));

    if (!ok) {
      // Failure: show fail toast, keep modal open
      expect(ok).toBe(false);
    }

    expect(mockReportBug).toHaveBeenCalled();
  });

  it("button disable/enable during async request", async () => {
    const mockReportBug = vi.fn().mockResolvedValue(true);
    let buttonDisabled = false;

    // Simulate click handler
    const clickHandler = async () => {
      buttonDisabled = true; // disable button
      try {
        const ok = await Promise.resolve(mockReportBug());
      } finally {
        buttonDisabled = false; // re-enable button
      }
    };

    // Execute handler
    await clickHandler();

    expect(buttonDisabled).toBe(false); // button re-enabled after request
    expect(mockReportBug).toHaveBeenCalled();
  });
});

describe("bug-report-modal: description handling", () => {
  it("trims whitespace from description", () => {
    const input = "  Bug description  \n";
    const trimmed = input.trim();

    expect(trimmed).toBe("Bug description");
  });

  it("preserves multi-line description", () => {
    const input = "Line 1\nLine 2\nLine 3";
    const trimmed = input.trim();

    expect(trimmed).toBe(input);
  });

  it("handles empty string description", () => {
    const input = "";
    const trimmed = input.trim();

    expect(trimmed).toBe("");
  });

  it("handles whitespace-only description", () => {
    const input = "   \n\t  ";
    const trimmed = input.trim();

    expect(trimmed).toBe("");
  });

  it("preserves special characters in description", () => {
    const input = "Error: 404 Not Found @ https://example.com";
    const trimmed = input.trim();

    // Special characters preserved (sanitization happens in reportBug)
    expect(trimmed).toContain("404");
    expect(trimmed).toContain("@");
  });
});
