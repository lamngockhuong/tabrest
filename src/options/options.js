import { SETTINGS_DEFAULTS } from "../shared/constants.js";
import { isValidDsn } from "../shared/error-reporter.js";
import { localizeHtml, t } from "../shared/i18n.js";
import { injectIcons } from "../shared/icons.js";
import { exportPayload, parseImport } from "../shared/import-export.js";
import {
  HOST_PERM_DEPENDENT_FLAGS,
  hasHostPermission,
  removeHostPermission,
  requestHostPermission,
} from "../shared/permissions.js";
import { getSettings, saveSettings } from "../shared/storage.js";
import { initTheme, onThemeChange, toggleTheme, updateThemeIcon } from "../shared/theme.js";
import { formatBytes, getBrowserInfo, isValidDomainOrIp } from "../shared/utils.js";

const OPPOSITE_LIST = { whitelist: "blacklist", blacklist: "whitelist" };

const elements = {
  themeToggle: document.getElementById("theme-toggle"),
  themeIcon: document.getElementById("theme-icon"),
  autoStartup: document.getElementById("auto-startup"),
  timer: document.getElementById("timer"),
  threshold: document.getElementById("threshold"),
  minTabs: document.getElementById("min-tabs"),
  toolbarAction: document.getElementById("toolbar-action"),
  useSidePanel: document.getElementById("use-side-panel"),
  saveYouTube: document.getElementById("save-youtube"),
  skipWhenOffline: document.getElementById("skip-when-offline"),
  restoreScroll: document.getElementById("restore-scroll"),
  onlyDiscardIdle: document.getElementById("only-discard-idle"),
  idleThreshold: document.getElementById("idle-threshold"),
  idleThresholdContainer: document.getElementById("idle-threshold-container"),
  perTabMemory: document.getElementById("per-tab-memory"),
  powerModeRadios: document.querySelectorAll('input[name="power-mode"]'),
  unloadPinned: document.getElementById("unload-pinned"),
  protectAudio: document.getElementById("protect-audio"),
  protectForm: document.getElementById("protect-form"),
  showBadge: document.getElementById("show-badge"),
  notifyAutoUnload: document.getElementById("notify-auto-unload"),
  showSuspendWarning: document.getElementById("show-suspend-warning"),
  suspendWarningDelay: document.getElementById("suspend-warning-delay"),
  suspendWarningDelayContainer: document.getElementById("suspend-warning-delay-container"),
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
  exportWhitelist: document.getElementById("export-whitelist"),
  importWhitelist: document.getElementById("import-whitelist"),
  exportBlacklist: document.getElementById("export-blacklist"),
  importBlacklist: document.getElementById("import-blacklist"),
  totalUnloaded: document.getElementById("total-unloaded"),
  totalSaved: document.getElementById("total-saved"),
  resetStats: document.getElementById("reset-stats"),
  status: document.getElementById("status"),
  shortcutsLink: document.getElementById("shortcuts-link"),
  rerunOnboarding: document.getElementById("rerun-onboarding"),
  enableErrorReporting: document.getElementById("enable-error-reporting"),
  customSentryDsn: document.getElementById("custom-sentry-dsn"),
  dsnValidationMsg: document.getElementById("dsn-validation-msg"),
};

let currentSettings = {};

// Initialize options page
async function init() {
  // Initialize theme first
  const theme = await initTheme();
  updateThemeIcon(elements.themeIcon, elements.themeToggle, theme);
  onThemeChange((theme) => updateThemeIcon(elements.themeIcon, elements.themeToggle, theme));
  localizeHtml();
  injectIcons();

  await loadSettings();
  await loadStats();
  setupEventListeners();
}

