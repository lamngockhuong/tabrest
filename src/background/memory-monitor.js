import { ALARM_NAMES } from "../shared/constants.js";
import { getSettings } from "../shared/storage.js";
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

  const memoryInfo = await getMemoryInfo();
  if (!memoryInfo) return 0;

  const usagePercent = calculateMemoryUsagePercent(memoryInfo);

  if (usagePercent < settings.memoryThresholdPercent) {
    return 0; // Under threshold
  }

  // Get LRU sorted tabs and unload oldest ones
  const lruTabs = getLRUSortedTabs();
  let unloadedCount = 0;

  // Unload up to 3 tabs per check to gradually reduce memory
  const maxUnload = 3;

  for (const tabId of lruTabs) {
    if (unloadedCount >= maxUnload) break;

    if (await discardTab(tabId, { settings })) {
      unloadedCount++;
    }
  }

  return unloadedCount;
}

// Re-export formatBytes from shared utils for backwards compatibility
export { formatBytes } from "../shared/utils.js";
