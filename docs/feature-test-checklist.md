# TabRest Feature Self-Test Checklist

Periodic manual QA checklist covering every user-visible feature. Run before each release, after major refactors, or whenever Chrome updates the extension APIs.

- **Scope:** v0.0.4 (Sprint 1–3 complete)
- **Estimated time:** 60–90 minutes for a full pass
- **Browser:** Chrome (or Chromium-based) latest stable
- **Locale coverage:** Verify both `en` and `vi` for any UI string changes

## How to Use

1. Load the extension as **Unpacked** from `chrome://extensions` (Developer mode on).
2. Open the service worker DevTools: `chrome://extensions` → TabRest → "Inspect views: service worker".
3. Walk through each section. Tick `[x]` when the expected result is observed; mark `[!]` and add a note if something fails.
4. Reset state between sections where indicated (e.g., reset stats, clear whitelist).

Legend: `[ ]` not tested · `[x]` pass · `[!]` fail · `[~]` skip / N/A.

---

## 0. Pre-flight

- [ ] Reload the unpacked extension; service worker boots without errors in DevTools console.
- [ ] `chrome://extensions/?errors=<id>` is empty for TabRest.
- [ ] Onboarding page opens automatically on first install (incognito profile or fresh user data dir).
- [ ] Toolbar icon and badge render at 16/48/128 px.
- [ ] Open popup → header shows logo, version, theme toggle, settings cog.
- [ ] Open Options → all sections render without overflow at 1280×800.
- [ ] Switch language to `vi` (Chrome → Settings → Languages → set Vietnamese as primary, then reload extension); popup + options strings reflect Vietnamese.
- [ ] Switch back to `en`; strings revert.

## 1. Auto-Unload — Inactivity Timer

- [ ] Set `Unload after` = 1 min (Options → Auto-Unload), `Min inactive tabs before discard` = 0.
- [ ] Open 3 tabs (any non-whitelisted sites). Focus tab A.
- [ ] Wait 1 min while staying on tab A.
- [ ] Tabs B and C are discarded (favicon dimmed, prefix shown). Tab A stays loaded.
- [ ] Click discarded tab B → reloads instantly, scroll position preserved (if `restoreScrollPosition` on).
- [ ] Set delay = 0 → auto-unload disabled; verify tabs no longer discard after a minute.

## 2. Auto-Unload — Memory Threshold

- [ ] Set `Memory threshold` = 60% (Options → Memory Management).
- [ ] Open enough tabs to push RAM > 60% (or temporarily lower threshold to current RAM −5%).
- [ ] Within 30s, LRU tabs discard until RAM drops below threshold.
- [ ] Set threshold = 0 → memory-based discarding disabled.

## 3. Auto-Unload — Per-Tab JS Heap Limit

- [ ] Set `Per-tab JS heap limit` = 100 MB (Options).
- [ ] If the form-checker host permission was previously granted, `chrome.scripting` injects the heap reporter; otherwise verify the recovery banner appears in the popup.
- [ ] Open a heavy site (e.g., Figma, large Google Sheet) and wait > 30s.
- [ ] Tab discards once heap > 100 MB.
- [ ] Set limit = 0 → heap monitoring disabled.

## 4. Auto-Unload — Startup

- [ ] Toggle `Auto-unload on startup` ON (Options).
- [ ] Quit and relaunch Chrome with multiple tabs open from previous session.
- [ ] All non-active, non-whitelisted tabs discard within seconds of startup.
- [ ] Toggle OFF → tabs remain loaded after relaunch.

## 5. Min Inactive Tabs Threshold

- [ ] Set `Min inactive tabs before auto-discard` = 5.
- [ ] With < 5 inactive tabs, auto-unload does NOT fire even if delay elapsed.
- [ ] Open more tabs to exceed threshold → auto-unload resumes.

## 6. Idle-Only Mode

- [ ] Toggle `Only auto-unload when idle` ON; `Idle threshold` = 1 min.
- [ ] Keep typing/moving mouse → no auto-unload triggers.
- [ ] Stop interaction for ≥ 1 min → auto-unload runs on next alarm.
- [ ] Toggle OFF → auto-unload runs regardless of idle state.

## 7. Skip When Offline

