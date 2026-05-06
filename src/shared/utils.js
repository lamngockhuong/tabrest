export function getBrowserInfo() {
  const ua = navigator.userAgent;

  // Extract version from user agent
  const getVersion = (pattern) => {
    const match = ua.match(pattern);
    return match ? match[1] : null;
  };

  if (ua.includes("Edg/")) {
    return {
      name: "Edge",
      version: getVersion(/Edg\/(\d+[\d.]*)/),
      shortcutsUrl: "edge://extensions/shortcuts",
    };
  }
  if (ua.includes("OPR/") || ua.includes("Opera")) {
    return {
      name: "Opera",
      version: getVersion(/OPR\/(\d+[\d.]*)/),
      shortcutsUrl: "opera://extensions/shortcuts",
    };
  }
  if (ua.includes("Brave")) {
    return {
      name: "Brave",
      version: getVersion(/Chrome\/(\d+[\d.]*)/),
      shortcutsUrl: "brave://extensions/shortcuts",
    };
  }
  if (ua.includes("Vivaldi")) {
    return {
      name: "Vivaldi",
      version: getVersion(/Vivaldi\/(\d+[\d.]*)/),
      shortcutsUrl: "vivaldi://extensions/shortcuts",
    };
  }
  if (ua.includes("Arc")) {
    return {
      name: "Arc",
      version: getVersion(/Chrome\/(\d+[\d.]*)/),
      shortcutsUrl: "chrome://extensions/shortcuts",
    };
  }

  return {
    name: "Chrome",
    version: getVersion(/Chrome\/(\d+[\d.]*)/),
    shortcutsUrl: "chrome://extensions/shortcuts",
  };
}

const RE_IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)$/;
const RE_IPV6_GROUP = /^[0-9a-f]{1,4}$/i;
const RE_DOMAIN = /^[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,}$/i;

function isIPv6(v) {
  if (!/^[0-9a-f:]+$/i.test(v)) return false;
  if (v.includes(":::")) return false;
  const compressedCount = v.split("::").length - 1;
  if (compressedCount > 1) return false;

  if (compressedCount === 0) {
    const parts = v.split(":");
    return parts.length === 8 && parts.every((p) => RE_IPV6_GROUP.test(p));
  }

  const groups = v.split(":").filter((p) => p !== "");
  if (groups.length > 7) return false;
  return groups.every((p) => RE_IPV6_GROUP.test(p));
}

// URL.hostname returns IPv6 wrapped in brackets ([::1]); strip for plain comparison/storage
export function unwrapHostname(host) {
  return host?.replace(/^\[|\]$/g, "") ?? "";
}

// Validate whitelist/blacklist entry: domain, IPv4, IPv6, or 'localhost'
export function isValidDomainOrIp(input) {
  if (!input || typeof input !== "string") return false;
  const v = input.trim().toLowerCase();
  if (!v) return false;
  if (v === "localhost") return true;
  if (RE_IPV4.test(v)) return true;
  if (isIPv6(v)) return true;
  if (RE_DOMAIN.test(v)) return true;
  return false;
}

export function parseSemver(version) {
  if (!version || typeof version !== "string") return null;
  const m = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

// True if curr bumps major or minor compared to prev. Patch-only or downgrade returns false.
export function isMinorOrMajorBump(prev, curr) {
  const a = parseSemver(prev);
  const b = parseSemver(curr);
  if (!a || !b) return false;
  if (b.major > a.major) return true;
  if (b.major === a.major && b.minor > a.minor) return true;
  return false;
}

// True only for http(s) URLs. Used to gate any code path that loads or
// restores a URL from untrusted input (saved sessions, imports, favicons).
export function isSafeHttpUrl(url) {
  if (typeof url !== "string" || !url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

// Service worker has no "current window" when all windows are minimized/unfocused.
export async function queryCurrentWindowTabs(extraQuery = {}) {
  try {
    return await chrome.tabs.query({ currentWindow: true, ...extraQuery });
  } catch {
    return [];
  }
}

// Format bytes to human readable string
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

// Show notification for auto-unloaded tab
export function notifyAutoUnload(tabTitle, reason, detail) {
  const title = reason === "timer" ? "💤 Tab unloaded (Timer)" : "💤 Tab unloaded (RAM)";
  const shortTitle = tabTitle?.slice(0, 40) || "Tab";
  const message = `${shortTitle}${tabTitle?.length > 40 ? "..." : ""} - ${detail}`;

  chrome.notifications.create(`tabrest-${Date.now()}`, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon-48.png"),
    title,
    message,
    silent: true,
  });
}
