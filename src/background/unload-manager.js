import { getSettings } from '../shared/storage.js';
import { recordUnload } from './stats-collector.js';

// Discard a single tab by ID
export async function discardTab(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);

    // Can't discard active tab or already discarded
    if (tab.active || tab.discarded) return false;

    const settings = await getSettings();
    if (tab.pinned && !settings.unloadPinnedTabs) return false;

    // Check whitelist
    if (isWhitelisted(tab.url, settings)) return false;

    await chrome.tabs.discard(tabId);
    console.log(`Discarded tab: ${tab.title}`);

    // Record stats if enabled
    if (settings.enableStats) {
      await recordUnload(1);
    }

    return true;
  } catch (error) {
    console.error(`Failed to discard tab ${tabId}:`, error);
    return false;
  }
}

// Discard the current active tab (switches to adjacent tab first)
export async function discardCurrentTab() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return false;

  // Switch to adjacent tab first
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const currentIndex = tabs.findIndex(t => t.id === activeTab.id);
  const nextTab = tabs[currentIndex + 1] || tabs[currentIndex - 1];

  if (nextTab) {
    await chrome.tabs.update(nextTab.id, { active: true });
    return await discardTab(activeTab.id);
  }
  return false;
}

// Discard all tabs to the right of current tab
export async function discardTabsToRight() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return 0;

  const tabs = await chrome.tabs.query({ currentWindow: true });
  const currentIndex = tabs.findIndex(t => t.id === activeTab.id);
  const tabsToRight = tabs.slice(currentIndex + 1);

  let count = 0;
  for (const tab of tabsToRight) {
    if (await discardTab(tab.id)) count++;
  }
  return count;
}

// Discard all tabs to the left of current tab
export async function discardTabsToLeft() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return 0;

  const tabs = await chrome.tabs.query({ currentWindow: true });
  const currentIndex = tabs.findIndex(t => t.id === activeTab.id);
  const tabsToLeft = tabs.slice(0, currentIndex);

  let count = 0;
  for (const tab of tabsToLeft) {
    if (await discardTab(tab.id)) count++;
  }
  return count;
}

// Discard all tabs except current
export async function discardOtherTabs() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return 0;

  const tabs = await chrome.tabs.query({ currentWindow: true });
  let count = 0;
  for (const tab of tabs) {
    if (tab.id !== activeTab.id && await discardTab(tab.id)) count++;
  }
  return count;
}

// Discard all other tabs on browser startup (if enabled)
export async function discardAllTabsOnStartup() {
  const settings = await getSettings();
  if (!settings.autoUnloadOnStartup) return 0;

  return await discardOtherTabs();
}

// Discard all tabs in a specific tab group
export async function discardTabGroup(groupId) {
  const tabs = await chrome.tabs.query({ groupId });
  let count = 0;

  for (const tab of tabs) {
    if (await discardTab(tab.id)) count++;
  }
  return count;
}

// Check if URL is in whitelist (sync - settings passed in)
function isWhitelisted(url, settings) {
  if (!url || !settings?.whitelist) return false;
  try {
    const hostname = new URL(url).hostname;
    return settings.whitelist.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}
