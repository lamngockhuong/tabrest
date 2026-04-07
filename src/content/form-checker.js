// Content script for form data detection
// Injected into web pages to check for unsaved form data

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "checkFormData") {
    const hasFormData = checkForUnsavedData();
    sendResponse({ hasFormData });
  }
  return true;
});

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
