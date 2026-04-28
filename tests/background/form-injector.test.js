import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/shared/permissions.js", () => ({
  hasHostPermission: vi.fn(),
}));

import { hasHostPermission } from "../../src/shared/permissions.js";

const importInjector = () => import("../../src/background/form-injector.js");

describe("form-injector", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("rejects non-http URLs without injecting", async () => {
    hasHostPermission.mockResolvedValue(true);
    const { ensureFormCheckerInjected } = await importInjector();

    expect(await ensureFormCheckerInjected(1, "chrome://extensions")).toBe(false);
    expect(await ensureFormCheckerInjected(1, undefined)).toBe(false);
    expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
  });

  it("returns false when host permission is missing", async () => {
    hasHostPermission.mockResolvedValue(false);
    const { ensureFormCheckerInjected } = await importInjector();

    expect(await ensureFormCheckerInjected(1, "https://a.com")).toBe(false);
    expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
  });

  it("injects content script and caches the tab on success", async () => {
    hasHostPermission.mockResolvedValue(true);
    chrome.scripting.executeScript.mockResolvedValue([]);
    const { ensureFormCheckerInjected } = await importInjector();

    const first = await ensureFormCheckerInjected(42, "https://a.com");
    const second = await ensureFormCheckerInjected(42, "https://a.com");

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(1);
    expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: ["src/content/form-checker.js"],
    });
  });

  it("returns false (and does not cache) when injection fails", async () => {
    hasHostPermission.mockResolvedValue(true);
    chrome.scripting.executeScript.mockRejectedValue(new Error("nope"));
    const { ensureFormCheckerInjected } = await importInjector();

    expect(await ensureFormCheckerInjected(7, "https://a.com")).toBe(false);

    chrome.scripting.executeScript.mockResolvedValue([]);
    expect(await ensureFormCheckerInjected(7, "https://a.com")).toBe(true);
    expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(2);
  });

  it("clearInjectedTab forces re-injection on next call", async () => {
    hasHostPermission.mockResolvedValue(true);
    chrome.scripting.executeScript.mockResolvedValue([]);
    const { ensureFormCheckerInjected, clearInjectedTab } = await importInjector();

    await ensureFormCheckerInjected(11, "https://a.com");
    expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(1);

    clearInjectedTab(11);
    await ensureFormCheckerInjected(11, "https://a.com");
    expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(2);
  });
});
