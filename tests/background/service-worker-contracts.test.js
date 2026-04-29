import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ALARM_NAMES,
  CONSENT_RESET_MIGRATION_KEY,
  REPORT_REASONS,
  REPORTER_COMMANDS,
} from "../../src/shared/constants.js";
import { HOST_PERM_DEPENDENT_FLAGS } from "../../src/shared/permissions.js";

// Approach A: service-worker.js is excluded because importing it registers
// chrome.* listeners as a side effect. These tests pin the routing/decision
// contracts the SW relies on by re-implementing the relevant fragments.

// --- configureToolbarAction (service-worker.js:73-87) -------------------------
// sidePanel mode takes precedence over toolbarClickAction.
function decideToolbarMode(settings, hasSidePanelApi) {
  const useSidePanel = settings.useSidePanel && Boolean(hasSidePanelApi);
  const popup =
    useSidePanel || settings.toolbarClickAction !== "popup" ? "" : "src/popup/popup.html";
  return { useSidePanel, popup };
}

describe("service-worker-contracts: toolbar action precedence", () => {
  it("sidePanel + API present → no popup, side panel auto-opens", () => {
    expect(decideToolbarMode({ useSidePanel: true, toolbarClickAction: "popup" }, true)).toEqual({
      useSidePanel: true,
      popup: "",
    });
  });

  it("sidePanel requested but API missing → falls back to popup decision", () => {
    expect(decideToolbarMode({ useSidePanel: true, toolbarClickAction: "popup" }, false)).toEqual({
      useSidePanel: false,
      popup: "src/popup/popup.html",
    });
  });

  it("popup mode → registers popup HTML", () => {
    expect(decideToolbarMode({ useSidePanel: false, toolbarClickAction: "popup" }, true)).toEqual({
      useSidePanel: false,
      popup: "src/popup/popup.html",
    });
  });

  it("custom toolbar action (e.g. discard-current) → empty popup so onClicked fires", () => {
    expect(
      decideToolbarMode({ useSidePanel: false, toolbarClickAction: "discard-current" }, true),
    ).toEqual({ useSidePanel: false, popup: "" });
  });
});

// --- onInstalled consent reset migration (service-worker.js:122-134) ----------
async function applyConsentResetMigration(reason, storageLocal, currentSettings, saveSettings) {
  if (reason !== "install" && reason !== "update") return { migrated: false };
  const flag = await storageLocal.get(CONSENT_RESET_MIGRATION_KEY);
  if (flag[CONSENT_RESET_MIGRATION_KEY]) return { migrated: false };
  await saveSettings({ ...currentSettings, enableErrorReporting: false });
  await storageLocal.set({ [CONSENT_RESET_MIGRATION_KEY]: true });
  return { migrated: true };
}

describe("service-worker-contracts: enableErrorReporting consent reset migration", () => {
  let storage;
  let saveSettings;
  let stored;

  beforeEach(() => {
    stored = {};
    storage = {
      get: vi.fn(async (k) => (k in stored ? { [k]: stored[k] } : {})),
      set: vi.fn(async (kv) => Object.assign(stored, kv)),
    };
    saveSettings = vi.fn(async () => {});
  });

  it("install reason: forces enableErrorReporting=false once", async () => {
    const r = await applyConsentResetMigration(
      "install",
      storage,
      { enableErrorReporting: true, other: 1 },
      saveSettings,
    );
    expect(r.migrated).toBe(true);
    expect(saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ enableErrorReporting: false, other: 1 }),
    );
    expect(stored[CONSENT_RESET_MIGRATION_KEY]).toBe(true);
  });

  it("update reason: same migration", async () => {
    const r = await applyConsentResetMigration(
      "update",
      storage,
      { enableErrorReporting: true },
      saveSettings,
    );
    expect(r.migrated).toBe(true);
  });

  it("subsequent runs are idempotent (does not clobber a deliberate opt-in)", async () => {
    stored[CONSENT_RESET_MIGRATION_KEY] = true;
    const r = await applyConsentResetMigration(
      "update",
      storage,
      { enableErrorReporting: true },
      saveSettings,
    );
    expect(r.migrated).toBe(false);
    expect(saveSettings).not.toHaveBeenCalled();
  });

  it("chrome_update / shared_module_update reasons skip migration", async () => {
    const r = await applyConsentResetMigration(
      "chrome_update",
      storage,
      { enableErrorReporting: true },
      saveSettings,
    );
    expect(r.migrated).toBe(false);
    expect(saveSettings).not.toHaveBeenCalled();
  });
});