// Load settings into UI
async function loadSettings() {
  const [settings, hasHost] = await Promise.all([getSettings(), hasHostPermission()]);
  currentSettings = settings;

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
  elements.useSidePanel.checked = currentSettings.useSidePanel ?? false;
  elements.saveYouTube.checked = currentSettings.saveYouTubeTimestamp;
  elements.skipWhenOffline.checked = currentSettings.skipWhenOffline;
  elements.restoreScroll.checked = currentSettings.restoreScrollPosition;
  elements.onlyDiscardIdle.checked = currentSettings.onlyDiscardWhenIdle;
  elements.idleThreshold.value = currentSettings.idleThresholdMinutes;
  updateIdleThresholdVisibility();
  elements.unloadPinned.checked = currentSettings.unloadPinnedTabs;
  elements.protectAudio.checked = currentSettings.protectAudioTabs;
  // protectFormTabs / showDiscardedPrefix only truly enabled when host permission is granted.
  elements.protectForm.checked = currentSettings.protectFormTabs && hasHost;
  elements.showBadge.checked = currentSettings.showBadgeCount;
  elements.notifyAutoUnload.checked = currentSettings.notifyOnAutoUnload;
  elements.showSuspendWarning.checked = currentSettings.showSuspendWarning;
  elements.suspendWarningDelay.value = String(currentSettings.suspendWarningDelayMs);
  updateSuspendWarningDelayVisibility();
  elements.enableStats.checked = currentSettings.enableStats;
  elements.enableTabGroups.checked = currentSettings.enableTabGroups;
  elements.showDiscardedPrefix.checked = currentSettings.showDiscardedPrefix && hasHost;
  elements.discardedPrefix.value = currentSettings.discardedPrefix;
  updatePrefixInputVisibility();
  elements.enableErrorReporting.checked = currentSettings.enableErrorReporting ?? false;
  elements.customSentryDsn.value = currentSettings.customSentryDsn ?? "";

  renderWhitelist();
  renderBlacklist();
}

function updatePrefixInputVisibility() {
  elements.prefixInputContainer.classList.toggle("hidden", !elements.showDiscardedPrefix.checked);
}

function updateIdleThresholdVisibility() {
  elements.idleThresholdContainer.classList.toggle("hidden", !elements.onlyDiscardIdle.checked);
}

function updateSuspendWarningDelayVisibility() {
  elements.suspendWarningDelayContainer.classList.toggle(
    "hidden",
    !elements.showSuspendWarning.checked,
  );
}

// Render domain list (XSS-safe DOM manipulation)
function renderDomainList(container, list, listKey) {
  container.innerHTML = "";

  if (!list || list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "domain-empty";
    empty.textContent = t("noDomainsYet");
    container.appendChild(empty);
    return;
  }

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

// Bind a checkbox to a host-permission-dependent setting: request permission on
// enable, revert + toast on deny, and only revoke when no other dependent flag
// is still on.
function bindHostPermToggle(el, settingKey, denyMessageKey, onChange) {
  el.addEventListener("change", async () => {
    if (el.checked) {
      const granted = await requestHostPermission();
      if (!granted) {
        el.checked = false;
        showStatus(t(denyMessageKey));
        return;
      }
    } else {
      // Re-read storage in case another surface (e.g., popup banner) flipped a
      // sibling flag while options was open.
      const fresh = await getSettings();
      const stillNeeded = HOST_PERM_DEPENDENT_FLAGS.some((k) => k !== settingKey && fresh[k]);
      if (!stillNeeded) await removeHostPermission();
    }
    currentSettings[settingKey] = el.checked;
    await saveSettings(currentSettings);
    if (onChange) onChange();
    showStatus(t("settingsSaved"));
  });
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
    { el: elements.useSidePanel, key: "useSidePanel", type: "checkbox" },
    { el: elements.saveYouTube, key: "saveYouTubeTimestamp", type: "checkbox" },
    { el: elements.skipWhenOffline, key: "skipWhenOffline", type: "checkbox" },
    { el: elements.restoreScroll, key: "restoreScrollPosition", type: "checkbox" },
    { el: elements.onlyDiscardIdle, key: "onlyDiscardWhenIdle", type: "checkbox" },
    { el: elements.idleThreshold, key: "idleThresholdMinutes", type: "number" },
    { el: elements.unloadPinned, key: "unloadPinnedTabs", type: "checkbox" },
    { el: elements.protectAudio, key: "protectAudioTabs", type: "checkbox" },
    { el: elements.showBadge, key: "showBadgeCount", type: "checkbox" },
    { el: elements.notifyAutoUnload, key: "notifyOnAutoUnload", type: "checkbox" },
    { el: elements.showSuspendWarning, key: "showSuspendWarning", type: "checkbox" },
    { el: elements.suspendWarningDelay, key: "suspendWarningDelayMs", type: "number" },
    { el: elements.enableStats, key: "enableStats", type: "checkbox" },
    { el: elements.enableTabGroups, key: "enableTabGroups", type: "checkbox" },
    { el: elements.enableErrorReporting, key: "enableErrorReporting", type: "checkbox" },
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
      if (key === "onlyDiscardWhenIdle") {
        updateIdleThresholdVisibility();
      }
      if (key === "showSuspendWarning") {
        updateSuspendWarningDelayVisibility();
      }
    });
  }

  // Custom Sentry DSN input - validation delegates to the same parser the
  // transport uses, so UI and runtime can never disagree on what counts as valid.
  let dsnDebounce = null;
  elements.customSentryDsn.addEventListener("input", () => {
    clearTimeout(dsnDebounce);
    dsnDebounce = setTimeout(async () => {
      const value = elements.customSentryDsn.value.trim();
      if (value !== "" && !isValidDsn(value)) {
        elements.dsnValidationMsg.textContent = t("invalidDsnMessage");
        elements.dsnValidationMsg.hidden = false;
        return;
      }
      elements.dsnValidationMsg.hidden = true;
      currentSettings.customSentryDsn = value;
      await saveSettings(currentSettings);
      showStatus(t("settingsSaved"));
    }, 400);
  });

  bindHostPermToggle(elements.protectForm, "protectFormTabs", "formProtectPermDenied");
  bindHostPermToggle(elements.showDiscardedPrefix, "showDiscardedPrefix", "prefixPermDenied", () =>
    updatePrefixInputVisibility(),
  );

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

  for (const { listKey, render, exportEl, importEl } of [
    {
      listKey: "whitelist",
      render: renderWhitelist,
      exportEl: elements.exportWhitelist,
      importEl: elements.importWhitelist,
    },
    {
      listKey: "blacklist",
      render: renderBlacklist,
      exportEl: elements.exportBlacklist,
      importEl: elements.importBlacklist,
    },
  ]) {
    exportEl.addEventListener("click", () => exportList(listKey));
    importEl.addEventListener("click", () => importList(listKey, render));
  }

  // Reset stats
  elements.resetStats.addEventListener("click", async () => {
    await chrome.storage.local.set({ stats: { tabsUnloaded: 0, memorySaved: 0 } });
    await loadStats();
    showStatus(t("statsReset"));
  });

  // Open shortcuts page (browser:// URLs require chrome.tabs.create)
  elements.shortcutsLink?.addEventListener("click", (e) => {
    e.preventDefault();
    const browser = getBrowserInfo();
    chrome.tabs.create({ url: browser.shortcutsUrl });
  });

  // Theme toggle
  elements.themeToggle.addEventListener("click", async () => {
    const newTheme = await toggleTheme();
    updateThemeIcon(elements.themeIcon, elements.themeToggle, newTheme);
  });

  // Re-run onboarding wizard
  elements.rerunOnboarding?.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/pages/onboarding.html") });
  });
}

