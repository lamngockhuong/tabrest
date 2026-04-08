# TabRest - System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CHROME BROWSER                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Popup     │  │   Options   │  │   Pages     │              │
│  │  (popup.*)  │  │ (options.*) │  │ (pages/*)   │              │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘              │
│         │                │                                      │
│         │    chrome.runtime.sendMessage                         │
│         ▼                ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   SERVICE WORKER                            ││
│  │                 (service-worker.js)                         ││
│  │  ┌─────────────┬─────────────┬─────────────┬──────────────┐ ││
│  │  │ unload-mgr  │ tab-tracker │ memory-mon  │ snooze-mgr   │ ││
│  │  │             │             │             │              │ ││
│  │  │ session-mgr │ stats-coll  │             │              │ ││
│  │  └─────────────┴─────────────┴─────────────┴──────────────┘ ││
│  └──────┬──────────────────────────────────────────────────────┘│
│         │                                                       │
│         │    chrome.tabs.sendMessage                            │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   CONTENT SCRIPTS                           ││
│  │  ┌─────────────────────┐  ┌─────────────────────┐           ││
│  │  │   form-checker.js   │  │ youtube-tracker.js  │           ││
│  │  │  (all http/https)   │  │ (youtube.com/watch) │           ││
│  │  └─────────────────────┘  └─────────────────────┘           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### Service Worker (Background)

Central orchestrator handling all extension logic.

```
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
│   └── stats-collector.js
└── Internal Functions
    ├── handleMessage()
    ├── getTabsWithStatus()
    ├── updateBadge()
    ├── configureToolbarAction()
    └── setupContextMenus()
```

### Module Responsibilities

| Module            | Primary Responsibility                          | Dependencies                   |
| ----------------- | ----------------------------------------------- | ------------------------------ |
| `unload-manager`  | Execute tab discards with protection checks     | stats-collector                |
| `tab-tracker`     | Track tab activity, trigger timer-based unloads | unload-manager, snooze-manager |
| `memory-monitor`  | Monitor RAM, trigger memory-based unloads       | tab-tracker, unload-manager    |
| `snooze-manager`  | Manage temporary protections                    | storage                        |
| `session-manager` | Save/restore tab sessions                       | storage                        |
| `stats-collector` | Track unload statistics                         | storage                        |

## Data Flow

### Automatic Tab Unloading (Timer)

```
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

```
1. chrome.alarms fires "memory-check-alarm" (every 30 sec)
       │
       ▼
2. memory-monitor.checkMemoryAndUnload()
       │
       ├── Check settings.memoryThresholdPercent > 0
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

```
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

| Event                    | Handler                                          | Action          |
| ------------------------ | ------------------------------------------------ | --------------- |
| `runtime.onStartup`      | Initialize all trackers, sync tabs, setup alarms | Startup         |
| `runtime.onInstalled`    | Same as startup + show onboarding/changelog      | Install/Update  |
| `tabs.onActivated`       | Update tab activity timestamp                    | Tab focus       |
| `tabs.onUpdated`         | Update activity, refresh badge                   | Tab navigation  |
| `tabs.onRemoved`         | Cleanup activity & memory entries                | Tab close       |
| `alarms.onAlarm`         | Route to appropriate check function              | Timer tick      |
| `commands.onCommand`     | Execute keyboard shortcut action                 | Hotkey          |
| `contextMenus.onClicked` | Execute context menu action                      | Right-click     |
| `storage.onChanged`      | Reconfigure alarms, toolbar, badge               | Settings change |
| `runtime.onMessage`      | Route to command handler                         | Message         |

### Alarm Schedule

| Alarm                  | Interval   | Purpose                |
| ---------------------- | ---------- | ---------------------- |
| `tab-check-alarm`      | 1 minute   | Check inactive tabs    |
| `memory-check-alarm`   | 30 seconds | Check RAM usage        |
| `snooze-cleanup-alarm` | 5 minutes  | Remove expired snoozes |

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
- `http://*/*`, `https://*/*`: Required for content scripts

### Data Security
- No external network requests
- All data stored locally
- No user tracking or analytics