- [ ] Toggle `Skip when offline` ON.
- [ ] Disconnect network (DevTools → Network → Offline, or disable Wi-Fi).
- [ ] Wait beyond `unloadDelayMinutes` → no tabs discard.
- [ ] Reconnect → discards resume on next alarm.

## 8. Power Mode

- [ ] Switch to **Battery saver**: aggressive thresholds; longer delays.
- [ ] Switch to **Normal**: defaults applied.
- [ ] Switch to **Performance**: shortest intervals, highest priority discard.
- [ ] After each switch, verify alarm period changes (DevTools `chrome.alarms.getAll`).

## 9. Manual Controls — Popup Buttons

- [ ] **Unload Current** → discards focused tab; popup closes; tab shows prefix.
- [ ] **Unload Others** → all tabs except active discard.
- [ ] **More Actions → Unload Right** → only tabs to right of active discard.
- [ ] **More Actions → Unload Left** → only tabs to left.
- [ ] **More Actions → Close Duplicates** → in a window with 3+ duplicate URLs, the oldest is kept and the rest close.
- [ ] Per-tab "Unload" icon in tab list discards only that row.

## 10. Keyboard Shortcuts

Configurable at `chrome://extensions/shortcuts`.

- [ ] `Alt+Shift+D` — unload current tab.
- [ ] `Alt+Shift+O` — unload other tabs.
- [ ] `Alt+Shift+→` — unload tabs to the right.
- [ ] `Alt+Shift+←` — unload tabs to the left.
- [ ] Rebind one shortcut → still fires the correct command.

## 11. Toolbar Click Action

- [ ] `popup` (default) → click icon opens popup.
- [ ] `discard-current` → click icon discards active tab; no popup.
- [ ] `discard-others` → click icon discards all other tabs.
- [ ] Setting takes effect after Options save without service-worker reload.

## 12. Context Menu

- [ ] Right-click on any page → TabRest submenu visible.
- [ ] "Unload this tab" works.
- [ ] "Add domain to whitelist" adds the page's hostname (incl. localhost or IP).
- [ ] "Snooze this tab (1h)" + "Snooze this site (1h)" entries fire correctly.
- [ ] Right-click on a link → "Open link in suspended state" creates a discarded tab.

## 13. Tab Search
- [ ] Click search toggle in popup → input appears, focused.
- [ ] Type substring → tab list filters by title and URL (case-insensitive).
- [ ] Combined with filter chips (All / Sleeping / Snoozed / Protected) → AND intersection.
- [ ] Clear input → full list returns.
- [ ] Close & reopen popup → search input collapses back (does not persist value).

## 14. Filter Chips

- [ ] **All** chip shows every tab.
- [ ] **Sleeping** shows only discarded tabs.
- [ ] **Snoozed** shows tabs/domains under snooze.
- [ ] **Protected** shows pinned/audio/form/whitelisted tabs with badge icons.
- [ ] Counts on each chip update live as tabs change state.

## 15. Persistent Section State
- [ ] Collapse "Sessions", "More Actions", and "Stats" sections.
- [ ] Close popup. Reopen popup → previously collapsed sections stay collapsed.
- [ ] Open them, close popup, reopen → expanded state persists.
- [ ] Same behaviour in side panel mode.

## 16. Whitelist (incl. localhost & IP)

- [ ] Add `youtube.com` via Options text field → whitelist saves; visiting youtube.com is protected from auto-unload.
- [ ] Add `localhost` → tabs on `http://localhost:*` protected.
- [ ] Add `127.0.0.1` → tabs on `http://127.0.0.1:*` protected.
- [ ] Add `::1` (IPv6) → protected.
- [ ] Invalid entry (e.g., `http://`) → input shows error, not saved.
- [ ] Remove an entry → next auto-unload may discard that domain.
- [ ] Context menu "Add to whitelist" on a localhost or IP tab works end-to-end.

## 17. Blacklist

- [ ] Add a low-priority domain to blacklist.
- [ ] Tabs on that domain discard on the very next timer tick (ignoring delay).
- [ ] Removing entry stops aggressive discard.

## 18. Pinned / Audio / Form Protection

- [ ] Pinned tab + `Protect pinned tabs` ON → never discards via auto-unload.
- [ ] Tab playing YouTube audio + `Protect audio tabs` ON → never discards.
- [ ] Tab with unsaved form (e.g., partially filled Google Form) + `Protect form tabs` ON → not discarded; popup row shows "Form" badge.
- [ ] Disable a protection → matching tabs become eligible.
- [ ] **Force unload** (per-tab menu in popup) overrides all protections.

