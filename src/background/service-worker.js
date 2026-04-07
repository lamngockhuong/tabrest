import { ALARM_NAMES, FORM_CHECK_TIMEOUT_MS } from "../shared/constants.js";
import { getSettings } from "../shared/storage.js";
import {
  checkMemoryAndUnload,
  checkPerTabMemory,
  getMemoryInfo,
  initMemoryMonitor,
  removeTabMemory,
  reportTabMemory,
  setupMemoryCheckAlarm,
} from "./memory-monitor.js";
import { deleteSession, getSessions, restoreSession, saveSession } from "./session-manager.js";
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
  discardAllTabsOnStartup,
  discardCurrentTab,
  discardOtherTabs,
  discardTab,
  discardTabGroup,
  discardTabsToLeft,
  discardTabsToRight,
  isUrlWhitelisted,
} from "./unload-manager.js";

// Configure toolbar action based on user preference
async function configureToolbarAction() {
  const settings = await getSettings();
  if (settings.toolbarClickAction === "popup") {
    chrome.action.setPopup({ popup: "src/popup/popup.html" });
  } else {
    // Disable popup to enable onClicked event
    chrome.action.setPopup({ popup: "" });
  }
}

// Handle toolbar click (only fires when popup is empty)
chrome.action.onClicked.addListener(async (tab) => {
  const settings = await getSettings();
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
  await initTabTracker();
  await initMemoryMonitor();
  await initStats();
  await syncAllTabs();
  await cleanupStaleActivity();
  await configureToolbarAction();
  await discardAllTabsOnStartup();
  updateBadge();
});

// Extension installed/updated
chrome.runtime.onInstalled.addListener(async (details) => {
  await initTabTracker();
  await initMemoryMonitor();
  await initStats();
  await syncAllTabs();
  await configureToolbarAction();
  setupContextMenus();
  updateBadge();

  // Open engagement pages
  const currentVersion = chrome.runtime.getManifest().version;

  if (details.reason === "install") {
    // First install - show onboarding
    chrome.tabs.create({ url: "src/pages/onboarding.html" });
  } else if (details.reason === "update") {
    // Check if we should show changelog
    const result = await chrome.storage.local.get("tabrest_lastVersion");
    if (result.tabrest_lastVersion !== currentVersion) {
      await chrome.storage.local.set({ tabrest_lastVersion: currentVersion });
      chrome.tabs.create({ url: "src/pages/changelog.html" });
    }
  }
});

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
  if (changeInfo.discarded !== undefined) {
    updateBadge();
  }
});

// Tab removed - clean up activity entry, memory entry, and update badge
chrome.tabs.onRemoved.addListener((tabId) => {
  removeTabActivity(tabId);
  removeTabMemory(tabId);
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
  }
});

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

  handleMessage(message).then((result) => {
    sendResponse(result);
    updateBadge();
  });
  return true; // Keep channel open for async response
});

// Handle messages from popup
async function handleMessage(message) {
  const { command, groupId, tabId, name, id, mode } = message;

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
    // Session commands
    case "get-sessions":
      return await getSessions();
    case "save-session":
      return await saveSession(name);
    case "delete-session":
      return await deleteSession(id);
    case "restore-session":
      return await restoreSession(id, mode);
    // Stats commands
    case "get-stats":
      return await getStats();
    default:
      return null;
  }
}

// Check if tab has unsaved form data
async function checkTabFormData(tabId) {
  try {
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

  return tabs.map((tab) => {
    const lastActive = tabActivity[tab.id] || now;
    const elapsed = now - lastActive;
    const timeUntilUnload = unloadDelay > 0 ? Math.max(0, unloadDelay - elapsed) : null;

    // Determine protection status and reason
    const isWhitelisted = isUrlWhitelisted(tab.url, settings);
    const isPinned = tab.pinned && !settings.unloadPinnedTabs;
    const isAudioPlaying = settings.protectAudioTabs && tab.audible;
    const hasFormData = settings.protectFormTabs && formDataMap.get(tab.id);
    const isProtected = isWhitelisted || isPinned || isAudioPlaying || hasFormData;

    // Determine protection reason for UI display (priority order)
    let protectionReason = null;
    if (isPinned) protectionReason = "pinned";
    else if (isWhitelisted) protectionReason = "whitelist";
    else if (isAudioPlaying) protectionReason = "audio";
    else if (hasFormData) protectionReason = "form";

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
