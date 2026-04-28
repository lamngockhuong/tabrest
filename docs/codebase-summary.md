# TabRest - Codebase Summary

## Overview

- **Type:** Chrome Extension (Manifest V3)
- **Language:** Vanilla JavaScript (ES Modules)
- **Build:** No build step required
- **Lines of Code:** ~6,400 (src/) as of v0.0.4
- **Package Manager:** pnpm

## Directory Structure

```
tabrest/
├── manifest.json           # Extension config (MV3)
├── _locales/               # i18n translations
│   ├── en/messages.json
│   └── vi/messages.json
├── src/
│   ├── background/         # Service worker modules (~1,600 LOC)
│   ├── content/            # Content scripts (~330 LOC)
│   ├── popup/              # Popup UI (~1,900 LOC)
│   ├── options/            # Settings page (~760 LOC)
│   ├── pages/              # Static pages (~130 LOC)
│   └── shared/             # Utilities (~350 LOC)
├── icons/                  # Extension icons (16/48/128px)
├── assets/                 # Store promo images (SVG/PNG)
├── scripts/                # Build utilities
├── website/                # Astro docs site
└── docs/                   # Project documentation
```

## Module Responsibilities

### Background (Service Worker)

| File                 | LOC | Purpose                                          |
| -------------------- | --- | ------------------------------------------------ |
| `service-worker.js`  | 618 | Orchestrator: events, alarms, message routing    |
| `unload-manager.js`  | 348 | Core discard logic, protection checks, batch ops |
| `tab-tracker.js`     | 172 | LRU activity tracking, inactivity timer checks   |
| `memory-monitor.js`  | 196 | System RAM monitoring, per-tab JS heap tracking  |
| `snooze-manager.js`  | 164 | Temporary tab/domain protection                  |
| `session-manager.js` | 209 | Save/restore tab sessions, import with merge & dedup |
| `stats-collector.js` | 99  | Usage statistics tracking                        |
| `form-injector.js`   | 24  | On-demand form-checker injection (lazy-loaded)   |

### Content Scripts

| File                 | LOC | Purpose                                     |
| -------------------- | --- | ------------------------------------------- |
| `form-checker.js`    | 201 | Detect unsaved forms, report JS heap memory (lazy-injected) |
| `youtube-tracker.js` | 132 | Save/restore YouTube playback position      |

### UI Components

| File                   | LOC | Purpose                             |
| ---------------------- | --- | ----------------------------------- |
| `popup/popup.js`       | 974 | Main popup logic, tab list, actions |
| `popup/popup.html`     | 238 | Popup markup (reused for side panel)|
| `popup/popup.css`      | 1053| Popup styles                        |
| `options/options.js`   | 428 | Settings management                 |
| `options/options.html` | 267 | Options page markup                 |
| `options/options.css`  | 401 | Options styles                      |

### Shared Utilities

| File                | LOC | Purpose                                     |
| ------------------- | --- | ------------------------------------------- |
| `constants.js`      | 98  | Default settings, alarm names, storage keys |
| `storage.js`        | 39  | Chrome storage wrapper with caching         |
| `utils.js`          | 141 | formatBytes, notification, semver, tab search helpers |
| `permissions.js`    | 43  | Check/request/remove host permissions       |
| `i18n.js`           | 48  | Internationalization helpers                |
| `theme.js`          | 91  | Dark/light mode management                  |
| `icons.js`          | 83  | SVG icon definitions                        |
| `import-export.js`  | 43  | Session/config export/import with schema validation |
| `error-reporter.js` | 232 | Anonymous error reporting                   |
| `log-collector.js`  | 155 | Diagnostic log aggregation                  |

### Pages

| File                       | Purpose                    |
| -------------------------- | -------------------------- |
| `pages/onboarding.html/js` | First-install welcome page |
| `pages/changelog.html/js`  | Version update changelog   |

## Module Dependencies

```
service-worker.js (orchestrator)
├── unload-manager.js
│   └── stats-collector.js
├── tab-tracker.js
│   ├── unload-manager.js
│   └── snooze-manager.js
├── memory-monitor.js
│   ├── tab-tracker.js (getLRUSortedTabs)
│   └── unload-manager.js
├── session-manager.js
│   └── import-export.js (schema validation)
├── snooze-manager.js
└── shared/*
    └── import-export.js
```

## Key Data Structures

### Settings (chrome.storage.sync)
```javascript
{
  autoUnloadOnStartup: boolean,
  unloadDelayMinutes: number,        // 0-240
  memoryThresholdPercent: number,    // 0-100
  whitelist: string[],               // domains
  blacklist: string[],
  perTabJsHeapThresholdMB: number,   // 0-1024, 0=disabled
  powerMode: string,                 // 'battery-saver'|'normal'|'performance'
  onlyDiscardWhenIdle: boolean,
  idleThresholdMinutes: number,
  skipWhenOffline: boolean,
  useSidePanel: boolean,             // side panel mode toggle
  showSuspendWarning: boolean,       // pre-discard toast
  suspendWarningDelayMs: number,     // 3000ms default
  // ... see constants.js SETTINGS_DEFAULTS for complete list
}
```

### Tab Activity (chrome.storage.local)
```javascript
{
  tabActivity: {
    [tabId: number]: timestamp   // last active time
  }
}
```

### Snooze Data (chrome.storage.local)
```javascript
{
  tabs: { [tabId]: expiresAt },
  domains: { [hostname]: expiresAt }
}
```

### Other Storage Keys (chrome.storage.local)

- `popup_section_state` — Persistent collapse state for popup sections
- `tabrest_lastVersion` — Current version for changelog gating
- `tabrest_snooze` — Active snooze timers
- `tabrest_scroll_positions` — Cached scroll positions (max 100)
- `youtube_timestamps` — YouTube playback positions (7-day max age)

## External Dependencies

### Runtime (none)
Core extension has zero runtime dependencies.

### Development
- `@biomejs/biome` - Linting and formatting
- `release-please` - Version management

### Website (website/)
- Astro framework
- Various Astro plugins

## Build & Development

```bash
pnpm install        # Install dev dependencies
pnpm run lint       # Check with Biome
pnpm run lint:fix   # Auto-fix issues
pnpm run format     # Format code
pnpm run ci         # Full CI check
```

## Important Implementation Notes

### Optional Host Permissions (v0.0.4+)
- `http://*/*` and `https://*/*` declared as `optional_host_permissions` in manifest
- Requested on-demand only if `protectFormTabs` is enabled
- `form-injector.js` uses `permissions.requestHostPermissions()` to recover access after updates
- On-demand injection via `chrome.scripting.executeScript()` reduces manifest impact

### Side Panel (v0.0.4+)
- Reuses `popup.html/js/css` when `useSidePanel` setting is true
- Controlled by `chrome.sidePanel.setOptions()` during `runtime.onInstalled`
- New `windows.onFocusChanged` listener updates badge across side panel and main window
- Popup and side panel communicate via standard `chrome.runtime.sendMessage()`

## File Size Limits

- Target: < 200 LOC per file for maintainability
- Current largest: `popup.js` (974 LOC), `popup.css` (1053 LOC)
- Consider splitting popup into components if it grows further
