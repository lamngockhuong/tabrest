// Content script for YouTube timestamp tracking
// Saves video playback position before tab is discarded, restores on reload

const STORAGE_KEY = "youtube_timestamps";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Get current video timestamp data
function getCurrentTimestamp() {
  const video = document.querySelector("video");
  if (!video || video.duration < 60) return null; // Skip short videos (<1 min)

  const videoId = new URLSearchParams(window.location.search).get("v");
  if (!videoId) return null;

  return {
    videoId,
    url: window.location.href,
    timestamp: Math.floor(video.currentTime),
    duration: Math.floor(video.duration),
    savedAt: Date.now(),
  };
}

// Save current timestamp to storage
async function saveTimestamp() {
  const data = getCurrentTimestamp();
  if (!data || data.timestamp < 10) return false; // Skip if <10s watched

  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const timestamps = result[STORAGE_KEY] || {};

    // Clean old entries
    const now = Date.now();
    for (const [key, val] of Object.entries(timestamps)) {
      if (now - val.savedAt > MAX_AGE_MS) delete timestamps[key];
    }

    timestamps[data.videoId] = data;
    await chrome.storage.local.set({ [STORAGE_KEY]: timestamps });
    return true;
  } catch {
    return false;
  }
}

// Wait for video to have metadata loaded
function waitForVideoReady(video, timeout = 5000) {
  return new Promise((resolve) => {
    if (video.readyState >= 1) return resolve(true); // HAVE_METADATA or higher

    const onReady = () => {
      video.removeEventListener("loadedmetadata", onReady);
      resolve(true);
    };
    video.addEventListener("loadedmetadata", onReady);
    setTimeout(() => {
      video.removeEventListener("loadedmetadata", onReady);
      resolve(false);
    }, timeout);
  });
}

// Restore timestamp on page load
async function restoreTimestamp() {
  const videoId = new URLSearchParams(window.location.search).get("v");
  if (!videoId) return;

  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const timestamps = result[STORAGE_KEY] || {};
    const saved = timestamps[videoId];

    if (!saved) return;

    // Wait for video element
    const video = await waitForVideo();
    if (!video) return;

    // Wait for video metadata to be loaded before seeking
    const ready = await waitForVideoReady(video);
    if (!ready) return;

    // Only restore if not near end (last 30s)
    if (saved.timestamp < saved.duration - 30) {
      video.currentTime = saved.timestamp;
    }

    // Clean up after restore
    delete timestamps[videoId];
    await chrome.storage.local.set({ [STORAGE_KEY]: timestamps });
  } catch {
    // Ignore errors during restore
  }
}

// Wait for video element to appear
function waitForVideo(timeout = 5000) {
  return new Promise((resolve) => {
    const video = document.querySelector("video");
    if (video) return resolve(video);

    const observer = new MutationObserver(() => {
      const video = document.querySelector("video");
      if (video) {
        observer.disconnect();
        resolve(video);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "saveYouTubeTimestamp") {
    saveTimestamp().then((success) => sendResponse({ success }));
    return true; // Keep channel open for async response
  }
});

// Restore timestamp on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", restoreTimestamp);
} else {
  restoreTimestamp();
}

// Error bridge: forward extension-origin errors to SW for Sentry reporting
// Load-once guard prevents duplicate listeners on injection re-runs
if (!window.__tabrestYoutubeErrorBridgeLoaded) {
  window.__tabrestYoutubeErrorBridgeLoaded = true;

  const SENTRY_SURFACE_TAG = "content_youtube";
  const isExtensionFrame = (stack) =>
    typeof stack === "string" &&
    (stack.includes("chrome-extension://") || stack.includes(chrome.runtime.id));

  function forwardError(err, source) {
    try {
      const stack = err?.stack || "";
      if (!isExtensionFrame(stack)) return;
      chrome.runtime.sendMessage({
        command: "captureError",
        error: { name: err?.name || "Error", message: err?.message || String(err), stack },
        context: { surface: SENTRY_SURFACE_TAG, source },
      }).catch(() => {}); // extension context invalidated → swallow
    } catch {
      // never crash content script over telemetry
    }
  }

  window.addEventListener("error", (e) => {
    forwardError(e.error || new Error(e.message), "uncaught");
  });
  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason instanceof Error ? e.reason : new Error(String(e.reason));
    forwardError(reason, "unhandledrejection");
  });
}
