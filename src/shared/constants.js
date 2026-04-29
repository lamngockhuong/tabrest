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
  // Error reporting (opt-in, default OFF for privacy) - send anonymous crash reports
  enableErrorReporting: false,
  // Custom Sentry DSN override (empty = use built-in SENTRY_DSN constant)
  customSentryDsn: "",
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

// Error reporter: quota + dedup storage keys and limits
export const ERROR_QUOTA_KEY = "error_reporter_quota";
export const ERROR_DEDUP_KEY = "error_reporter_dedup";
export const ERROR_DAILY_CAP = 100;
export const ERROR_DEDUP_WINDOW_MS = 86400000; // 24 hours
export const ERROR_REPEAT_SAMPLE_RATE = 0.1;
export const ERROR_DEDUP_MAX_ENTRIES = 100;

// Anti-spam guards for user-initiated bug reports.
// Manual reports bypass error dedup, so they need their own throttle to
// prevent a malicious or impatient user from burning the shared daily cap.
export const MANUAL_REPORT_STATE_KEY = "manual_report_throttle";
export const MANUAL_REPORT_DAILY_CAP = 5;
export const MANUAL_REPORT_COOLDOWN_MS = 60000; // 1 minute between submits

// One-time flag: marks that consent was reset to opt-in default during the
// v0.0.5 → v0.1.0 migration. Without this guard, every future extension update
// would silently re-flip a user's enabled opt-in back to false.
export const CONSENT_RESET_MIGRATION_KEY = "consent_reset_migration_v1_done";

// Sentry surface tags (event source). Content scripts duplicate these as
// literals because they cannot import ES modules — keep in sync.
export const SURFACES = Object.freeze({
  SERVICE_WORKER: "service_worker",
  POPUP: "popup",
  OPTIONS: "options",
  CONTENT_FORM: "content_form",
  CONTENT_YOUTUBE: "content_youtube",
  MANUAL_REPORT: "manual_report",
});

// Runtime message commands routed to the error reporter via the SW bridge.
export const REPORTER_COMMANDS = Object.freeze({
  CAPTURE_ERROR: "captureError",
  CAPTURE_MESSAGE: "captureMessage",
  REPORT_BUG: "reportBug",
});

export const REPORT_REASONS = Object.freeze({
  COOLDOWN: "cooldown",
  DAILY_CAP: "daily_cap",
  SEND_FAILED: "send_failed",
  NO_DSN: "no_dsn",
});

// Sentry DSN for anonymous crash reporting.
// DSNs are public by design: they are project-scoped, server-rate-limited,
// and contain only a public key (no secret). Safe to commit.
// US-region ingest endpoint.
export const SENTRY_DSN =
  "https://2b6ab992bad3bb998e5026532fabccb3@o4511298350612480.ingest.us.sentry.io/4511298353496064";
