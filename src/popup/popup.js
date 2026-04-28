import { sanitizeString } from "../shared/error-reporter.js";
import { localizeHtml, t } from "../shared/i18n.js";
import { icon, injectIcons } from "../shared/icons.js";
import { exportPayload, parseImport } from "../shared/import-export.js";
import {
  collectDiagnostics,
  formatDiagnosticsJSON,
  formatDiagnosticsText,
} from "../shared/log-collector.js";
import { requestHostPermission } from "../shared/permissions.js";
import { getSettings, saveSettings } from "../shared/storage.js";
import { initTheme, onThemeChange, toggleTheme, updateThemeIcon } from "../shared/theme.js";
import { formatBytes, getBrowserInfo, isSafeHttpUrl } from "../shared/utils.js";

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
  toggleSearch: document.getElementById("toggle-search"),
  tabSearchRow: document.getElementById("tab-search-row"),
  tabSearchInput: document.getElementById("tab-search-input"),
  // Theme
  themeToggle: document.getElementById("theme-toggle"),
  themeIcon: document.getElementById("theme-icon"),
  // Toast
  toast: document.getElementById("toast"),
  // Sessions
  sessionList: document.getElementById("session-list"),
  sessionNameInput: document.getElementById("session-name-input"),
  btnSaveSession: document.getElementById("btn-save-session"),
  exportSessions: document.getElementById("export-sessions"),
  importSessions: document.getElementById("import-sessions"),
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
  // Form permission recovery banner
  formPermBanner: document.getElementById("form-perm-banner"),
  formPermGrant: document.getElementById("form-perm-grant"),
  formPermDismiss: document.getElementById("form-perm-dismiss"),
  // Bug report
  reportBugBtn: document.getElementById("report-bug-btn"),
  bugReportModal: document.getElementById("bug-report-modal"),
  modalClose: document.getElementById("modal-close"),
  bugDescription: document.getElementById("bug-description"),
  diagnosticsPreview: document.getElementById("diagnostics-preview"),
  copyForGithub: document.getElementById("copy-for-github"),
};

// --- Utility Functions ---

async function sendCommand(command, data = {}) {
  return await chrome.runtime.sendMessage({ command, ...data });
}

