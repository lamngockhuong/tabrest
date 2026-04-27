import { ALARM_NAMES, FORM_CHECK_TIMEOUT_MS } from "../shared/constants.js";
import { initErrorReporter } from "../shared/error-reporter.js";
import { hasHostPermission } from "../shared/permissions.js";
import { getSettings, saveSettings } from "../shared/storage.js";
import { isMinorOrMajorBump, isValidDomainOrIp, unwrapHostname } from "../shared/utils.js";
import { clearInjectedTab, ensureFormCheckerInjected } from "./form-injector.js";
import {
  checkMemoryAndUnload,
  checkPerTabMemory,
  getMemoryInfo,
  initMemoryMonitor,
  removeTabMemory,
  reportTabMemory,
  setupMemoryCheckAlarm,
} from "./memory-monitor.js";
import {
  deleteSession,
  getSessions,
  importSessions,
  restoreSession,
  saveSession,
} from "./session-manager.js";
import {
  cancelDomainSnooze,
  cancelTabSnooze,
  cleanupExpiredSnooze,
  getActiveSnoozes,
  getSnoozeData,
  getTabSnoozeInfo,
  snoozeDomain,
  snoozeTab,
} from "./snooze-manager.js";
import { getStats, initStats } from "./stats-collector.js";
import {
  checkAndUnloadInactiveTabs,
  cleanupStaleActivity,
  getTabActivityMap,
  initTabTracker,
  removeTabActivity,
  setupTabCheckAlarm,
  syncAllTabs,
  updateTabActivity,
} from "./tab-tracker.js";
import {
  closeDuplicateTabs,
  discardAllTabsOnStartup,
  discardCurrentTab,
  discardOtherTabs,
  discardTab,
  discardTabGroup,
  discardTabsToLeft,
  discardTabsToRight,
  isUrlWhitelisted,
} from "./unload-manager.js";

// Side-panel mode takes precedence over toolbarClickAction.
async function configureToolbarAction() {
  const settings = await getSettings();
  if (settings.useSidePanel && chrome.sidePanel) {
    // Empty popup → action.onClicked fires → opens side panel.
    chrome.action.setPopup({ popup: "" });
    try {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
    } catch {}
    return;
  }
  if (settings.toolbarClickAction === "popup") {
    chrome.action.setPopup({ popup: "src/popup/popup.html" });
  } else {
    chrome.action.setPopup({ popup: "" });
  }
  if (chrome.sidePanel) {
    try {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
    } catch {}
  }
}

// Toolbar click (only fires when popup is empty).
chrome.action.onClicked.addListener(async (tab) => {
  const settings = await getSettings();
  if (settings.useSidePanel && chrome.sidePanel) {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch {}
    return;
  }
  switch (settings.toolbarClickAction) {
    case "discard-current":
      await discardCurrentTab();
      break;
    case "discard-others":
      await discardOtherTabs();
      break;
  }
  updateBadge();
});

// Browser startup - initialize trackers and auto-unload
chrome.runtime.onStartup.addListener(async () => {
  await initErrorReporter();
  await initTabTracker();
  await initMemoryMonitor();
  await initStats();
  await syncAllTabs();
  await cleanupStaleActivity();
  await configureToolbarAction();
  await setupSnoozeCleanupAlarm();
  // Catch the case where the user revoked host permission via chrome://extensions
  // between sessions; silently flip protectFormTabs off (no banner — not an upgrade).
  await syncFormPermissionState(false);
  await discardAllTabsOnStartup();
  updateBadge();
});

// Extension installed/updated
chrome.runtime.onInstalled.addListener(async (details) => {
  await initErrorReporter();
  await initTabTracker();
  await initMemoryMonitor();
  await initStats();
  await syncAllTabs();
  await configureToolbarAction();
  await setupSnoozeCleanupAlarm();
  setupContextMenus();
  updateBadge();

  // Open engagement pages
  const currentVersion = chrome.runtime.getManifest().version;

  if (details.reason === "install") {
    // First install - show onboarding, store version to track future bumps
    await chrome.storage.local.set({ tabrest_lastVersion: currentVersion });
    chrome.tabs.create({ url: "src/pages/onboarding.html" });
  } else if (details.reason === "update") {
    const stored = await chrome.storage.local.get("tabrest_lastVersion");
    const prevVersion = details.previousVersion || stored.tabrest_lastVersion;

    if (prevVersion && isMinorOrMajorBump(prevVersion, currentVersion)) {
      chrome.tabs.create({ url: "https://tabrest.ohnice.app/changelog" });
    }
    await chrome.storage.local.set({ tabrest_lastVersion: currentVersion });
  }

  // Migrate users moving to optional_host_permissions: if form protection was on
  // but Chrome dropped the implicit grant, force-disable and queue recovery banner.
  await syncFormPermissionState(details.reason === "update");
});

