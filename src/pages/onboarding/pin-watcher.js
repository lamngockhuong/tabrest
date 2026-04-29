// Detects when the user pins the extension during the Done step.
// Chrome's chrome.action.getUserSettings() returns { isOnToolbar: boolean }.
// We poll because there is no event for "user toggled pin in the puzzle menu".

const POLL_INTERVAL_MS = 1000;

export async function getPinStatus() {
  if (!chrome.action?.getUserSettings) return null;
  try {
    const settings = await chrome.action.getUserSettings();
    return !!settings?.isOnToolbar;
  } catch {
    return null;
  }
}

export function watchUntilPinned(onPinned, intervalMs = POLL_INTERVAL_MS) {
  let stopped = false;
  let timer = null;

  async function tick() {
    if (stopped) return;
    const pinned = await getPinStatus();
    if (stopped) return;
    if (pinned) {
      stopped = true;
      onPinned();
      return;
    }
    timer = setTimeout(tick, intervalMs);
  }

  tick();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
