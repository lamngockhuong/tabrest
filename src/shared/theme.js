// Theme management module
// Handles dark/light theme switching with system preference detection

import { icon } from "./icons.js";

const THEME_KEY = "tabrest_theme";
const THEMES = { LIGHT: "light", DARK: "dark" };

/**
 * Get saved theme or detect system preference
 * @returns {Promise<string>} Theme name ('light' or 'dark')
 */
export async function getTheme() {
  const result = await chrome.storage.local.get(THEME_KEY);
  if (result[THEME_KEY]) return result[THEME_KEY];

  // Detect system preference
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? THEMES.DARK : THEMES.LIGHT;
}

/**
 * Save theme preference to storage
 * @param {string} theme - Theme name
 */
export async function setTheme(theme) {
  await chrome.storage.local.set({ [THEME_KEY]: theme });
}

/**
 * Apply theme to document
 * @param {string} theme - Theme name
 */
export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Initialize theme on page load
 * @returns {Promise<string>} Applied theme name
 */
export async function initTheme() {
  const theme = await getTheme();
  applyTheme(theme);
  return theme;
}

/**
 * Toggle between dark and light themes
 * @returns {Promise<string>} New theme name
 */
export async function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || THEMES.LIGHT;
  const next = current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
  applyTheme(next);
  await setTheme(next);
  return next;
}

/**
 * Subscribe to theme changes from other pages/popups
 * @param {function(string): void} callback - Called with new theme when changed externally
 */
export function onThemeChange(callback = () => {}) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[THEME_KEY]) {
      const { newValue, oldValue } = changes[THEME_KEY];
      if (newValue === oldValue) return;
      // Only apply if different from current DOM state (avoids redundant update on initiating page)
      const current = document.documentElement.getAttribute("data-theme");
      if (newValue !== current) {
        applyTheme(newValue);
      }
      callback(newValue);
    }
  });
}

/**
 * Update theme toggle icon and title
 * @param {HTMLElement} iconEl - Icon element to update
 * @param {HTMLElement} toggleEl - Toggle button element
 * @param {string} theme - Current theme
 */
export function updateThemeIcon(iconEl, toggleEl, theme) {
  const name = theme === THEMES.DARK ? "sun" : "moon";
  iconEl.innerHTML = icon(name, 14);
  toggleEl.title = theme === THEMES.DARK ? "Switch to light mode" : "Switch to dark mode";
}

export { THEME_KEY, THEMES };
