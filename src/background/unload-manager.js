import { FORM_CHECK_TIMEOUT_MS } from "../shared/constants.js";
import { getSettings } from "../shared/storage.js";
import { recordUnload } from "./stats-collector.js";

/**
 * Check if tab should be protected from unloading
 * @param {object} tab - Chrome tab object
 * @param {object} settings - Current settings
 * @returns {Promise<{protected: boolean, reason?: string}>}
 */
async function shouldProtectTab(tab, settings) {
  // Audio protection - skip tabs playing audio
  if (settings.protectAudioTabs && tab.audible) {
    return { protected: true, reason: "audio" };
  }

  // Form protection - check for unsaved form data
  if (settings.protectFormTabs) {
    try {
      const response = await Promise.race([
        chrome.tabs.sendMessage(tab.id, { action: "checkFormData" }),
        new Promise((resolve) => setTimeout(() => resolve(null), FORM_CHECK_TIMEOUT_MS)),
      ]);
      if (response?.hasFormData) {
        return { protected: true, reason: "form" };
      }
    } catch {
      // Content script not loaded, proceed with unload
    }
  }

  return { protected: false };
}

// Discard a single tab by ID
// @param {number} tabId - Tab ID to discard
// @param {object} options - { settings, force }
//   - settings: Pre-fetched settings to avoid refetching in batch
//   - force: Bypass protection checks (for user-initiated unloads)
export async function discardTab(tabId, options = {}) {
  const { settings: providedSettings = null, force = false } = options;

  try {
    const tab = await chrome.tabs.get(tabId);

    // Can't discard active tab or already discarded
    if (tab.active || tab.discarded) return false;

    const settings = providedSettings ?? (await getSettings());

    // Skip protection checks if force unload
    if (!force) {
      if (tab.pinned && !settings.unloadPinnedTabs) return false;

      // Check whitelist
      const whitelisted = isWhitelisted(tab.url, settings);
      console.log(
        `[TabRest] Checking tab ${tabId}: ${tab.url}, whitelist: [${settings.whitelist?.join(", ")}], isWhitelisted: ${whitelisted}`,
      );
      if (whitelisted) return false;

      // Check audio/form protection
      const protection = await shouldProtectTab(tab, settings);
      if (protection.protected) {
        return false;
      }
    }

    // Save YouTube timestamp before discarding
    if (settings.saveYouTubeTimestamp && tab.url?.includes("youtube.com/watch")) {
      try {
        await chrome.tabs.sendMessage(tabId, { action: "saveYouTubeTimestamp" });
      } catch {
        // Content script not loaded, proceed without saving
      }
    }

    // Save scroll position before discarding
    if (settings.restoreScrollPosition) {
      try {
        await chrome.tabs.sendMessage(tabId, { action: "saveScrollPosition", tabId });
      } catch {
        // Content script not loaded, proceed without saving
      }
    }

    if (settings.showDiscardedPrefix && settings.discardedPrefix) {
      await addTitlePrefix(tabId, settings.discardedPrefix);
    }

    await chrome.tabs.discard(tabId);

    // Record stats if enabled
    if (settings.enableStats) {
      await recordUnload(1);
    }

    return true;
  } catch (error) {
    // Tab closed between query and discard - expected during batch operations
    if (!error.message?.includes("No tab with id")) {
      console.error(`Failed to discard tab ${tabId}:`, error);
    }
    return false;
  }
}

// Discard the current active tab (switches to adjacent tab first)
export async function discardCurrentTab() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return false;

  // Switch to adjacent tab first
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const currentIndex = tabs.findIndex((t) => t.id === activeTab.id);
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
  const currentIndex = tabs.findIndex((t) => t.id === activeTab.id);
  const tabsToRight = tabs.slice(currentIndex + 1);

  const settings = await getSettings();
  let count = 0;
  for (const tab of tabsToRight) {
    if (await discardTab(tab.id, { settings })) count++;
  }
  return count;
}

// Discard all tabs to the left of current tab
export async function discardTabsToLeft() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return 0;

  const tabs = await chrome.tabs.query({ currentWindow: true });
  const currentIndex = tabs.findIndex((t) => t.id === activeTab.id);
  const tabsToLeft = tabs.slice(0, currentIndex);

  const settings = await getSettings();
  let count = 0;
  for (const tab of tabsToLeft) {
    if (await discardTab(tab.id, { settings })) count++;
  }
  return count;
}

// Discard all tabs except current
export async function discardOtherTabs() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return 0;

  const tabs = await chrome.tabs.query({ currentWindow: true });
  const settings = await getSettings();
  let count = 0;
  for (const tab of tabs) {
    if (tab.id !== activeTab.id && (await discardTab(tab.id, { settings }))) count++;
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
  const numericGroupId = Number(groupId);
  if (!Number.isInteger(numericGroupId) || numericGroupId < 0) {
    return 0;
  }

  const tabs = await chrome.tabs.query({ groupId: numericGroupId });
  const eligibleTabIds = tabs.filter((tab) => !tab.active && !tab.discarded).map((tab) => tab.id);

  const settings = await getSettings();
  let count = 0;
  for (const tabId of eligibleTabIds) {
    if (await discardTab(tabId, { settings })) count++;
  }
  return count;
}

// Check if hostname matches a domain list (exported for reuse)
export function matchesDomainList(url, domainList) {
  if (!url || !domainList?.length) return false;
  try {
    const hostname = new URL(url).hostname;
    return domainList.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

// Check if URL is in whitelist (sync - settings passed in)
function isWhitelisted(url, settings) {
  return matchesDomainList(url, settings?.whitelist);
}

// Check if URL is in blacklist (sync - settings passed in)
function isBlacklisted(url, settings) {
  return matchesDomainList(url, settings?.blacklist);
}

async function addTitlePrefix(tabId, prefix) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (p) => {
        if (!document.title.startsWith(p)) {
          document.title = `${p} ${document.title}`;
        }
      },
      args: [prefix],
    });
  } catch {
    // Tab may not support script injection (chrome://, about:, etc.)
  }
}

// Export for external use
export { isBlacklisted as isUrlBlacklisted, isWhitelisted as isUrlWhitelisted };
