// Enhanced stats collection module
// Tracks detailed metrics: today/all-time/member since/RAM saved

import { STORAGE_KEYS } from "../shared/constants.js";

const STATS_KEY = STORAGE_KEYS.STATS;
const MB_PER_TAB = 150; // Estimated MB saved per suspended tab

/**
 * Get today's date string (YYYY-MM-DD)
 */
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Default stats structure
 */
function defaultStats() {
  return {
    totalTabsSuspended: 0,
    totalTabsSuspendedToday: 0,
    todayDate: getTodayDate(),
    installDate: Date.now(),
    memorySaved: 0,
  };
}

/**
 * Reset daily count if date changed (mutates stats object)
 * @param {object} stats - Stats object to check/reset
 * @returns {boolean} True if reset occurred
 */
function resetDailyIfNeeded(stats) {
  const today = getTodayDate();
  if (stats.todayDate !== today) {
    stats.totalTabsSuspendedToday = 0;
    stats.todayDate = today;
    return true;
  }
  return false;
}

/**
 * Initialize stats on extension install
 */
export async function initStats() {
  const result = await chrome.storage.local.get(STATS_KEY);
  if (!result[STATS_KEY]) {
    await chrome.storage.local.set({ [STATS_KEY]: defaultStats() });
    console.log("Stats initialized with defaults");
  }
}

/**
 * Get current stats with daily reset check
 * @returns {Promise<object>}
 */
export async function getStats() {
  const result = await chrome.storage.local.get(STATS_KEY);
  const stats = result[STATS_KEY] || defaultStats();

  // Reset daily count if date changed
  if (resetDailyIfNeeded(stats)) {
    await chrome.storage.local.set({ [STATS_KEY]: stats });
  }

  // Calculate estimated RAM saved (derived, not stored)
  stats.estimatedRamSaved = stats.totalTabsSuspended * MB_PER_TAB;

  return stats;
}

/**
 * Record a tab suspension event
 * @param {number} count - Number of tabs suspended (default: 1)
 * @returns {Promise<object>} Updated stats
 */
export async function recordUnload(count = 1) {
  const result = await chrome.storage.local.get(STATS_KEY);
  const stats = result[STATS_KEY] || defaultStats();

  resetDailyIfNeeded(stats);

  stats.totalTabsSuspended += count;
  stats.totalTabsSuspendedToday += count;
  stats.memorySaved += count * MB_PER_TAB * 1024 * 1024; // bytes

  await chrome.storage.local.set({ [STATS_KEY]: stats });
  return stats;
}

/**
 * Alias for recordUnload for backward compatibility
 */
export const recordSuspension = recordUnload;

/**
 * Reset all statistics
 */
export async function resetStats() {
  const stats = defaultStats();
  await chrome.storage.local.set({ [STATS_KEY]: stats });
  return stats;
}

export { MB_PER_TAB, STATS_KEY };
