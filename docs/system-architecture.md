# TabRest - System Architecture

## High-Level Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                        CHROME BROWSER                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐             │
│  │   Popup     │  │   Options   │  │    Pages     │             │
│  │  (popup.*)  │  │ (options.*) │  │  (pages/*)   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────────────┘             │
│         │                │                                      │
│  ┌──────┴────────────────┴──────────────────────────────┐       │
│  │  Side Panel (optional, useSidePanel setting)         │       │
│  │  Reuses popup.html/js/css when active                │       │
│  └──────────────────────────────────────────────────────┘       │
│         │                │                                      │
│         │    chrome.runtime.sendMessage                         │
│         ▼                ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   SERVICE WORKER                            ││
│  │                 (service-worker.js)                         ││
│  │  ┌─────────────┬─────────────┬─────────────┬──────────────┐ ││
│  │  │ unload-mgr  │ tab-tracker │ memory-mon  │ snooze-mgr   │ ││
│  │  │             │             │             │              │ ││
│  │  │ session-mgr │ stats-coll  │ window mgr* │ form-inject  │ ││
│  │  └─────────────┴─────────────┴─────────────┴──────────────┘ ││
│  │  * chrome.windows.onFocusChanged listener                   ││
│  └──────┬──────────────────────────────────────────────────────┘│
│         │                                                       │
│         │    chrome.tabs.sendMessage                            │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   CONTENT SCRIPTS                           ││
│  │                  (Lazy-injected)                            ││
│  │  ┌─────────────────────┐  ┌─────────────────────┐           ││
│  │  │   form-checker.js   │  │ youtube-tracker.js  │           ││
│  │  │ (on-demand inject)  │  │ (youtube.com/watch) │           ││
│  │  └─────────────────────┘  └─────────────────────┘           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### Service Worker (Background)

Central orchestrator handling all extension logic.

```text
service-worker.js
├── Event Listeners
│   ├── chrome.runtime.onStartup
│   ├── chrome.runtime.onInstalled
│   ├── chrome.tabs.onActivated
│   ├── chrome.tabs.onUpdated
│   ├── chrome.tabs.onRemoved
│   ├── chrome.alarms.onAlarm
│   ├── chrome.commands.onCommand
│   ├── chrome.contextMenus.onClicked
│   ├── chrome.action.onClicked
│   ├── chrome.storage.onChanged
│   └── chrome.runtime.onMessage
├── Module Imports
│   ├── unload-manager.js
│   ├── tab-tracker.js
│   ├── memory-monitor.js
│   ├── snooze-manager.js
│   ├── session-manager.js
│   ├── stats-collector.js
│   ├── form-injector.js
│   └── shared/permissions.js
└── Internal Functions
    ├── handleMessage()
    ├── getTabsWithStatus()
    ├── updateBadge()
    ├── configureToolbarAction()
    └── setupContextMenus()
```

### Module Responsibilities

| Module            | Primary Responsibility                          | Dependencies                               |
| ----------------- | ----------------------------------------------- | ------------------------------------------ |
| `unload-manager`  | Execute tab discards with protection checks     | stats-collector                            |
| `tab-tracker`     | Track tab activity, trigger timer-based unloads | unload-manager, snooze-manager             |
| `memory-monitor`  | Monitor RAM, trigger memory-based unloads       | tab-tracker, unload-manager, form-injector |
| `snooze-manager`  | Manage temporary protections                    | storage                                    |
| `session-manager` | Save/restore tab sessions                       | storage                                    |
| `stats-collector` | Track unload statistics                         | storage                                    |
| `form-injector`   | Inject form-checker (eager on page load + lazy) | permissions                                |

## Data Flow

### Automatic Tab Unloading (Timer)

```text
1. chrome.alarms fires "tab-check-alarm" (every 1 min)
       │
       ▼
2. tab-tracker.checkAndUnloadInactiveTabs()
       │
       ├── Check settings.unloadDelayMinutes > 0
       ├── Check navigator.onLine (if skipWhenOffline)
       ├── Check chrome.idle.queryState (if onlyDiscardWhenIdle)
       ├── Apply power mode delay multiplier
       │
       ▼
3. For each tab in tabActivity map:
       │
       ├── Verify tab exists, not active, not discarded
       ├── Check whitelist (skip — wins over blacklist)
       ├── Check if blacklisted (immediate unload)
       ├── Check if exceeded inactivity threshold
       ├── Check if snoozed
       │
       ▼
4. unload-manager.discardTab(tabId, { settings })
       │
       ├── Check whitelist
       ├── Check pinned protection
       ├── Check audio/form protection
       ├── Save YouTube timestamp (if applicable)
       ├── Save scroll position
       ├── Add title prefix
       │
       ▼
5. chrome.tabs.discard(tabId)
       │
       ▼
6. stats-collector.recordUnload()
```

### Automatic Tab Unloading (Memory)

```text
1. chrome.alarms fires "memory-check-alarm" (every 30 sec)
       │
       ▼
2. memory-monitor.checkMemoryAndUnload()
       │
       ├── Check settings.memoryThresholdPercent > 0
       ├── Proactively ensure form-checker injected (for per-tab heap data)
       ├── chrome.system.memory.getInfo()
       ├── Calculate usage percent
       ├── Apply power mode threshold offset
       │
       ▼
3. If usage > effective threshold:
       │
       ├── Get LRU sorted tabs from tab-tracker
       │
       ▼
4. Unload up to MAX_TABS_PER_MEMORY_CHECK (3)
       │
       ▼
5. unload-manager.discardTab() for each
```

### Manual Tab Unload (Popup)

```text
1. User clicks "Unload" button in popup
       │
       ▼
2. popup.js: chrome.runtime.sendMessage({ command: "unload-tab", tabId })
       │
       ▼
3. service-worker.js: handleMessage()
       │
       ▼
4. unload-manager.discardTab(tabId, { force: true })
       │
       ├── Skip protection checks (force mode)
       │
       ▼
5. chrome.tabs.discard(tabId)
       │
       ▼
6. sendResponse(result)
       │
       ▼
7. popup.js: Refresh tab list
```

## Storage Architecture

### chrome.storage.sync (Cross-device)

```javascript
{
  settings: {
    autoUnloadOnStartup: true,
    unloadDelayMinutes: 30,
    memoryThresholdPercent: 80,
    whitelist: ["youtube.com", "gmail.com", ...],
    blacklist: [],
    // ... all user preferences
  }
}
```

### chrome.storage.local (Device-specific)

```javascript
{
  // Tab activity tracking
  tabActivity: {
    123: 1712345678000,  // tabId: lastActiveTimestamp
    456: 1712345600000,
    // ...
  },

  // Statistics
  stats: {
    totalUnloaded: 150,
    memorySavedBytes: 1073741824,
    // ...
  },

  // Snooze data
  tabrest_snooze: {
    tabs: { 123: 1712350000000 },      // tabId: expiresAt
    domains: { "example.com": 1712350000000 }
  },

  // Scroll positions
  tabrest_scroll_positions: {
    "https://example.com/page": { x: 0, y: 500 },
    // ... (max 100 entries)
  },

  // YouTube timestamps
  youtube_timestamps: {
    "dQw4w9WgXcQ": { time: 123.5, savedAt: 1712345678000 },
    // ... (max age: 7 days)
  },

  // Version tracking
  tabrest_lastVersion: "0.0.3"
}
```

## Event Handling

### Chrome Events → Actions

| Event                    | Handler                                          | Action                   |
| ------------------------ | ------------------------------------------------ | ------------------------ |
| `runtime.onStartup`      | Initialize all trackers, sync tabs, setup alarms | Startup                  |
| `runtime.onInstalled`    | Same as startup + show onboarding/changelog      | Install/Update           |
| `tabs.onActivated`       | Update tab activity timestamp                    | Tab focus                |
| `tabs.onUpdated`         | Update activity, refresh badge                   | Tab navigation           |
| `tabs.onRemoved`         | Cleanup activity & memory entries                | Tab close                |
| `windows.onFocusChanged` | Update badge across windows (side panel mode)    | Window focus change      |
| `alarms.onAlarm`         | Route to appropriate check function              | Timer tick               |
| `commands.onCommand`     | Execute keyboard shortcut action                 | Hotkey                   |
| `contextMenus.onClicked` | Execute context menu action                      | Right-click              |
| `storage.onChanged`      | Reconfigure alarms, toolbar, badge               | Settings change          |
| `runtime.onMessage`      | Route to command handler                         | Message (include import) |

### Alarm Schedule

| Alarm                  | Interval   | Purpose                |
| ---------------------- | ---------- | ---------------------- |
| `tab-check-alarm`      | 1 minute   | Check inactive tabs    |
| `memory-check-alarm`   | 30 seconds | Check RAM usage        |
| `snooze-cleanup-alarm` | 5 minutes  | Remove expired snoozes |

## Advanced Features (v0.0.4+)

### Side Panel Architecture

**Design:**

- Reuses `popup.html`, `popup.js`, `popup.css` for consistent UI
- Setting `useSidePanel` controls popup vs side panel mode
- `chrome.sidePanel.setOptions()` enables/disables side panel in manifest
- On toolbar click: handler checks `useSidePanel` setting to route to popup or side panel

**Window Synchronization:**

- `chrome.windows.onFocusChanged` listener updates badge across main window + side panel
- Side panel stays visible while switching tabs within same window
- Responsive layout via CSS media query for sidebar width (~400px)

**Communication:**

- Popup and side panel both use standard `chrome.runtime.sendMessage()` to background
- Background response format identical for both UI surfaces
- State shared via `chrome.storage.local` (e.g., filter state, section collapse)

### Optional Host Permissions & On-Demand Injection

**Flow:**

1. Manifest declares `optional_host_permissions: ["http://*/*", "https://*/*"]`
2. `protectFormTabs` setting gate: if false, form checking skipped
3. Form checker injected via `chrome.scripting.executeScript()` from two paths:
   - **Eager** (`tabs.onUpdated` with `status="complete"`): so the input listener registers before the user types — required for React-controlled inputs and contenteditable editors (Lexical/ProseMirror) where `value`/`defaultValue` tracking is unreliable
   - **Lazy** (auto-unload timer / memory check): catches tabs already open before the extension loaded
4. On any keystroke, form-checker sets a global `document.body.dataset.tabrestFormModified` flag — single robust signal that survives SPA navigation and React re-renders
5. Permission recovery: if user revokes access, banner appears in options with "Grant permission" button
6. `permissions.requestHostPermissions()` uses `chrome.permissions.request()` with silent fallback

**Rationale:**

- User can protect unsaved forms without granting hosts permission upfront
- Reduced trust friction on install (optional rather than required)
- Eager injection is the only reliable way to detect modifications in modern rich-text editors (which never expose values via `defaultValue`)

### Suspend Warning Toast

**Execution:**

1. Timer/memory trigger identifies tab for auto-discard
2. If `showSuspendWarning` enabled:
   - Inject warning content script via `chrome.scripting.executeScript()`
   - Warning toast appears on-page (3s default, configurable via `suspendWarningDelayMs`)
3. User can interact during warning:
   - Click tab (switches focus) → cancels discard
   - Play audio/video → triggers audio protection
   - Edit form → triggers form protection
   - Snooze button in toast → suspends discard
4. After delay: re-check all protections
   - If tab now protected, abort discard
   - Otherwise, proceed with discard

**Storage:**

- Settings: `showSuspendWarning`, `suspendWarningDelayMs`
- No persistent state for warnings (ephemeral toast)

### Import/Export

**Schema:**

```javascript
{
  version: 1,                    // Schema version for forward compat
  type: "whitelist" | "sessions",
  data: [
    // Whitelists
    { domain: "example.com", description: "Work site" },
    // Sessions
    { name: "Research", tabs: [{ url, title }], savedAt: timestamp }
  ]
}
```

**Operations:**

- **Export:** User clicks "Export" → clipboard contains versioned JSON
- **Import:** User pastes JSON → `import-export.js` validates schema version
  - Merge (not replace): append new entries, dedup by domain/session name
  - Validation: check URL format, sanitize domains
- **Storage:** Imports written to `chrome.storage.sync` (cross-device)

**Dedup Strategy:**

- Sessions: Compare by name; if exists, merge tabs (add unique URLs)
- Whitelists: Check domain exists; skip if present

## Message Protocol

### Popup → Background

```javascript
// Commands
{ command: "unload-current" }
{ command: "unload-others" }
{ command: "unload-tab", tabId: 123 }
{ command: "unload-group", groupId: 5 }
{ command: "get-memory-info" }
{ command: "get-tabs-with-status" }
{ command: "get-stats" }
{ command: "snooze-tab", tabId: 123, minutes: 30 }
{ command: "snooze-domain", domain: "example.com", minutes: 60 }
{ command: "cancel-tab-snooze", tabId: 123 }
{ command: "get-sessions" }
{ command: "save-session", name: "Research" }
{ command: "restore-session", id: "abc123", mode: "replace" }
{ command: "import-sessions", data: [...] }  // Import with merge & dedup
```

### Content Script → Background

```javascript
// Memory report (from form-checker.js)
{ action: "reportTabMemory", heapMB: 150 }

// Tab ID request (for scroll position)
{ action: "getTabId" }
```

### Background → Content Script

```javascript
// Form check
{ action: "checkFormData" }

// Scroll/YouTube save
{ action: "saveScrollPosition", tabId: 123 }
{ action: "saveYouTubeTimestamp" }
```

## Security Model

### Permission Scope

- `tabs`: Query and modify tabs
- `storage`: Persist settings and data
- `alarms`: Schedule periodic checks
- `system.memory`: Monitor RAM usage
- `contextMenus`: Add right-click options
- `tabGroups`: Manage tab groups
- `scripting`: Inject title prefix script
- `idle`: Detect user activity state
- `notifications`: Alert on auto-unload

### Host Permissions

- `http://*/*`, `https://*/*`: Optional (requested on-demand for form detection)

### Data Security

- No external network requests (except optional Sentry error reporting)
- All data stored locally
- No user tracking or analytics

## Error Reporting (Sentry, v0.1.0+)

### Overview

Optional anonymous error reporting via Sentry SaaS (disabled by default). Helps identify and fix bugs faster while maintaining privacy.

### Data Flow

```text
content-script.js (form-checker, youtube-tracker)
        │ chrome.runtime.sendMessage({command: "captureError"})
        ▼
service-worker.js (onMessage handler)
        │
        ▼
error-reporter.js
        ├── sanitizeString() — strip URLs, emails, IPs → [REDACTED]
        ├── computeFingerprint() — FNV-1a hash of name + first 3 stack frames
        ├── checkDedup() — skip if identical error within 24h window
        ├── checkAndIncrementQuota() — 100 events/day/user cap, LRU evict at 100 dedup entries
        ├── sample() — 0.1 sample rate for repeated errors
        │
        ├─► fetch(SENTRY_INGEST_URL) — POST JSON envelope
        │   └─► Sentry ingest (200 OK = success)
        │
        └─► chrome.storage.local buffer — fallback when offline/disabled/quota exceeded
```

### Configuration

**DSN (public constant):**

```
https://o4511298350612480.ingest.us.sentry.io/api/4511298353496064/envelope/
```

Embedded in `src/shared/constants.js:SENTRY_DSN`. Users can optionally override via `customSentryDsn` setting.

**Manifest Host Permission:**

```
"host_permissions": ["https://*.ingest.us.sentry.io/*"]
```

### Privacy Contract

- **Client-side sanitization:** All error payloads run through `sanitizeString()` before dispatch. URLs, emails, IPv4, IPv6 → `[REDACTED]`. Whitelist/blacklist domain counts never sent.
- **No IP tracking:** Server-side `user.ip_address: null` + Sentry dashboard "Prevent Storing of IP Addresses" setting.
- **Opt-in default OFF:** Setting `enableErrorReporting: false` on fresh install + update. No events sent until explicitly enabled in Options → Privacy & Diagnostics.
- **Consent persistence:** Force-flipped to `false` on `chrome.runtime.onInstalled` (install + update events) to prevent stale user settings from v0.0.5.

### Rate Limiting & Dedup

| Aspect              | Limit                                                              |
| ------------------- | ------------------------------------------------------------------ |
| **Daily cap**       | 100 events/day/user, UTC midnight reset                            |
| **Dedup window**    | 24 hours (FNV-1a fingerprint of error name + first 3 stack frames) |
| **Repeat sampling** | 0.1 sample rate for duplicate fingerprints (send 10% of repeats)   |
| **Dedup table max** | LRU evict at 100 entries to prevent unbounded memory               |

### Error Surfaces (Tags)

Five surfaces report errors:

- `service_worker` — Background service worker exceptions
- `popup` — Popup UI errors
- `options` — Options page errors
- `content_form` — Form-checker content script
- `content_youtube` — YouTube-tracker content script

### Storage (Fallback Buffer)

When Sentry endpoint unreachable (offline, 4xx/5xx), error saved to `chrome.storage.local` buffer under `error_buffer_*` keys (max 10 entries per surface, auto-evict oldest on overflow).

### Settings

| Key                    | Type   | Default | Description                                   |
| ---------------------- | ------ | ------- | --------------------------------------------- |
| `enableErrorReporting` | bool   | `false` | Master toggle for error reporting             |
| `customSentryDsn`      | string | `""`    | Advanced: override DSN (empty = use built-in) |

Both stored in `chrome.storage.sync` (cross-device) so setting persists across browsers.
