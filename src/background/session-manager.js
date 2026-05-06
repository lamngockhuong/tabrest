// Session management module
// Handles saving, restoring, and managing tab sessions

import { isSafeHttpUrl, queryCurrentWindowTabs } from "../shared/utils.js";

const MAX_SESSIONS = 20;
const SESSIONS_KEY = "tabrest_sessions";
const SESSION_NAME_MAX_LEN = 100;

// Internal protocols to exclude from sessions
const INTERNAL_PROTOCOLS = ["chrome:", "chrome-extension:", "about:", "file:", "devtools:"];

/**
 * Check if URL is an internal browser URL
 * @param {string} url - URL to check
 * @returns {boolean}
 */
function isInternalUrl(url) {
  return !url || INTERNAL_PROTOCOLS.some((p) => url.startsWith(p));
}

/**
 * Auto-generate session name from current date/time
 * @returns {string}
 */
function formatSessionName() {
  const d = new Date();
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Get all saved sessions
 * @returns {Promise<Array>}
 */
export async function getSessions() {
  const result = await chrome.storage.local.get(SESSIONS_KEY);
  return result[SESSIONS_KEY] || [];
}

/**
 * Save current window tabs as a session
 * @param {string} name - Optional session name
 * @returns {Promise<{success: boolean, session?: object, error?: string}>}
 */
export async function saveSession(name) {
  const sessions = await getSessions();

  if (sessions.length >= MAX_SESSIONS) {
    return { success: false, error: "Maximum sessions reached (20)" };
  }

  const tabs = await queryCurrentWindowTabs();
  const validTabs = tabs.filter((t) => t.url && !isInternalUrl(t.url));

  if (!validTabs.length) {
    return { success: false, error: "No saveable tabs in window" };
  }

  const session = {
    id: `session_${Date.now()}`,
    name: (name || formatSessionName()).slice(0, SESSION_NAME_MAX_LEN),
    createdAt: Date.now(),
    tabs: validTabs.map((t) => ({
      url: t.url,
      title: t.title || "Untitled",
      favIconUrl: t.favIconUrl || "",
      pinned: t.pinned || false,
    })),
  };

  sessions.unshift(session);
  await chrome.storage.local.set({ [SESSIONS_KEY]: sessions });

  return { success: true, session };
}

/**
 * Delete a session by ID
 * @param {string} id - Session ID
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteSession(id) {
  const sessions = await getSessions();
  const filtered = sessions.filter((s) => s.id !== id);
  await chrome.storage.local.set({ [SESSIONS_KEY]: filtered });
  return { success: true };
}

/**
 * Restore a session
 * @param {string} id - Session ID
 * @param {string} mode - 'open' (add tabs) or 'replace' (close existing)
 * @returns {Promise<{success: boolean, count?: number, error?: string}>}
 */
export async function restoreSession(id, mode = "open") {
  const sessions = await getSessions();
  const session = sessions.find((s) => s.id === id);

  if (!session) {
    return { success: false, error: "Session not found" };
  }

  const validTabs = session.tabs.filter((t) => t.url && !isInternalUrl(t.url));
  if (!validTabs.length) {
    return { success: false, error: "No restorable tabs" };
  }

  if (mode === "replace") {
    // Close current tabs and open session tabs
    const currentTabs = await queryCurrentWindowTabs();

    // Create first tab
    const firstTab = validTabs[0];
    const newTab = await chrome.tabs.create({
      url: firstTab.url,
      pinned: firstTab.pinned,
      active: true,
    });

    // Close old tabs
    const oldIds = currentTabs.map((t) => t.id).filter((tabId) => tabId !== newTab.id);
    if (oldIds.length) await chrome.tabs.remove(oldIds);

    // Create remaining tabs
    for (let i = 1; i < validTabs.length; i++) {
      await chrome.tabs.create({
        url: validTabs[i].url,
        pinned: validTabs[i].pinned,
        active: false,
      });
    }
  } else {
    // Open mode - just add tabs
    for (const tab of validTabs) {
      await chrome.tabs.create({
        url: tab.url,
        pinned: tab.pinned,
        active: false,
      });
    }
  }

  return { success: true, count: validTabs.length };
}

/**
 * Import sessions from a parsed payload. Additive - duplicates by name and
 * malformed entries are skipped. Hard-caps at MAX_SESSIONS overall.
 * @param {Array} incoming
 * @returns {Promise<{added: number, skipped: number}>}
 */
export async function importSessions(incoming) {
  if (!Array.isArray(incoming)) return { added: 0, skipped: 0 };

  const existing = await getSessions();
  const existingNames = new Set(existing.map((s) => s.name));
  let added = 0;
  let skipped = 0;

  for (const s of incoming) {
    if (existing.length >= MAX_SESSIONS) {
      skipped++;
      continue;
    }
    if (!s || typeof s !== "object" || !s.name || !Array.isArray(s.tabs)) {
      skipped++;
      continue;
    }
    const name = String(s.name).slice(0, SESSION_NAME_MAX_LEN);
    if (existingNames.has(name)) {
      skipped++;
      continue;
    }

    const tabs = s.tabs
      .filter((t) => t && isSafeHttpUrl(t?.url))
      .map((t) => ({
        url: t.url,
        title: typeof t.title === "string" ? t.title : "Untitled",
        favIconUrl: typeof t.favIconUrl === "string" ? t.favIconUrl : "",
        pinned: !!t.pinned,
      }));

    if (!tabs.length) {
      skipped++;
      continue;
    }

    existing.unshift({
      id: `session_${Date.now()}_${crypto.randomUUID()}`,
      name,
      createdAt: typeof s.createdAt === "number" ? s.createdAt : Date.now(),
      tabs,
    });
    existingNames.add(name);
    added++;
  }

  if (added > 0) {
    await chrome.storage.local.set({ [SESSIONS_KEY]: existing });
  }
  return { added, skipped };
}
