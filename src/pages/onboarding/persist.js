import { POWER_MODE_NAME_KEY, WHITELIST_SUGGESTIONS } from "../../shared/constants.js";
import { getSettings, saveSettings } from "../../shared/storage.js";

const ALLOWED_POWER_MODES = new Set(Object.keys(POWER_MODE_NAME_KEY));

export async function persistAutoUnload(value) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) return;
  const current = await getSettings();
  await saveSettings({ ...current, unloadDelayMinutes: minutes });
}

// The wizard only controls the suggestion checkboxes, so entries the user added
// elsewhere (e.g. in Options) must survive a re-run of onboarding. Existing
// entries keep their position; newly checked suggestions are appended.
export async function persistWhitelist(domains) {
  if (!Array.isArray(domains)) return;
  const checked = new Set(
    domains
      .map((d) => String(d).trim().toLowerCase())
      .filter((d) => WHITELIST_SUGGESTIONS.includes(d)),
  );
  const current = await getSettings();
  const next = [];
  for (const d of current.whitelist || []) {
    if (next.includes(d)) continue;
    if (!WHITELIST_SUGGESTIONS.includes(String(d).toLowerCase()) || checked.has(d)) next.push(d);
  }
  for (const d of checked) if (!next.includes(d)) next.push(d);
  await saveSettings({ ...current, whitelist: next });
}

export async function persistPowerMode(mode) {
  if (!ALLOWED_POWER_MODES.has(mode)) return;
  const current = await getSettings();
  await saveSettings({ ...current, powerMode: mode });
}

export async function persistNotifications(enabled) {
  const current = await getSettings();
  await saveSettings({ ...current, notifyOnAutoUnload: !!enabled });
}
