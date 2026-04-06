// Content script for form data detection
// Injected into web pages to check for unsaved form data

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkFormData') {
    const hasFormData = checkForUnsavedData();
    sendResponse({ hasFormData });
  }
  return true;
});

/**
 * Check if page has unsaved form data
 * @returns {boolean}
 */
function checkForUnsavedData() {
  // Check text inputs and textareas
  const inputs = document.querySelectorAll(
    'input[type="text"], input[type="email"], input[type="password"], ' +
    'input[type="search"], input[type="tel"], input[type="url"], ' +
    'input:not([type]), textarea'
  );

  for (const input of inputs) {
    if (input.value && input.value.trim().length > 0) {
      // Skip hidden inputs and readonly
      if (input.type === 'hidden' || input.readOnly || input.disabled) continue;
      // Skip if not visible
      if (input.offsetParent === null) continue;
      return true;
    }
  }

  // Check contenteditable elements
  const editables = document.querySelectorAll('[contenteditable="true"]');
  for (const el of editables) {
    if (el.textContent && el.textContent.trim().length > 0) {
      return true;
    }
  }

  return false;
}