// Heuristic must stay in sync with the @media (min-height: 650px) rule in popup.css
function isSidePanel() {
  return window.matchMedia("(min-height: 650px)").matches;
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
    return `<span class="badge badge-active">${icon("zap", 12)} active</span>`;
  }
  if (tab.discarded) {
    return `<span class="badge badge-sleeping">${icon("moon", 12)} zzz</span>`;
  }
  // Pin badge shows for any pinned tab, including when unloadPinnedTabs=true
  // (pin is intrinsic; protectionReason from background omits it for this reason).
  if (tab.pinned) {
    return `<span class="badge badge-protected" title="Pinned">${icon("pin", 12)} pin</span>`;
  }
  if (tab.isProtected) {
    const badges = {
      whitelist: { icon: "shield", text: "safe", title: "Whitelisted" },
      audio: { icon: "volume", text: "audio", title: "Playing audio" },
      form: { icon: "fileText", text: "form", title: "Unsaved form" },
      snooze: { icon: "pause", text: "snooze", title: "Snoozed" },
    };
    const badge = badges[tab.protectionReason] || badges.whitelist;
    return `<span class="badge badge-protected" title="${badge.title}">${icon(badge.icon, 12)} ${badge.text}</span>`;
  }
  if (tab.timeUntilUnload !== null && tab.timeUntilUnload > 0) {
    const mins = Math.ceil(tab.timeUntilUnload / 60000);
    return `<span class="badge badge-timer" title="Time until auto-unload">${icon("clock", 12)} ${mins}m</span>`;
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

const SECTION_STATE_KEY = "popup_section_state";
const SECTIONS = [
  { toggle: "tabs-toggle", body: "tabs-body", defaultOpen: true },
  { toggle: "settings-toggle", body: "settings-body", defaultOpen: false },
  { toggle: "more-toggle", body: "more-body", defaultOpen: false },
  { toggle: "sessions-toggle", body: "sessions-body", defaultOpen: false },
  { toggle: "stats-toggle", body: "stats-body", defaultOpen: false },
];
const SECTION_BY_TOGGLE = new Map(SECTIONS.map((s) => [s.toggle, s]));

function applySectionState(toggleId, isOpen) {
  const section = SECTION_BY_TOGGLE.get(toggleId);
  if (!section) return;
  const body = document.getElementById(section.body);
  const toggle = document.getElementById(toggleId);
  if (!body || !toggle) return;
  body.classList.toggle("open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
}

async function loadSectionState() {
  const result = await chrome.storage.local.get(SECTION_STATE_KEY);
  const stored = result[SECTION_STATE_KEY] || {};
  for (const s of SECTIONS) {
    applySectionState(s.toggle, stored[s.toggle] ?? s.defaultOpen);
  }
}

async function persistSectionState(toggleId, isOpen) {
  const result = await chrome.storage.local.get(SECTION_STATE_KEY);
  const stored = result[SECTION_STATE_KEY] || {};
  stored[toggleId] = isOpen;
  await chrome.storage.local.set({ [SECTION_STATE_KEY]: stored });
}

function setupCollapsible(toggleId, bodyId) {
  const toggle = document.getElementById(toggleId);
  const body = document.getElementById(bodyId);
  if (!toggle || !body) return;

  toggle.addEventListener("click", async () => {
    const willOpen = !body.classList.contains("open");
    applySectionState(toggleId, willOpen);
    await persistSectionState(toggleId, willOpen);
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

let lastTabGroupsKey = "";
const TAB_GROUP_ID_NONE = chrome.tabGroups?.TAB_GROUP_ID_NONE ?? -1;

async function loadTabGroups() {
  try {
    const settings = await getSettings();
    if (!settings.enableTabGroups || !chrome.tabGroups) {
      elements.tabGroupsSection.classList.add("hidden");
      lastTabGroupsKey = "hidden";
      return;
    }

    const [tabs, allGroups] = await Promise.all([
      chrome.tabs.query({ currentWindow: true }),
      chrome.tabGroups.query({}),
    ]);

    const counts = new Map();
    for (const tab of tabs) {
      if (tab.groupId !== TAB_GROUP_ID_NONE) {
        counts.set(tab.groupId, (counts.get(tab.groupId) ?? 0) + 1);
      }
    }

    const groups = allGroups.filter((g) => counts.has(g.id));
    if (groups.length === 0) {
      elements.tabGroupsSection.classList.add("hidden");
      lastTabGroupsKey = "hidden";
      return;
    }

    // Skip DOM rebuild when nothing visible changed; preserves user's current selection.
    const key = groups.map((g) => `${g.id}:${g.title ?? ""}:${counts.get(g.id)}`).join("|");
    if (key === lastTabGroupsKey) {
      elements.tabGroupsSection.classList.remove("hidden");
      return;
    }
    lastTabGroupsKey = key;

    elements.tabGroupSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = t("selectTabGroup");
    elements.tabGroupSelect.appendChild(placeholder);

    for (const group of groups) {
      const option = document.createElement("option");
      option.value = group.id;
      const title = group.title || t("untitledTabGroup", [String(group.id)]);
      option.textContent = `${title} (${counts.get(group.id)})`;
      elements.tabGroupSelect.appendChild(option);
    }

    elements.tabGroupsSection.classList.remove("hidden");
  } catch (err) {
    console.error("[TabRest] loadTabGroups failed:", err);
    elements.tabGroupsSection.classList.add("hidden");
  }
}

// Current filter, search query, and cached tabs
let currentFilter = "all";
let searchQuery = "";
let cachedTabs = [];

// Get tab filter category
function getTabCategory(tab) {
  if (tab.discarded) return "sleeping";
  if (tab.isSnoozed) return "snoozed";
  // Match the badge: pinned tabs always count as protected (even when unloadPinnedTabs=true
  // makes them eligible for unloading), so the filter chip and badge stay in sync.
  if (tab.isProtected || tab.pinned) return "protected";
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

  setChipDisabled("sleeping", counts.sleeping === 0);
  setChipDisabled("snoozed", counts.snoozed === 0);
  setChipDisabled("protected", counts.protected === 0);
}

function setChipDisabled(filter, disabled) {
  const chip = document.querySelector(`.filter-chip[data-filter="${filter}"]`);
  if (!chip) return;
  chip.classList.toggle("disabled", disabled);
  chip.disabled = disabled;
}

// Apply search query (case-insensitive substring on title or url)
function applySearch(tabs) {
  if (!searchQuery) return tabs;
  const q = searchQuery.toLowerCase();
  return tabs.filter(
    (t) => (t.title || "").toLowerCase().includes(q) || (t.url || "").toLowerCase().includes(q),
  );
}

// Filter tabs by current chip filter, then by search query (AND composition).
// Filter chip counts intentionally reflect pre-search totals — they represent
// category sizes, not visible result count.
function filterTabs(tabs) {
  const filtered =
    currentFilter === "all" ? tabs : tabs.filter((tab) => getTabCategory(tab) === currentFilter);
  return applySearch(filtered);
}

// Generate HTML for a single tab item
function renderTabItem(tab) {
  const statusBadge = getStatusBadge(tab);
  const favicon = tab.favIconUrl
    ? `<img class="tab-favicon" src="${tab.favIconUrl}" alt="">`
    : `<span class="tab-favicon-placeholder">${icon("globe", 14)}</span>`;
  const title = escapeHtml(tab.title);
  const hostname = getHostname(tab.url);
  const snoozeBtn =
    tab.active || tab.discarded
      ? ""
      : tab.isSnoozed
        ? `<button class="tab-snooze-btn unsnooze" data-tab-id="${tab.id}" data-snooze-type="${tab.snoozeInfo?.type || "tab"}" data-snooze-domain="${escapeHtml(tab.snoozeInfo?.domain || "")}" title="Cancel snooze">${icon("play", 14)}</button>`
        : `<div class="snooze-dropdown">
          <button class="tab-snooze-btn" data-tab-id="${tab.id}" title="Snooze">${icon("pause", 14)}</button>
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
        ${!tab.active && !tab.discarded ? `<button class="tab-unload-btn" data-tab-id="${tab.id}" title="${tab.isProtected ? "Force unload" : "Unload"}">${icon("moon", 14)}</button>` : ""}
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

// Render sessions list
async function renderSessions() {
  const sessions = await sendCommand("get-sessions");

  if (!sessions?.length) {
    elements.sessionList.innerHTML = "";
    return;
  }

  elements.sessionList.innerHTML = sessions
    .map((s) => {
      // Only render favicons from safe URLs
      const favicons = s.tabs
        .slice(0, 4)
        .map((tab) =>
          tab.favIconUrl && isSafeHttpUrl(tab.favIconUrl)
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

async function readPendingHostPermFlags() {
  const { pendingHostPermBanner } = await chrome.storage.local.get("pendingHostPermBanner");
  return Array.isArray(pendingHostPermBanner) && pendingHostPermBanner.length
    ? pendingHostPermBanner
    : null;
}

async function checkFormPermBanner() {
  if (!(await readPendingHostPermFlags())) return;
  elements.formPermBanner.style.display = "flex";
  injectIcons();
}

async function dismissFormPermBanner() {
  elements.formPermBanner.style.display = "none";
  await chrome.storage.local.remove("pendingHostPermBanner");
}

async function handleFormPermGrant() {
  const flags = await readPendingHostPermFlags();
  const granted = await requestHostPermission();
  if (granted && flags?.length) {
    const settings = await getSettings();
    for (const key of flags) settings[key] = true;
    await saveSettings(settings);
    showToast(t("formPermGranted"));
  }
  await dismissFormPermBanner();
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

  function clearSearch() {
    searchQuery = "";
    elements.tabSearchInput.value = "";
    renderFilteredTabs(filterTabs(cachedTabs));
  }

  elements.toggleSearch.addEventListener("click", async (e) => {
    e.stopPropagation();
    const willHide = !elements.tabSearchRow.classList.contains("hidden");
    if (willHide) {
      clearSearch();
      elements.tabSearchRow.classList.add("hidden");
      return;
    }
    // Search input lives inside the Tabs collapsible — force it open so the input is visible
    const tabsBody = document.getElementById("tabs-body");
    if (tabsBody && !tabsBody.classList.contains("open")) {
      applySectionState("tabs-toggle", true);
      await persistSectionState("tabs-toggle", true);
    }
    elements.tabSearchRow.classList.remove("hidden");
    elements.tabSearchInput.focus();
  });

  let searchDebounce = null;
  elements.tabSearchInput.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      searchQuery = elements.tabSearchInput.value.trim();
      renderFilteredTabs(filterTabs(cachedTabs));
    }, 50);
  });

  elements.tabSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      clearSearch();
      elements.tabSearchRow.classList.add("hidden");
      elements.toggleSearch.focus();
    }
  });

  // Filter chips click handler
  elements.tabFilters.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if (!chip || chip.disabled) return;

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

    const snoozeBtn = e.target.closest(".tab-snooze-btn");
    if (snoozeBtn && !snoozeBtn.classList.contains("unsnooze")) {
      e.stopPropagation();
      const dropdown = snoozeBtn.closest(".snooze-dropdown");
      if (dropdown) {
        for (const d of document.querySelectorAll(".snooze-dropdown.open")) {
          d.classList.remove("open", "flip-up");
        }
        dropdown.classList.remove("flip-up");
        const btnRect = snoozeBtn.getBoundingClientRect();
        const containerRect = elements.tabList.getBoundingClientRect();
        const spaceBelow = containerRect.bottom - btnRect.bottom;
        const spaceAbove = btnRect.top - containerRect.top;
        // Menu is ~180px tall — flip up only when below is too tight and above has more room
        if (spaceBelow < 200 && spaceAbove > spaceBelow) {
          dropdown.classList.add("flip-up");
        }
        dropdown.classList.toggle("open");
      }
      return;
    }

    // Handle unsnooze
    const unsnoozeBtn = e.target.closest(".unsnooze");
    if (unsnoozeBtn) {
      e.stopPropagation();
      const tabId = Number.parseInt(unsnoozeBtn.dataset.tabId, 10);
      const snoozeType = unsnoozeBtn.dataset.snoozeType;
      const snoozeDomain = unsnoozeBtn.dataset.snoozeDomain;

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

    const unloadBtn = e.target.closest(".tab-unload-btn");
    if (unloadBtn) {
      e.stopPropagation();
      const tabId = Number.parseInt(unloadBtn.dataset.tabId, 10);
      await sendCommand("unload-tab", { tabId });
      await Promise.all([renderTabList(), updateStats()]);
      showToast(t("tabUnloaded"));
    } else if (!e.target.closest(".snooze-dropdown")) {
      const tabId = Number.parseInt(item.dataset.tabId, 10);
      await chrome.tabs.update(tabId, { active: true });
      if (!isSidePanel()) window.close();
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

  document.getElementById("close-duplicates")?.addEventListener("click", async () => {
    const result = await sendCommand("close-duplicates");
    if (!result || result.closed === 0) {
      showToast(t("noDuplicatesFound"));
    } else {
      showToast(t("closedNDuplicates", [String(result.closed)]));
    }
    await Promise.all([renderTabList(), updateStats()]);
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

  // Session export — copy current sessions as JSON to clipboard
  elements.exportSessions?.addEventListener("click", async () => {
    const sessions = (await sendCommand("get-sessions")) || [];
    try {
      await exportPayload("sessions", { sessions });
      showToast(t("exportedToClipboard"));
    } catch {
      showToast(t("exportFailed"));
    }
  });

  // Session import — parse pasted JSON, additive merge by name
  elements.importSessions?.addEventListener("click", async () => {
    const text = prompt(t("pasteImportJson"));
    if (!text) return;
    const result = parseImport(text, "sessions");
    if (!result.ok) {
      showToast(t(`importFailed_${result.error}`));
      return;
    }
    const res = await sendCommand("import-sessions", { sessions: result.data.sessions });
    showToast(t("importedNAdded", [String(res?.added || 0), String(res?.skipped || 0)]));
    await renderSessions();
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

  // Form permission recovery banner handlers
  elements.formPermGrant?.addEventListener("click", handleFormPermGrant);
  elements.formPermDismiss?.addEventListener("click", dismissFormPermBanner);

  // Bug report modal handlers
  let cachedDiagnostics = null;

  elements.reportBugBtn?.addEventListener("click", async () => {
    cachedDiagnostics = await collectDiagnostics();
    elements.diagnosticsPreview.textContent = formatDiagnosticsJSON(cachedDiagnostics);
    elements.bugReportModal.style.display = "flex";
  });

  elements.modalClose?.addEventListener("click", () => {
    elements.bugReportModal.style.display = "none";
  });

  elements.bugReportModal?.addEventListener("click", (e) => {
    if (e.target === elements.bugReportModal) {
      elements.bugReportModal.style.display = "none";
    }
  });

  elements.copyForGithub?.addEventListener("click", async () => {
    // Sanitize user description to prevent accidental PII sharing
    const description = sanitizeString(elements.bugDescription.value.trim());
    const text = formatDiagnosticsText(cachedDiagnostics);
    const fullReport = description ? `## Description\n${description}\n\n${text}` : text;

    try {
      await navigator.clipboard.writeText(fullReport);
      showToast(t("copiedToClipboard") || "Copied! Paste in GitHub issue.");
    } catch {
      showToast("Failed to copy. Please copy manually.");
    }
    chrome.tabs.create({ url: "https://github.com/lamngockhuong/tabrest/issues/new" });
    elements.bugReportModal.style.display = "none";
    elements.bugDescription.value = "";
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

  // loadSectionState only flips classes; safe to run alongside renderers
  await Promise.allSettled([
    loadSectionState(),
    loadSettings(),
    updateStats(),
    loadTabGroups(),
    renderTabList(),
    renderSessions(),
    renderDetailedStats(),
    checkReviewPrompt(),
    checkFormPermBanner(),
  ]);
  setupEventListeners();

  // Popup re-renders on every open; side panel persists, so it must subscribe to tab changes.
  if (isSidePanel()) setupTabEventSync();
}

const SYNC_DEBOUNCE_MS = 150;

function leadingDebounce(fn, delay = SYNC_DEBOUNCE_MS) {
  let pending = false;
  return () => {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      fn();
    }, delay);
  };
}

let tabEventSyncBound = false;
function setupTabEventSync() {
  if (tabEventSyncBound) return;
  tabEventSyncBound = true;

  const scheduleRefresh = leadingDebounce(renderTabList);
  chrome.tabs.onActivated.addListener(scheduleRefresh);
  chrome.tabs.onUpdated.addListener((_id, changeInfo) => {
    if ("discarded" in changeInfo || "title" in changeInfo || "favIconUrl" in changeInfo) {
      scheduleRefresh();
    }
  });
  chrome.tabs.onRemoved.addListener(scheduleRefresh);
  chrome.tabs.onCreated.addListener(scheduleRefresh);

  if (!chrome.tabGroups) return;
  const scheduleGroupsRefresh = leadingDebounce(loadTabGroups);
  chrome.tabGroups.onCreated.addListener(scheduleGroupsRefresh);
  chrome.tabGroups.onUpdated.addListener(scheduleGroupsRefresh);
  chrome.tabGroups.onRemoved.addListener(scheduleGroupsRefresh);
  chrome.tabs.onAttached.addListener(scheduleGroupsRefresh);
  chrome.tabs.onDetached.addListener(scheduleGroupsRefresh);
}

init();
