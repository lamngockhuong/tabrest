import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectDiagnostics, formatDiagnosticsText } from "../../src/shared/log-collector.js";

// Mock chrome APIs
beforeEach(() => {
  global.chrome = {
    tabs: {
      query: vi.fn().mockResolvedValue([
        {
          id: 1,
          url: "https://secret-banking.com/account",
          title: "My Secret Bank Account",
          discarded: false,
          pinned: true,
          audible: false,
          windowId: 1,
        },
        {
          id: 2,
          url: "https://private-email.com/inbox",
          title: "Private Email - user@private.com",
          discarded: true,
          pinned: false,
          audible: false,
          windowId: 1,
        },
        {
          id: 3,
          url: "https://streaming.example.com/video",
          title: "Watching Secret Movie",
          discarded: false,
          pinned: false,
          audible: true,
          windowId: 2,
        },
      ]),
    },
    system: {
      memory: {
        getInfo: vi.fn().mockResolvedValue({
          capacity: 16 * 1024 * 1024 * 1024,
          availableCapacity: 8 * 1024 * 1024 * 1024,
        }),
      },
    },
    storage: {
      local: {
        get: vi.fn().mockResolvedValue({
          stats: {
            totalTabsSuspended: 150,
            totalTabsSuspendedToday: 12,
            installDate: "2024-01-15",
          },
        }),
      },
      sync: {
        get: vi.fn().mockResolvedValue({
          settings: {
            whitelist: ["secret-site.com", "private-domain.org", "personal.example"],
            blacklist: ["ads.tracker.com", "malware.bad"],
            unloadDelayMinutes: 30,
            memoryThresholdPercent: 80,
            powerMode: "normal",
            minTabsBeforeAutoDiscard: 6,
          },
        }),
      },
    },
    runtime: {
      getManifest: vi.fn().mockReturnValue({ version: "0.0.5" }),
    },
  };

  vi.stubGlobal("navigator", {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    platform: "Win32",
  });
});

describe("collectDiagnostics - Privacy", () => {
  it("should NOT include any tab URLs", async () => {
    const data = await collectDiagnostics();
    const json = JSON.stringify(data);

    expect(json).not.toContain("secret-banking.com");
    expect(json).not.toContain("private-email.com");
    expect(json).not.toContain("streaming.example.com");
    expect(json).not.toContain("https://");
    expect(json).not.toContain("http://");
  });

  it("should NOT include any tab titles", async () => {
    const data = await collectDiagnostics();
    const json = JSON.stringify(data);

    expect(json).not.toContain("My Secret Bank Account");
    expect(json).not.toContain("Private Email");
    expect(json).not.toContain("Watching Secret Movie");
    expect(json).not.toContain("user@private.com");
  });

  it("should NOT include whitelist domains", async () => {
    const data = await collectDiagnostics();
    const json = JSON.stringify(data);

    expect(json).not.toContain("secret-site.com");
    expect(json).not.toContain("private-domain.org");
    expect(json).not.toContain("personal.example");
  });

  it("should NOT include blacklist domains", async () => {
    const data = await collectDiagnostics();
    const json = JSON.stringify(data);

    expect(json).not.toContain("ads.tracker.com");
    expect(json).not.toContain("malware.bad");
  });

  it("should only include whitelist/blacklist counts", async () => {
    const data = await collectDiagnostics();

    expect(data.settings.whitelistCount).toBe(3);
    expect(data.settings.blacklistCount).toBe(2);
    expect(data.settings.whitelist).toBeUndefined();
    expect(data.settings.blacklist).toBeUndefined();
  });
});

describe("collectDiagnostics - Data Shape", () => {
  it("should include correct tab counts", async () => {
    const data = await collectDiagnostics();

    expect(data.tabs.total).toBe(3);
    expect(data.tabs.discarded).toBe(1);
    expect(data.tabs.pinned).toBe(1);
    expect(data.tabs.audible).toBe(1);
    expect(data.tabs.windows).toBe(2);
  });

  it("should include extension version", async () => {
    const data = await collectDiagnostics();

    expect(data.extension.version).toBe("0.0.5");
  });

  it("should include browser info", async () => {
    const data = await collectDiagnostics();

    expect(data.extension.browser).toBe("Chrome");
    expect(data.extension.browserVersion).toMatch(/^\d+/);
  });

  it("should include memory info", async () => {
    const data = await collectDiagnostics();

    expect(data.memory.usagePercent).toBe(50);
    expect(data.memory.totalGB).toBe("16.0");
    expect(data.memory.availableGB).toBe("8.0");
  });

  it("should include sanitized settings", async () => {
    const data = await collectDiagnostics();

    expect(data.settings.unloadDelayMinutes).toBe(30);
    expect(data.settings.memoryThresholdPercent).toBe(80);
    expect(data.settings.powerMode).toBe("normal");
  });

  it("should include stats", async () => {
    const data = await collectDiagnostics();

    expect(data.stats.totalTabsSuspended).toBe(150);
    expect(data.stats.totalTabsSuspendedToday).toBe(12);
  });
});

describe("formatDiagnosticsText - Privacy", () => {
  it("should format as readable markdown without PII", async () => {
    const data = await collectDiagnostics();
    const text = formatDiagnosticsText(data);

    // Should have proper structure
    expect(text).toContain("## TabRest Bug Report");
    expect(text).toContain("### Extension");
    expect(text).toContain("### Tabs");
    expect(text).toContain("### Memory");
    expect(text).toContain("### Settings");

    // Should NOT contain any private data
    expect(text).not.toContain("secret");
    expect(text).not.toContain("private");
    expect(text).not.toContain("https://");
    expect(text).not.toContain(".com/");
  });

  it("should include counts and metrics", async () => {
    const data = await collectDiagnostics();
    const text = formatDiagnosticsText(data);

    expect(text).toContain("Total: 3");
    expect(text).toContain("Discarded: 1");
    expect(text).toContain("Whitelist entries: 3");
    expect(text).toContain("Blacklist entries: 2");
  });
});

describe("collectDiagnostics - Error Handling", () => {
  it("should handle memory API failure gracefully", async () => {
    chrome.system.memory.getInfo.mockRejectedValue(new Error("Permission denied"));

    const data = await collectDiagnostics();

    expect(data.memory.error).toBe("Unable to read memory info");
  });

  it("should handle missing stats gracefully", async () => {
    chrome.storage.local.get.mockResolvedValue({});

    const data = await collectDiagnostics();

    expect(data.stats.totalTabsSuspended).toBe(0);
    expect(data.stats.totalTabsSuspendedToday).toBe(0);
  });
});
