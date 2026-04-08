// Snooze manager - temporarily protect tabs/domains from auto-discard
import { SNOOZE_KEY } from "../shared/constants.js";

/**
 * Get all snooze entries from storage
 * @returns {Promise<{tabs: Object, domains: Object}>}
 */
export async function getSnoozeData() {
  const result = await chrome.storage.local.get(SNOOZE_KEY);
  return result[SNOOZE_KEY] || { tabs: {}, domains: {} };
}

/**
 * Snooze a specific tab for given minutes
 * @param {number} tabId - Tab ID to snooze
 * @param {number} minutes - Duration in minutes (-1 for forever)
 */
export async function snoozeTab(tabId, minutes) {
  const data = await getSnoozeData();
  const until = minutes === -1 ? -1 : Date.now() + minutes * 60 * 1000;
  data.tabs[tabId] = { until };
  await chrome.storage.local.set({ [SNOOZE_KEY]: data });
}

/**
 * Snooze a domain for given minutes
 * @param {string} domain - Domain to snooze
 * @param {number} minutes - Duration in minutes (-1 for forever)
 */
export async function snoozeDomain(domain, minutes) {
  const data = await getSnoozeData();
  const until = minutes === -1 ? -1 : Date.now() + minutes * 60 * 1000;
  data.domains[domain] = { until };
  await chrome.storage.local.set({ [SNOOZE_KEY]: data });
}

/**
 * Check snooze info for a tab (core logic - sync version for batch operations)
 * @param {Object} data - Pre-fetched snooze data
 * @param {number} tabId - Tab ID to check
 * @param {string} url - Tab URL for domain matching
 * @returns {{snoozed: boolean, type?: string, domain?: string, until?: number}}
 */
function checkSnoozeSync(data, tabId, url) {
  const now = Date.now();

  // Check tab snooze first
  const tabSnooze = data.tabs[tabId];
  if (tabSnooze && (tabSnooze.until === -1 || tabSnooze.until > now)) {
    return { snoozed: true, type: "tab", until: tabSnooze.until };
  }

  // Check domain snooze using shared matchesDomainList pattern
  if (url) {
    try {
      const hostname = new URL(url).hostname;
      for (const [domain, snooze] of Object.entries(data.domains)) {
        if (hostname === domain || hostname.endsWith(`.${domain}`)) {
          if (snooze.until === -1 || snooze.until > now) {
            return { snoozed: true, type: "domain", domain, until: snooze.until };
          }
        }
      }
    } catch {
      // Invalid URL
    }
  }

  return { snoozed: false };
}

/**
 * Check if tab is currently snoozed (by tabId or domain)
 * @param {number} tabId - Tab ID to check
 * @param {string} url - Tab URL for domain matching
 * @param {Object} [preloadedData] - Optional pre-fetched snooze data for batch operations
 * @returns {Promise<boolean>}
 */
export async function isTabSnoozed(tabId, url, preloadedData = null) {
  const data = preloadedData || (await getSnoozeData());
  return checkSnoozeSync(data, tabId, url).snoozed;
}

/**
 * Get snooze info for a tab (for UI display)
 * @param {number} tabId - Tab ID
 * @param {string} url - Tab URL
 * @param {Object} [preloadedData] - Optional pre-fetched snooze data for batch operations
 * @returns {Promise<{snoozed: boolean, type?: string, until?: number}>}
 */
export async function getTabSnoozeInfo(tabId, url, preloadedData = null) {
  const data = preloadedData || (await getSnoozeData());
  return checkSnoozeSync(data, tabId, url);
}

/**
 * Remove expired snooze entries
 */
export async function cleanupExpiredSnooze() {
  const data = await getSnoozeData();
  const now = Date.now();
  let changed = false;

  // Clean expired tab snoozes
  for (const [tabId, snooze] of Object.entries(data.tabs)) {
    if (snooze.until !== -1 && snooze.until <= now) {
      delete data.tabs[tabId];
      changed = true;
    }
  }

  // Clean expired domain snoozes
  for (const [domain, snooze] of Object.entries(data.domains)) {
    if (snooze.until !== -1 && snooze.until <= now) {
      delete data.domains[domain];
      changed = true;
    }
  }

  if (changed) {
    await chrome.storage.local.set({ [SNOOZE_KEY]: data });
  }
}

/**
 * Cancel snooze for a tab
 * @param {number} tabId - Tab ID
 */
export async function cancelTabSnooze(tabId) {
  const data = await getSnoozeData();
  if (!data.tabs[tabId]) return; // No-op if not snoozed
  delete data.tabs[tabId];
  await chrome.storage.local.set({ [SNOOZE_KEY]: data });
}

/**
 * Cancel snooze for a domain
 * @param {string} domain - Domain to unsnooze
 */
export async function cancelDomainSnooze(domain) {
  const data = await getSnoozeData();
  if (!data.domains[domain]) return; // No-op if not snoozed
  delete data.domains[domain];
  await chrome.storage.local.set({ [SNOOZE_KEY]: data });
}

/**
 * Get all active snoozes for UI display
 * @returns {Promise<{tabs: Array, domains: Array}>}
 */
export async function getActiveSnoozes() {
  const data = await getSnoozeData();
  const now = Date.now();

  const tabs = Object.entries(data.tabs)
    .filter(([, s]) => s.until === -1 || s.until > now)
    .map(([id, s]) => ({ tabId: Number(id), until: s.until }));

  const domains = Object.entries(data.domains)
    .filter(([, s]) => s.until === -1 || s.until > now)
    .map(([domain, s]) => ({ domain, until: s.until }));

  return { tabs, domains };
}
