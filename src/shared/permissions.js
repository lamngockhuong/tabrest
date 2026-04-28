// Helpers for the optional host permission ("http://*/*", "https://*/*").
// Used by form protection and the discarded-tab title prefix.

const HOST_ORIGINS = ["http://*/*", "https://*/*"];

// Settings flags that require the optional host permission to function.
// Toggles share the grant; the permission is revoked only when all are off.
export const HOST_PERM_DEPENDENT_FLAGS = ["protectFormTabs", "showDiscardedPrefix"];

// Cache the permission state per session: `chrome.permissions.contains` is an
// async IPC fired once per discard candidate / popup form check / per-tab heap
// bootstrap. The runtime listeners below invalidate the cache when the user
// grants or revokes the permission.
let cachedHasPermission = null;

if (chrome?.permissions?.onAdded) {
  chrome.permissions.onAdded.addListener(() => {
    cachedHasPermission = null;
  });
}
if (chrome?.permissions?.onRemoved) {
  chrome.permissions.onRemoved.addListener(() => {
    cachedHasPermission = null;
  });
}

export async function hasHostPermission() {
  if (cachedHasPermission !== null) return cachedHasPermission;
  cachedHasPermission = await chrome.permissions.contains({ origins: HOST_ORIGINS });
  return cachedHasPermission;
}

export async function requestHostPermission() {
  const granted = await chrome.permissions.request({ origins: HOST_ORIGINS });
  cachedHasPermission = granted;
  return granted;
}

export async function removeHostPermission() {
  const removed = await chrome.permissions.remove({ origins: HOST_ORIGINS });
  if (removed) cachedHasPermission = false;
  return removed;
}
