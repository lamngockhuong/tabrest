// Content script for form data detection and scroll position tracking
// Injected on-demand via chrome.scripting.executeScript (host permission optional).

if (!window.__tabrestFormCheckLoaded) {
  window.__tabrestFormCheckLoaded = true;

  // Set by the trusted-input listener below. Kept in the isolated world, not
  // the DOM, so the page cannot mark its own tab as having unsaved data.
  // The background also remembers it per document, so a copy injected again
  // after an extension update or reload starts from the previous copy's value.
  let formModified = false;
  const formModifiedRestored = chrome.runtime
    .sendMessage({ action: "getFormModified" })
    .then((response) => {
      if (response?.modified) formModified = true;
    })
    .catch(() => {});

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "checkFormData") {
      formModifiedRestored.then(() => sendResponse({ hasFormData: checkForUnsavedData() }));
      return true; // Async response
    } else if (message.action === "saveScrollPosition") {
      // The service worker stores it; this script cannot reach extension storage
      sendResponse({ position: { x: window.scrollX, y: window.scrollY } });
      return false;
    }
    // Unknown actions: return nothing so the channel closes instead of hanging the sender
  });

  /**
   * Restore the scroll position saved for this tab before it was discarded
   */
  async function restoreScrollPosition() {
    // Check if extension context is valid
    if (!chrome.runtime?.id) return;

    try {
      // The service worker matches the saved entry against this tab's URL
      const response = await chrome.runtime.sendMessage({ action: "takeScrollPosition" });
      const saved = response?.position;
      if (!saved) return;
      // Small delay to ensure page is rendered
      setTimeout(() => {
        window.scrollTo(saved.x, saved.y);
      }, 100);
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
    // Flag set by input listener - most reliable signal across SPA
    // navigations, React re-renders, and rich editors (Lexical/ProseMirror).
    if (formModified) return true;

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

    // Pre-populated rich editor (e.g. GitHub edit-comment) - modern editors
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
  // flag set on the first keystroke is the most robust signal.
  // Script-dispatched events are ignored so the page cannot set the flag itself.
  document.addEventListener(
    "input",
    (event) => {
      if (!event.isTrusted || formModified) return;
      formModified = true;
      // An orphaned copy (extension reloaded) has no runtime; the new copy reports instead
      if (!chrome.runtime?.id) return;
      chrome.runtime.sendMessage({ action: "markFormModified" }).catch(() => {});
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
