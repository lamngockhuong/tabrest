import { localizeHtml, t } from "../shared/i18n.js";
import { getSettings, saveSettings } from "../shared/storage.js";
import { initTheme, onThemeChange, toggleTheme, updateThemeIcon } from "../shared/theme.js";
import { formatBytes } from "../shared/utils.js";

const elements = {
  themeToggle: document.getElementById("theme-toggle"),
  themeIcon: document.getElementById("theme-icon"),
  autoStartup: document.getElementById("auto-startup"),
  timer: document.getElementById("timer"),
  threshold: document.getElementById("threshold"),
  unloadPinned: document.getElementById("unload-pinned"),
  protectAudio: document.getElementById("protect-audio"),
  protectForm: document.getElementById("protect-form"),
  showBadge: document.getElementById("show-badge"),
  enableStats: document.getElementById("enable-stats"),
  whitelistContainer: document.getElementById("whitelist-container"),
  newWhitelist: document.getElementById("new-whitelist"),
  addWhitelist: document.getElementById("add-whitelist"),
  totalUnloaded: document.getElementById("total-unloaded"),
  totalSaved: document.getElementById("total-saved"),
  resetStats: document.getElementById("reset-stats"),
  status: document.getElementById("status"),
  shortcutsLink: document.getElementById("shortcuts-link"),
};

let currentSettings = {};

// Initialize options page
async function init() {
  // Initialize theme first
  const theme = await initTheme();
  updateThemeIcon(elements.themeIcon, elements.themeToggle, theme);
  onThemeChange((theme) => updateThemeIcon(elements.themeIcon, elements.themeToggle, theme));
  localizeHtml();

  await loadSettings();
  await loadStats();
  setupEventListeners();
}

// Load settings into UI
async function loadSettings() {
  currentSettings = await getSettings();

  elements.autoStartup.checked = currentSettings.autoUnloadOnStartup;
  elements.timer.value = currentSettings.unloadDelayMinutes;
  elements.threshold.value = currentSettings.memoryThresholdPercent;
  elements.unloadPinned.checked = currentSettings.unloadPinnedTabs;
  elements.protectAudio.checked = currentSettings.protectAudioTabs;
  elements.protectForm.checked = currentSettings.protectFormTabs;
  elements.showBadge.checked = currentSettings.showBadgeCount;
  elements.enableStats.checked = currentSettings.enableStats;

  renderWhitelist();
}

// Render whitelist domains (XSS-safe DOM manipulation)
function renderWhitelist() {
  elements.whitelistContainer.innerHTML = "";

  for (const domain of currentSettings.whitelist || []) {
    const item = document.createElement("div");
    item.className = "domain-item";

    const span = document.createElement("span");
    span.textContent = domain; // Safe: textContent escapes HTML

    const btn = document.createElement("button");
    btn.dataset.domain = domain;
    btn.title = "Remove";
    btn.innerHTML = "&times;";
    btn.addEventListener("click", async () => {
      currentSettings.whitelist = currentSettings.whitelist.filter((d) => d !== domain);
      await saveSettings(currentSettings);
      renderWhitelist();
      showStatus(t("domainRemoved"));
    });

    item.appendChild(span);
    item.appendChild(btn);
    elements.whitelistContainer.appendChild(item);
  }
}

// Load statistics
async function loadStats() {
  const result = await chrome.storage.local.get("stats");
  const stats = result.stats || { tabsUnloaded: 0, memorySaved: 0 };

  elements.totalUnloaded.textContent = stats.tabsUnloaded || 0;
  elements.totalSaved.textContent = formatBytes(stats.memorySaved || 0);
}

// Setup event listeners
function setupEventListeners() {
  // Auto-save settings on change
  const settingsMap = [
    { el: elements.autoStartup, key: "autoUnloadOnStartup", type: "checkbox" },
    { el: elements.timer, key: "unloadDelayMinutes", type: "number" },
    { el: elements.threshold, key: "memoryThresholdPercent", type: "number" },
    { el: elements.unloadPinned, key: "unloadPinnedTabs", type: "checkbox" },
    { el: elements.protectAudio, key: "protectAudioTabs", type: "checkbox" },
    { el: elements.protectForm, key: "protectFormTabs", type: "checkbox" },
    { el: elements.showBadge, key: "showBadgeCount", type: "checkbox" },
    { el: elements.enableStats, key: "enableStats", type: "checkbox" },
  ];

  for (const { el, key, type } of settingsMap) {
    el.addEventListener("change", async () => {
      currentSettings[key] = type === "checkbox" ? el.checked : Number.parseInt(el.value, 10);
      await saveSettings(currentSettings);
      showStatus(t("settingsSaved"));
    });
  }

  // Add whitelist domain
  elements.addWhitelist.addEventListener("click", addWhitelistDomain);
  elements.newWhitelist.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addWhitelistDomain();
  });

  // Reset stats
  elements.resetStats.addEventListener("click", async () => {
    await chrome.storage.local.set({ stats: { tabsUnloaded: 0, memorySaved: 0 } });
    await loadStats();
    showStatus(t("statsReset"));
  });

  // Open shortcuts page (chrome:// URLs require chrome.tabs.create)
  elements.shortcutsLink?.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });

  // Theme toggle
  elements.themeToggle.addEventListener("click", async () => {
    const newTheme = await toggleTheme();
    updateThemeIcon(elements.themeIcon, elements.themeToggle, newTheme);
  });
}

// Add domain to whitelist
async function addWhitelistDomain() {
  const domain = elements.newWhitelist.value.trim().toLowerCase();

  if (!domain) return;

  // Basic validation
  if (!/^[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,}$/i.test(domain)) {
    showStatus(t("invalidDomain"));
    return;
  }

  if (currentSettings.whitelist.includes(domain)) {
    showStatus(t("domainExists"));
    return;
  }

  currentSettings.whitelist.push(domain);
  await saveSettings(currentSettings);
  elements.newWhitelist.value = "";
  renderWhitelist();
  showStatus(t("domainAdded"));
}

// Show status message
function showStatus(message) {
  elements.status.textContent = message;
  elements.status.classList.add("show");
  setTimeout(() => {
    elements.status.classList.remove("show");
  }, 2000);
}

// Initialize
init();
