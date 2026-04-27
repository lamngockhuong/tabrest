// Default settings for TabRest extension
export const SETTINGS_DEFAULTS = {
  autoUnloadOnStartup: true,
  unloadDelayMinutes: 30,
  memoryThresholdPercent: 80,
  whitelist: ["youtube.com", "gmail.com", "docs.google.com", "miro.com", "figma.com", "notion.so"],
  blacklist: [],
  unloadPinnedTabs: false,
  protectAudioTabs: true,
  protectFormTabs: true,
  showBadgeCount: true,
  enableTabGroups: true,
  enableStats: true,
  showDiscardedPrefix: true,
  discardedPrefix: "\u{1F4A4}",
  // Only auto-discard when inactive tabs exceed this count (0 = disabled)
  minTabsBeforeAutoDiscard: 6,
  // Toolbar click action: "popup" | "discard-current" | "discard-others"
  toolbarClickAction: "popup",
  // Save YouTube video position before discarding (disabled by default, YouTube has built-in resume)
  saveYouTubeTimestamp: false,
  // Only auto-discard when computer is idle
  onlyDiscardWhenIdle: false,
  idleThresholdMinutes: 5,
  // Power mode: "battery-saver" | "normal" | "performance"
  powerMode: "normal",
  // Per-tab JS heap threshold in MB (0 = disabled)
  perTabJsHeapThresholdMB: 0,
  // Competitor feature: Skip auto-discard when offline
  skipWhenOffline: true,
  // Competitor feature: Restore scroll position after reload
  restoreScrollPosition: true,
  // Notify when tabs are auto-unloaded
  notifyOnAutoUnload: false,
  // Error reporting (opt-out) - send anonymous crash reports
  enableErrorReporting: true,
  // Show on-page warning toast before auto-discard (timer/memory paths only)
  showSuspendWarning: true,
  // Delay between toast appearance and discard, in ms
  suspendWarningDelayMs: 3000,
  // Open in side panel instead of popup
  useSidePanel: false,
};

// YouTube timestamp storage key
export const YOUTUBE_TIMESTAMPS_KEY = "youtube_timestamps";

// YouTube timestamp max age (7 days in milliseconds)
export const YOUTUBE_TIMESTAMP_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Power mode configuration - affects delay and memory thresholds
export const POWER_MODE_CONFIG = {
  "battery-saver": {
    delayMultiplier: 0.5, // 50% of normal delay
    memoryThresholdOffset: -10, // 10% lower threshold (more aggressive)
  },
  normal: {
    delayMultiplier: 1.0,
    memoryThresholdOffset: 0,
  },
  performance: {
    delayMultiplier: 2.0, // 200% of normal delay
    memoryThresholdOffset: 10, // 10% higher threshold (less aggressive)
  },
};

// Chrome alarm names for periodic checks
export const ALARM_NAMES = {
  TAB_CHECK: "tab-check-alarm",
  MEMORY_CHECK: "memory-check-alarm",
  SNOOZE_CLEANUP: "snooze-cleanup-alarm",
};

// Scroll position storage
export const SCROLL_POSITIONS_KEY = "tabrest_scroll_positions";
export const SCROLL_MAX_ENTRIES = 100;

// Snooze storage
export const SNOOZE_KEY = "tabrest_snooze";

// Timeout for form data check (content script message)
export const FORM_CHECK_TIMEOUT_MS = 300;

// Per-tab memory staleness threshold (2 minutes)
export const MEMORY_STALE_THRESHOLD_MS = 120000;

// Memory report interval from content script (30 seconds)
export const MEMORY_REPORT_INTERVAL_MS = 30000;

// Max tabs to unload per memory check cycle
export const MAX_TABS_PER_MEMORY_CHECK = 3;

// Chrome storage keys
export const STORAGE_KEYS = {
  SETTINGS: "settings",
  TAB_ACTIVITY: "tabActivity",
  STATS: "stats",
};
