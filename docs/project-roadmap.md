# TabRest - Project Roadmap

## Current Version: 0.0.4

### Completed Features

#### Core Functionality
- [x] Auto-unload inactive tabs (configurable 15min-4hrs)
- [x] Memory threshold monitoring (60-90% RAM)
- [x] Per-tab JS heap limit (100MB-1GB)
- [x] Startup auto-unload option
- [x] Power modes (battery-saver, normal, performance)
- [x] Minimum tab count threshold

#### Manual Controls
- [x] Unload current tab (switches to adjacent)
- [x] Unload other tabs
- [x] Unload tabs to left/right
- [x] Unload tab groups
- [x] Context menus (page + toolbar)
- [x] Keyboard shortcuts (Alt+Shift+D/O/←/→)
- [x] Configurable toolbar click action

#### Protection Rules
- [x] Domain whitelist
- [x] Domain blacklist (immediate unload)
- [x] Pinned tab protection
- [x] Audio tab protection
- [x] Form data protection
- [x] Snooze tab (30min-2hrs)
- [x] Snooze domain (30min-2hrs)

#### Quality of Life
- [x] Visual prefix on discarded tabs (💤)
- [x] Scroll position restore
- [x] YouTube timestamp save/restore
- [x] Skip when offline
- [x] Notifications on auto-unload
- [x] Badge count for discarded tabs
- [x] Statistics tracking
- [x] Session save/restore
- [x] Idle state detection option
- [x] Copy tab list to clipboard

#### UI/UX
- [x] Popup with tab list and status
- [x] Options page with all settings
- [x] Onboarding page for new users
- [x] Changelog page for updates
- [x] Dark/light theme support
- [x] Internationalization (EN, VI)

#### Infrastructure
- [x] Manifest V3 compliance
- [x] No build step (vanilla JS)
- [x] Biome linting
- [x] CI pipeline (GitHub Actions)
- [x] Release-please automation
- [x] Astro documentation website

---

## Roadmap

### Phase 1: Polish & Release (Q2 2026)

**Goal:** Chrome Web Store release

| Task                           | Priority | Status      |
| ------------------------------ | -------- | ----------- |
| Chrome Web Store listing       | High     | Pending     |
| Store screenshots/promo images | High     | Done        |
| Privacy policy page            | High     | Done        |
| User testing & bug fixes       | High     | In Progress |
| Performance optimization       | Medium   | Pending     |
| Accessibility audit            | Medium   | Pending     |

### Phase 2: Feature Enhancements (Q3 2026)

**Goal:** User-requested features

| Feature                   | Description                       | Priority | Status      |
| ------------------------- | --------------------------------- | -------- | ----------- |
| Tab search/filter         | Search tabs by title/URL in popup | Medium   | Filter done |
| Import/export settings    | Backup and restore configuration  | Low      |
| Tab usage analytics       | Dashboard showing usage patterns  | Low      |
| Custom keyboard shortcuts | Let users customize hotkeys       | Low      |
| More languages            | Add more i18n translations        | Low      |

### Phase 3: Advanced Features (Q4 2026)

**Goal:** Power user features

| Feature                 | Description                             | Priority |
| ----------------------- | --------------------------------------- | -------- |
| Rule-based unloading    | Custom rules beyond whitelist/blacklist | Medium   |
| Tab aging visualization | Show how long tabs have been open       | Low      |
| Browser sync            | Sync settings across devices            | Low      |
| Tab archiving           | Long-term storage of closed tabs        | Low      |

---

## Version History

### v0.0.4 (Current)
- **Phase 06:** Auto-open changelog on minor/major version bumps (silent for patch updates)
- **Phase 07:** Optional host_permissions + on-demand form-checker injection (breaking for v0.0.3 users)
- **Phase 08:** Suspend warning toast (3s delay before auto-unload), optional form protection
- **Phase 09:** Side panel mode (alternative to popup, reuses popup UI, new `chrome.windows.onFocusChanged` listener)
- **Phase 10:** Import/export sessions (clipboard-based) + whitelist/blacklist export/import in options
- Fixed per-tab JS heap memory monitoring regression

### v0.0.3
- Added tab filter chips (All/Sleeping/Snoozed/Protected)
- Fixed cancel snooze for domain-snoozed tabs
- Improved snooze button UX (show on hover)

### v0.0.2
- Added snooze functionality (tabs and domains)
- Added scroll position restore
- Added skip when offline option
- Added auto-unload notifications
- Improved tab list UI in popup
- Bug fixes and performance improvements

### v0.0.1 (Initial)
- Core auto-unload functionality
- Timer and memory-based unloading
- Whitelist/blacklist protection
- Basic popup UI
- Options page
- Keyboard shortcuts

---

## Technical Debt

| Item                         | Impact          | Effort |
| ---------------------------- | --------------- | ------ |
| Split popup.js (715 LOC)     | Maintainability | Medium |
| Add unit tests               | Reliability     | High   |
| Reduce popup.css (1053 LOC)  | Maintainability | Low    |
| Extract shared UI components | Reusability     | Medium |

---

## Success Metrics

| Metric                  | Target        |
| ----------------------- | ------------- |
| Chrome Web Store rating | 4.5+ stars    |
| Weekly active users     | 1,000+        |
| Memory saved per user   | 500MB+ daily  |
| Crash reports           | < 1% of users |
| Load time (popup)       | < 100ms       |

---

## Contributing

Contributions welcome! Priority areas:
1. Bug reports and fixes
2. New language translations
3. Documentation improvements
4. Performance optimizations

See repository README for development setup.
