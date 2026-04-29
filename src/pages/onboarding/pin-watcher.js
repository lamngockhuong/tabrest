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

export function watchUntilPinned(onPinned) {
  let stopped = false;
  let timer = null;

  async function tick() {
    if (stopped) return;
    const pinned = await getPinStatus();
    if (pinned) {
      stopped = true;
      onPinned();
      return;
    }
    timer = setTimeout(tick, POLL_INTERVAL_MS);
  }

  tick();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

const CONFETTI_EMOJIS = ["🎉", "🎊", "✨", "🥳", "⭐", "💫", "🪄", "🍾"];
const CONFETTI_COUNT = 36;
const CONFETTI_MAX_DURATION_MS = 2000;
const CONFETTI_MAX_DELAY_MS = 200;
const CONFETTI_LIFE_MS = CONFETTI_MAX_DURATION_MS + CONFETTI_MAX_DELAY_MS + 100;

export function fireConfetti(host = document.body) {
  const layer = document.createElement("div");
  layer.className = "ob-confetti-layer";

  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const piece = document.createElement("span");
    piece.className = "ob-confetti";
    piece.textContent = CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length];
    const angle = Math.random() * Math.PI * 2;
    const distance = 180 + Math.random() * 280;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 80;
    const rot = (Math.random() * 720 - 360).toFixed(0);
    const duration = 1200 + Math.random() * 800;
    const delay = Math.random() * CONFETTI_MAX_DELAY_MS;
    const size = 18 + Math.random() * 14;
    piece.style.setProperty("--dx", `${dx.toFixed(0)}px`);
    piece.style.setProperty("--dy", `${dy.toFixed(0)}px`);
    piece.style.setProperty("--rot", `${rot}deg`);
    piece.style.fontSize = `${size.toFixed(0)}px`;
    piece.style.animationDuration = `${duration}ms`;
    piece.style.animationDelay = `${delay}ms`;
    layer.appendChild(piece);
  }

  host.appendChild(layer);
  setTimeout(() => layer.remove(), CONFETTI_LIFE_MS);
}
