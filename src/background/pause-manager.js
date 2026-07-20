// Pause manager - temporarily disable ALL auto-discard globally.
// Distinct from snooze-manager (per tab/domain): this is a single global switch
// so users can suspend TabRest during presentations, downloads, gaming, etc.
// State lives in storage.local as { until } where until is an epoch ms deadline,
// or -1 for "paused until the user resumes". Manual unload actions are never
// affected - only automatic discard paths check isPaused().
import { PAUSE_KEY } from "../shared/constants.js";

/**
 * Read raw pause state from storage.
 * @returns {Promise<{until: number}|null>} until: epoch ms, -1 (forever), or null when not set
 */
async function getPauseData() {
  const result = await chrome.storage.local.get(PAUSE_KEY);
  return result[PAUSE_KEY] || null;
}

/**
 * Whether stored pause data represents a currently-active pause.
 * Single source of truth for the "-1 forever, else deadline in the future" rule.
 * @param {{until: number}|null} data
 * @returns {boolean}
 */
function isActive(data) {
  return Boolean(data) && (data.until === -1 || data.until > Date.now());
}

/**
 * Pause all auto-discard.
 * @param {number} minutes - Duration in minutes (>0), or -1 to pause until resumed
 * @returns {Promise<boolean>} true when a pause was written, false when input was rejected
 */
export async function setPause(minutes) {
  const n = Number(minutes);
  // Accept only the -1 "until resumed" sentinel or a positive minute count.
  // Reject NaN / <=0 / other negatives so a bad value can't write a dead
  // { until: NaN } entry that lingers until the next cleanup sweep.
  if (n !== -1 && (!Number.isFinite(n) || n <= 0)) return false;
  const until = n === -1 ? -1 : Date.now() + Math.trunc(n) * 60 * 1000;
  await chrome.storage.local.set({ [PAUSE_KEY]: { until } });
  return true;
}

/**
 * Resume auto-discard immediately.
 */
export async function clearPause() {
  await chrome.storage.local.remove(PAUSE_KEY);
}

/**
 * Whether auto-discard is currently paused. Expired timed pauses count as not paused.
 * @returns {Promise<boolean>}
 */
export async function isPaused() {
  return isActive(await getPauseData());
}

/**
 * Pause info for UI display.
 * @returns {Promise<{paused: boolean, until?: number}>} until: epoch ms or -1 when paused
 */
export async function getPauseInfo() {
  const data = await getPauseData();
  return isActive(data) ? { paused: true, until: data.until } : { paused: false };
}

/**
 * Remove an expired timed pause so the badge/UI can refresh back to normal.
 * @returns {Promise<boolean>} true when an expired entry was cleared
 */
export async function cleanupExpiredPause() {
  const data = await getPauseData();
  // Expired == stored but no longer active (indefinite pauses never expire).
  if (data && !isActive(data)) {
    await chrome.storage.local.remove(PAUSE_KEY);
    return true;
  }
  return false;
}
