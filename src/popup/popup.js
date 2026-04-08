import { localizeHtml, t } from "../shared/i18n.js";
import { injectIcons } from "../shared/icons.js";
import { getSettings, saveSettings } from "../shared/storage.js";
import { initTheme, onThemeChange, toggleTheme, updateThemeIcon } from "../shared/theme.js";
import { formatBytes, getBrowserInfo } from "../shared/utils.js";

// DOM Elements
const elements = {
  // Stats strip
  statSleeping: document.getElementById("stat-sleeping"),
  statProtected: document.getElementById("stat-protected"),
  statSaved: document.getElementById("stat-saved"),
  statRamUsage: document.getElementById("stat-ram-usage"),
  ramStat: document.getElementById("ram-stat"),
  // Settings
  timerSelect: document.getElementById("timer-select"),
  thresholdSelect: document.getElementById("threshold-select"),
  settingsBtn: document.getElementById("settings-btn"),
  settingsToggle: document.getElementById("settings-toggle"),
  settingsBody: document.getElementById("settings-body"),
  // More actions
  moreToggle: document.getElementById("more-toggle"),
  moreBody: document.getElementById("more-body"),
  // Tab groups
  tabGroupsSection: document.getElementById("tab-groups-section"),
  tabGroupSelect: document.getElementById("tab-group-select"),
  // Tab list
  tabsToggle: document.getElementById("tabs-toggle"),
  tabsBody: document.getElementById("tabs-body"),
  tabList: document.getElementById("tab-list"),
  tabFilters: document.getElementById("tab-filters"),
  filterCountAll: document.getElementById("filter-count-all"),
  filterCountSleeping: document.getElementById("filter-count-sleeping"),
  filterCountSnoozed: document.getElementById("filter-count-snoozed"),
  filterCountProtected: document.getElementById("filter-count-protected"),
  copyTabs: document.getElementById("copy-tabs"),
  refreshTabs: document.getElementById("refresh-tabs"),
  // Theme
  themeToggle: document.getElementById("theme-toggle"),
  themeIcon: document.getElementById("theme-icon"),
  // Toast
  toast: document.getElementById("toast"),
  // Sessions
  sessionList: document.getElementById("session-list"),
  sessionNameInput: document.getElementById("session-name-input"),
  btnSaveSession: document.getElementById("btn-save-session"),
  // Detailed stats
  statToday: document.getElementById("stat-today"),
  statAllTime: document.getElementById("stat-all-time"),
  statRam: document.getElementById("stat-ram"),
  statMemberSince: document.getElementById("stat-member-since"),
  // Review prompt
  reviewPrompt: document.getElementById("review-prompt"),
  reviewYes: document.getElementById("review-yes"),
  reviewNo: document.getElementById("review-no"),
  reviewDismiss: document.getElementById("review-dismiss"),
};

// --- Utility Functions ---

// Send command to background script
async function sendCommand(command, data = {}) {
  return await chrome.runtime.sendMessage({ command, ...data });
}

// Get hostname from URL
function getHostname(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Attach error handlers to hide broken favicon images
function attachFaviconErrorHandlers(container, selector) {
  container.querySelectorAll(selector).forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        img.style.display = "none";
      },
      { once: true },
    );
  });
}

// Get status badge HTML for a tab
function getStatusBadge(tab) {
  if (tab.active) {
    return '<span class="badge badge-active">⚡ active</span>';
  }
  if (tab.discarded) {
    return '<span class="badge badge-sleeping">💤 zzz</span>';
  }
  if (tab.isProtected) {
    const badges = {
      pinned: { icon: "📌", text: "pin", title: "Pinned" },
      whitelist: { icon: "🛡️", text: "safe", title: "Whitelisted" },
      audio: { icon: "🔊", text: "audio", title: "Playing audio" },
      form: { icon: "📝", text: "form", title: "Unsaved form" },
      snooze: { icon: "⏸️", text: "snooze", title: "Snoozed" },
    };
    const badge = badges[tab.protectionReason] || badges.whitelist;
    return `<span class="badge badge-protected" title="${badge.title}">${badge.icon} ${badge.text}</span>`;
  }
  if (tab.timeUntilUnload !== null && tab.timeUntilUnload > 0) {
    const mins = Math.ceil(tab.timeUntilUnload / 60000);
    return `<span class="badge badge-timer" title="Time until auto-unload">⏱️ ${mins}m</span>`;
  }
  return "";
}

