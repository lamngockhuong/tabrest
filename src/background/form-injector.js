import { hasHostPermission } from "../shared/permissions.js";

const injectedTabs = new Set();

export async function ensureFormCheckerInjected(tabId, tabUrl) {
  if (injectedTabs.has(tabId)) return true;
  if (!tabUrl?.startsWith("http")) return false;
  if (!(await hasHostPermission())) return false;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/content/form-checker.js"],
    });
    injectedTabs.add(tabId);
    return true;
  } catch {
    return false;
  }
}

export function clearInjectedTab(tabId) {
  injectedTabs.delete(tabId);
}
