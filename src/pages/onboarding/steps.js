import {
  persistAutoUnload,
  persistNotifications,
  persistPowerMode,
  persistWhitelist,
} from "./persist.js";
import { renderDone } from "./render-done.js";
import {
  renderAutoUnload,
  renderNotifications,
  renderPowerMode,
  renderWelcome,
  renderWhitelist,
} from "./step-renderers.js";

const noop = () => undefined;

export const STEPS = [
  { id: "welcome", titleKey: "obWelcomeTitle", render: renderWelcome, persist: noop },
  {
    id: "auto-unload",
    titleKey: "obAutoUnloadTitle",
    render: renderAutoUnload,
    persist: persistAutoUnload,
  },
  {
    id: "whitelist",
    titleKey: "obWhitelistTitle",
    render: renderWhitelist,
    persist: persistWhitelist,
  },
  {
    id: "power-mode",
    titleKey: "obPowerModeTitle",
    render: renderPowerMode,
    persist: persistPowerMode,
  },
  {
    id: "notifications",
    titleKey: "obNotificationsTitle",
    render: renderNotifications,
    persist: persistNotifications,
  },
  { id: "done", titleKey: "obDoneTitle", render: renderDone, persist: noop },
];
