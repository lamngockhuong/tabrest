import { describe, it, expect } from "vitest";
import {
  SETTINGS_DEFAULTS,
  ALARM_NAMES,
  STORAGE_KEYS,
  POWER_MODE_CONFIG,
} from "../../src/shared/constants.js";

describe("SETTINGS_DEFAULTS", () => {
  it("has required keys", () => {
    expect(SETTINGS_DEFAULTS).toHaveProperty("unloadDelayMinutes");
    expect(SETTINGS_DEFAULTS).toHaveProperty("memoryThresholdPercent");
    expect(SETTINGS_DEFAULTS).toHaveProperty("whitelist");
    expect(SETTINGS_DEFAULTS).toHaveProperty("blacklist");
  });

  it("has valid delay value", () => {
    expect(SETTINGS_DEFAULTS.unloadDelayMinutes).toBeGreaterThan(0);
  });

  it("has valid memory threshold", () => {
    expect(SETTINGS_DEFAULTS.memoryThresholdPercent).toBeGreaterThanOrEqual(0);
    expect(SETTINGS_DEFAULTS.memoryThresholdPercent).toBeLessThanOrEqual(100);
  });

  it("whitelist is an array with default domains", () => {
    expect(Array.isArray(SETTINGS_DEFAULTS.whitelist)).toBe(true);
    expect(SETTINGS_DEFAULTS.whitelist.length).toBeGreaterThan(0);
  });

  it("blacklist is an empty array by default", () => {
    expect(Array.isArray(SETTINGS_DEFAULTS.blacklist)).toBe(true);
    expect(SETTINGS_DEFAULTS.blacklist.length).toBe(0);
  });
});

describe("ALARM_NAMES", () => {
  it("has required alarm names", () => {
    expect(ALARM_NAMES).toHaveProperty("TAB_CHECK");
    expect(ALARM_NAMES).toHaveProperty("MEMORY_CHECK");
  });

  it("alarm names are non-empty strings", () => {
    expect(typeof ALARM_NAMES.TAB_CHECK).toBe("string");
    expect(ALARM_NAMES.TAB_CHECK.length).toBeGreaterThan(0);
  });
});

describe("STORAGE_KEYS", () => {
  it("has required storage keys", () => {
    expect(STORAGE_KEYS).toHaveProperty("SETTINGS");
    expect(STORAGE_KEYS).toHaveProperty("TAB_ACTIVITY");
    expect(STORAGE_KEYS).toHaveProperty("STATS");
  });
});

describe("POWER_MODE_CONFIG", () => {
  it("has all power modes", () => {
    expect(POWER_MODE_CONFIG).toHaveProperty("battery-saver");
    expect(POWER_MODE_CONFIG).toHaveProperty("normal");
    expect(POWER_MODE_CONFIG).toHaveProperty("performance");
  });

  it("normal mode has neutral multipliers", () => {
    expect(POWER_MODE_CONFIG.normal.delayMultiplier).toBe(1.0);
    expect(POWER_MODE_CONFIG.normal.memoryThresholdOffset).toBe(0);
  });

  it("battery-saver is more aggressive", () => {
    expect(POWER_MODE_CONFIG["battery-saver"].delayMultiplier).toBeLessThan(1.0);
  });

  it("performance is less aggressive", () => {
    expect(POWER_MODE_CONFIG.performance.delayMultiplier).toBeGreaterThan(1.0);
  });
});
