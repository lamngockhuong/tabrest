// Collects sanitized diagnostic data for bug reports
// Privacy-first: no URLs, titles, domains, or personal data

import { getSettings } from "./storage.js";
import { getBrowserInfo } from "./utils.js";

/**
 * Collect sanitized diagnostic data
 * @returns {Promise<Object>} Diagnostic data safe to share
 */
export async function collectDiagnostics() {
  const [settings, tabs, memoryInfo, stats] = await Promise.all([
    getSettings(),
    chrome.tabs.query({}),
    getMemoryInfoSafe(),
    getStatsSafe(),
  ]);

  const browserInfo = getBrowserInfo();

  return {
    // Extension info
    extension: {
      version: chrome.runtime.getManifest().version,
      browser: browserInfo.name,
      browserVersion: browserInfo.version || "unknown",
      platform: navigator.platform,
      timestamp: new Date().toISOString(),
    },

    // Settings (exclude sensitive)
    settings: sanitizeSettings(settings),

    // Tab counts only (no URLs/titles)
    tabs: {
      total: tabs.length,
      discarded: tabs.filter((t) => t.discarded).length,
      pinned: tabs.filter((t) => t.pinned).length,
      audible: tabs.filter((t) => t.audible).length,
      windows: new Set(tabs.map((t) => t.windowId)).size,
    },

    // Memory usage
    memory: memoryInfo,

    // Stats (if enabled)
    stats: stats,
  };
}

/**
 * Remove sensitive settings before sharing
 * @param {Object} settings - Full settings object
 * @returns {Object} Sanitized settings
 */
function sanitizeSettings(settings) {
  // Extract only non-sensitive settings
  const { whitelist, blacklist, ...safeSettings } = settings;

  return {
    ...safeSettings,
    // Only share counts, not actual domains
    whitelistCount: whitelist?.length || 0,
    blacklistCount: blacklist?.length || 0,
  };
}

/**
 * Get memory info with error handling
 * @returns {Promise<Object>} Memory info or error
 */
async function getMemoryInfoSafe() {
  try {
    const info = await chrome.system.memory.getInfo();
    const used = info.capacity - info.availableCapacity;
    return {
      usagePercent: Math.round((used / info.capacity) * 100),
      totalGB: (info.capacity / 1024 / 1024 / 1024).toFixed(1),
      availableGB: (info.availableCapacity / 1024 / 1024 / 1024).toFixed(1),
    };
  } catch {
    return { error: "Unable to read memory info" };
  }
}

/**
 * Get stats with error handling
 * @returns {Promise<Object>} Stats or error
 */
async function getStatsSafe() {
  try {
    const data = await chrome.storage.local.get("stats");
    const stats = data.stats || {};
    return {
      totalTabsSuspended: stats.totalTabsSuspended || 0,
      totalTabsSuspendedToday: stats.totalTabsSuspendedToday || 0,
      installDate: stats.installDate || null,
    };
  } catch {
    return { error: "Unable to read stats" };
  }
}

/**
 * Format diagnostics as readable text for clipboard/GitHub
 * @param {Object} data - Diagnostics from collectDiagnostics()
 * @returns {string} Markdown-formatted report
 */
export function formatDiagnosticsText(data) {
  const memorySection = data.memory.error
    ? `- Error: ${data.memory.error}`
    : `- Usage: ${data.memory.usagePercent}%
- Total RAM: ${data.memory.totalGB} GB
- Available: ${data.memory.availableGB} GB`;

  return `## TabRest Bug Report

### Extension
- Version: ${data.extension.version}
- Browser: ${data.extension.browser} ${data.extension.browserVersion}
- Platform: ${data.extension.platform}
- Time: ${data.extension.timestamp}

### Tabs
- Total: ${data.tabs.total}
- Discarded: ${data.tabs.discarded}
- Pinned: ${data.tabs.pinned}
- Playing audio: ${data.tabs.audible}
- Windows: ${data.tabs.windows}

### Memory
${memorySection}

### Settings
- Auto-unload delay: ${data.settings.unloadDelayMinutes} min
- RAM threshold: ${data.settings.memoryThresholdPercent}%
- Power mode: ${data.settings.powerMode}
- Min tabs before auto-discard: ${data.settings.minTabsBeforeAutoDiscard}
- Whitelist entries: ${data.settings.whitelistCount}
- Blacklist entries: ${data.settings.blacklistCount}

### Stats
- Tabs unloaded (all time): ${data.stats.totalTabsSuspended}
- Tabs unloaded (today): ${data.stats.totalTabsSuspendedToday}
`;
}

/**
 * Format diagnostics as JSON for preview
 * @param {Object} data - Diagnostics from collectDiagnostics()
 * @returns {string} JSON string
 */
export function formatDiagnosticsJSON(data) {
  return JSON.stringify(data, null, 2);
}