// Toast notification
let toastTimer = null;

function showToast(message, duration = 2500) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    elements.toast.classList.remove("show");
  }, duration);
}

// Setup collapsible section
function setupCollapsible(toggleId, bodyId) {
  const toggle = document.getElementById(toggleId);
  const body = document.getElementById(bodyId);
  if (!toggle || !body) return;

  toggle.addEventListener("click", () => {
    const isOpen = body.classList.contains("open");

    if (isOpen) {
      body.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    } else {
      body.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
    }
  });
}

// Relative time helper
function relativeTime(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

// --- Core Functions ---

// Load current settings into UI
async function loadSettings() {
  const settings = await getSettings();
  elements.timerSelect.value = settings.unloadDelayMinutes;
  elements.thresholdSelect.value = settings.memoryThresholdPercent;
}

// Update stats strip display
async function updateStats() {
  // Batch all async operations
  const [allTabs, currentWindowTabs, statsResult, settings, memoryInfo] = await Promise.all([
    chrome.tabs.query({}),
    chrome.tabs.query({ currentWindow: true }),
    chrome.storage.local.get("stats"),
    getSettings(),
    sendCommand("get-memory-info"),
  ]);

  const discardedCount = allTabs.filter((t) => t.discarded).length;
  const protectedCount = currentWindowTabs.filter(
    (t) =>
      t.active ||
      (t.pinned && !settings.unloadPinnedTabs) ||
      (settings.protectAudioTabs && t.audible),
  ).length;

  elements.statSleeping.textContent = discardedCount;
  elements.statProtected.textContent = protectedCount;

  // Use formatBytes from utils.js
  if (statsResult.stats?.memorySaved) {
    elements.statSaved.textContent = `~${formatBytes(statsResult.stats.memorySaved)}`;
  } else {
    elements.statSaved.textContent = "—";
  }

  // Display RAM usage with threshold indicator
  if (memoryInfo) {
    const used = memoryInfo.capacity - memoryInfo.availableCapacity;
    const usagePercent = Math.round((used / memoryInfo.capacity) * 100);
    elements.statRamUsage.textContent = `${usagePercent}%`;

    // Highlight if above threshold
    const threshold = settings.memoryThresholdPercent || 0;
    if (threshold > 0 && usagePercent >= threshold) {
      elements.ramStat.classList.add("warning");
      elements.ramStat.title = `RAM ${usagePercent}% ≥ threshold ${threshold}% - tabs may be unloaded`;
    } else {
      elements.ramStat.classList.remove("warning");
      elements.ramStat.title = `System RAM usage: ${usagePercent}%`;
    }
  }
}

// Load tab groups if available and enabled
async function loadTabGroups() {
  try {
    // Check if tab groups feature is enabled
    const settings = await getSettings();
    if (!settings.enableTabGroups) return;

    const groups = await chrome.tabGroups.query({});
    if (groups.length > 0) {
      elements.tabGroupsSection.classList.remove("hidden");
      elements.tabGroupSelect.innerHTML = '<option value="">Select Tab Group...</option>';
      for (const group of groups) {
        const option = document.createElement("option");
        option.value = group.id;
        option.textContent = group.title || `Group ${group.id}`;
        elements.tabGroupSelect.appendChild(option);
      }
    }
  } catch {
    // Tab groups not available
  }
}

// Current filter and cached tabs
let currentFilter = "all";
let cachedTabs = [];

// Get tab filter category
function getTabCategory(tab) {
  if (tab.discarded) return "sleeping";
  if (tab.isSnoozed) return "snoozed";
  if (tab.isProtected && !tab.isSnoozed) return "protected";
  return "active";
}

// Update filter counts
function updateFilterCounts(tabs) {
  const counts = { all: tabs.length, sleeping: 0, snoozed: 0, protected: 0 };
  for (const tab of tabs) {
    const category = getTabCategory(tab);
    if (category === "sleeping") counts.sleeping++;
    else if (category === "snoozed") counts.snoozed++;
    else if (category === "protected") counts.protected++;
  }
  elements.filterCountAll.textContent = counts.all;
  elements.filterCountSleeping.textContent = counts.sleeping;
  elements.filterCountSnoozed.textContent = counts.snoozed;
  elements.filterCountProtected.textContent = counts.protected;
}

// Filter tabs based on current filter
function filterTabs(tabs) {
  if (currentFilter === "all") return tabs;
  return tabs.filter((tab) => getTabCategory(tab) === currentFilter);
}

// Generate HTML for a single tab item
function renderTabItem(tab) {
  const statusBadge = getStatusBadge(tab);
  const favicon = tab.favIconUrl
    ? `<img class="tab-favicon" src="${tab.favIconUrl}" alt="">`
    : '<span class="tab-favicon-placeholder">🌐</span>';
  const title = escapeHtml(tab.title.length > 30 ? `${tab.title.slice(0, 30)}...` : tab.title);
  const hostname = getHostname(tab.url);
  const snoozeBtn =
    tab.active || tab.discarded
      ? ""
      : tab.isSnoozed
        ? `<button class="tab-snooze-btn unsnooze" data-tab-id="${tab.id}" data-snooze-type="${tab.snoozeInfo?.type || "tab"}" data-snooze-domain="${escapeHtml(tab.snoozeInfo?.domain || "")}" title="Cancel snooze">▶️</button>`
        : `<div class="snooze-dropdown">
          <button class="tab-snooze-btn" data-tab-id="${tab.id}" title="Snooze">⏸️</button>
          <div class="snooze-menu">
            <button data-tab-id="${tab.id}" data-minutes="30">30 min</button>
            <button data-tab-id="${tab.id}" data-minutes="60">1 hour</button>
            <button data-tab-id="${tab.id}" data-minutes="120">2 hours</button>
            <hr>
            <button data-tab-id="${tab.id}" data-domain="${hostname}" data-minutes="60">Site 1h</button>
          </div>
        </div>`;

  return `
    <div class="tab-item ${tab.active ? "active" : ""} ${tab.discarded ? "discarded" : ""}"
         data-tab-id="${tab.id}"
         title="${escapeHtml(tab.title)}">
      <div class="tab-info">
        ${favicon}
        <div class="tab-details">
          <span class="tab-title">${title}</span>
          <span class="tab-hostname">${hostname}</span>
        </div>
      </div>
      <div class="tab-status">
        ${snoozeBtn}
        ${!tab.active && !tab.discarded ? `<button class="tab-unload-btn" data-tab-id="${tab.id}" title="${tab.isProtected ? "Force unload" : "Unload"}">💤</button>` : ""}
        ${statusBadge}
      </div>
    </div>
  `;
}

// Render filtered tabs to DOM
function renderFilteredTabs(tabs) {
  if (tabs.length === 0) {
    elements.tabList.innerHTML = '<div class="tab-item-empty">No tabs match this filter</div>';
    return;
  }
  elements.tabList.innerHTML = tabs.map(renderTabItem).join("");
  attachFaviconErrorHandlers(elements.tabList, ".tab-favicon");
}

// Render tab list with status indicators
async function renderTabList() {
  const tabs = await sendCommand("get-tabs-with-status");
  if (!tabs) {
    elements.tabList.innerHTML = '<div class="tab-item-empty">Unable to load tabs</div>';
    return;
  }

  cachedTabs = tabs;
  updateFilterCounts(tabs);
  renderFilteredTabs(filterTabs(tabs));
}

// Validate URL is safe (http/https only)
function isSafeUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Render sessions list
async function renderSessions() {
  const sessions = await sendCommand("get-sessions");

  if (!sessions?.length) {
    elements.sessionList.innerHTML = `<div class="empty-state">${t("saveFirstSession")}</div>`;
    return;
  }

  elements.sessionList.innerHTML = sessions
    .map((s) => {
      // Only render favicons from safe URLs
      const favicons = s.tabs
        .slice(0, 4)
        .map((tab) =>
          tab.favIconUrl && isSafeUrl(tab.favIconUrl)
            ? `<img src="${escapeHtml(tab.favIconUrl)}" alt="">`
            : "",
        )
        .join("");

      return `
      <div class="session-card" data-session-id="${s.id}">
        <div class="session-favicon-stack">${favicons}</div>
        <div class="session-info">
          <div class="session-name" title="${escapeHtml(s.name)}">${escapeHtml(s.name)}</div>
          <div class="session-meta">${s.tabs.length} tabs · ${relativeTime(s.createdAt)}</div>
        </div>
        <div class="session-actions">
          <button class="btn btn-sm session-restore" data-id="${s.id}" title="Open tabs">
            <span data-icon="play"></span>
          </button>
          <button class="btn btn-sm session-delete" data-id="${s.id}" title="Delete">
            <span data-icon="trash"></span>
          </button>
        </div>
      </div>
    `;
    })
    .join("");

  attachFaviconErrorHandlers(elements.sessionList, ".session-favicon-stack img");

  injectIcons();
}

// Render detailed stats section
async function renderDetailedStats() {
  const stats = await sendCommand("get-stats");
  if (!stats) return;

  elements.statToday.textContent = stats.totalTabsSuspendedToday || 0;
  elements.statAllTime.textContent = stats.totalTabsSuspended || 0;

  // Format RAM
  const ramMb = stats.estimatedRamSaved || 0;
  elements.statRam.textContent =
    ramMb >= 1024 ? `~${(ramMb / 1024).toFixed(1)} GB` : `~${ramMb} MB`;

  // Format member since
  if (stats.installDate) {
    elements.statMemberSince.textContent = new Date(stats.installDate).toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      },
    );
  }
}