## 19. Optional Host Permissions + Form Injector
- [ ] On a fresh install, host permissions NOT granted by default.
- [ ] Toggle `Protect form tabs` OFF then ON → permission prompt or recovery banner appears.
- [ ] Grant permission → form-checker injects only on tabs accessed; verify in popup row badges and DevTools.
- [ ] Revoke via `chrome://extensions` → recovery banner reappears in popup with "Enable" CTA.
- [ ] Toggle `Discarded tab title prefix` ON → if `scripting`/host perms not granted, requests them.

## 20. Snooze

- [ ] Snooze a tab for 30 min → shows "Snoozed" badge; auto-unload skips it.
- [ ] Snooze a domain for 1 h → all current and new tabs on that domain protected.
- [ ] Cancel snooze → tab/domain returns to normal eligibility.
- [ ] Snooze persists across browser restart (within window).
- [ ] Snooze expires automatically when the timer elapses.

## 21. Suspend Warning Toast
- [ ] Toggle `Show suspend warning` ON; delay = 3000 ms.
- [ ] Open a tab and let it become eligible for auto-unload.
- [ ] Toast appears in-page 3 s before the discard fires.
- [ ] Switching to the tab cancels the discard.
- [ ] Starting audio/video, modifying a form, or snoozing within the 3 s also cancels.
- [ ] Toggle OFF → no toast; tab discards silently.
- [ ] Custom delay (e.g., 5000 ms) honored.

## 22. YouTube Timestamp Restore

- [ ] Toggle `Save YouTube timestamp` ON.
- [ ] Play a YouTube video to 1:00 then unload the tab.
- [ ] Reload the discarded tab → playback resumes ≥ 0:55.
- [ ] Visit > 7 days later → cache expired (manual: edit `chrome.storage.sync` to confirm).

## 23. Scroll Position Restore

- [ ] Toggle `Restore scroll position` ON.
- [ ] Scroll halfway down a long page; let tab discard.
- [ ] Re-open tab → restores within ±50 px of original scroll position.
- [ ] Cap of 100 entries: discard 110 distinct tabs and verify the oldest entries drop from `tabrest_scroll_positions` (chrome.storage.local).

## 24. Tab Groups

- [ ] Create a tab group with 3 tabs.
- [ ] Popup `Tab groups` selector lists the group with tab count.
- [ ] "Unload this group" discards every tab in the group while keeping the group structure.
- [ ] Toggle `Enable tab groups` OFF → selector hidden.

## 25. Visual Indicators

- [ ] Badge count = number of discarded tabs (toggle `Show badge count`).
- [ ] Discarded tab title prefix shows configured glyph (default `💤`); custom glyph (max 4 chars) saves and applies after the host permission prompt.
- [ ] Toggle prefix OFF → titles unchanged on next discard.
- [ ] Popup header RAM percentage updates every ~5 s.

## 26. Memory Estimate Tooltip
- [ ] Hover the RAM stat in popup → tooltip explains the estimate (e.g., "~150 MB per discarded tab").
- [ ] Tooltip text localized in `vi`.
- [ ] Tooltip dismisses on mouse-out.

## 27. Notifications

- [ ] Toggle `Notify on auto-unload` ON.
- [ ] Trigger an auto-unload → desktop notification with tab count + memory saved.
- [ ] Notification respects OS focus-assist / Do Not Disturb.

## 28. Statistics

- [ ] After unloading several tabs, popup `Stats` shows correct today + all-time totals.
- [ ] "RAM saved" estimate increases.
- [ ] "Member since" reflects install date.
- [ ] "Reset stats" zeroes counters and confirms via toast.

## 29. Sessions

- [ ] Save current window as session "test-1" (popup → Sessions → name → Save).
- [ ] Close all tabs.
- [ ] Restore "test-1" → exact tab list reopens (URLs match, order preserved).
- [ ] Delete "test-1" → entry disappears.
- [ ] 100+ saved sessions paginate or scroll without breaking the popup layout.

## 30. Import / Export

For each of: **whitelist**, **blacklist**, **sessions**:

