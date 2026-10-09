import { describe, expect, it } from "vitest";
import { CONTENT_ERROR_SESSION_CAP } from "../../src/shared/constants.js";
import { takeContentErrorBudget } from "../../src/shared/error-reporter.js";

// Content scripts share a renderer with the page, so their error reports get a
// budget of their own, kept where content scripts cannot reset it.
describe("error-reporter: content-script error budget", () => {
  it("allows errors up to the cap, then refuses", async () => {
    let used;
    chrome.storage.session.get.mockImplementation(async (key) => ({ [key]: used }));
    chrome.storage.session.set.mockImplementation(async (items) => {
      used = Object.values(items)[0];
    });

    const results = [];
    for (let i = 0; i < CONTENT_ERROR_SESSION_CAP + 3; i++) {
      results.push(await takeContentErrorBudget());
    }

    expect(results.filter(Boolean)).toHaveLength(CONTENT_ERROR_SESSION_CAP);
    expect(results.slice(CONTENT_ERROR_SESSION_CAP).every((r) => r === false)).toBe(true);
  });

  it("counts concurrent calls without losing any", async () => {
    let used;
    chrome.storage.session.get.mockImplementation(async (key) => ({ [key]: used }));
    chrome.storage.session.set.mockImplementation(async (items) => {
      used = Object.values(items)[0];
    });

    const results = await Promise.all(
      Array.from({ length: CONTENT_ERROR_SESSION_CAP + 5 }, () => takeContentErrorBudget()),
    );

    expect(results.filter(Boolean)).toHaveLength(CONTENT_ERROR_SESSION_CAP);
  });

  it("keeps the budget in session storage, which content scripts cannot reach", async () => {
    chrome.storage.session.get.mockResolvedValue({});
    await takeContentErrorBudget();
    expect(chrome.storage.session.set).toHaveBeenCalled();
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it("refuses when session storage fails", async () => {
    chrome.storage.session.get.mockRejectedValue(new Error("unavailable"));
    expect(await takeContentErrorBudget()).toBe(false);
  });
});
