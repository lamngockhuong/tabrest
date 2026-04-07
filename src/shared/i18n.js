// Internationalization helper module
// Uses Chrome's built-in i18n API

/**
 * Get translated message
 * @param {string} key - Message key from messages.json
 * @param {string|string[]} substitutions - Optional substitution values
 * @returns {string} Translated message or key if not found
 */
export function t(key, substitutions) {
  const message = chrome.i18n.getMessage(key, substitutions);
  return message || key; // Fallback to key if not found
}

/**
 * Apply translations to elements with data-i18n attributes
 * Call after DOM is ready or after dynamic content is added
 */
export function localizeHtml() {
  // Text content
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const msg = chrome.i18n.getMessage(key);
    if (msg) el.textContent = msg;
  });

  // Placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const msg = chrome.i18n.getMessage(key);
    if (msg) el.placeholder = msg;
  });

  // Titles (tooltips)
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    const msg = chrome.i18n.getMessage(key);
    if (msg) el.title = msg;
  });
}

/**
 * Get current UI language
 * @returns {string} Language code (e.g., 'en', 'vi')
 */
export function getUILanguage() {
  return chrome.i18n.getUILanguage();
}
