import {
  ALARM_NAMES,
  MAX_TABS_PER_MEMORY_CHECK,
  MEMORY_STALE_THRESHOLD_MS,
  POWER_MODE_CONFIG,
} from "../shared/constants.js";
import { getSettings } from "../shared/storage.js";
import { notifyAutoUnload } from "../shared/utils.js";
import { getSnoozeData, isTabSnoozed } from "./snooze-manager.js";
import { getLRUSortedTabs } from "./tab-tracker.js";
import { discardTab } from "./unload-manager.js";

let lastMemoryInfo = null;

// Initialize memory monitor and setup alarm
export async function initMemoryMonitor() {
  await setupMemoryCheckAlarm();
}

// Setup periodic memory check alarm based on settings
export async function setupMemoryCheckAlarm() {
  await chrome.alarms.clear(ALARM_NAMES.MEMORY_CHECK);

  const settings = await getSettings();
  if (settings.memoryThresholdPercent > 0) {
    // Check every 30 seconds
    chrome.alarms.create(ALARM_NAMES.MEMORY_CHECK, {
      periodInMinutes: 0.5,
    });
  }
}

// Get current system memory info
export async function getMemoryInfo() {
  try {
    const info = await chrome.system.memory.getInfo();
    lastMemoryInfo = info;
    return info;
  } catch (error) {
    console.error("Failed to get memory info:", error);
    return null;
  }
}

// Get last cached memory info (for UI without API call)
export function getLastMemoryInfo() {
  return lastMemoryInfo;
}

// Calculate memory usage percentage
export function calculateMemoryUsagePercent(memoryInfo) {
  if (!memoryInfo) return 0;
  const used = memoryInfo.capacity - memoryInfo.availableCapacity;
  return Math.round((used / memoryInfo.capacity) * 100);
}

// Check memory and unload tabs if threshold exceeded
export async function checkMemoryAndUnload() {
  const settings = await getSettings();
  if (settings.memoryThresholdPercent <= 0) return 0;

  // Skip if offline and setting enabled - tabs can't reload anyway
  if (settings.skipWhenOffline && !navigator.onLine) {
    return 0;
  }

  const memoryInfo = await getMemoryInfo();
  if (!memoryInfo) return 0;

  const usagePercent = calculateMemoryUsagePercent(memoryInfo);

  // Apply power mode offset to threshold
  const powerConfig = POWER_MODE_CONFIG[settings.powerMode] || POWER_MODE_CONFIG.normal;
  const effectiveThreshold = settings.memoryThresholdPercent + powerConfig.memoryThresholdOffset;

  if (usagePercent < effectiveThreshold) {
    return 0; // Under threshold
  }

  // Get LRU sorted tabs and unload oldest ones
  const lruTabs = getLRUSortedTabs();
  let unloadedCount = 0;

  // Load snooze data once before loop to avoid N+1 storage reads
  const snoozeData = await getSnoozeData();

  console.log(
    `[TabRest] MEMORY check: RAM ${usagePercent}% (threshold: ${effectiveThreshold}%), unloading up to ${MAX_TABS_PER_MEMORY_CHECK} tabs`,
  );

  for (const tabId of lruTabs) {
    if (unloadedCount >= MAX_TABS_PER_MEMORY_CHECK) break;

    // Get tab info for snooze check and notification
    let tab = null;
    try {
      tab = await chrome.tabs.get(tabId);
    } catch {
      // Tab may not exist
      continue;
    }

    // Skip if tab or domain is snoozed (using preloaded data)
    if (await isTabSnoozed(tabId, tab.url, snoozeData)) continue;

    if (await discardTab(tabId, { settings })) {
      unloadedCount++;
      // Notify if enabled
      if (settings.notifyOnAutoUnload && tab.title) {
        notifyAutoUnload(tab.title, "memory", `RAM usage: ${usagePercent}%`);
      }
    }
  }

  return unloadedCount;
}

// Per-tab memory tracking map: tabId -> { heapMB, lastUpdate }
const tabMemoryMap = new Map();

// Handle memory report from content script
export function reportTabMemory(tabId, heapMB) {
  tabMemoryMap.set(tabId, {
    heapMB,
    lastUpdate: Date.now(),
  });
}

// Clean up memory entry when tab closes
export function removeTabMemory(tabId) {
  tabMemoryMap.delete(tabId);
}

// Get tab memory (returns null if stale or not available)
export function getTabMemory(tabId) {
  const data = tabMemoryMap.get(tabId);
  if (data && Date.now() - data.lastUpdate < MEMORY_STALE_THRESHOLD_MS) {
    return data.heapMB;
  }
  return null;
}

// Check individual tab memory and unload heavy tabs
export async function checkPerTabMemory() {
  const settings = await getSettings();
  if (settings.perTabJsHeapThresholdMB <= 0) return 0;

  // Skip if offline and setting enabled - tabs can't reload anyway
  if (settings.skipWhenOffline && !navigator.onLine) {
    return 0;
  }

  const tabs = await chrome.tabs.query({});
  let unloadedCount = 0;

  // Load snooze data once before loop to avoid N+1 storage reads
  const snoozeData = await getSnoozeData();

  for (const tab of tabs) {
    if (tab.active || tab.discarded) continue;

    // Skip if tab or domain is snoozed
    if (await isTabSnoozed(tab.id, tab.url, snoozeData)) continue;

    const heapMB = getTabMemory(tab.id);
    if (heapMB && heapMB > settings.perTabJsHeapThresholdMB) {
      if (await discardTab(tab.id, { settings })) {
        unloadedCount++;
      }
    }
  }

  return unloadedCount;
}

// Re-export formatBytes from shared utils for backwards compatibility
export { formatBytes } from "../shared/utils.js";