async function syncFormPermissionState(showBannerIfChanged) {
  if (await hasHostPermission()) return;
  const settings = await getSettings();
  if (!settings.protectFormTabs) return;
  settings.protectFormTabs = false;
  await saveSettings(settings);
  if (showBannerIfChanged) {
    await chrome.storage.local.set({ pendingFormPermBanner: true });
  }
}

// Add current site to whitelist
async function addCurrentSiteToWhitelist() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  try {
    const url = new URL(tab.url);
    const hostname = unwrapHostname(url.hostname).replace(/^www\./, "");
    if (!isValidDomainOrIp(hostname)) return;

    const settings = await getSettings();
    if (!settings.whitelist.includes(hostname)) {
      settings.whitelist.push(hostname);
      await saveSettings(settings);
    }
  } catch {
    // Ignore invalid URLs
  }
}

// Setup context menus
function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "unload-tab",
      title: "Unload This Tab",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "unload-others",
      title: "Unload Other Tabs",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "separator-1",
      type: "separator",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "unload-right",
      title: "Unload Tabs to the Right",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "unload-left",
      title: "Unload Tabs to the Left",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "separator-2",
      type: "separator",
      contexts: ["page"],
    });
    // Snooze context menus
    chrome.contextMenus.create({
      id: "snooze-tab-30",
      title: "Snooze Tab (30 min)",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "snooze-tab-60",
      title: "Snooze Tab (1 hour)",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "snooze-domain-60",
      title: "Snooze Site (1 hour)",
      contexts: ["page"],
    });

    // Open link in suspended tab
    chrome.contextMenus.create({
      id: "open-link-suspended",
      title: "Open Link in Suspended Tab",
      contexts: ["link"],
    });

    // Toolbar icon (action) context menu
    chrome.contextMenus.create({
      id: "action-unload-current",
      title: "Unload Current Tab",
      contexts: ["action"],
    });
    chrome.contextMenus.create({
      id: "action-unload-others",
      title: "Unload Other Tabs",
      contexts: ["action"],
    });
    chrome.contextMenus.create({
      id: "action-never-unload-site",
      title: "Never Unload This Site",
      contexts: ["action"],
    });
  });
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case "unload-tab":
      if (tab?.id) {
        if (tab.active) {
          await discardCurrentTab();
        } else {
          await discardTab(tab.id);
        }
      }
      break;
    case "unload-others":
      await discardOtherTabs();
      break;
    case "unload-right":
      await discardTabsToRight();
      break;
    case "unload-left":
      await discardTabsToLeft();
      break;
    // Snooze handlers
    case "snooze-tab-30":
      if (tab?.id) await snoozeTab(tab.id, 30);
      break;
    case "snooze-tab-60":
      if (tab?.id) await snoozeTab(tab.id, 60);
      break;
    case "snooze-domain-60":
      if (tab?.url) {
        try {
          const hostname = new URL(tab.url).hostname;
          await snoozeDomain(hostname, 60);
        } catch {
          // Invalid URL
        }
      }
      break;
    // Open link in suspended tab
    case "open-link-suspended":
      if (info.linkUrl) {
        await openLinkSuspended(info.linkUrl);
      }
      break;
    // Action (toolbar icon) menu handlers
    case "action-unload-current":
      await discardCurrentTab();
      break;
    case "action-unload-others":
      await discardOtherTabs();
      break;
    case "action-never-unload-site":
      await addCurrentSiteToWhitelist();
      break;
  }
  updateBadge();
});

// Keyboard shortcuts handler
chrome.commands.onCommand.addListener(async (command) => {
  switch (command) {
    case "unload-current":
      await discardCurrentTab();
      break;
    case "unload-others":
      await discardOtherTabs();
      break;
    case "unload-right":
      await discardTabsToRight();
      break;
    case "unload-left":
      await discardTabsToLeft();
      break;
  }
  updateBadge();
});

// Tab activated - update activity timestamp
chrome.tabs.onActivated.addListener((activeInfo) => {
  updateTabActivity(activeInfo.tabId);
});

