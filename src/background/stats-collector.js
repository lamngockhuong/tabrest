import { STORAGE_KEYS } from '../shared/constants.js';

// ~50MB per tab - conservative estimate based on Chrome memory profiling
const ESTIMATED_MB_PER_TAB = 50;

let stats = {
  tabsUnloaded: 0,
  memorySaved: 0,
  sessionStart: Date.now()
};

// Initialize stats from storage
export async function initStats() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.STATS);
  if (result[STORAGE_KEYS.STATS]) {
    stats = { ...result[STORAGE_KEYS.STATS], sessionStart: Date.now() };
  }
  console.log('Stats initialized:', stats);
}

// Record a tab unload event
export async function recordUnload(tabCount = 1) {
  stats.tabsUnloaded += tabCount;
  stats.memorySaved += tabCount * ESTIMATED_MB_PER_TAB * 1024 * 1024; // Convert to bytes
  await saveStats();
}

// Get current stats
export async function getStats() {
  return { ...stats };
}

// Reset all statistics
export async function resetStats() {
  stats = {
    tabsUnloaded: 0,
    memorySaved: 0,
    sessionStart: Date.now()
  };
  await saveStats();
}

// Save stats to storage
async function saveStats() {
  await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: stats });
}
