import { SETTINGS_DEFAULTS, STORAGE_KEYS } from "./constants.js";

// Settings cache to avoid repeated storage reads
let settingsCache = null;

// Initialize cache invalidation listener
if (typeof chrome !== "undefined" && chrome.storage) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[STORAGE_KEYS.SETTINGS]) {
      settingsCache = null;
    }
  });
}

// Get settings with defaults merged (cached, invalidated on change)
export async function getSettings() {
  if (settingsCache) return settingsCache;
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
  settingsCache = { ...SETTINGS_DEFAULTS, ...result[STORAGE_KEYS.SETTINGS] };
  return settingsCache;
}

// Save settings to sync storage
export async function saveSettings(settings) {
  // Invalidate cache immediately to ensure consistency
  settingsCache = null;
  await chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: settings });
}

// Get tab activity timestamps from local storage
export async function getTabActivity() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.TAB_ACTIVITY);
  return result[STORAGE_KEYS.TAB_ACTIVITY] || {};
}

// Save tab activity to local storage
export async function saveTabActivity(activity) {
  await chrome.storage.local.set({ [STORAGE_KEYS.TAB_ACTIVITY]: activity });
}