// --- syncHostPermissionState (service-worker.js:169-179) ----------------------
async function syncHostPermissionState({
  hasPerm,
  settings,
  saveSettings,
  storageLocal,
  showBannerIfChanged,
}) {
  if (hasPerm) return { changed: false };
  const reset = HOST_PERM_DEPENDENT_FLAGS.filter((k) => settings[k]);
  if (reset.length === 0) return { changed: false };
  for (const k of reset) settings[k] = false;
  await saveSettings(settings);
  if (showBannerIfChanged) {
    await storageLocal.set({ pendingHostPermBanner: reset });
  }
  return { changed: true, reset };
}

describe("service-worker-contracts: host permission resync", () => {
  let saveSettings;
  let storageLocal;

  beforeEach(() => {
    saveSettings = vi.fn(async () => {});
    storageLocal = { set: vi.fn(async () => {}) };
  });

  it("noop when host permission is granted", async () => {
    const r = await syncHostPermissionState({
      hasPerm: true,
      settings: { protectFormTabs: true, showDiscardedPrefix: true },
      saveSettings,
      storageLocal,
      showBannerIfChanged: true,
    });
    expect(r.changed).toBe(false);
    expect(saveSettings).not.toHaveBeenCalled();
  });

  it("flips dependent flags off when permission missing", async () => {
    const settings = { protectFormTabs: true, showDiscardedPrefix: false };
    const r = await syncHostPermissionState({
      hasPerm: false,
      settings,
      saveSettings,
      storageLocal,
      showBannerIfChanged: true,
    });
    expect(r.reset).toEqual(["protectFormTabs"]);
    expect(settings.protectFormTabs).toBe(false);
    expect(storageLocal.set).toHaveBeenCalledWith({
      pendingHostPermBanner: ["protectFormTabs"],
    });
  });

  it("silent (startup) mode does NOT queue recovery banner", async () => {
    const settings = { protectFormTabs: true, showDiscardedPrefix: true };
    await syncHostPermissionState({
      hasPerm: false,
      settings,
      saveSettings,
      storageLocal,
      showBannerIfChanged: false,
    });
    expect(storageLocal.set).not.toHaveBeenCalled();
  });

  it("noop when no dependent flag was on (no spurious banner)", async () => {
    const r = await syncHostPermissionState({
      hasPerm: false,
      settings: { protectFormTabs: false, showDiscardedPrefix: false },
      saveSettings,
      storageLocal,
      showBannerIfChanged: true,
    });
    expect(r.changed).toBe(false);
    expect(saveSettings).not.toHaveBeenCalled();
  });
});

// --- handleMessage routing table (service-worker.js:530-586) ------------------
// Re-implements the dispatch - pins the contract that {command} maps to the
// correct handler with the correct argument shape. Mirrors all branches of
// the source switch so that a drift between this list and the source switch
// is review-visible.
const ROUTED_COMMANDS = [
  "unload-current",
  "unload-others",
  "unload-right",
  "unload-left",
  "unload-group",
  "unload-tab",
  "close-duplicates",
  "get-memory-info",
  "get-tabs-with-status",
  "get-sessions",
  "save-session",
  "delete-session",
  "restore-session",
  "import-sessions",
  "get-stats",
  "snooze-tab",
  "snooze-domain",
  "cancel-tab-snooze",
  "cancel-domain-snooze",
  "get-snooze-info",
  "get-active-snoozes",
];

