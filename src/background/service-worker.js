import {
  discardAllTabsOnStartup,
  discardCurrentTab,
  discardOtherTabs,
  discardTabsToLeft,
  discardTabsToRight,
  discardTabGroup,
  discardTab,
  isUrlWhitelisted
} from './unload-manager.js';
import {
  initTabTracker,
  updateTabActivity,
  removeTabActivity,
  checkAndUnloadInactiveTabs,
  syncAllTabs,
  cleanupStaleActivity,
  setupTabCheckAlarm,
  getTabActivityMap
} from './tab-tracker.js';
import {
  initMemoryMonitor,
  checkMemoryAndUnload,
  setupMemoryCheckAlarm,
  getMemoryInfo
} from './memory-monitor.js';
import { initStats } from './stats-collector.js';
import { getSettings } from '../shared/storage.js';
import { ALARM_NAMES } from '../shared/constants.js';

// Browser startup - initialize trackers and auto-unload
chrome.runtime.onStartup.addListener(async () => {
  console.log('Browser started');
  await initTabTracker();
  await initMemoryMonitor();
  await initStats();
  await syncAllTabs();
  await cleanupStaleActivity();

  const count = await discardAllTabsOnStartup();
  console.log(`Auto-unloaded ${count} tabs on startup`);
  updateBadge();
});

// Extension installed/updated
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed/updated:', details.reason);
  await initTabTracker();
  await initMemoryMonitor();
  await initStats();
  await syncAllTabs();
  setupContextMenus();

  const settings = await getSettings();
  console.log('Current settings:', settings);
  updateBadge();
});

// Setup context menus
function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'unload-tab',
      title: 'Unload This Tab',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'unload-others',
      title: 'Unload Other Tabs',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'separator-1',
      type: 'separator',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'unload-right',
      title: 'Unload Tabs to the Right',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'unload-left',
      title: 'Unload Tabs to the Left',
      contexts: ['page']
    });
  });
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'unload-tab':
      if (tab?.id) {
        if (tab.active) {
          await discardCurrentTab();
        } else {
          await discardTab(tab.id);
        }
      }
      break;
    case 'unload-others':
      await discardOtherTabs();
      break;
    case 'unload-right':
      await discardTabsToRight();
      break;
    case 'unload-left':
      await discardTabsToLeft();
      break;
  }
  updateBadge();
});

// Keyboard shortcuts handler
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command received:', command);

  switch (command) {
    case 'unload-current':
      await discardCurrentTab();
      break;
    case 'unload-others':
      await discardOtherTabs();
      break;
    case 'unload-right':
      await discardTabsToRight();
      break;
    case 'unload-left':
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
  if (changeInfo.status === 'complete' || changeInfo.url) {
    updateTabActivity(tabId);
  }
  if (changeInfo.discarded !== undefined) {
    updateBadge();
  }
});

// Tab removed - clean up activity entry and update badge
chrome.tabs.onRemoved.addListener((tabId) => {
  removeTabActivity(tabId);
  updateBadge();
});

// Alarm handler for periodic checks
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAMES.TAB_CHECK) {
    const count = await checkAndUnloadInactiveTabs();
    if (count > 0) updateBadge();
  } else if (alarm.name === ALARM_NAMES.MEMORY_CHECK) {
    const count = await checkMemoryAndUnload();
    if (count > 0) updateBadge();
  }
});

// Settings changed - reconfigure alarms and badge
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'sync' && changes.settings) {
    console.log('Settings changed, reconfiguring alarms...');
    await setupTabCheckAlarm();
    await setupMemoryCheckAlarm();
    updateBadge();
  }
});

// Message handler for popup commands
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(result => {
    sendResponse(result);
    updateBadge();
  });
  return true; // Keep channel open for async response
});

// Handle messages from popup
async function handleMessage(message) {
  const { command, groupId, tabId } = message;

  switch (command) {
    case 'unload-current':
      return await discardCurrentTab();
    case 'unload-others':
      return await discardOtherTabs();
    case 'unload-right':
      return await discardTabsToRight();
    case 'unload-left':
      return await discardTabsToLeft();
    case 'unload-group':
      return await discardTabGroup(groupId);
    case 'get-memory-info':
      return await getMemoryInfo();
    case 'get-tabs-with-status':
      return await getTabsWithStatus();
    case 'unload-tab':
      return await discardTab(tabId);
    default:
      return null;
  }
}

// Get all tabs in current window with their status info
async function getTabsWithStatus() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const settings = await getSettings();
  const tabActivity = getTabActivityMap();
  const now = Date.now();
  const unloadDelay = settings.unloadDelayMinutes * 60 * 1000;

  return tabs.map(tab => {
    const lastActive = tabActivity[tab.id] || now;
    const elapsed = now - lastActive;
    const timeUntilUnload = unloadDelay > 0 ? Math.max(0, unloadDelay - elapsed) : null;

    // Determine protection status
    const isWhitelisted = isUrlWhitelisted(tab.url, settings);
    const isPinned = tab.pinned && !settings.unloadPinnedTabs;
    const isProtected = isWhitelisted || isPinned;

    return {
      id: tab.id,
      title: tab.title || 'New Tab',
      url: tab.url,
      favIconUrl: tab.favIconUrl,
      active: tab.active,
      discarded: tab.discarded,
      pinned: tab.pinned,
      isProtected,
      isWhitelisted,
      timeUntilUnload: tab.active || tab.discarded || isProtected ? null : timeUntilUnload
    };
  });
}

// Update badge with discarded tab count
async function updateBadge() {
  const settings = await getSettings();

  if (!settings.showBadgeCount) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const tabs = await chrome.tabs.query({});
  const count = tabs.filter(t => t.discarded).length;

  chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#4caf50' });
}

console.log('TabRest service worker initialized');
