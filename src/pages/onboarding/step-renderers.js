import {
  POWER_MODE_DESC_KEY,
  POWER_MODE_NAME_KEY,
  WHITELIST_SUGGESTIONS,
} from "../../shared/constants.js";
import { getMemorySaverDocsUrl, t } from "../../shared/i18n.js";
import { clearChildren, createEl } from "./dom-helpers.js";

const POWER_MODES = Object.keys(POWER_MODE_NAME_KEY);
const AUTO_UNLOAD_OPTIONS = [30, 60, 120];

export function renderWelcome() {
  return () => undefined;
}

export function renderAutoUnload(bodyEl, settings) {
  clearChildren(bodyEl);
  const current = AUTO_UNLOAD_OPTIONS.includes(settings.unloadDelayMinutes)
    ? settings.unloadDelayMinutes
    : 30;
  const grid = createEl("div", { class: "ob-radio-grid" });
  for (const minutes of AUTO_UNLOAD_OPTIONS) {
    const id = `ob-auto-${minutes}`;
    const labelKey = `obAutoUnloadOpt${minutes}`;
    const input = createEl("input", {
      type: "radio",
      name: "ob-auto-unload",
      value: String(minutes),
      id,
      checked: minutes === current,
    });
    grid.appendChild(
      createEl(
        "label",
        { class: "ob-radio-card", for: id },
        input,
        createEl("span", { class: "ob-radio-label" }, t(labelKey)),
      ),
    );
  }
  bodyEl.appendChild(grid);
  return () => {
    const checked = bodyEl.querySelector('input[name="ob-auto-unload"]:checked');
    return checked ? Number(checked.value) : current;
  };
}

export function renderWhitelist(bodyEl, settings) {
  clearChildren(bodyEl);
  const existing = new Set((settings.whitelist || []).map((s) => String(s).toLowerCase()));
  const grid = createEl("div", { class: "ob-checkbox-grid" });
  for (const domain of WHITELIST_SUGGESTIONS) {
    const id = `ob-wl-${domain}`;
    const input = createEl("input", {
      type: "checkbox",
      value: domain,
      id,
      checked: existing.has(domain),
    });
    grid.appendChild(
      createEl(
        "label",
        { class: "ob-checkbox-card", for: id },
        input,
        createEl("span", { class: "ob-checkbox-label" }, domain),
      ),
    );
  }
  bodyEl.appendChild(grid);
  bodyEl.appendChild(
    createEl(
      "p",
      { class: "ob-info-note" },
      `${t("memorySaverNoteBody")} `,
      createEl(
        "a",
        {
          href: getMemorySaverDocsUrl(),
          target: "_blank",
          rel: "noopener noreferrer",
        },
        t("learnMoreLink"),
      ),
    ),
  );
  return () =>
    Array.from(bodyEl.querySelectorAll("input[type=checkbox]:checked")).map((b) => b.value);
}

export function renderPowerMode(bodyEl, settings) {
  clearChildren(bodyEl);
  const current = POWER_MODES.includes(settings.powerMode) ? settings.powerMode : "normal";
  const grid = createEl("div", { class: "ob-radio-grid" });
  for (const mode of POWER_MODES) {
    const id = `ob-pm-${mode}`;
    const input = createEl("input", {
      type: "radio",
      name: "ob-power-mode",
      value: mode,
      id,
      checked: mode === current,
    });
    grid.appendChild(
      createEl(
        "label",
        { class: "ob-radio-card ob-radio-card-stacked", for: id },
        input,
        createEl("span", { class: "ob-radio-title" }, t(POWER_MODE_NAME_KEY[mode])),
        createEl("span", { class: "ob-radio-desc" }, t(POWER_MODE_DESC_KEY[mode])),
      ),
    );
  }
  bodyEl.appendChild(grid);
  return () => {
    const checked = bodyEl.querySelector('input[name="ob-power-mode"]:checked');
    return checked ? checked.value : current;
  };
}

export function renderNotifications(bodyEl, settings) {
  clearChildren(bodyEl);
  const id = "ob-notif-toggle";
  const input = createEl("input", {
    type: "checkbox",
    id,
    checked: !!settings.notifyOnAutoUnload,
  });
  bodyEl.appendChild(
    createEl(
      "label",
      { class: "ob-toggle-row", for: id },
      input,
      createEl("span", { class: "ob-toggle-label" }, t("obNotificationsToggle")),
    ),
  );
  return () => bodyEl.querySelector(`#${id}`).checked;
}