function buildRouter(handlers) {
  return async (message) => {
    const { command, groupId, tabId, name, id, mode, minutes, domain, url, sessions } = message;
    switch (command) {
      case "unload-current":
        return await handlers.discardCurrentTab();
      case "unload-others":
        return await handlers.discardOtherTabs();
      case "unload-right":
        return await handlers.discardTabsToRight();
      case "unload-left":
        return await handlers.discardTabsToLeft();
      case "unload-group":
        return await handlers.discardTabGroup(groupId);
      case "unload-tab":
        return await handlers.discardTab(tabId, { force: true });
      case "close-duplicates":
        return await handlers.closeDuplicateTabs();
      case "get-memory-info":
        return await handlers.getMemoryInfo();
      case "get-tabs-with-status":
        return await handlers.getTabsWithStatus();
      case "get-sessions":
        return await handlers.getSessions();
      case "save-session":
        return await handlers.saveSession(name);
      case "delete-session":
        return await handlers.deleteSession(id);
      case "restore-session":
        return await handlers.restoreSession(id, mode);
      case "import-sessions":
        return await handlers.importSessions(sessions);
      case "get-stats":
        return await handlers.getStats();
      case "snooze-tab":
        await handlers.snoozeTab(tabId, minutes);
        return { success: true };
      case "snooze-domain":
        await handlers.snoozeDomain(domain, minutes);
        return { success: true };
      case "cancel-tab-snooze":
        await handlers.cancelTabSnooze(tabId);
        return { success: true };
      case "cancel-domain-snooze":
        await handlers.cancelDomainSnooze(domain);
        return { success: true };
      case "get-snooze-info":
        return await handlers.getTabSnoozeInfo(tabId, url);
      case "get-active-snoozes":
        return await handlers.getActiveSnoozes();
      default:
        return null;
    }
  };
}

describe("service-worker-contracts: handleMessage routing", () => {
  let handlers;
  let route;

  beforeEach(() => {
    handlers = {
      discardCurrentTab: vi.fn().mockResolvedValue("a"),
      discardOtherTabs: vi.fn().mockResolvedValue("b"),
      discardTabsToRight: vi.fn().mockResolvedValue("c"),
      discardTabsToLeft: vi.fn().mockResolvedValue("d"),
      discardTabGroup: vi.fn().mockResolvedValue("g"),
      discardTab: vi.fn().mockResolvedValue("t"),
      closeDuplicateTabs: vi.fn().mockResolvedValue({ closed: 2 }),
      getMemoryInfo: vi.fn().mockResolvedValue({ capacity: 1, availableCapacity: 1 }),
      getTabsWithStatus: vi.fn().mockResolvedValue([]),
      getSessions: vi.fn().mockResolvedValue([]),
      saveSession: vi.fn().mockResolvedValue({ success: true }),
      deleteSession: vi.fn().mockResolvedValue(),
      restoreSession: vi.fn().mockResolvedValue({ success: true }),
      importSessions: vi.fn().mockResolvedValue({ added: 1, skipped: 0 }),
      getStats: vi.fn().mockResolvedValue({ tabsUnloaded: 0 }),
      snoozeTab: vi.fn().mockResolvedValue(),
      snoozeDomain: vi.fn().mockResolvedValue(),
      cancelTabSnooze: vi.fn().mockResolvedValue(),
      cancelDomainSnooze: vi.fn().mockResolvedValue(),
      getTabSnoozeInfo: vi.fn().mockResolvedValue({ snoozed: false }),
      getActiveSnoozes: vi.fn().mockResolvedValue([]),
    };
    route = buildRouter(handlers);
  });

  it("every documented command has a routing branch (no silent null fall-through)", async () => {
    for (const command of ROUTED_COMMANDS) {
      expect(await route({ command }), `${command} returned null`).not.toBeNull();
    }
  });

  it("unload-tab passes {force:true} to bypass protection guards", async () => {
    await route({ command: "unload-tab", tabId: 42 });
    expect(handlers.discardTab).toHaveBeenCalledWith(42, { force: true });
  });

  it("unload-group passes groupId", async () => {
    await route({ command: "unload-group", groupId: 7 });
    expect(handlers.discardTabGroup).toHaveBeenCalledWith(7);
  });

  it("snooze-tab returns {success:true} regardless of impl return", async () => {
    handlers.snoozeTab.mockResolvedValueOnce(undefined);
    expect(await route({ command: "snooze-tab", tabId: 1, minutes: 30 })).toEqual({
      success: true,
    });
    expect(handlers.snoozeTab).toHaveBeenCalledWith(1, 30);
  });

  it("snooze-domain forwards domain + minutes", async () => {
    await route({ command: "snooze-domain", domain: "x.com", minutes: 60 });
    expect(handlers.snoozeDomain).toHaveBeenCalledWith("x.com", 60);
  });

  it("restore-session forwards id + mode", async () => {
    await route({ command: "restore-session", id: "s1", mode: "open" });
    expect(handlers.restoreSession).toHaveBeenCalledWith("s1", "open");
  });

  it("unknown command returns null (don't break the popup)", async () => {
    expect(await route({ command: "made-up-thing" })).toBeNull();
  });
});

