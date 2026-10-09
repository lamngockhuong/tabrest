// Remembers which document the user typed into, per tab, outside the page's
// reach. A content script's in-memory flag is lost when the extension updates
// or reloads while the tab stays open; this lets the re-injected copy get it
// back. The browser-assigned documentId changes on every navigation, so a new
// page never inherits the flag of the previous one.

import { FORM_MODIFIED_KEY } from "../shared/constants.js";

async function readFlags() {
  const data = await chrome.storage.local.get(FORM_MODIFIED_KEY);
  return data[FORM_MODIFIED_KEY] || {};
}

// Serialize read-modify-write so a mark and a clear for different tabs cannot
// overwrite each other's result
let writeQueue = Promise.resolve();
function updateFlags(mutate) {
  const run = writeQueue.then(async () => {
    const flags = await readFlags();
    if (mutate(flags)) await chrome.storage.local.set({ [FORM_MODIFIED_KEY]: flags });
  });
  writeQueue = run.catch(() => {});
  return run;
}

/**
 * Record that the user modified a form in this tab's current document.
 * @param {number} tabId
 * @param {string} documentId - sender.documentId, set by the browser
 */
export async function markFormModified(tabId, documentId) {
  if (!documentId) return;
  await updateFlags((flags) => {
    if (flags[tabId] === documentId) return false;
    flags[tabId] = documentId;
    return true;
  });
}

/**
 * True when the user modified a form in this exact document.
 * @param {number} tabId
 * @param {string} documentId
 */
export async function isFormModified(tabId, documentId) {
  if (!documentId) return false;
  const flags = await readFlags();
  return flags[tabId] === documentId;
}

export async function clearFormModified(tabId) {
  await updateFlags((flags) => {
    if (!(tabId in flags)) return false;
    delete flags[tabId];
    return true;
  });
}

// Tab IDs are reassigned after a browser restart, so old entries mean nothing
export async function clearAllFormModified() {
  await chrome.storage.local.remove(FORM_MODIFIED_KEY);
}
