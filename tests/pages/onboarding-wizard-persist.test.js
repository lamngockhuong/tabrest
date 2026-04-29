import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/shared/storage.js", () => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
}));

import { getSettings, saveSettings } from "../../src/shared/storage.js";
import {
  persistAutoUnload,
  persistNotifications,
  persistPowerMode,
  persistWhitelist,
} from "../../src/pages/onboarding/persist.js";

const baseSettings = { unloadDelayMinutes: 30, whitelist: [], powerMode: "normal", notifyOnAutoUnload: false };

beforeEach(() => {
  getSettings.mockReset();
  saveSettings.mockReset();
  getSettings.mockResolvedValue({ ...baseSettings });
  saveSettings.mockResolvedValue(undefined);
});

describe("persistAutoUnload", () => {
  it("writes only the unloadDelayMinutes key", async () => {
    await persistAutoUnload(60);
    expect(saveSettings).toHaveBeenCalledTimes(1);
    expect(saveSettings.mock.calls[0][0]).toEqual({ ...baseSettings, unloadDelayMinutes: 60 });
  });

  it("ignores invalid values", async () => {
    await persistAutoUnload("nope");
    await persistAutoUnload(0);
    await persistAutoUnload(-5);
    expect(saveSettings).not.toHaveBeenCalled();
  });
});

describe("persistWhitelist", () => {
  it("dedupes and lowercases domains", async () => {
    await persistWhitelist(["GitHub.com", "github.com", " Notion.so "]);
    expect(saveSettings.mock.calls[0][0].whitelist).toEqual(["github.com", "notion.so"]);
  });

  it("ignores non-array input", async () => {
    await persistWhitelist("github.com");
    expect(saveSettings).not.toHaveBeenCalled();
  });

  it("accepts empty array (replaces with empty list)", async () => {
    await persistWhitelist([]);
    expect(saveSettings).toHaveBeenCalledTimes(1);
    expect(saveSettings.mock.calls[0][0].whitelist).toEqual([]);
  });
});

describe("persistPowerMode", () => {
  it("writes only the powerMode key for allowed values", async () => {
    await persistPowerMode("battery-saver");
    expect(saveSettings.mock.calls[0][0]).toEqual({ ...baseSettings, powerMode: "battery-saver" });
  });

  it("rejects unknown modes", async () => {
    await persistPowerMode("turbo");
    expect(saveSettings).not.toHaveBeenCalled();
  });
});

describe("persistNotifications", () => {
  it("coerces truthy/falsy values to boolean", async () => {
    await persistNotifications(1);
    expect(saveSettings.mock.calls[0][0].notifyOnAutoUnload).toBe(true);
    saveSettings.mockClear();
    await persistNotifications(null);
    expect(saveSettings.mock.calls[0][0].notifyOnAutoUnload).toBe(false);
  });
});
