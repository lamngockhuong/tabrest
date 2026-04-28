// Content script for form data detection and scroll position tracking
// Injected on-demand via chrome.scripting.executeScript (host permission optional).

if (!window.__tabrestFormCheckLoaded) {
  window.__tabrestFormCheckLoaded = true;

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
    // Global flag set by input listener — most reliable signal across SPA
    // navigations, React re-renders, and rich editors (Lexical/ProseMirror).
    if (document.body?.dataset.tabrestFormModified === "true") return true;

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

    // Pre-populated rich editor (e.g. GitHub edit-comment) — modern editors
    // render placeholders via CSS pseudo-elements, so non-empty text implies
    // user content. Post-injection typing is caught by the global flag above.
    const editables = document.querySelectorAll('[contenteditable="true"]');
    for (const el of editables) {
      if (el.offsetParent === null) continue;
      if (el.textContent?.trim().length > 0) return true;
    }

    return false;
  }

  // Mark page as modified on any user input. value/defaultValue tracking is
  // unreliable for React-controlled inputs and rich editors, so a single
  // global flag set on the first keystroke is the most robust signal.
  // Guarded against redundant attribute writes that would re-fire MutationObservers.
  document.addEventListener(
    "input",
    () => {
      if (document.body && document.body.dataset.tabrestFormModified !== "true") {
        document.body.dataset.tabrestFormModified = "true";
      }
    },
    true,
  );

  // Report JS heap memory usage to background
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

  // Error bridge: forward extension-origin errors to SW for Sentry reporting
  const SENTRY_SURFACE_TAG = "content_form";
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
