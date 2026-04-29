import { POWER_MODE_NAME_KEY, WHITELIST_SUGGESTIONS } from "../../shared/constants.js";
import { t } from "../../shared/i18n.js";
import { icon } from "../../shared/icons.js";
import { fireConfetti } from "./confetti.js";
import { clearChildren, createEl } from "./dom-helpers.js";
import { getPinStatus, watchUntilPinned } from "./pin-watcher.js";

const SUMMARY_ROWS = [
  ["clock", "obDoneSummaryDelay"],
  ["shield", "obDoneSummaryWhitelist"],
  ["zap", "obDoneSummaryPowerMode"],
  ["volume", "obDoneSummaryNotifs"],
];

const SHORTCUT_MARKER = "{{KBD}}";
const SHORTCUT_KEYS = "Alt+Shift+D";

function delayText(minutes) {
  return minutes >= 60 && minutes % 60 === 0
    ? t("obHours", [String(minutes / 60)])
    : t("obMinutes", [String(minutes)]);
}

function openSettings() {
  if (chrome.runtime?.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/options/options.html") });
  }
}

function iconEl(name, size = 16) {
  const span = createEl("span", { class: "ob-summary-icon" });
  span.innerHTML = icon(name, size);
  return span;
}

let stopWatching = null;

function buildPinCard(pinned) {
  const card = createEl("div", { class: `ob-pin-card${pinned ? " is-pinned" : ""}` });
  const iconWrap = createEl("span", { class: "feature-icon ob-pin-icon" });
  iconWrap.innerHTML = icon(pinned ? "check" : "pin", 20);
  const text = createEl("div", { class: "ob-pin-text" });
  text.appendChild(createEl("strong", {}, t(pinned ? "obPinnedTitle" : "obPinTitle")));
  text.appendChild(createEl("p", {}, t(pinned ? "obPinnedDesc" : "obPinDesc")));
  card.appendChild(iconWrap);
  card.appendChild(text);
  return card;
}

export function renderDone(bodyEl, settings) {
  clearChildren(bodyEl);
  if (stopWatching) {
    stopWatching();
    stopWatching = null;
  }

  const minutes = Number(settings.unloadDelayMinutes) || 30;
  const knownPicks = (settings.whitelist || []).filter((d) => WHITELIST_SUGGESTIONS.includes(d));
  const pmKey = POWER_MODE_NAME_KEY[settings.powerMode] ?? POWER_MODE_NAME_KEY.normal;

  const values = {
    obDoneSummaryDelay: delayText(minutes),
    obDoneSummaryWhitelist: t("obDoneSummaryWhitelistN", [String(knownPicks.length)]),
    obDoneSummaryPowerMode: t(pmKey),
    obDoneSummaryNotifs: t(settings.notifyOnAutoUnload ? "obOnState" : "obOffState"),
  };

  const pinHost = createEl("div", { class: "ob-pin-host" });
  pinHost.appendChild(buildPinCard(false));
  bodyEl.appendChild(pinHost);

  getPinStatus().then((initiallyPinned) => {
    if (!pinHost.isConnected) return;
    if (initiallyPinned === true) {
      pinHost.replaceChildren(buildPinCard(true));
      return;
    }
    if (initiallyPinned === null) return;
    stopWatching = watchUntilPinned(() => {
      if (!pinHost.isConnected) return;
      const pinnedCard = buildPinCard(true);
      pinnedCard.classList.add("just-pinned");
      pinHost.replaceChildren(pinnedCard);
      fireConfetti();
    });
  });

  const list = createEl("dl", { class: "ob-summary" });
  for (const [iconName, labelKey] of SUMMARY_ROWS) {
    list.appendChild(
      createEl(
        "div",
        { class: "ob-summary-row" },
        iconEl(iconName),
        createEl("dt", {}, t(labelKey)),
        createEl("dd", {}, values[labelKey]),
      ),
    );
  }
  bodyEl.appendChild(list);

  const link = createEl("button", { type: "button", class: "btn-outline ob-open-settings" });
  link.appendChild(iconEl("sliders", 14));
  link.appendChild(createEl("span", {}, t("obDoneOpenSettings")));
  link.addEventListener("click", openSettings);
  bodyEl.appendChild(createEl("div", { class: "ob-done-actions" }, link));

  const tip = createEl("p", { class: "ob-shortcut-hint" });
  const [before, after = ""] = t("obDoneShortcutsHint", [SHORTCUT_MARKER]).split(SHORTCUT_MARKER);
  tip.appendChild(document.createTextNode(before));
  tip.appendChild(createEl("kbd", {}, SHORTCUT_KEYS));
  tip.appendChild(document.createTextNode(after));
  bodyEl.appendChild(tip);

  return () => undefined;
}