// Review prompt URLs
const REVIEW_URL = "https://chromewebstore.google.com/detail/tabrest/placeholder-id/reviews";
const ISSUES_URL = "https://github.com/lamngockhuong/tabrest/issues";

// Check and show review prompt
async function checkReviewPrompt() {
  const data = await chrome.storage.local.get([
    "tabrest_stats",
    "reviewPromptCompleted",
    "reviewPromptDismissCount",
  ]);

  const stats = data.tabrest_stats;
  if (!stats || stats.totalTabsSuspended < 10) return;
  if (data.reviewPromptCompleted) return;
  if ((data.reviewPromptDismissCount || 0) >= 2) return;

  // Show prompt
  elements.reviewPrompt.style.display = "";
  injectIcons();
}

function hideReviewPrompt() {
  elements.reviewPrompt.style.display = "none";
}

function incrementDismiss() {
  chrome.storage.local.get("reviewPromptDismissCount", (data) => {
    chrome.storage.local.set({
      reviewPromptDismissCount: (data.reviewPromptDismissCount || 0) + 1,
    });
  });
}

// Setup event listeners
function setupEventListeners() {
  // Settings button
  elements.settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Theme toggle button
  elements.themeToggle.addEventListener("click", async () => {
    const newTheme = await toggleTheme();
    updateThemeIcon(elements.themeIcon, elements.themeToggle, newTheme);
  });

  // Copy tabs button
  elements.copyTabs.addEventListener("click", async (e) => {
    e.stopPropagation();
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tabListText = tabs.map((tab) => `${tab.title}\n${tab.url}`).join("\n\n");
    await navigator.clipboard.writeText(tabListText);
    showToast(t("tabListCopied"));
  });

  // Refresh tabs button
  elements.refreshTabs.addEventListener("click", async (e) => {
    e.stopPropagation();
    await Promise.all([renderTabList(), updateStats()]);
    showToast(t("refreshed"));
  });

  // Filter chips click handler
  elements.tabFilters.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if (!chip) return;

    // Update active state
    for (const c of document.querySelectorAll(".filter-chip")) {
      c.classList.remove("active");
    }
    chip.classList.add("active");

    // Apply filter and re-render
    currentFilter = chip.dataset.filter;
    renderFilteredTabs(filterTabs(cachedTabs));
  });

  // Setup collapsible sections
  setupCollapsible("tabs-toggle", "tabs-body");
  setupCollapsible("settings-toggle", "settings-body");
  setupCollapsible("more-toggle", "more-body");
  setupCollapsible("sessions-toggle", "sessions-body");
  setupCollapsible("stats-toggle", "stats-body");

  // Tab list event delegation
  elements.tabList.addEventListener("click", async (e) => {
    const item = e.target.closest(".tab-item");
    if (!item) return;

    // Handle snooze dropdown toggle
    if (e.target.classList.contains("tab-snooze-btn") && !e.target.classList.contains("unsnooze")) {
      e.stopPropagation();
      const dropdown = e.target.closest(".snooze-dropdown");
      if (dropdown) {
        // Close other dropdowns
        for (const d of document.querySelectorAll(".snooze-dropdown.open")) {
          d.classList.remove("open");
        }
        dropdown.classList.toggle("open");
      }
      return;
    }

    // Handle unsnooze
    if (e.target.classList.contains("unsnooze")) {
      e.stopPropagation();
      const tabId = Number.parseInt(e.target.dataset.tabId, 10);
      const snoozeType = e.target.dataset.snoozeType;
      const snoozeDomain = e.target.dataset.snoozeDomain;

      if (snoozeType === "domain" && snoozeDomain) {
        await sendCommand("cancel-domain-snooze", { domain: snoozeDomain });
      } else {
        await sendCommand("cancel-tab-snooze", { tabId });
      }
      await renderTabList();
      showToast(t("snoozeRemoved") || "Snooze removed");
      return;
    }

    // Handle snooze menu item click
    if (e.target.closest(".snooze-menu button")) {
      e.stopPropagation();
      const btn = e.target.closest(".snooze-menu button");
      const tabId = Number.parseInt(btn.dataset.tabId, 10);
      const minutes = Number.parseInt(btn.dataset.minutes, 10);
      const domain = btn.dataset.domain;

      if (domain) {
        await sendCommand("snooze-domain", { domain, minutes });
        showToast(t("domainSnoozed") || `Site snoozed for ${minutes} min`);
      } else {
        await sendCommand("snooze-tab", { tabId, minutes });
        showToast(t("tabSnoozed") || `Tab snoozed for ${minutes} min`);
      }

      for (const d of document.querySelectorAll(".snooze-dropdown.open")) {
        d.classList.remove("open");
      }
      await renderTabList();
      return;
    }

    if (e.target.classList.contains("tab-unload-btn")) {
      e.stopPropagation();
      const tabId = Number.parseInt(e.target.dataset.tabId, 10);
      await sendCommand("unload-tab", { tabId });
      await Promise.all([renderTabList(), updateStats()]);
      showToast(t("tabUnloaded"));
    } else if (!e.target.closest(".snooze-dropdown")) {
      const tabId = Number.parseInt(item.dataset.tabId, 10);
      await chrome.tabs.update(tabId, { active: true });
      window.close();
    }
  });

  // Close snooze dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".snooze-dropdown")) {
      for (const d of document.querySelectorAll(".snooze-dropdown.open")) {
        d.classList.remove("open");
      }
    }
  });

  // Quick action buttons - unified handler
  const handleUnloadAction = async (command, data = {}) => {
    const result = await sendCommand(command, data);
    if (command === "unload-current") {
      showToast(result ? t("tabUnloaded") : t("cannotUnloadActive"));
    } else {
      showToast(t("tabsUnloaded", [result || 0]));
    }
    renderTabList();
    updateStats();
  };

  document
    .getElementById("unload-current")
    .addEventListener("click", () => handleUnloadAction("unload-current"));
  document
    .getElementById("unload-others")
    .addEventListener("click", () => handleUnloadAction("unload-others"));
  document
    .getElementById("unload-right")
    .addEventListener("click", () => handleUnloadAction("unload-right"));
  document
    .getElementById("unload-left")
    .addEventListener("click", () => handleUnloadAction("unload-left"));

  document.getElementById("unload-group")?.addEventListener("click", () => {
    const groupId = Number.parseInt(elements.tabGroupSelect.value, 10);
    if (groupId) handleUnloadAction("unload-group", { groupId });
  });

  // Quick settings
  elements.timerSelect.addEventListener("change", async (e) => {
    const settings = await getSettings();
    settings.unloadDelayMinutes = Number.parseInt(e.target.value, 10);
    await saveSettings(settings);
    showToast(t("timerUpdated"));
  });

  elements.thresholdSelect.addEventListener("change", async (e) => {
    const settings = await getSettings();
    settings.memoryThresholdPercent = Number.parseInt(e.target.value, 10);
    await saveSettings(settings);
    showToast(t("thresholdUpdated"));
  });

  // Session save button
  elements.btnSaveSession.addEventListener("click", async () => {
    const result = await sendCommand("save-session", {
      name: elements.sessionNameInput.value.trim(),
    });

    if (result.success) {
      elements.sessionNameInput.value = "";
      showToast(t("sessionSaved"));
      renderSessions();
    } else {
      showToast(result.error || t("failedToSave"));
    }
  });

  // Session list event delegation
  elements.sessionList.addEventListener("click", async (e) => {
    const restoreBtn = e.target.closest(".session-restore");
    const deleteBtn = e.target.closest(".session-delete");

    if (restoreBtn) {
      const id = restoreBtn.dataset.id;
      const result = await sendCommand("restore-session", { id, mode: "open" });
      showToast(result.success ? t("restoredTabs", [result.count]) : result.error);
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      await sendCommand("delete-session", { id });
      renderSessions();
      showToast(t("sessionDeleted"));
    }
  });

  // Review prompt handlers
  elements.reviewYes?.addEventListener("click", () => {
    chrome.storage.local.set({ reviewPromptCompleted: true });
    chrome.tabs.create({ url: REVIEW_URL });
    hideReviewPrompt();
  });

  elements.reviewNo?.addEventListener("click", () => {
    incrementDismiss();
    chrome.tabs.create({ url: ISSUES_URL });
    hideReviewPrompt();
  });

  elements.reviewDismiss?.addEventListener("click", () => {
    incrementDismiss();
    hideReviewPrompt();
  });
}

// --- Initialize ---

async function init() {
  // Initialize theme first to prevent flash
  const theme = await initTheme();
  updateThemeIcon(elements.themeIcon, elements.themeToggle, theme);
  onThemeChange((theme) => updateThemeIcon(elements.themeIcon, elements.themeToggle, theme));

  // Set version from manifest with browser name
  const browser = getBrowserInfo();
  document.getElementById("app-version").textContent =
    `TabRest v${chrome.runtime.getManifest().version} · ${browser.name}`;

  // Inject SVG icons
  injectIcons();
  localizeHtml();

  // Run independent operations in parallel for faster popup load
  // Use allSettled to handle individual failures gracefully
  await Promise.allSettled([
    loadSettings(),
    updateStats(),
    loadTabGroups(),
    renderTabList(),
    renderSessions(),
    renderDetailedStats(),
    checkReviewPrompt(),
  ]);
  setupEventListeners();
}

init();