// Tab updated (navigation complete) - update activity and badge
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    updateTabActivity(tabId);
  }
  if (changeInfo.status === "loading" || changeInfo.discarded === true) {
    // Page navigating or Chrome dropped the tab — injected form-checker is
    // gone; force re-inject next check.
    clearInjectedTab(tabId);
  }
  if (changeInfo.discarded !== undefined) {
    updateBadge();
  }
});

// Tab removed - clean up activity entry, memory entry, and update badge
chrome.tabs.onRemoved.addListener((tabId) => {
  removeTabActivity(tabId);
  removeTabMemory(tabId);
  clearInjectedTab(tabId);
  updateBadge();
});

// Alarm handler for periodic checks
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAMES.TAB_CHECK) {
    const count = await checkAndUnloadInactiveTabs();
    if (count > 0) updateBadge();
  } else if (alarm.name === ALARM_NAMES.MEMORY_CHECK) {
    const systemCount = await checkMemoryAndUnload();
    const perTabCount = await checkPerTabMemory();
    if (systemCount + perTabCount > 0) updateBadge();
  } else if (alarm.name === ALARM_NAMES.SNOOZE_CLEANUP) {
    await cleanupExpiredSnooze();
  }
});

// Setup snooze cleanup alarm (runs every 5 minutes)
async function setupSnoozeCleanupAlarm() {
  await chrome.alarms.clear(ALARM_NAMES.SNOOZE_CLEANUP);
  chrome.alarms.create(ALARM_NAMES.SNOOZE_CLEANUP, { periodInMinutes: 5 });
}

/**
 * Open a link in a new suspended (discarded) tab
 * @param {string} url - URL to open
 */
async function openLinkSuspended(url) {
  // Validate URL (security - only http/https)
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }
  } catch {
    return false;
  }

  // Create tab in background (not active)
  const tab = await chrome.tabs.create({ url, active: false });

  let timeoutId = null;

  // Cleanup function to remove all listeners and clear timeout
  const cleanup = () => {
    chrome.tabs.onUpdated.removeListener(updateListener);
    chrome.tabs.onRemoved.removeListener(removeListener);
    if (timeoutId) clearTimeout(timeoutId);
  };

  // Wait for tab to finish loading, then discard
  const updateListener = (tabId, changeInfo) => {
    if (tabId === tab.id && changeInfo.status === "complete") {
      cleanup();
      // Small delay to ensure page is fully ready
      setTimeout(() => {
        chrome.tabs.discard(tab.id).catch(() => {});
      }, 500);
    }
  };

  // Handle tab closed before load completes
  const removeListener = (tabId) => {
    if (tabId === tab.id) {
      cleanup();
    }
  };

  chrome.tabs.onUpdated.addListener(updateListener);
  chrome.tabs.onRemoved.addListener(removeListener);

  // Timeout fallback - cleanup and discard after 30s regardless
  timeoutId = setTimeout(() => {
    cleanup();
    chrome.tabs.discard(tab.id).catch(() => {});
  }, 30000);

  return true;
}

// Settings changed - reconfigure alarms, toolbar action, and badge
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === "sync" && changes.settings) {
    await setupTabCheckAlarm();
    await setupMemoryCheckAlarm();
    await configureToolbarAction();
    updateBadge();
  }
});

// Message handler for popup commands and content script reports
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle per-tab memory reports from content script
  if (message.action === "reportTabMemory" && sender.tab?.id) {
    reportTabMemory(sender.tab.id, message.heapMB);
    sendResponse({ received: true });
    return true;
  }

  // Handle getTabId for scroll position restore
  if (message.action === "getTabId" && sender.tab?.id) {
    sendResponse({ tabId: sender.tab.id });
    return true;
  }

  handleMessage(message).then((result) => {
    sendResponse(result);
    updateBadge();
  });
  return true; // Keep channel open for async response
});