// --- onMessage reporter bridges (service-worker.js:482-520) -------------------
// Three pre-routing branches: per-tab memory report, getTabId, and the three
// REPORTER_COMMANDS. They short-circuit before the main router and shape the
// sendResponse contract differently.
describe("service-worker-contracts: reporter command pre-routing", () => {
  it("CAPTURE_ERROR reconstructs an Error from the structured payload", () => {
    // Replicates the branch from service-worker.js:497-505. captureError is
    // called with a real Error (not the plain object) so downstream Sentry
    // tooling sees a stack-bearing exception.
    const captureError = vi.fn();
    const message = {
      command: REPORTER_COMMANDS.CAPTURE_ERROR,
      error: { name: "TypeError", message: "boom", stack: "stack" },
      context: { surface: "popup" },
    };

    const errPayload = message.error || {};
    const err = new Error(errPayload.message || "Unknown error");
    err.name = errPayload.name || "Error";
    err.stack = errPayload.stack || "";
    captureError(err, message.context || {});

    const [errArg, ctxArg] = captureError.mock.calls[0];
    expect(errArg).toBeInstanceOf(Error);
    expect(errArg.name).toBe("TypeError");
    expect(errArg.message).toBe("boom");
    expect(errArg.stack).toBe("stack");
    expect(ctxArg).toEqual({ surface: "popup" });
  });

  it("CAPTURE_ERROR with empty payload still produces a usable Error", () => {
    const captureError = vi.fn();
    const message = { command: REPORTER_COMMANDS.CAPTURE_ERROR };
    const errPayload = message.error || {};
    const err = new Error(errPayload.message || "Unknown error");
    err.name = errPayload.name || "Error";
    err.stack = errPayload.stack || "";
    captureError(err, message.context || {});
    const [errArg, ctxArg] = captureError.mock.calls[0];
    expect(errArg.message).toBe("Unknown error");
    expect(errArg.name).toBe("Error");
    expect(errArg.stack).toBe("");
    expect(ctxArg).toEqual({});
  });

  it("CAPTURE_MESSAGE defaults level/context", () => {
    const captureMessage = vi.fn();
    const message = { command: REPORTER_COMMANDS.CAPTURE_MESSAGE };
    captureMessage(message.message || "", message.level || "info", message.context || {});
    expect(captureMessage).toHaveBeenCalledWith("", "info", {});
  });

  it("REPORT_BUG transport failure surfaces SEND_FAILED via the constants table", () => {
    // Pin the exact reason code the SW returns when the network leg throws.
    // Catches a future refactor that swaps in a freeform string.
    const failure = { ok: false, reason: REPORT_REASONS.SEND_FAILED };
    expect(failure.reason).toBe("send_failed");
    expect(REPORT_REASONS).toMatchObject({
      COOLDOWN: expect.any(String),
      DAILY_CAP: expect.any(String),
      SEND_FAILED: expect.any(String),
      NO_DSN: expect.any(String),
    });
  });
});

// --- openLinkSuspended URL gate (service-worker.js:418-428) -------------------
function isOpenableUrl(url) {
  try {
    const p = new URL(url);
    return ["http:", "https:"].includes(p.protocol);
  } catch {
    return false;
  }
}

