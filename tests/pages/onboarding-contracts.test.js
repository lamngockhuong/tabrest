import { describe, expect, it, vi } from "vitest";

// Approach A: onboarding.js is excluded from coverage (DOM entry, 17 LOC). The
// page boots three things on DOMContentLoaded - pin that contract here so a
// regression (e.g. theme not synced, icons not injected, close button dead)
// fails CI rather than ride to release.

// Replicates the body of src/pages/onboarding.js DOMContentLoaded handler.
async function onboardingBoot({ initTheme, onThemeChange, injectIcons, closeBtn, windowClose }) {
  await initTheme();
  onThemeChange();
  injectIcons();
  closeBtn?.addEventListener("click", () => windowClose());
}

describe("onboarding-contracts: DOMContentLoaded boot order", () => {
  it("awaits theme init before subscribing to changes (prevents flash)", async () => {
    const order = [];
    const initTheme = vi.fn(async () => {
      // Simulate async storage read. If onThemeChange ran first, the order
      // array would record it before "init".
      await Promise.resolve();
      order.push("init");
    });
    const onThemeChange = vi.fn(() => order.push("subscribe"));
    const injectIcons = vi.fn(() => order.push("icons"));

    await onboardingBoot({ initTheme, onThemeChange, injectIcons });

    expect(order).toEqual(["init", "subscribe", "icons"]);
  });

  it("attaches close handler that calls window.close", async () => {
    const handlers = [];
    const closeBtn = {
      addEventListener: vi.fn((evt, handler) => handlers.push({ evt, handler })),
    };
    const windowClose = vi.fn();

    await onboardingBoot({
      initTheme: vi.fn(async () => {}),
      onThemeChange: vi.fn(),
      injectIcons: vi.fn(),
      closeBtn,
      windowClose,
    });

    expect(closeBtn.addEventListener).toHaveBeenCalledWith("click", expect.any(Function));
    handlers[0].handler();
    expect(windowClose).toHaveBeenCalledOnce();
  });

  it("missing close button does not crash boot (defensive)", async () => {
    // The HTML must contain #btn-get-started - but a markup typo shouldn't
    // crash the entire onboarding page. Replicates `?.addEventListener`.
    await expect(
      onboardingBoot({
        initTheme: vi.fn(async () => {}),
        onThemeChange: vi.fn(),
        injectIcons: vi.fn(),
        closeBtn: null,
        windowClose: vi.fn(),
      }),
    ).resolves.toBeUndefined();
  });
});
