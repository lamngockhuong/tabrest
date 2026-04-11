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
