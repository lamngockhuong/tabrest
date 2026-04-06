// Theme management module
// Handles dark/light theme switching with system preference detection

const THEME_KEY = 'tabrest_theme';
const THEMES = { LIGHT: 'light', DARK: 'dark' };

/**
 * Get saved theme or detect system preference
 * @returns {Promise<string>} Theme name ('light' or 'dark')
 */
export async function getTheme() {
  const result = await chrome.storage.local.get(THEME_KEY);
  if (result[THEME_KEY]) return result[THEME_KEY];

  // Detect system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
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
  document.documentElement.setAttribute('data-theme', theme);
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
  const current = document.documentElement.getAttribute('data-theme') || THEMES.LIGHT;
  const next = current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
  applyTheme(next);
  await setTheme(next);
  return next;
}

export { THEMES, THEME_KEY };
