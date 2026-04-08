# TabRest - Codebase Summary

## Overview

- **Type:** Chrome Extension (Manifest V3)
- **Language:** Vanilla JavaScript (ES Modules)
- **Build:** No build step required
- **Lines of Code:** ~5,400 (src/)
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

| File                 | LOC  | Purpose                                          |
| -------------------- | ---- | ------------------------------------------------ |
| `service-worker.js`  | 564  | Orchestrator: events, alarms, message routing    |
| `unload-manager.js`  | 238  | Core discard logic, protection checks, batch ops |
| `tab-tracker.js`     | 173  | LRU activity tracking, inactivity timer checks   |
| `memory-monitor.js`  | 157  | System RAM monitoring, per-tab JS heap tracking  |
| `snooze-manager.js`  | ~120 | Temporary tab/domain protection                  |
| `session-manager.js` | ~100 | Save/restore tab sessions                        |
| `stats-collector.js` | ~80  | Usage statistics tracking                        |

### Content Scripts

| File                 | LOC | Purpose                                     |
| -------------------- | --- | ------------------------------------------- |
| `form-checker.js`    | 201 | Detect unsaved forms, report JS heap memory |
| `youtube-tracker.js` | 132 | Save/restore YouTube playback position      |

### UI Components

| File                   | LOC  | Purpose                             |
| ---------------------- | ---- | ----------------------------------- |
| `popup/popup.js`       | 715  | Main popup logic, tab list, actions |
| `popup/popup.html`     | 238  | Popup markup                        |
| `popup/popup.css`      | 1053 | Popup styles                        |
| `options/options.js`   | 297  | Settings management                 |
| `options/options.html` | 267  | Options page markup                 |
| `options/options.css`  | 401  | Options styles                      |

### Shared Utilities

| File           | LOC | Purpose                                     |
| -------------- | --- | ------------------------------------------- |
| `constants.js` | 90  | Default settings, alarm names, storage keys |
| `storage.js`   | 39  | Chrome storage wrapper with caching         |
| `utils.js`     | 23  | formatBytes, notification helper            |
| `i18n.js`      | 48  | Internationalization helpers                |
| `theme.js`     | 88  | Dark/light mode management                  |
| `icons.js`     | 64  | SVG icon definitions                        |

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
├── snooze-manager.js
└── shared/*
```

## Key Data Structures

### Settings (chrome.storage.sync)
```javascript
{
  autoUnloadOnStartup: boolean,
  unloadDelayMinutes: number,      // 0-240
  memoryThresholdPercent: number,  // 0-100
  whitelist: string[],             // domains
  blacklist: string[],
  // ... see constants.js SETTINGS_DEFAULTS
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

## File Size Limits

- Target: < 200 LOC per file for maintainability
- Current largest: `popup.js` (715 LOC), `popup.css` (1053 LOC)
- Consider splitting popup into components if it grows further
