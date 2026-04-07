import { SETTINGS_DEFAULTS } from "../shared/constants.js";
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
  minTabs: document.getElementById("min-tabs"),
  toolbarAction: document.getElementById("toolbar-action"),
  saveYouTube: document.getElementById("save-youtube"),
  onlyDiscardIdle: document.getElementById("only-discard-idle"),
  idleThreshold: document.getElementById("idle-threshold"),
  idleThresholdContainer: document.getElementById("idle-threshold-container"),
  perTabMemory: document.getElementById("per-tab-memory"),
  powerModeRadios: document.querySelectorAll('input[name="power-mode"]'),
  unloadPinned: document.getElementById("unload-pinned"),
  protectAudio: document.getElementById("protect-audio"),
  protectForm: document.getElementById("protect-form"),
  showBadge: document.getElementById("show-badge"),
  enableStats: document.getElementById("enable-stats"),
  enableTabGroups: document.getElementById("enable-tab-groups"),
  showDiscardedPrefix: document.getElementById("show-discarded-prefix"),
  discardedPrefix: document.getElementById("discarded-prefix"),
  prefixInputContainer: document.getElementById("prefix-input-container"),
  whitelistContainer: document.getElementById("whitelist-container"),
  newWhitelist: document.getElementById("new-whitelist"),
  addWhitelist: document.getElementById("add-whitelist"),
  blacklistContainer: document.getElementById("blacklist-container"),
  newBlacklist: document.getElementById("new-blacklist"),
  addBlacklist: document.getElementById("add-blacklist"),
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
  elements.perTabMemory.value = currentSettings.perTabJsHeapThresholdMB;
  elements.minTabs.value = currentSettings.minTabsBeforeAutoDiscard;

  // Set power mode radio
  for (const radio of elements.powerModeRadios) {
    radio.checked = radio.value === currentSettings.powerMode;
  }
  elements.toolbarAction.value = currentSettings.toolbarClickAction;
  elements.saveYouTube.checked = currentSettings.saveYouTubeTimestamp;
  elements.onlyDiscardIdle.checked = currentSettings.onlyDiscardWhenIdle;
  elements.idleThreshold.value = currentSettings.idleThresholdMinutes;
  updateIdleThresholdVisibility();
  elements.unloadPinned.checked = currentSettings.unloadPinnedTabs;
  elements.protectAudio.checked = currentSettings.protectAudioTabs;
  elements.protectForm.checked = currentSettings.protectFormTabs;
  elements.showBadge.checked = currentSettings.showBadgeCount;
  elements.enableStats.checked = currentSettings.enableStats;
  elements.enableTabGroups.checked = currentSettings.enableTabGroups;
  elements.showDiscardedPrefix.checked = currentSettings.showDiscardedPrefix;
  elements.discardedPrefix.value = currentSettings.discardedPrefix;
  updatePrefixInputVisibility();

  renderWhitelist();
  renderBlacklist();
}

function updatePrefixInputVisibility() {
  elements.prefixInputContainer.classList.toggle("hidden", !elements.showDiscardedPrefix.checked);
}

function updateIdleThresholdVisibility() {
  elements.idleThresholdContainer.classList.toggle("hidden", !elements.onlyDiscardIdle.checked);
}

// Render domain list (XSS-safe DOM manipulation)
function renderDomainList(container, list, listKey) {
  container.innerHTML = "";

  for (const domain of list || []) {
    const item = document.createElement("div");
    item.className = "domain-item";

    const span = document.createElement("span");
    span.textContent = domain; // Safe: textContent escapes HTML

    const btn = document.createElement("button");
    btn.dataset.domain = domain;
    btn.title = "Remove";
    btn.innerHTML = "&times;";
    btn.addEventListener("click", async () => {
      currentSettings[listKey] = currentSettings[listKey].filter((d) => d !== domain);
      await saveSettings(currentSettings);
      renderDomainList(container, currentSettings[listKey], listKey);
      showStatus(t("domainRemoved"));
    });

    item.appendChild(span);
    item.appendChild(btn);
    container.appendChild(item);
  }
}