// Handle messages from popup
async function handleMessage(message) {
  const { command, groupId, tabId, name, id, mode, minutes, domain, url, sessions } = message;

  switch (command) {
    case "unload-current":
      return await discardCurrentTab();
    case "unload-others":
      return await discardOtherTabs();
    case "unload-right":
      return await discardTabsToRight();
    case "unload-left":
      return await discardTabsToLeft();
    case "unload-group":
      return await discardTabGroup(groupId);
    case "get-memory-info":
      return await getMemoryInfo();
    case "get-tabs-with-status":
      return await getTabsWithStatus();
    case "unload-tab":
      return await discardTab(tabId, { force: true });
    case "close-duplicates":
      return await closeDuplicateTabs();
    // Session commands
    case "get-sessions":
      return await getSessions();
    case "save-session":
      return await saveSession(name);
    case "delete-session":
      return await deleteSession(id);
    case "restore-session":
      return await restoreSession(id, mode);
    case "import-sessions":
      return await importSessions(sessions);
    // Stats commands
    case "get-stats":
      return await getStats();
    // Snooze commands
    case "snooze-tab":
      await snoozeTab(tabId, minutes);
      return { success: true };
    case "snooze-domain":
      await snoozeDomain(domain, minutes);
      return { success: true };
    case "cancel-tab-snooze":
      await cancelTabSnooze(tabId);
      return { success: true };
    case "cancel-domain-snooze":
      await cancelDomainSnooze(domain);
      return { success: true };
    case "get-snooze-info":
      return await getTabSnoozeInfo(tabId, url);
    case "get-active-snoozes":
      return await getActiveSnoozes();
    default:
      return null;
  }
}

// Check if tab has unsaved form data
async function checkTabFormData(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!(await ensureFormCheckerInjected(tabId, tab.url))) return false;
    const response = await Promise.race([
      chrome.tabs.sendMessage(tabId, { action: "checkFormData" }),
      new Promise((resolve) => setTimeout(() => resolve(null), FORM_CHECK_TIMEOUT_MS)),
    ]);
    return response?.hasFormData || false;
  } catch {
    return false;
  }
}

// Get all tabs in current window with their status info
async function getTabsWithStatus() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const settings = await getSettings();
  const tabActivity = getTabActivityMap();
  const now = Date.now();
  const unloadDelay = settings.unloadDelayMinutes * 60 * 1000;

  // Check form data for eligible tabs in parallel (only if form protection enabled)
  const formDataMap = new Map();
  if (settings.protectFormTabs) {
    const eligibleTabs = tabs.filter((t) => !t.discarded && !t.active && t.url?.startsWith("http"));
    const formChecks = await Promise.all(
      eligibleTabs.map(async (t) => ({ id: t.id, hasForm: await checkTabFormData(t.id) })),
    );
    for (const { id, hasForm } of formChecks) {
      formDataMap.set(id, hasForm);
    }
  }

  // Load snooze data once and check all tabs (avoids N storage reads)
  const snoozeData = await getSnoozeData();
  const snoozeMap = new Map();
  for (const t of tabs) {
    snoozeMap.set(t.id, await getTabSnoozeInfo(t.id, t.url, snoozeData));
  }

  return tabs.map((tab) => {
    const lastActive = tabActivity[tab.id] || now;
    const elapsed = now - lastActive;
    const timeUntilUnload = unloadDelay > 0 ? Math.max(0, unloadDelay - elapsed) : null;

    // Determine protection status and reason
    const isWhitelisted = isUrlWhitelisted(tab.url, settings);
    const isPinned = tab.pinned && !settings.unloadPinnedTabs;
    const isAudioPlaying = settings.protectAudioTabs && tab.audible;
    const hasFormData = settings.protectFormTabs && formDataMap.get(tab.id);
    const snoozeInfo = snoozeMap.get(tab.id) || { snoozed: false };
    const isSnoozed = snoozeInfo.snoozed;
    const isProtected = isWhitelisted || isPinned || isAudioPlaying || hasFormData || isSnoozed;

    // Determine protection reason for UI display (priority order)
    let protectionReason = null;
    if (isPinned) protectionReason = "pinned";
    else if (isWhitelisted) protectionReason = "whitelist";
    else if (isAudioPlaying) protectionReason = "audio";
    else if (hasFormData) protectionReason = "form";
    else if (isSnoozed) protectionReason = "snooze";

    return {
      id: tab.id,
      title: tab.title || "New Tab",
      url: tab.url,
      favIconUrl: tab.favIconUrl,
      active: tab.active,
      discarded: tab.discarded,
      pinned: tab.pinned,
      audible: tab.audible,
      isProtected,
      isWhitelisted,
      isSnoozed,
      snoozeInfo,
      protectionReason,
      timeUntilUnload: tab.active || tab.discarded || isProtected ? null : timeUntilUnload,
    };
  });
}

// Update badge with discarded tab count
async function updateBadge() {
  const settings = await getSettings();

  if (!settings.showBadgeCount) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }

  const tabs = await chrome.tabs.query({});
  const count = tabs.filter((t) => t.discarded).length;

  chrome.action.setBadgeText({ text: count > 0 ? count.toString() : "" });
  chrome.action.setBadgeBackgroundColor({ color: "#4338CA" });
}
