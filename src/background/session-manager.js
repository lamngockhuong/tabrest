// Session management module
// Handles saving, restoring, and managing tab sessions

const MAX_SESSIONS = 20;
const SESSIONS_KEY = 'tabrest_sessions';

// Internal protocols to exclude from sessions
const INTERNAL_PROTOCOLS = ['chrome:', 'chrome-extension:', 'about:', 'file:', 'devtools:'];

/**
 * Check if URL is an internal browser URL
 * @param {string} url - URL to check
 * @returns {boolean}
 */
function isInternalUrl(url) {
  return !url || INTERNAL_PROTOCOLS.some(p => url.startsWith(p));
}

/**
 * Auto-generate session name from current date/time
 * @returns {string}
 */
function formatSessionName() {
  const d = new Date();
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
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
    return { success: false, error: 'Maximum sessions reached (20)' };
  }

  const tabs = await chrome.tabs.query({ currentWindow: true });
  const validTabs = tabs.filter(t => t.url && !isInternalUrl(t.url));

  if (!validTabs.length) {
    return { success: false, error: 'No saveable tabs in window' };
  }

  const session = {
    id: `session_${Date.now()}`,
    name: name || formatSessionName(),
    createdAt: Date.now(),
    tabs: validTabs.map(t => ({
      url: t.url,
      title: t.title || 'Untitled',
      favIconUrl: t.favIconUrl || '',
      pinned: t.pinned || false
    }))
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
  const filtered = sessions.filter(s => s.id !== id);
  await chrome.storage.local.set({ [SESSIONS_KEY]: filtered });
  return { success: true };
}

/**
 * Restore a session
 * @param {string} id - Session ID
 * @param {string} mode - 'open' (add tabs) or 'replace' (close existing)
 * @returns {Promise<{success: boolean, count?: number, error?: string}>}
 */
export async function restoreSession(id, mode = 'open') {
  const sessions = await getSessions();
  const session = sessions.find(s => s.id === id);

  if (!session) {
    return { success: false, error: 'Session not found' };
  }

  const validTabs = session.tabs.filter(t => t.url && !isInternalUrl(t.url));
  if (!validTabs.length) {
    return { success: false, error: 'No restorable tabs' };
  }

  if (mode === 'replace') {
    // Close current tabs and open session tabs
    const currentTabs = await chrome.tabs.query({ currentWindow: true });

    // Create first tab
    const firstTab = validTabs[0];
    const newTab = await chrome.tabs.create({
      url: firstTab.url,
      pinned: firstTab.pinned,
      active: true
    });

    // Close old tabs
    const oldIds = currentTabs.map(t => t.id).filter(tabId => tabId !== newTab.id);
    if (oldIds.length) await chrome.tabs.remove(oldIds);

    // Create remaining tabs
    for (let i = 1; i < validTabs.length; i++) {
      await chrome.tabs.create({
        url: validTabs[i].url,
        pinned: validTabs[i].pinned,
        active: false
      });
    }
  } else {
    // Open mode - just add tabs
    for (const tab of validTabs) {
      await chrome.tabs.create({
        url: tab.url,
        pinned: tab.pinned,
        active: false
      });
    }
  }

  return { success: true, count: validTabs.length };
}

export { MAX_SESSIONS, SESSIONS_KEY };
