# TabRest - Project Overview & PDR

## Product Overview

**TabRest** is a Chrome extension that automatically unloads inactive browser tabs to free system memory. It uses Chrome's native `chrome.tabs.discard()` API to suspend tabs while preserving their state, allowing instant restoration when needed.

**Tagline:** "Rest your tabs, free your memory"

## Target Users

- Power users with many open tabs (10+ tabs regularly)
- Users on memory-constrained devices
- Professionals who keep research/reference tabs open
- Developers with multiple documentation tabs

## Problem Statement

Browser tabs consume significant memory even when inactive. Users with many tabs experience:
- System slowdowns
- Browser crashes
- Reduced battery life
- Reluctance to open new tabs

## Solution

TabRest automatically identifies and unloads inactive tabs based on:
- **Time-based:** Tabs inactive beyond configurable threshold (15min-4hrs)
- **Memory-based:** System RAM usage exceeds threshold (60-90%)
- **Per-tab memory:** Individual tab JS heap exceeds limit (100MB-1GB)

Unloaded tabs remain visible in the tab bar and restore instantly when clicked.

## Key Features

### Automatic Unloading
| Feature          | Description                                |
| ---------------- | ------------------------------------------ |
| Inactivity timer | Unload after 15min-4hrs of inactivity      |
| Memory threshold | Unload when RAM exceeds 60-90%             |
| Per-tab JS heap  | Unload tabs using >100MB-1GB heap          |
| Startup unload   | Free memory when browser opens             |
| Power modes      | Battery-saver, normal, performance presets |

### Manual Controls
| Feature            | Description                               |
| ------------------ | ----------------------------------------- |
| Unload current     | Discard active tab (switches to adjacent) |
| Unload others      | Discard all except active                 |
| Unload left/right  | Directional bulk unload                   |
| Unload group       | Discard entire tab group                  |
| Context menus      | Right-click quick actions                 |
| Keyboard shortcuts | Alt+Shift+D/O/←/→                         |

### Protection Rules
| Rule        | Description                                 |
| ----------- | ------------------------------------------- |
| Whitelist   | Never unload specified domains              |
| Blacklist   | Always unload specified domains immediately |
| Pinned tabs | Optional protection                         |
| Audio tabs  | Protect tabs playing audio                  |
| Form tabs   | Detect unsaved form data                    |
| Snooze      | Temporarily protect tab/domain (30min-2hrs) |

### Quality-of-Life
| Feature          | Description                                       |
| ---------------- | ------------------------------------------------- |
| Visual indicator | Configurable prefix (e.g., "💤") on discarded tabs |
| Scroll restore   | Preserve scroll position across reload            |
| YouTube resume   | Save/restore video playback position              |
| Offline skip     | Don't discard when network unavailable            |
| Notifications    | Alert when tabs auto-unloaded                     |
| Statistics       | Track tabs unloaded, memory saved                 |
| Sessions         | Save/restore tab collections                      |

### Internationalization
- English (default)
- Vietnamese

## Technical Requirements

### Platform
- Chrome browser (Manifest V3)
- No external dependencies for core extension
- Works offline after installation

### Permissions Required
```
tabs, storage, alarms, system.memory, contextMenus,
tabGroups, scripting, idle, notifications
host_permissions: http://*/*, https://*/*
```

### Performance Targets
- < 50ms response time for popup actions
- < 1% CPU usage when idle
- Minimal memory footprint (~5-10MB)
- Alarm-based checks (survives service worker termination)

## Version History

| Version | Status  | Key Changes                                         |
| ------- | ------- | --------------------------------------------------- |
| 0.0.2   | Current | Snooze, scroll restore, offline skip, notifications |
| 0.0.1   | Initial | Core unload functionality                           |

## Links

- **Website:** https://tabrest.khuong.dev
- **Repository:** GitHub (lamngockhuong/tabrest)
- **Chrome Web Store:** Coming soon
