import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REPORT_REASONS } from "../../src/shared/constants.js";

// Fresh module per test: reporter and settings-cache state are module-level.
let reporter;
let storage;

function mockConsent(enabled) {
  chrome.storage.sync.get.mockResolvedValue({ settings: { enableErrorReporting: enabled } });
}

// saveSettings drops the settings cache (onChanged is mocked in tests)
async function setConsent(enabled) {
  await storage.saveSettings({});
  mockConsent(enabled);
}

describe("error-reporter consent changes", () => {
  beforeEach(async () => {
    vi.resetModules();
    global.self = { addEventListener: vi.fn() };
    reporter = await import("../../src/shared/error-reporter.js");
    storage = await import("../../src/shared/storage.js");
  });

  afterEach(() => {
    delete global.self;
  });

  it("stops sending once consent is revoked and the reporter is reset", async () => {
    await setConsent(true);
    await reporter.initErrorReporter();

    await setConsent(false);
    reporter.resetErrorReporter();
    await reporter.initErrorReporter();

    expect(await reporter.reportBug("desc", null)).toEqual({
      ok: true,
      reason: REPORT_REASONS.NO_DSN,
    });
  });

  it("does not re-register global error handlers on re-init", async () => {
    await setConsent(true);
    await reporter.initErrorReporter();
    const registered = self.addEventListener.mock.calls.length;
    expect(registered).toBeGreaterThan(0);

    reporter.resetErrorReporter();
    await reporter.initErrorReporter();

    expect(self.addEventListener).toHaveBeenCalledTimes(registered);
  });

  it("an init started before a reset cannot re-enable reporting", async () => {
    // Stale init reads consent=true but resolves only after the user revoked it
    let resolveStale;
    chrome.storage.sync.get.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStale = resolve;
      }),
    );
    const staleInit = reporter.initErrorReporter();

    reporter.resetErrorReporter();
    await setConsent(false);
    await reporter.initErrorReporter();

    resolveStale({ settings: { enableErrorReporting: true } });
    await staleInit;

    expect(await reporter.reportBug("desc", null)).toEqual({
      ok: true,
      reason: REPORT_REASONS.NO_DSN,
    });
  });
});
