import { FORM_CHECK_TIMEOUT_MS, STARTUP_DISCARD_DELAY_MS } from "../shared/constants.js";
import { getSettings } from "../shared/storage.js";
import { queryCurrentWindowTabs, unwrapHostname } from "../shared/utils.js";
import { ensureFormCheckerInjected } from "./form-injector.js";
import { recordUnload } from "./stats-collector.js";

// Pinned + whitelist gates only. Returns null if cleared, else { protected, reason }.
function passesStaticGates(tab, settings) {
  if (tab.pinned && !settings.unloadPinnedTabs) return { protected: true, reason: "pinned" };
  if (isWhitelisted(tab.url, settings)) return { protected: true, reason: "whitelist" };
  return null;
}

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
      if (!(await ensureFormCheckerInjected(tab.id, tab.url))) {
        return { protected: false };
      }
      const response = await Promise.race([
        chrome.tabs.sendMessage(tab.id, { action: "checkFormData" }),
        new Promise((resolve) => setTimeout(() => resolve(null), FORM_CHECK_TIMEOUT_MS)),
      ]);
      if (response?.hasFormData) {
        return { protected: true, reason: "form" };
      }
    } catch {
      // Content script not loaded or restricted page; proceed with unload.
    }
  }

  return { protected: false };
}

// Discard a single tab by ID
// @param {number} tabId - Tab ID to discard
// @param {object} options - { settings, force, auto }
//   - settings: Pre-fetched settings to avoid refetching in batch
//   - force: Bypass protection checks (for user-initiated unloads)
//   - auto: From alarm/memory-monitor - eligible for warning toast + recheck window
export async function discardTab(tabId, options = {}) {
  const { settings: providedSettings = null, force = false, auto = false } = options;

  try {
    const tab = await chrome.tabs.get(tabId);

    // Can't discard active tab or already discarded
    if (tab.active || tab.discarded) return false;

    const settings = providedSettings ?? (await getSettings());

    // Skip protection checks if force unload
    if (!force) {
      if (passesStaticGates(tab, settings)) return false;
      const protection = await shouldProtectTab(tab, settings);
      if (protection.protected) return false;
    }

    // Auto paths: show warning toast and re-check before committing.
    let currentTab = tab;
    if (auto && !force && settings.showSuspendWarning && currentTab.url?.startsWith("http")) {
      if (currentTab.status === "loading") return false;
      const message =
        chrome.i18n.getMessage("suspendWarningMessage") ||
        "TabRest will suspend this tab to free memory…";
      await injectSuspendWarning(tabId, settings.suspendWarningDelayMs, message);
      await new Promise((r) => setTimeout(r, settings.suspendWarningDelayMs));

      const refreshed = await chrome.tabs.get(tabId).catch(() => null);
      if (!refreshed || refreshed.active || refreshed.discarded) return false;
      if (refreshed.status === "loading") return false;
      if (passesStaticGates(refreshed, settings)) return false;
      const recheck = await shouldProtectTab(refreshed, settings);
      if (recheck.protected) return false;
      currentTab = refreshed;
    }

    // Save YouTube timestamp before discarding
    if (settings.saveYouTubeTimestamp && currentTab.url?.includes("youtube.com/watch")) {
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
  const tabs = await queryCurrentWindowTabs();
  const activeTab = tabs.find((t) => t.active);
  if (!activeTab) return false;

  // Switch to adjacent tab first
  const currentIndex = tabs.indexOf(activeTab);
  const nextTab = tabs[currentIndex + 1] || tabs[currentIndex - 1];

  if (nextTab) {
    await chrome.tabs.update(nextTab.id, { active: true });
    return await discardTab(activeTab.id);
  }
  return false;
}

// Discard all tabs to the right of current tab
export async function discardTabsToRight() {
  const tabs = await queryCurrentWindowTabs();
  const activeTab = tabs.find((t) => t.active);
  if (!activeTab) return 0;

  const currentIndex = tabs.indexOf(activeTab);
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
  const tabs = await queryCurrentWindowTabs();
  const activeTab = tabs.find((t) => t.active);
  if (!activeTab) return 0;

  const currentIndex = tabs.indexOf(activeTab);
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
  const tabs = await queryCurrentWindowTabs();
  const activeTab = tabs.find((t) => t.active);
  if (!activeTab) return 0;
  const settings = await getSettings();
  let count = 0;
  for (const tab of tabs) {
    if (tab.id !== activeTab.id && (await discardTab(tab.id, { settings }))) count++;
  }
  return count;
}

// Force-discard all tabs across every window on browser startup.
export async function discardAllTabsOnStartup() {
  const settings = await getSettings();
  if (!settings.autoUnloadOnStartup) return 0;

  await new Promise((resolve) => setTimeout(resolve, STARTUP_DISCARD_DELAY_MS));

  const tabs = await chrome.tabs.query({});
  let count = 0;
  for (const tab of tabs) {
    if (!tab.active && !tab.discarded && (await discardTab(tab.id, { settings, force: true })))
      count++;
  }
  return count;
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

// Normalize URL for duplicate detection: lowercase host, strip trailing slash + fragment, keep query
function normalizeUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    const path = u.pathname.replace(/\/$/, "") || "/";
    return `${u.protocol}//${u.hostname.toLowerCase()}${path}${u.search}`;
  } catch {
    return null;
  }
}

// Pick best tab to keep from a duplicate group: pinned > active > lowest index
function pickKeeper(group) {
  const pinned = group.find((t) => t.pinned);
  if (pinned) return pinned;
  const active = group.find((t) => t.active);
  if (active) return active;
  return group.reduce((a, b) => (a.index <= b.index ? a : b));
}

export async function closeDuplicateTabs() {
  const tabs = await queryCurrentWindowTabs();
  const groups = new Map();

  for (const tab of tabs) {
    const key = normalizeUrl(tab.url);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(tab);
  }

  const idsToClose = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const keeper = pickKeeper(group);
    for (const tab of group) {
      if (tab.id === keeper.id || tab.pinned) continue;
      idsToClose.push(tab.id);
    }
  }

  if (idsToClose.length === 0) return { closed: 0 };

  // chrome.tabs.remove(array) is all-or-nothing; on rejection no tabs are closed
  try {
    await chrome.tabs.remove(idsToClose);
    return { closed: idsToClose.length };
  } catch (error) {
    if (!error.message?.includes("No tab with id")) {
      console.error("Failed to close duplicate tabs:", error);
    }
    return { closed: 0 };
  }
}