- [ ] Export → JSON copied to clipboard with `version: 1` schema.
- [ ] Empty the list, then Import the previously exported JSON → list restored, no duplicates.
- [ ] Import a JSON with overlap → additive merge, dedup by name (sessions) or domain (whitelist/blacklist).
- [ ] Malformed JSON → error toast, no state change.
- [ ] Wrong schema version → rejected with clear message.

## 31. Side Panel Mode

- [ ] Options → Toolbar Action → enable `Open in side panel`.
- [ ] Click toolbar icon → side panel opens (popup does not).
- [ ] Side panel layout responsive at 360 px and 480 px wide.
- [ ] Side panel stays open while switching tabs and windows.
- [ ] Disable side panel → toolbar reverts to popup.
- [ ] All popup interactions (search, filter, snooze, save session, import/export) work in side panel.

## 32. Auto-Open Changelog

- [ ] Bump manifest version from `0.0.4` → `0.0.5` (patch). Reload extension → changelog tab does NOT auto-open.
- [ ] Bump from `0.0.4` → `0.1.0` (minor) → changelog page opens in new tab.
- [ ] Bump from `0.1.0` → `1.0.0` (major) → changelog opens.
- [ ] Restore version; clear `tabrest_lastVersion` from `chrome.storage.local` to retest.

## 33. Theme (Dark / Light)

- [ ] Toggle dark mode in popup → applies instantly.
- [ ] Open Options in another window → already in dark mode (cross-page sync).
- [ ] Toggle in Options → popup follows.
- [ ] Onboarding & changelog pages match the chosen theme.
- [ ] OS dark mode preference is respected on first install.

## 34. Bug Report / Error Reporting

- [ ] Click "Report a bug" in popup footer → modal opens with auto-filled diagnostics (extension version, Chrome version, platform).
- [ ] Submit → opens the GitHub issue link with prefilled body.
- [ ] Toggle `Send anonymous error reports` OFF → service-worker errors are NOT exfiltrated (verify no outbound network in DevTools).
- [ ] Toggle ON → errors collected via `error-reporter.js` and surfaced (manual: throw a test error).

## 35. Onboarding

- [ ] Fresh install → onboarding tab opens automatically.
- [ ] Walks through key features and links to Options.
- [ ] Theme matches user preference.

## 36. i18n Coverage

- [ ] Switch Chrome UI language to Vietnamese.
- [ ] Every string in popup, options, onboarding, changelog, toast, notification, error message renders in Vietnamese (no `__MSG_*__` placeholders, no fallback English unless intentional).
- [ ] Numbers/dates use locale-appropriate formatting.

## 37. Settings Sync

- [ ] Sign in to Chrome with a sync-enabled account.
- [ ] Modify settings on Profile A; on Profile B (signed in same account) verify sync within ~1 min.
- [ ] Sessions and whitelist propagate across devices (sessions stored in `chrome.storage.sync`).
- [ ] Tab activity stays per-device (`chrome.storage.local`).

## 38. Service Worker Resilience

- [ ] In DevTools → Application → Service Workers → click "Stop" to terminate the worker.
- [ ] Wait > 30s. Open a tab, then idle.
- [ ] Worker auto-wakes via `chrome.alarms`; auto-unload still fires.
- [ ] Long sessions (≥ 4 h) do not leak memory (`chrome://serviceworker-internals` shows stable heap).

## 39. Cross-Browser Smoke (Chromium variants)

Spot-check on:

- [ ] Brave latest
- [ ] Edge latest
- [ ] Vivaldi latest
- [ ] Opera latest

Verify popup loads, manual unload works, side panel renders (where supported), shortcuts respond.

## 40. Uninstall / Cleanup

- [ ] Remove extension → all alarms cleared.
- [ ] Storage entries cleaned up by Chrome (verify via fresh reinstall: stats reset, no leftover snooze/sessions).
- [ ] No orphaned content scripts in previously injected tabs after reinstall.

---

## Issue Reporting Template

When a check fails, file an issue with:

- Section + checklist item ID (e.g., `§21 Suspend Warning Toast`).
- Steps reproduced.
- Expected vs actual.
- Browser + OS + extension version.
- Service worker DevTools console excerpt.
- Screenshots or screen recording where helpful.

Repository: <https://github.com/lamngockhuong/tabrest/issues>
