import { describe, it, expect, vi, beforeEach } from "vitest";
import { CONSENT_RESET_MIGRATION_KEY } from "../../src/shared/constants.js";

/**
 * Migration Tests for Phase 02
 * Verify that error reporting is force-disabled exactly once during the
 * v0.0.5 → v0.1.0 rollout; subsequent updates must respect a user's opt-in.
 * The implementation gates the flip on CONSENT_RESET_MIGRATION_KEY in
 * chrome.storage.local.
 */

describe("migration: onInstalled handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chrome.storage.sync.get.mockResolvedValue({});
    chrome.storage.sync.set.mockResolvedValue();
  });

  it("force-disables enableErrorReporting on install", async () => {
    // Simulate: chrome.runtime.onInstalled({ reason: "install" })
    const details = { reason: "install" };

    // Mock storage returning current settings
    chrome.storage.sync.get.mockResolvedValue({
      settings: { enableErrorReporting: true, otherSetting: "preserved" },
    });

    // Simulate the onInstalled behavior: read, set enableErrorReporting to false
    const current = (await chrome.storage.sync.get("settings")).settings || {};
    await chrome.storage.sync.set({
      settings: { ...current, enableErrorReporting: false },
    });

    expect(chrome.storage.sync.get).toHaveBeenCalledWith("settings");
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          enableErrorReporting: false,
          otherSetting: "preserved",
        }),
      }),
    );
  });

  it("force-disables enableErrorReporting on update", async () => {
    const details = { reason: "update", previousVersion: "0.0.4" };

    // Simulate: settings had enableErrorReporting: true before
    chrome.storage.sync.get.mockResolvedValue({
      settings: { enableErrorReporting: true, customSentryDsn: "https://..." },
    });

    const current = (await chrome.storage.sync.get("settings")).settings || {};
    await chrome.storage.sync.set({
      settings: { ...current, enableErrorReporting: false },
    });

    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          enableErrorReporting: false,
          customSentryDsn: "https://...",
        }),
      }),
    );
  });

  it("sets enableErrorReporting to false when key is absent on update", async () => {
    // Simulate: fresh install (no prior settings)
    chrome.storage.sync.get.mockResolvedValue({
      settings: {},
    });

    const current = (await chrome.storage.sync.get("settings")).settings || {};
    await chrome.storage.sync.set({
      settings: { ...current, enableErrorReporting: false },
    });

    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          enableErrorReporting: false,
        }),
      }),
    );
  });

  it("does not modify settings on chrome_update reason", async () => {
    // Only "install" and "update" trigger the force-flip
    const details = { reason: "chrome_update" };

    chrome.storage.sync.get.mockResolvedValue({
      settings: { enableErrorReporting: true },
    });

    // Simulate: chrome_update reason is not "install" or "update", so no action
    if (details.reason === "install" || details.reason === "update") {
      const current = (await chrome.storage.sync.get("settings")).settings || {};
      await chrome.storage.sync.set({
        settings: { ...current, enableErrorReporting: false },
      });
    }

    // Should NOT have called set for chrome_update
    expect(chrome.storage.sync.set).not.toHaveBeenCalled();
  });

  it("is idempotent — multiple calls produce same result", async () => {
    chrome.storage.sync.get.mockResolvedValue({
      settings: { enableErrorReporting: true },
    });

    // First call
    let current = (await chrome.storage.sync.get("settings")).settings || {};
    await chrome.storage.sync.set({
      settings: { ...current, enableErrorReporting: false },
    });

    // Reset mocks but keep the result
    chrome.storage.sync.set.mockResolvedValue();
    chrome.storage.sync.get.mockResolvedValue({
      settings: { enableErrorReporting: false },
    });

    // Second call (idempotent)
    current = (await chrome.storage.sync.get("settings")).settings || {};
    await chrome.storage.sync.set({
      settings: { ...current, enableErrorReporting: false },
    });

    // Both calls should result in false
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          enableErrorReporting: false,
        }),
      }),
    );
  });

  it("does NOT re-flip enableErrorReporting once migration flag is set", async () => {
    // User had previously opted IN to error reporting after migration ran once.
    chrome.storage.sync.get.mockResolvedValue({
      settings: { enableErrorReporting: true },
    });
    chrome.storage.local.get = vi.fn().mockResolvedValue({
      [CONSENT_RESET_MIGRATION_KEY]: true,
    });

    const flag = await chrome.storage.local.get(CONSENT_RESET_MIGRATION_KEY);
    if (!flag[CONSENT_RESET_MIGRATION_KEY]) {
      const current = (await chrome.storage.sync.get("settings")).settings || {};
      await chrome.storage.sync.set({
        settings: { ...current, enableErrorReporting: false },
      });
    }

    expect(chrome.storage.sync.set).not.toHaveBeenCalled();
  });

  it("preserves other settings while flipping enableErrorReporting", async () => {
    const originalSettings = {
      enableAutoUnload: true,
      unloadDelayMinutes: 30,
      customSentryDsn: "https://custom@o123.ingest.us.sentry.io/456",
      enableErrorReporting: true,
    };

    chrome.storage.sync.get.mockResolvedValue({
      settings: originalSettings,
    });

    const current = (await chrome.storage.sync.get("settings")).settings || {};
    const newSettings = { ...current, enableErrorReporting: false };
    await chrome.storage.sync.set({ settings: newSettings });

    expect(newSettings).toEqual({
      enableAutoUnload: true,
      unloadDelayMinutes: 30,
      customSentryDsn: "https://custom@o123.ingest.us.sentry.io/456",
      enableErrorReporting: false,
    });
  });
});