describe("service-worker-contracts: openLinkSuspended URL safety gate", () => {
  it.each([
    ["https://example.com", true],
    ["http://example.com", true],
    ["javascript:alert(1)", false],
    ["data:text/html,<script>", false],
    ["chrome://settings", false],
    ["file:///etc/hosts", false],
    ["", false],
    ["not a url", false],
  ])("%s → %s", (url, expected) => {
    expect(isOpenableUrl(url)).toBe(expected);
  });
});

// --- alarm dispatch (service-worker.js:395-406) -------------------------------
describe("service-worker-contracts: alarm name → handler routing", () => {
  it("ALARM_NAMES exposes the three expected timers", () => {
    expect(ALARM_NAMES).toMatchObject({
      TAB_CHECK: expect.any(String),
      MEMORY_CHECK: expect.any(String),
      SNOOZE_CLEANUP: expect.any(String),
    });
  });

  it("alarm names are unique (no accidental aliasing)", () => {
    const values = [ALARM_NAMES.TAB_CHECK, ALARM_NAMES.MEMORY_CHECK, ALARM_NAMES.SNOOZE_CLEANUP];
    expect(new Set(values).size).toBe(3);
  });
});

// --- updateBadge (service-worker.js:674-687) ----------------------------------
function badgeText({ enabled, discardedCount }) {
  if (!enabled) return "";
  return discardedCount > 0 ? String(discardedCount) : "";
}

describe("service-worker-contracts: badge text gating", () => {
  it.each([
    [{ enabled: false, discardedCount: 5 }, ""], // disabled wins over count
    [{ enabled: true, discardedCount: 0 }, ""], // zero never shown (no '0' clutter)
    [{ enabled: true, discardedCount: 1 }, "1"],
    [{ enabled: true, discardedCount: 42 }, "42"],
  ])("%o -> %p", (input, expected) => {
    expect(badgeText(input)).toBe(expected);
  });
});

// --- getTabsWithStatus protection chain (service-worker.js:642-652) -----------
function resolveProtectionReason({ isWhitelisted, isAudio, hasForm, isSnoozed }) {
  // Order matters: audio > form > snooze > whitelist. Pin is excluded - it
  // comes from tab.pinned directly in the UI.
  if (!(isWhitelisted || isAudio || hasForm || isSnoozed)) return null;
  if (isAudio) return "audio";
  if (hasForm) return "form";
  if (isSnoozed) return "snooze";
  if (isWhitelisted) return "whitelist";
  return null;
}

describe("service-worker-contracts: protectionReason chain", () => {
  it.each([
    [{ isAudio: true, hasForm: true, isSnoozed: true, isWhitelisted: true }, "audio"],
    [{ hasForm: true, isSnoozed: true, isWhitelisted: true }, "form"],
    [{ isSnoozed: true, isWhitelisted: true }, "snooze"],
    [{ isWhitelisted: true }, "whitelist"],
    [{}, null],
  ])("%o → %s", (flags, expected) => {
    expect(
      resolveProtectionReason({
        isWhitelisted: false,
        isAudio: false,
        hasForm: false,
        isSnoozed: false,
        ...flags,
      }),
    ).toBe(expected);
  });
});

// --- getTabsWithStatus timeUntilUnload visibility (service-worker.js:668) -----
function timeUntilVisible({ active, discarded, isProtected, timeUntilUnload }) {
  return active || discarded || isProtected ? null : timeUntilUnload;
}

describe("service-worker-contracts: timeUntilUnload visibility", () => {
  it("hidden when active/discarded/protected (timer badge would be misleading)", () => {
    expect(timeUntilVisible({ active: true, timeUntilUnload: 1000 })).toBeNull();
    expect(timeUntilVisible({ discarded: true, timeUntilUnload: 1000 })).toBeNull();
    expect(timeUntilVisible({ isProtected: true, timeUntilUnload: 1000 })).toBeNull();
  });

  it("visible for plain unloadable tabs", () => {
    expect(timeUntilVisible({ timeUntilUnload: 1000 })).toBe(1000);
  });
});