// Add domain to a list (whitelist or blacklist)
async function addDomainToList(inputEl, listKey, renderFn) {
  const domain = inputEl.value.trim().toLowerCase();

  if (!domain) return;

  // Accept domains, IPv4, IPv6, and 'localhost'
  if (!isValidDomainOrIp(domain)) {
    showStatus(t("invalidDomain"));
    return;
  }

  if (currentSettings[listKey].includes(domain)) {
    showStatus(t("domainExists"));
    return;
  }

  const oppositeKey = OPPOSITE_LIST[listKey];
  if (currentSettings[oppositeKey]?.includes(domain)) {
    showStatus(t("domainConflict", [domain, t(oppositeKey)]));
    return;
  }

  currentSettings[listKey].push(domain);
  await saveSettings(currentSettings);
  inputEl.value = "";
  renderFn();
  showStatus(t("domainAdded"));
}

// Export a domain list (whitelist | blacklist) to clipboard.
async function exportList(listKey) {
  try {
    await exportPayload(listKey, { entries: currentSettings[listKey] || [] });
    showStatus(t("exportedToClipboard"));
  } catch {
    showStatus(t("exportFailed"));
  }
}

// Import a domain list from clipboard text. Additive - duplicates and invalid
// entries are skipped, never overwritten.
async function importList(listKey, renderFn) {
  const text = prompt(t("pasteImportJson"));
  if (!text) return;
  const result = parseImport(text, listKey);
  if (!result.ok) {
    showStatus(t(`importFailed_${result.error}`));
    return;
  }
  const entries = Array.isArray(result.data.entries) ? result.data.entries : [];
  const oppositeKey = OPPOSITE_LIST[listKey];
  let added = 0;
  let skipped = 0;
  for (const raw of entries) {
    const entry = String(raw || "")
      .trim()
      .toLowerCase();
    if (
      !isValidDomainOrIp(entry) ||
      currentSettings[listKey].includes(entry) ||
      currentSettings[oppositeKey]?.includes(entry)
    ) {
      skipped++;
      continue;
    }
    currentSettings[listKey].push(entry);
    added++;
  }
  if (added > 0) await saveSettings(currentSettings);
  renderFn();
  showStatus(t("importedNAdded", [String(added), String(skipped)]));
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
