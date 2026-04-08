// Content script for form data detection and scroll position tracking
// Injected into web pages to check for unsaved form data and save/restore scroll

// Note: Content scripts can't use ES imports, so constants defined locally
const SCROLL_POSITIONS_KEY = "tabrest_scroll_positions";
const SCROLL_MAX_ENTRIES = 100;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "checkFormData") {
    const hasFormData = checkForUnsavedData();
    sendResponse({ hasFormData });
  } else if (message.action === "saveScrollPosition") {
    saveScrollPosition(message.tabId).then((saved) => sendResponse({ saved }));
    return true; // Async response
  }
  return true;
});

/**
 * Save current scroll position to storage
 * @param {number} tabId - Tab ID for storage key
 */
async function saveScrollPosition(tabId) {
  try {
    const position = {
      x: window.scrollX,
      y: window.scrollY,
      url: location.href,
      savedAt: Date.now(),
    };

    const data = await chrome.storage.local.get(SCROLL_POSITIONS_KEY);
    const positions = data[SCROLL_POSITIONS_KEY] || {};
    positions[tabId] = position;

    // Cleanup old entries if over limit
    const keys = Object.keys(positions);
    if (keys.length > SCROLL_MAX_ENTRIES) {
      const sorted = keys.sort((a, b) => positions[a].savedAt - positions[b].savedAt);
      const toRemove = sorted.slice(0, keys.length - SCROLL_MAX_ENTRIES);
      for (const k of toRemove) {
        delete positions[k];
      }
    }

    await chrome.storage.local.set({ [SCROLL_POSITIONS_KEY]: positions });
    return true;
  } catch {
    return false;
  }
}

/**
 * Restore scroll position if saved for this tab/URL
 */
async function restoreScrollPosition() {
  // Check if extension context is valid
  if (!chrome.runtime?.id) return;

  try {
    // Get current tab ID via background
    const response = await chrome.runtime.sendMessage({ action: "getTabId" });
    if (!response?.tabId) return;

    const data = await chrome.storage.local.get(SCROLL_POSITIONS_KEY);
    const positions = data[SCROLL_POSITIONS_KEY] || {};
    const saved = positions[response.tabId];

    if (saved && saved.url === location.href) {
      // Small delay to ensure page is rendered
      setTimeout(() => {
        window.scrollTo(saved.x, saved.y);
      }, 100);

      // Clean up after restore
      delete positions[response.tabId];
      await chrome.storage.local.set({ [SCROLL_POSITIONS_KEY]: positions });
    }
  } catch {
    // Ignore errors (extension context invalidated, etc.)
  }
}

// Restore scroll on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", restoreScrollPosition);
} else {
  restoreScrollPosition();
}

/**
 * Check if page has unsaved form data (user-modified values)
 * @returns {boolean}
 */
function checkForUnsavedData() {
  // Check text inputs and textareas - only if MODIFIED from default
  const inputs = document.querySelectorAll(
    'input[type="text"], input[type="email"], input[type="password"], ' +
      'input[type="search"], input[type="tel"], input[type="url"], ' +
      "input:not([type]), textarea",
  );

  for (const input of inputs) {
    // Skip hidden, readonly, disabled inputs
    if (input.type === "hidden" || input.readOnly || input.disabled) continue;
    // Skip if not visible
    if (input.offsetParent === null) continue;

    // Check if value differs from default (user has typed something)
    const currentValue = input.value?.trim() || "";
    const defaultValue = input.defaultValue?.trim() || "";
    if (currentValue !== defaultValue && currentValue.length > 0) {
      return true;
    }
  }

  // Check checkboxes/radios that changed from default
  const checkables = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
  for (const input of checkables) {
    if (input.checked !== input.defaultChecked) {
      return true;
    }
  }

  // Check select elements that changed from default
  const selects = document.querySelectorAll("select");
  for (const select of selects) {
    for (const option of select.options) {
      if (option.selected !== option.defaultSelected) {
        return true;
      }
    }
  }

  // Check contenteditable - track via data attribute set on input
  const editables = document.querySelectorAll('[contenteditable="true"]');
  for (const el of editables) {
    if (el.dataset.tabrestModified === "true") {
      return true;
    }
  }

  return false;
}

// Track contenteditable modifications
document.addEventListener(
  "input",
  (e) => {
    if (e.target.isContentEditable) {
      e.target.dataset.tabrestModified = "true";
    }
  },
  true,
);

// Phase 6: Report JS heap memory usage to background
// Guard against duplicate intervals on SPA navigation
let memoryReporterId = null;

function reportMemoryUsage() {
  // Check if extension context is still valid
  if (!chrome.runtime?.id) {
    if (memoryReporterId) {
      clearInterval(memoryReporterId);
      memoryReporterId = null;
    }
    return;
  }

  // performance.memory is only available in Chrome with the flag or in certain contexts
  if (!performance.memory) return;

  const heapMB = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));

  chrome.runtime
    .sendMessage({
      action: "reportTabMemory",
      heapMB,
    })
    .catch(() => {
      // Ignore if background not ready
    });
}

// Start memory reporting with duplicate guard
function startMemoryReporting() {
  if (memoryReporterId) return; // Already running
  memoryReporterId = setInterval(reportMemoryUsage, 30000);
  reportMemoryUsage(); // Report once immediately
}

// Clean up interval on page unload to prevent memory leaks
window.addEventListener("beforeunload", () => {
  if (memoryReporterId) {
    clearInterval(memoryReporterId);
    memoryReporterId = null;
  }
});

startMemoryReporting();
