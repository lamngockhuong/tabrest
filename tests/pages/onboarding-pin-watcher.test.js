import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPinStatus, watchUntilPinned } from "../../src/pages/onboarding/pin-watcher.js";

const ORIGINAL_ACTION = chrome.action;

afterEach(() => {
  chrome.action = ORIGINAL_ACTION;
  vi.useRealTimers();
});

describe("getPinStatus", () => {
  it("returns true when isOnToolbar is true", async () => {
    chrome.action = { getUserSettings: vi.fn(() => Promise.resolve({ isOnToolbar: true })) };
    expect(await getPinStatus()).toBe(true);
  });

  it("returns false when isOnToolbar is false", async () => {
    chrome.action = { getUserSettings: vi.fn(() => Promise.resolve({ isOnToolbar: false })) };
    expect(await getPinStatus()).toBe(false);
  });

  it("returns null when chrome.action is undefined", async () => {
    chrome.action = undefined;
    expect(await getPinStatus()).toBe(null);
  });

  it("returns null when getUserSettings is missing", async () => {
    chrome.action = {};
    expect(await getPinStatus()).toBe(null);
  });

  it("returns null when getUserSettings rejects", async () => {
    chrome.action = { getUserSettings: vi.fn(() => Promise.reject(new Error("denied"))) };
    expect(await getPinStatus()).toBe(null);
  });

  it("returns false when settings.isOnToolbar is missing", async () => {
    chrome.action = { getUserSettings: vi.fn(() => Promise.resolve({})) };
    expect(await getPinStatus()).toBe(false);
  });
});

describe("watchUntilPinned", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("calls onPinned and stops once status becomes true", async () => {
    let pinned = false;
    chrome.action = {
      getUserSettings: vi.fn(() => Promise.resolve({ isOnToolbar: pinned })),
    };

    const onPinned = vi.fn();
    watchUntilPinned(onPinned, 50);

    await vi.advanceTimersByTimeAsync(0);
    expect(onPinned).not.toHaveBeenCalled();

    pinned = true;
    await vi.advanceTimersByTimeAsync(50);
    expect(onPinned).toHaveBeenCalledOnce();

    const callsBefore = chrome.action.getUserSettings.mock.calls.length;
    await vi.advanceTimersByTimeAsync(200);
    expect(chrome.action.getUserSettings.mock.calls.length).toBe(callsBefore);
  });

  it("stop() cancels pending poll without firing onPinned", async () => {
    chrome.action = {
      getUserSettings: vi.fn(() => Promise.resolve({ isOnToolbar: false })),
    };
    const onPinned = vi.fn();
    const stop = watchUntilPinned(onPinned, 50);

    await vi.advanceTimersByTimeAsync(0);
    stop();
    await vi.advanceTimersByTimeAsync(500);
    expect(onPinned).not.toHaveBeenCalled();
  });

  it("does not fire onPinned if pinned status arrives after stop", async () => {
    let resolveSettings;
    chrome.action = {
      getUserSettings: vi.fn(
        () =>
          new Promise((resolve) => {
            resolveSettings = resolve;
          }),
      ),
    };
    const onPinned = vi.fn();
    const stop = watchUntilPinned(onPinned, 50);

    stop();
    resolveSettings({ isOnToolbar: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(onPinned).not.toHaveBeenCalled();
  });

  it("multiple stop() calls are safe", async () => {
    chrome.action = {
      getUserSettings: vi.fn(() => Promise.resolve({ isOnToolbar: false })),
    };
    const stop = watchUntilPinned(vi.fn(), 50);
    expect(() => {
      stop();
      stop();
      stop();
    }).not.toThrow();
  });
});