// Render whitelist domains
function renderWhitelist() {
  renderDomainList(elements.whitelistContainer, currentSettings.whitelist, "whitelist");
}

// Render blacklist domains
function renderBlacklist() {
  renderDomainList(elements.blacklistContainer, currentSettings.blacklist, "blacklist");
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
    { el: elements.perTabMemory, key: "perTabJsHeapThresholdMB", type: "number" },
    { el: elements.minTabs, key: "minTabsBeforeAutoDiscard", type: "number" },
    { el: elements.toolbarAction, key: "toolbarClickAction", type: "string" },
    { el: elements.saveYouTube, key: "saveYouTubeTimestamp", type: "checkbox" },
    { el: elements.onlyDiscardIdle, key: "onlyDiscardWhenIdle", type: "checkbox" },
    { el: elements.idleThreshold, key: "idleThresholdMinutes", type: "number" },
    { el: elements.unloadPinned, key: "unloadPinnedTabs", type: "checkbox" },
    { el: elements.protectAudio, key: "protectAudioTabs", type: "checkbox" },
    { el: elements.protectForm, key: "protectFormTabs", type: "checkbox" },
    { el: elements.showBadge, key: "showBadgeCount", type: "checkbox" },
    { el: elements.enableStats, key: "enableStats", type: "checkbox" },
    { el: elements.enableTabGroups, key: "enableTabGroups", type: "checkbox" },
    { el: elements.showDiscardedPrefix, key: "showDiscardedPrefix", type: "checkbox" },
  ];

  for (const { el, key, type } of settingsMap) {
    el.addEventListener("change", async () => {
      if (type === "checkbox") {
        currentSettings[key] = el.checked;
      } else if (type === "string") {
        currentSettings[key] = el.value;
      } else {
        currentSettings[key] = Number.parseInt(el.value, 10);
      }
      await saveSettings(currentSettings);
      showStatus(t("settingsSaved"));
      if (key === "showDiscardedPrefix") {
        updatePrefixInputVisibility();
      }
      if (key === "onlyDiscardWhenIdle") {
        updateIdleThresholdVisibility();
      }
    });
  }

  // Power mode radios
  for (const radio of elements.powerModeRadios) {
    radio.addEventListener("change", async () => {
      if (radio.checked) {
        currentSettings.powerMode = radio.value;
        await saveSettings(currentSettings);
        showStatus(t("settingsSaved"));
      }
    });
  }

  // Prefix input - debounced to avoid storage spam
  let prefixDebounce = null;
  elements.discardedPrefix.addEventListener("input", () => {
    clearTimeout(prefixDebounce);
    prefixDebounce = setTimeout(async () => {
      const value = elements.discardedPrefix.value.trim() || SETTINGS_DEFAULTS.discardedPrefix;
      currentSettings.discardedPrefix = value;
      elements.discardedPrefix.value = value;
      await saveSettings(currentSettings);
      showStatus(t("settingsSaved"));
    }, 400);
  });

  // Add whitelist domain
  elements.addWhitelist.addEventListener("click", addWhitelistDomain);
  elements.newWhitelist.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addWhitelistDomain();
  });

  // Add blacklist domain
  elements.addBlacklist.addEventListener("click", addBlacklistDomain);
  elements.newBlacklist.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addBlacklistDomain();
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

// Add domain to a list (whitelist or blacklist)
async function addDomainToList(inputEl, listKey, renderFn) {
  const domain = inputEl.value.trim().toLowerCase();

  if (!domain) return;

  // Basic validation
  if (!/^[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,}$/i.test(domain)) {
    showStatus(t("invalidDomain"));
    return;
  }

  if (currentSettings[listKey].includes(domain)) {
    showStatus(t("domainExists"));
    return;
  }

  currentSettings[listKey].push(domain);
  await saveSettings(currentSettings);
  inputEl.value = "";
  renderFn();
  showStatus(t("domainAdded"));
}

// Add domain to whitelist
async function addWhitelistDomain() {
  await addDomainToList(elements.newWhitelist, "whitelist", renderWhitelist);
}

// Add domain to blacklist
async function addBlacklistDomain() {
  await addDomainToList(elements.newBlacklist, "blacklist", renderBlacklist);
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
