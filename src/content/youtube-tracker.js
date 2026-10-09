// Content script for YouTube timestamp tracking
// Saves video playback position before tab is discarded, restores on reload

// Current playback position, or null when there is nothing worth restoring.
// The service worker stores it under the video id from the tab URL; this script
// cannot reach extension storage.
function getCurrentPlayback() {
  const video = document.querySelector("video");
  if (!video || video.duration < 60) return null; // Skip short videos (<1 min)
  const timestamp = Math.floor(video.currentTime);
  if (timestamp < 10) return null; // Skip if <10s watched
  return { timestamp, duration: Math.floor(video.duration) };
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
  if (!new URLSearchParams(window.location.search).get("v")) return;

  try {
    const response = await chrome.runtime.sendMessage({ action: "takeYouTubeTimestamp" });
    const saved = response?.playback;
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
    sendResponse({ playback: getCurrentPlayback() });
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
      chrome.runtime
        .sendMessage({
          command: "captureError",
          error: { name: err?.name || "Error", message: err?.message || String(err), stack },
          context: { surface: SENTRY_SURFACE_TAG, source },
        })
        .catch(() => {}); // extension context invalidated → swallow
    } catch {
      // never crash content script over telemetry
    }
  }

  window.addEventListener("error", (e) => {
    // Page-dispatched (untrusted) or cross-world errors carry no Error object we own
    if (!e.isTrusted || !e.error) return;
    forwardError(e.error, "uncaught");
  });
  window.addEventListener("unhandledrejection", (e) => {
    // Wrapping a non-Error reason here would stamp it with an extension frame
    if (!e.isTrusted || !(e.reason instanceof Error)) return;
    forwardError(e.reason, "unhandledrejection");
  });
}
