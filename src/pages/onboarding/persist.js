import { POWER_MODE_NAME_KEY } from "../../shared/constants.js";
import { getSettings, saveSettings } from "../../shared/storage.js";

const ALLOWED_POWER_MODES = new Set(Object.keys(POWER_MODE_NAME_KEY));

export async function persistAutoUnload(value) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) return;
  const current = await getSettings();
  await saveSettings({ ...current, unloadDelayMinutes: minutes });
}

export async function persistWhitelist(domains) {
  if (!Array.isArray(domains)) return;
  const cleaned = [...new Set(domains.map((d) => String(d).trim().toLowerCase()).filter(Boolean))];
  const current = await getSettings();
  await saveSettings({ ...current, whitelist: cleaned });
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
