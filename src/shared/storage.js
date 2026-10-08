import { SETTINGS_DEFAULTS, STORAGE_KEYS } from "./constants.js";

// Settings cache to avoid repeated storage reads
let settingsCache = null;
// Bumped on every invalidation so a read that started earlier cannot refill the cache
let cacheEpoch = 0;

// Initialize cache invalidation listener
if (typeof chrome !== "undefined" && chrome.storage) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[STORAGE_KEYS.SETTINGS]) {
      settingsCache = null;
      cacheEpoch++;
    }
  });
}

// Get settings with defaults merged (cached, invalidated on change)
export async function getSettings() {
  if (settingsCache) return settingsCache;
  const epoch = cacheEpoch;
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
  const settings = { ...SETTINGS_DEFAULTS, ...result[STORAGE_KEYS.SETTINGS] };
  // Settings changed while this read was in flight: return it, but don't cache stale data
  if (epoch === cacheEpoch) settingsCache = settings;
  return settings;
}

// Save settings to sync storage
export async function saveSettings(settings) {
  // Invalidate cache immediately to ensure consistency
  settingsCache = null;
  cacheEpoch++;
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
