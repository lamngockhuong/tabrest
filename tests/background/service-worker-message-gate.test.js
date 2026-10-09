import { beforeAll, describe, expect, it, vi } from "vitest";
import { FORM_MODIFIED_KEY } from "../../src/shared/constants.js";

// Exception to the rule in service-worker-contracts.test.js: this file imports
// the real service-worker.js, because the sender gate only protects anything if
// the onMessage listener itself applies it. The chrome.* listeners the import
// registers are stubbed below and never fired except onMessage.

vi.mock("../../src/background/session-manager.js", () => ({
  deleteSession: vi.fn(),
  getSessions: vi.fn(() => Promise.resolve([])),
  importSessions: vi.fn(),
  restoreSession: vi.fn(() => Promise.resolve({ ok: true })),
  saveSession: vi.fn(),
}));

const { getSessions, restoreSession } = await import("../../src/background/session-manager.js");

const EXTENSION_ORIGIN = "chrome-extension://test/";
const contentScript = {
  id: "test",
  tab: { id: 7 },
  frameId: 0,
  url: "https://www.youtube.com/watch?v=x",
};
const popup = { id: "test", url: `${EXTENSION_ORIGIN}src/popup/popup.html` };

let onMessage;

beforeAll(async () => {
  const listener = () => ({ addListener: vi.fn() });
  chrome.action.onClicked = listener();
  chrome.action.setBadgeText = vi.fn(() => Promise.resolve());
  chrome.action.setBadgeBackgroundColor = vi.fn(() => Promise.resolve());
  chrome.runtime.onStartup = listener();
  chrome.runtime.onInstalled = listener();
  chrome.contextMenus = { onClicked: listener() };
  chrome.commands = { onCommand: listener() };

  await import("../../src/background/service-worker.js");
  const calls = chrome.runtime.onMessage.addListener.mock.calls;
  onMessage = calls[calls.length - 1][0];
});

// Calls the real listener and waits for sendResponse, or for a synchronous
// return when the listener answers before returning.
function send(message, sender) {
  return new Promise((resolve) => {
    onMessage(message, sender, resolve);
  });
}

describe("service-worker onMessage: sender gate", () => {
  it("answers forbidden to get-sessions from a content script", async () => {
    await expect(send({ command: "get-sessions" }, contentScript)).resolves.toEqual({
      ok: false,
      reason: "forbidden",
    });
    expect(getSessions).not.toHaveBeenCalled();
  });

  it("answers forbidden to restore-session from a content script", async () => {
    await expect(
      send({ command: "restore-session", id: "s1", mode: "replace" }, contentScript),
    ).resolves.toEqual({ ok: false, reason: "forbidden" });
    expect(restoreSession).not.toHaveBeenCalled();
  });

  it("gates on the extension origin from chrome.runtime.getURL", async () => {
    await send({ command: "get-sessions" }, contentScript);
    expect(chrome.runtime.getURL).toHaveBeenCalledWith("");
  });

  it("still answers getTabId from a content script", async () => {
    await expect(send({ action: "getTabId" }, contentScript)).resolves.toEqual({ tabId: 7 });
  });

  it("stores the form-modified flag for the sender's own tab and document", async () => {
    const sender = { ...contentScript, documentId: "doc-a" };
    await send({ action: "markFormModified" }, sender);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      [FORM_MODIFIED_KEY]: { 7: "doc-a" },
    });
  });

  it("runs get-sessions from an extension page", async () => {
    await send({ command: "get-sessions" }, popup);
    expect(getSessions).toHaveBeenCalledTimes(1);
  });
});
