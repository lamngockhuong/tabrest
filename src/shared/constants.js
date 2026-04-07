// Default settings for TabRest extension
export const SETTINGS_DEFAULTS = {
  autoUnloadOnStartup: true,
  unloadDelayMinutes: 30,
  memoryThresholdPercent: 80,
  whitelist: ["youtube.com", "gmail.com", "docs.google.com"],
  blacklist: [],
  unloadPinnedTabs: false,
  protectAudioTabs: true,
  protectFormTabs: true,
  showBadgeCount: true,
  enableTabGroups: true,
  enableStats: true,
};

// Chrome alarm names for periodic checks
export const ALARM_NAMES = {
  TAB_CHECK: "tab-check-alarm",
  MEMORY_CHECK: "memory-check-alarm",
};

// Chrome storage keys
export const STORAGE_KEYS = {
  SETTINGS: "settings",
  TAB_ACTIVITY: "tabActivity",
  STATS: "stats",
};
