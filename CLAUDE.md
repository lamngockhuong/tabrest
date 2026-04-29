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

## Writing Style

- **No em dash or en dash**: Never use `—` (U+2014) or `–` (U+2013) in any output - prose, code comments, docs, commit messages, PR descriptions, or chat replies. Use a hyphen-minus `-` (with surrounding spaces when used as a sentence break) or rephrase the sentence.
- **Exception**: UI placeholder values that intentionally render `—` as a "no value" indicator (e.g., `src/popup/popup.html` stat cells, `src/popup/popup.js` `textContent = "—"`). Do not change those.

<!-- gitnexus:start -->

# GitNexus — Code Intelligence

This project is indexed by GitNexus as **tabrest** (2176 symbols, 3410 relationships, 104 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource                                 | Use for                                  |
| ---------------------------------------- | ---------------------------------------- |
| `gitnexus://repo/tabrest/context`        | Codebase overview, check index freshness |
| `gitnexus://repo/tabrest/clusters`       | All functional areas                     |
| `gitnexus://repo/tabrest/processes`      | All execution flows                      |
| `gitnexus://repo/tabrest/process/{name}` | Step-by-step execution trace             |

## CLI

| Task                                         | Read this skill file                                        |
| -------------------------------------------- | ----------------------------------------------------------- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md`       |
| Blast radius / "What breaks if I change X?"  | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?"             | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md`       |
| Rename / extract / split / refactor          | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`     |
| Tools, resources, schema reference           | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md`           |
| Index, status, clean, wiki CLI commands      | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md`             |

<!-- gitnexus:end -->
