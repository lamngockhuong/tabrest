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
    // Never hit the real Sentry DSN from tests
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, headers: { get: () => null } }),
    );
    reporter = await import("../../src/shared/error-reporter.js");
    storage = await import("../../src/shared/storage.js");
  });

  afterEach(() => {
    delete global.self;
    vi.unstubAllGlobals();
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

    // The stale read must not refill the settings cache with the revoked consent
    expect((await storage.getSettings()).enableErrorReporting).toBe(false);
    await reporter.initErrorReporter();
    expect(await reporter.reportBug("desc", null)).toEqual({
      ok: true,
      reason: REPORT_REASONS.NO_DSN,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("an init interrupted by a reset still finishes before callers report", async () => {
    // Cold-wake REPORT_BUG: its init is waiting on storage when a DSN change resets it
    let resolveStale;
    chrome.storage.sync.get.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStale = resolve;
      }),
    );
    const interruptedInit = reporter.initErrorReporter();

    reporter.resetErrorReporter();
    await setConsent(true);

    resolveStale({ settings: { enableErrorReporting: true } });
    await interruptedInit;

    expect(await reporter.reportBug("desc", null)).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("isReporterConfigChange", () => {
  let isReporterConfigChange;

  beforeEach(async () => {
    ({ isReporterConfigChange } = await import("../../src/shared/error-reporter.js"));
  });

  it("is true when consent or DSN changes", () => {
    expect(
      isReporterConfigChange({ enableErrorReporting: true }, { enableErrorReporting: false }),
    ).toBe(true);
    expect(
      isReporterConfigChange({ customSentryDsn: "" }, { customSentryDsn: "https://k@h/1" }),
    ).toBe(true);
  });

  it("is false when only unrelated keys change", () => {
    const base = { enableErrorReporting: false, customSentryDsn: "" };
    expect(isReporterConfigChange(base, { ...base, unloadDelayMinutes: 30 })).toBe(false);
  });

  it("treats a missing oldValue as a change when consent is set", () => {
    expect(isReporterConfigChange(undefined, { enableErrorReporting: true })).toBe(true);
    expect(isReporterConfigChange(undefined, {})).toBe(false);
  });
});
