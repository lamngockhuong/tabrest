import { getTabActivity, saveTabActivity, getSettings } from '../shared/storage.js';
import { discardTab } from './unload-manager.js';
import { ALARM_NAMES } from '../shared/constants.js';

// In-memory cache of tab activity: { tabId: lastActiveTimestamp }
let tabActivity = {};
let saveTimeout = null;

// Initialize tab tracker - load persisted data and setup alarm
export async function initTabTracker() {
  tabActivity = await getTabActivity();
  await setupTabCheckAlarm();
  console.log('Tab tracker initialized with', Object.keys(tabActivity).length, 'tabs');
}

// Setup periodic check alarm based on settings
export async function setupTabCheckAlarm() {
  await chrome.alarms.clear(ALARM_NAMES.TAB_CHECK);

  const settings = await getSettings();
  if (settings.unloadDelayMinutes > 0) {
    // Check every minute
    chrome.alarms.create(ALARM_NAMES.TAB_CHECK, {
      periodInMinutes: 1
    });
    console.log('Tab check alarm set (every 1 minute)');
  }
}

// Update activity timestamp for a tab
export function updateTabActivity(tabId) {
  tabActivity[tabId] = Date.now();
  debouncedSave();
}

// Remove activity entry when tab is closed
export function removeTabActivity(tabId) {
  delete tabActivity[tabId];
  debouncedSave();
}

// Get copy of activity map (for debugging/UI)
export function getTabActivityMap() {
  return { ...tabActivity };
}

// Get tabs sorted by LRU (oldest first)
export function getLRUSortedTabs() {
  return Object.entries(tabActivity)
    .sort(([, a], [, b]) => a - b)
    .map(([tabId]) => parseInt(tabId));
}

// Check and unload tabs that exceeded the inactivity delay
export async function checkAndUnloadInactiveTabs() {
  const settings = await getSettings();
  if (settings.unloadDelayMinutes <= 0) return 0;

  const cutoffTime = Date.now() - (settings.unloadDelayMinutes * 60 * 1000);
  const tabs = await chrome.tabs.query({});

  // Build Map for O(1) lookup instead of O(n) find per iteration
  const tabMap = new Map(tabs.map(t => [t.id, t]));

  let unloadedCount = 0;

  for (const [tabIdStr, lastActive] of Object.entries(tabActivity)) {
    const tabId = parseInt(tabIdStr);

    // Skip if recently active
    if (lastActive > cutoffTime) continue;

    // Verify tab still exists and is eligible (O(1) lookup)
    const tab = tabMap.get(tabId);
    if (!tab || tab.active || tab.discarded) continue;

    if (await discardTab(tabId)) {
      unloadedCount++;
    }
  }

  if (unloadedCount > 0) {
    console.log(`Timer check: unloaded ${unloadedCount} inactive tabs`);
  }

  return unloadedCount;
}

// Debounced save to prevent excessive writes
function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await saveTabActivity(tabActivity);
  }, 1000);
}

// Clean up activity entries for tabs that no longer exist
export async function cleanupStaleActivity() {
  const tabs = await chrome.tabs.query({});
  const validTabIds = new Set(tabs.map(t => t.id));

  let cleaned = 0;
  for (const tabIdStr of Object.keys(tabActivity)) {
    const tabId = parseInt(tabIdStr);
    if (!validTabIds.has(tabId)) {
      delete tabActivity[tabId];
      cleaned++;
    }
  }

  if (cleaned > 0) {
    await saveTabActivity(tabActivity);
    console.log(`Cleaned up ${cleaned} stale tab entries`);
  }
}

// Initialize activity for all existing tabs
export async function syncAllTabs() {
  const tabs = await chrome.tabs.query({});
  const now = Date.now();

  for (const tab of tabs) {
    if (!tabActivity[tab.id]) {
      // New tab: active tabs get current time, others start 1 min old
      tabActivity[tab.id] = tab.active ? now : now - 60000;
    }
  }

  await saveTabActivity(tabActivity);
}
