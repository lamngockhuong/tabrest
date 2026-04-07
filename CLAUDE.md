# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TabRest is a Chrome extension (Manifest V3) that automatically unloads inactive tabs to free memory. No build step required - vanilla JavaScript with ES modules.

## Development Commands

```bash
# Load extension in Chrome
# 1. Go to chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select the project root directory

# View service worker logs
# Go to chrome://extensions → TabRest → "Inspect views: service worker"

# Test keyboard shortcuts
# chrome://extensions/shortcuts
```

## Architecture

### Module Dependency Flow

```
service-worker.js (orchestrator)
    ├── unload-manager.js (core discard logic)
    │       └── stats-collector.js (usage tracking)
    ├── tab-tracker.js (LRU activity tracking)
    │       └── unload-manager.js
    └── memory-monitor.js (RAM threshold checks)
            └── tab-tracker.js (for LRU list)
            └── unload-manager.js

shared/
    ├── constants.js (SETTINGS_DEFAULTS, ALARM_NAMES, STORAGE_KEYS, POWER_MODE_CONFIG)
    ├── storage.js (chrome.storage wrapper with caching)
    └── utils.js (formatBytes)

content/
    ├── form-checker.js (detects unsaved forms, reports JS heap memory)
    └── youtube-tracker.js (saves/restores YouTube playback position)
```

### Key Design Decisions

- **Settings caching**: `storage.js` caches settings in memory, invalidated on `chrome.storage.onChanged`
- **LRU tracking**: `tab-tracker.js` maintains in-memory `tabActivity` map, debounced to storage
- **Timers**: Uses `chrome.alarms` (not setInterval) to survive service worker termination
- **Whitelist check**: Sync function accepting settings param to avoid redundant storage reads

### Communication Patterns

- **Popup → Background**: `chrome.runtime.sendMessage({ command, ...data })`
- **Background → Popup**: Response via `sendResponse()`
- **Settings sync**: `chrome.storage.sync` for cross-device, `chrome.storage.local` for tab activity

### Chrome APIs Used

| API                         | Purpose                                |
| --------------------------- | -------------------------------------- |
| `chrome.tabs.discard()`     | Unload tab preserving state            |
| `chrome.alarms`             | Periodic checks (1min tab, 30s memory) |
| `chrome.system.memory`      | RAM usage monitoring                   |
| `chrome.storage.sync/local` | Settings and activity persistence      |
| `chrome.contextMenus`       | Right-click menu                       |
| `chrome.commands`           | Keyboard shortcuts                     |
| `chrome.idle`               | Idle state detection                   |
| `chrome.action`             | Toolbar icon click handling            |
| `chrome.scripting`          | Inject title prefix for discarded tabs |