// Check if hostname matches a domain list (exported for reuse)
export function matchesDomainList(url, domainList) {
  if (!url || !domainList?.length) return false;
  try {
    const hostname = unwrapHostname(new URL(url).hostname);
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

// Inject self-contained warning toast on the page. Uses Shadow DOM + all:initial
// to avoid CSS collisions. Silent on restricted URLs / missing permission.
async function injectSuspendWarning(tabId, delayMs, message) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (d, m) => {
        if (window.__tabrestSuspendWarningShown) return;
        window.__tabrestSuspendWarningShown = true;
        const host = document.createElement("div");
        host.id = "__tabrest_warning_toast";
        host.style.cssText = "position:fixed;top:16px;right:16px;z-index:2147483647;all:initial;";
        const root = host.attachShadow({ mode: "closed" });
        const style = document.createElement("style");
        style.textContent =
          ".toast{font:14px system-ui,-apple-system,Segoe UI,sans-serif;background:#1f2937;color:#fff;padding:12px 16px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.3);max-width:320px;line-height:1.4}";
        const div = document.createElement("div");
        div.className = "toast";
        div.textContent = m;
        root.append(style, div);
        document.documentElement.appendChild(host);
        setTimeout(() => {
          host.remove();
          delete window.__tabrestSuspendWarningShown;
        }, d);
      },
      args: [delayMs, message],
    });
  } catch {
    // Restricted page or no host permission - skip warning silently.
  }
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
