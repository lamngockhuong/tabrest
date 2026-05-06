import { ALARM_NAMES, POWER_MODE_CONFIG } from "../shared/constants.js";
import { getSettings, getTabActivity, saveTabActivity } from "../shared/storage.js";
import { notifyAutoUnload } from "../shared/utils.js";
import { getSnoozeData, isTabSnoozed } from "./snooze-manager.js";
import { discardTab, isUrlBlacklisted, isUrlWhitelisted } from "./unload-manager.js";

// In-memory cache of tab activity: { tabId: lastActiveTimestamp }
let tabActivity = {};
let saveTimeout = null;

// Initialize tab tracker - load persisted data and setup alarm
export async function initTabTracker() {
  tabActivity = await getTabActivity();
  await setupTabCheckAlarm();
}

// Setup periodic check alarm based on settings
export async function setupTabCheckAlarm() {
  await chrome.alarms.clear(ALARM_NAMES.TAB_CHECK);

  const settings = await getSettings();
  if (settings.unloadDelayMinutes > 0) {
    // Check every minute
    chrome.alarms.create(ALARM_NAMES.TAB_CHECK, {
      periodInMinutes: 1,
    });
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
    .map(([tabId]) => Number.parseInt(tabId, 10));
}

// Check and unload tabs that exceeded the inactivity delay
export async function checkAndUnloadInactiveTabs() {
  const settings = await getSettings();
  if (settings.unloadDelayMinutes <= 0) return 0;

  // Skip if offline and setting enabled - avoid discarding tabs that can't reload
  if (settings.skipWhenOffline && !navigator.onLine) {
    return 0;
  }

  // Skip if user is active and idle-only mode is enabled
  if (settings.onlyDiscardWhenIdle) {
    try {
      const idleSeconds = settings.idleThresholdMinutes * 60;
      const state = await chrome.idle.queryState(idleSeconds);
      if (state === "active") {
        return 0; // User is active, skip discarding
      }
    } catch {
      // Idle API not available, proceed without idle check
    }
  }

  // Apply power mode multiplier to delay
  const powerConfig = POWER_MODE_CONFIG[settings.powerMode] || POWER_MODE_CONFIG.normal;
  const effectiveDelay = settings.unloadDelayMinutes * powerConfig.delayMultiplier;
  const cutoffTime = Date.now() - effectiveDelay * 60 * 1000;
  const tabs = await chrome.tabs.query({});

  // Build Map for O(1) lookup instead of O(n) find per iteration
  const tabMap = new Map(tabs.map((t) => [t.id, t]));

  // Skip if not enough inactive tabs
  if (settings.minTabsBeforeAutoDiscard > 0) {
    const eligibleCount = tabs.filter((t) => !t.active && !t.discarded).length;
    if (eligibleCount <= settings.minTabsBeforeAutoDiscard) {
      return 0;
    }
  }

  // Load snooze data once before loop to avoid N+1 storage reads
  const snoozeData = await getSnoozeData();

  let unloadedCount = 0;

  for (const [tabIdStr, lastActive] of Object.entries(tabActivity)) {
    const tabId = Number.parseInt(tabIdStr, 10);

    // Verify tab still exists and is eligible (O(1) lookup)
    const tab = tabMap.get(tabId);
    if (!tab || tab.active || tab.discarded) continue;

    // Whitelist wins over blacklist - skip entirely (matches discardTab gate)
    if (isUrlWhitelisted(tab.url, settings)) continue;

    // Blacklisted tabs: unload immediately regardless of activity time
    const blacklisted = isUrlBlacklisted(tab.url, settings);

    // Skip if recently active (unless blacklisted)
    if (!blacklisted && lastActive > cutoffTime) continue;

    // Skip if tab or domain is snoozed (using preloaded data)
    if (await isTabSnoozed(tabId, tab.url, snoozeData)) continue;

    const inactiveMinutes = Math.round((Date.now() - lastActive) / 60000);
    console.log(
      `[TabRest] TIMER unload: ${tab.url}, inactive ${inactiveMinutes}min (threshold: ${effectiveDelay}min)`,
    );

    if (await discardTab(tabId, { settings, auto: true })) {
      unloadedCount++;
      // Notify if enabled
      if (settings.notifyOnAutoUnload) {
        notifyAutoUnload(tab.title, "timer", `Inactive for ${inactiveMinutes} minutes`);
      }
    }
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
export async function cleanupStaleActivity(allTabs = null) {
  const tabs = allTabs ?? (await chrome.tabs.query({}));
  const validTabIds = new Set(tabs.map((t) => t.id));

  let cleaned = 0;
  for (const tabIdStr of Object.keys(tabActivity)) {
    const tabId = Number.parseInt(tabIdStr, 10);
    if (!validTabIds.has(tabId)) {
      delete tabActivity[tabId];
      cleaned++;
    }
  }

  if (cleaned > 0) {
    await saveTabActivity(tabActivity);
  }
}

// Initialize activity for all existing tabs
export async function syncAllTabs(allTabs = null) {
  const tabs = allTabs ?? (await chrome.tabs.query({}));
  const now = Date.now();

  for (const tab of tabs) {
    if (!tabActivity[tab.id]) {
      // New tab: active tabs get current time, others start 1 min old
      tabActivity[tab.id] = tab.active ? now : now - 60000;
    }
  }

  await saveTabActivity(tabActivity);
}
