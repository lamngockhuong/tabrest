// Keeps the per-page state restored after a discarded tab reloads: scroll
// positions and YouTube playback times. Content scripts only report values and
// ask for their own tab's entry; storage stays with the service worker, so a
// compromised page cannot read or rewrite another site's entries.

import {
  SCROLL_MAX_ENTRIES,
  SCROLL_POSITIONS_KEY,
  YOUTUBE_TIMESTAMP_MAX_AGE_MS,
  YOUTUBE_TIMESTAMPS_KEY,
} from "../shared/constants.js";

const isNonNegative = (n) => Number.isFinite(n) && n >= 0;
const VIDEO_ID_RE = /^[\w-]{1,64}$/;

/**
 * The YouTube video id of a watch-page URL, or null.
 * @param {string} url
 */
export function youTubeVideoId(url) {
  try {
    const id = new URL(url).searchParams.get("v");
    return id && VIDEO_ID_RE.test(id) ? id : null;
  } catch {
    return null;
  }
}

/**
 * Save the scroll position a tab reported before it is discarded.
 * @param {number} tabId
 * @param {string} url - the tab URL as the browser reports it
 * @param {{x: number, y: number}} position - reported by the page, so validated
 */
export async function saveScrollPosition(tabId, url, position) {
  if (!url || !isNonNegative(position?.x) || !isNonNegative(position?.y)) return;
  const data = await chrome.storage.local.get(SCROLL_POSITIONS_KEY);
  const positions = data[SCROLL_POSITIONS_KEY] || {};
  positions[tabId] = { x: position.x, y: position.y, url, savedAt: Date.now() };

  const keys = Object.keys(positions);
  if (keys.length > SCROLL_MAX_ENTRIES) {
    keys.sort((a, b) => positions[a].savedAt - positions[b].savedAt);
    for (const k of keys.slice(0, keys.length - SCROLL_MAX_ENTRIES)) delete positions[k];
  }
  await chrome.storage.local.set({ [SCROLL_POSITIONS_KEY]: positions });
}

/**
 * Return and remove the saved scroll position of a tab, when it was saved for
 * the same URL the tab shows now.
 * @param {number} tabId
 * @param {string} url - sender.url, filled in by the browser
 * @returns {Promise<{x: number, y: number}|null>}
 */
export async function takeScrollPosition(tabId, url) {
  const data = await chrome.storage.local.get(SCROLL_POSITIONS_KEY);
  const positions = data[SCROLL_POSITIONS_KEY] || {};
  const saved = positions[tabId];
  if (!saved || !url || saved.url !== url) return null;
  delete positions[tabId];
  await chrome.storage.local.set({ [SCROLL_POSITIONS_KEY]: positions });
  return { x: saved.x, y: saved.y };
}

/**
 * Save the playback time a YouTube tab reported before it is discarded.
 * @param {string} url - the tab URL as the browser reports it
 * @param {{timestamp: number, duration: number}} playback - reported by the page
 */
export async function saveYouTubeTimestamp(url, playback) {
  const videoId = youTubeVideoId(url);
  const { timestamp, duration } = playback || {};
  if (!videoId || !isNonNegative(timestamp) || !isNonNegative(duration)) return;

  const data = await chrome.storage.local.get(YOUTUBE_TIMESTAMPS_KEY);
  const timestamps = data[YOUTUBE_TIMESTAMPS_KEY] || {};
  const now = Date.now();
  for (const [key, val] of Object.entries(timestamps)) {
    if (!(now - val?.savedAt <= YOUTUBE_TIMESTAMP_MAX_AGE_MS)) delete timestamps[key];
  }
  timestamps[videoId] = { timestamp, duration, savedAt: now };
  await chrome.storage.local.set({ [YOUTUBE_TIMESTAMPS_KEY]: timestamps });
}

/**
 * Return and remove the saved playback time of the video a tab shows.
 * @param {string} url - sender.url, filled in by the browser
 * @returns {Promise<{timestamp: number, duration: number}|null>}
 */
export async function takeYouTubeTimestamp(url) {
  const videoId = youTubeVideoId(url);
  if (!videoId) return null;
  const data = await chrome.storage.local.get(YOUTUBE_TIMESTAMPS_KEY);
  const timestamps = data[YOUTUBE_TIMESTAMPS_KEY] || {};
  const saved = timestamps[videoId];
  if (!saved) return null;
  delete timestamps[videoId];
  await chrome.storage.local.set({ [YOUTUBE_TIMESTAMPS_KEY]: timestamps });
  return { timestamp: saved.timestamp, duration: saved.duration };
}
