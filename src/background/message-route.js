// Decides which runtime messages a sender may run.
// Content scripts live inside web pages, so a compromised renderer can send
// anything they can. They may only report about their own tab (including its
// form-modified flag) or forward their own errors. Every other command belongs to the extension's own pages
// (popup, side panel, options, onboarding).

import { REPORTER_COMMANDS } from "../shared/constants.js";

export const MESSAGE_ROUTES = Object.freeze({
  TAB_MEMORY: "tab-memory",
  TAB_ID: "tab-id",
  MARK_FORM_MODIFIED: "mark-form-modified",
  GET_FORM_MODIFIED: "get-form-modified",
  CAPTURE_ERROR: "capture-error",
  PRIVILEGED: "privileged",
  FORBIDDEN: "forbidden",
});

/**
 * True when the message comes from a page served by this extension.
 * Options and onboarding open in a tab, so sender.tab alone does not mark a
 * content script; the sender URL (filled in by the browser) does.
 * @param {chrome.runtime.MessageSender} sender
 * @param {string} extensionOrigin - chrome.runtime.getURL("")
 */
export function isExtensionPageSender(sender, extensionOrigin) {
  return (
    typeof sender?.url === "string" &&
    typeof extensionOrigin === "string" &&
    extensionOrigin.length > 0 &&
    sender.url.startsWith(extensionOrigin)
  );
}

/**
 * Pick the handler for a runtime message, or FORBIDDEN when the sender may
 * not run it.
 * @param {object} message
 * @param {chrome.runtime.MessageSender} sender
 * @param {string} extensionOrigin - chrome.runtime.getURL("")
 * @returns {string} one of MESSAGE_ROUTES
 */
export function resolveMessageRoute(message, sender, extensionOrigin) {
  if (!message || typeof message !== "object") return MESSAGE_ROUTES.FORBIDDEN;
  if (message.action === "reportTabMemory" && sender?.tab?.id) return MESSAGE_ROUTES.TAB_MEMORY;
  if (message.action === "getTabId" && sender?.tab?.id) return MESSAGE_ROUTES.TAB_ID;
  if (message.action === "markFormModified" && sender?.tab?.id) {
    return MESSAGE_ROUTES.MARK_FORM_MODIFIED;
  }
  if (message.action === "getFormModified" && sender?.tab?.id) {
    return MESSAGE_ROUTES.GET_FORM_MODIFIED;
  }
  if (message.command === REPORTER_COMMANDS.CAPTURE_ERROR) return MESSAGE_ROUTES.CAPTURE_ERROR;
  return isExtensionPageSender(sender, extensionOrigin)
    ? MESSAGE_ROUTES.PRIVILEGED
    : MESSAGE_ROUTES.FORBIDDEN;
}
