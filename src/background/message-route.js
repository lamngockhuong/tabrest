// Decides which runtime messages a sender may run.
// Content scripts live inside web pages, so a compromised renderer can send
// anything they can. They may only report about their own tab (including its
// form-modified flag and the scroll or playback state saved for it) or forward errors raised in extension code. Every other command belongs to the extension's own pages
// (popup, side panel, options, onboarding).

import { REPORTER_COMMANDS } from "../shared/constants.js";

export const MESSAGE_ROUTES = Object.freeze({
  TAB_MEMORY: "tab-memory",
  TAKE_SCROLL_POSITION: "take-scroll-position",
  TAKE_YOUTUBE_TIMESTAMP: "take-youtube-timestamp",
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
  if (message.action === "takeScrollPosition" && sender?.tab?.id) {
    return MESSAGE_ROUTES.TAKE_SCROLL_POSITION;
  }
  if (message.action === "takeYouTubeTimestamp" && sender?.tab?.id) {
    return MESSAGE_ROUTES.TAKE_YOUTUBE_TIMESTAMP;
  }
  if (message.action === "markFormModified" && sender?.tab?.id) {
    return MESSAGE_ROUTES.MARK_FORM_MODIFIED;
  }
  if (message.action === "getFormModified" && sender?.tab?.id) {
    return MESSAGE_ROUTES.GET_FORM_MODIFIED;
  }
  if (message.command === REPORTER_COMMANDS.CAPTURE_ERROR) {
    if (isExtensionPageSender(sender, extensionOrigin)) return MESSAGE_ROUTES.CAPTURE_ERROR;
    // A content script forwards only errors whose stack runs through extension code
    const stack = message.error?.stack;
    const ownError =
      sender?.tab?.id && typeof stack === "string" && stack.includes(extensionOrigin);
    return ownError ? MESSAGE_ROUTES.CAPTURE_ERROR : MESSAGE_ROUTES.FORBIDDEN;
  }
  return isExtensionPageSender(sender, extensionOrigin)
    ? MESSAGE_ROUTES.PRIVILEGED
    : MESSAGE_ROUTES.FORBIDDEN;
}
