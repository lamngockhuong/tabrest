import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getBrowserInfo,
  isSafeHttpUrl,
  notifyAutoUnload,
  unwrapHostname,
} from "../../src/shared/utils.js";

const stubUserAgent = (ua) => {
  vi.stubGlobal("navigator", { userAgent: ua });
};

describe("getBrowserInfo", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("detects Edge", () => {
    stubUserAgent(
      "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0.0.0 Edg/120.0.0.0",
    );
    const info = getBrowserInfo();
    expect(info.name).toBe("Edge");
    expect(info.version).toMatch(/^\d+/);
    expect(info.shortcutsUrl).toBe("edge://extensions/shortcuts");
  });

  it("detects Opera via OPR/", () => {
    stubUserAgent("Mozilla/5.0 Chrome/120.0.0.0 OPR/106.0.0.0");
    const info = getBrowserInfo();
    expect(info.name).toBe("Opera");
    expect(info.shortcutsUrl).toBe("opera://extensions/shortcuts");
  });

  it("detects Brave", () => {
    stubUserAgent("Mozilla/5.0 Chrome/120.0.0.0 Brave/1.60");
    const info = getBrowserInfo();
    expect(info.name).toBe("Brave");
    expect(info.shortcutsUrl).toBe("brave://extensions/shortcuts");
  });

  it("detects Vivaldi", () => {
    stubUserAgent("Mozilla/5.0 Chrome/120.0.0.0 Vivaldi/6.5");
    const info = getBrowserInfo();
    expect(info.name).toBe("Vivaldi");
    expect(info.shortcutsUrl).toBe("vivaldi://extensions/shortcuts");
  });

  it("detects Arc using Chrome shortcuts URL", () => {
    stubUserAgent("Mozilla/5.0 Chrome/120.0.0.0 Arc/1.0");
    const info = getBrowserInfo();
    expect(info.name).toBe("Arc");
    expect(info.shortcutsUrl).toBe("chrome://extensions/shortcuts");
  });

  it("falls back to Chrome", () => {
    stubUserAgent("Mozilla/5.0 (Macintosh) Chrome/120.5.6.7 Safari/537.36");
    const info = getBrowserInfo();
    expect(info.name).toBe("Chrome");
    expect(info.version).toBe("120.5.6.7");
  });

  it("returns null version when not extractable", () => {
    stubUserAgent("Mozilla/5.0 Edg/");
    const info = getBrowserInfo();
    expect(info.name).toBe("Edge");
    expect(info.version).toBe(null);
  });
});

describe("unwrapHostname", () => {
  it("strips IPv6 brackets", () => {
    expect(unwrapHostname("[::1]")).toBe("::1");
    expect(unwrapHostname("[2001:db8::1]")).toBe("2001:db8::1");
  });

  it("returns plain hostname unchanged", () => {
    expect(unwrapHostname("example.com")).toBe("example.com");
  });

  it("handles empty / nullish", () => {
    expect(unwrapHostname("")).toBe("");
    expect(unwrapHostname(null)).toBe("");
    expect(unwrapHostname(undefined)).toBe("");
  });
});

describe("isSafeHttpUrl", () => {
  it("accepts http and https", () => {
    expect(isSafeHttpUrl("http://example.com")).toBe(true);
    expect(isSafeHttpUrl("https://example.com/page?a=1")).toBe(true);
  });

  it("rejects other protocols", () => {
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeHttpUrl("chrome://extensions")).toBe(false);
    expect(isSafeHttpUrl("data:text/html,<script>")).toBe(false);
  });

  it("rejects malformed / non-string input", () => {
    expect(isSafeHttpUrl("")).toBe(false);
    expect(isSafeHttpUrl(null)).toBe(false);
    expect(isSafeHttpUrl(undefined)).toBe(false);
    expect(isSafeHttpUrl(123)).toBe(false);
    expect(isSafeHttpUrl("not a url")).toBe(false);
  });
});

describe("notifyAutoUnload", () => {
  it("creates timer notification with truncated long titles", () => {
    const longTitle = "a".repeat(60);
    notifyAutoUnload(longTitle, "timer", "Inactive 30 minutes");

    expect(chrome.notifications.create).toHaveBeenCalledTimes(1);
    const [id, opts] = chrome.notifications.create.mock.calls[0];
    expect(id).toMatch(/^tabrest-\d+$/);
    expect(opts.title).toContain("Timer");
    expect(opts.message).toContain("...");
    expect(opts.message).toContain("Inactive 30 minutes");
    expect(opts.silent).toBe(true);
    expect(opts.iconUrl).toContain("icons/icon-48.png");
  });

  it("creates RAM notification without truncation for short titles", () => {
    notifyAutoUnload("Short Title", "memory", "RAM 85%");
    const [, opts] = chrome.notifications.create.mock.calls[0];
    expect(opts.title).toContain("RAM");
    expect(opts.message).not.toContain("...");
    expect(opts.message).toContain("Short Title");
  });

  it("falls back to 'Tab' for empty title", () => {
    notifyAutoUnload(undefined, "timer", "detail");
    const [, opts] = chrome.notifications.create.mock.calls[0];
    expect(opts.message.startsWith("Tab")).toBe(true);
  });
});
