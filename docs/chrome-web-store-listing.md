# Chrome Web Store Listing - TabRest

All content for TabRest's Chrome Web Store listing. Translated versions live at `docs/<locale>/chrome-web-store-listing.md` for: vi, es, pt-BR, ja, zh-CN, ko, de, fr, ru, id (user-facing sections only).

## Basic Info

Listing fields entered into the Chrome Web Store developer dashboard.

| Field                | Value                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| **Package name**     | TabRest - Rest your tabs, free your RAM                               |
| **Summary**          | Rest your tabs, free your memory - automatically unload inactive tabs |
| **Category**         | Functionality & UI                                                    |
| **Default language** | English - en                                                          |

## Additional fields

| Field              | Value                                             |
| ------------------ | ------------------------------------------------- |
| **Official URL**   | None                                              |
| **Homepage URL**   | <https://tabrest.ohnice.app>                      |
| **Support URL**    | <https://github.com/lamngockhuong/tabrest/issues> |
| **Mature content** | No                                                |

## What's New

Paste the content below into the Chrome Web Store "What's new" field on each release.

```
NEW: Interactive Setup Wizard

First-time install now opens a friendly 6-step wizard that walks you through the most useful settings - auto-unload timer, whitelist suggestions, power mode, and notifications. Each step is skippable and your existing defaults are preserved if you skip.

Already installed? You can rerun the wizard anytime from Options > Footer > "Run setup again".

OTHER IMPROVEMENTS:
- Refreshed install/welcome experience with smooth slide transitions
- Reduced-motion support for accessibility
- Pin-to-toolbar reminder so you can find TabRest faster
- Polished options page footer
- Multi-language wizard (English & Vietnamese)

PRIVACY:
All settings stored locally on your device. Optional anonymous error reporting remains opt-in (disabled by default).
```

## Short Description

132 characters maximum. Used as the store listing tagline.

```text
Rest your tabs, free your memory - automatically unload inactive tabs to keep Chrome fast and responsive.
```

## Full Description

Long-form marketing copy used in the Chrome Web Store description field.

```text
TabRest automatically unloads inactive browser tabs to free up memory and keep your computer running smoothly.

🎯 PERFECT FOR:
• Users with many tabs open
• Computers with limited RAM
• Anyone who wants a faster browsing experience

✨ KEY FEATURES:

📌 Smart Auto-Unload
• Configurable inactivity timer (5 minutes to 4 hours)
• Memory threshold trigger (60-95% RAM usage)
• Per-tab memory limit (unload tabs using >100MB-1GB JS heap)
• Startup unload option to free memory when browser opens
• Skip when offline - don't unload tabs when network unavailable

⌨️ Manual Controls & Keyboard Shortcuts
• Unload current tab: Alt+Shift+D
• Unload other tabs: Alt+Shift+O
• Unload tabs to the right: Alt+Shift+Right
• Unload tabs to the left: Alt+Shift+Left
• Right-click context menu for quick access

🛡️ Protection Features
• Whitelist domains to never unload
• Snooze individual tabs (30 min - 2 hours)
• Snooze entire domains temporarily
• Skip tabs with playing audio/video
• Skip tabs with unsaved forms
• Protect pinned tabs option

📊 Statistics & Monitoring
• Live RAM usage display in popup
• Track total tabs unloaded
• Track total memory saved
• Visual indicator (💤) on discarded tab titles

🔧 Additional Features
• Tab group support - unload entire groups
• YouTube position restore - resume where you left off
• Scroll position restore when tabs reload
• Auto-unload notifications
• Close duplicate tabs - one-click deduplication in popup
• Tab search - live filter by title or URL
• Memory estimate tooltip - hover to see per-tab memory breakdown
• Suspend warning toast - 3 second gentle warning before auto-unload
• Side panel mode - open UI in persistent browser sidebar instead of popup (stays visible as you switch tabs)
• Import/export settings - backup and restore whitelists, blacklists, and sessions to clipboard JSON
• Interactive setup wizard - guided 6-step onboarding on install (rerun anytime from Options)
• Optional anonymous error reporting (opt-in) - helps us fix bugs while protecting your privacy
• Multi-language support
• Auto-open changelog - view what's new on updates (minor/major releases only)

💡 HOW IT WORKS:
TabRest uses Chrome's native tabs.discard() API. Discarded tabs:
• Stay visible in your tab bar
• Preserve scroll position and form data
• Reload instantly when clicked
• Free up memory while inactive

🔒 PRIVACY:
• No data collection by default
• Optional anonymous error reporting (disabled by default, fully transparent)
• When enabled: errors anonymized, PII redacted, max 100/day, 30-day retention
• All settings stored locally on your device
• Open source: https://github.com/lamngockhuong/tabrest

🌐 WEBSITE: https://tabrest.ohnice.app

Made with ❤️ for tab hoarders everywhere.
```

## Permissions Justification

Copy each block into the matching field in the Chrome Web Store dashboard. All entries stay under the 1000-character limit.

## Single purpose

```text
TabRest automatically unloads (discards) inactive browser tabs to free up RAM and keep the browser responsive. The extension monitors tab activity and system memory, then uses chrome.tabs.discard() to suspend tabs that meet user-configured criteria (inactivity timer, memory threshold, per-tab heap limit) while preserving scroll position, form data, and tab visibility. Users can also unload tabs manually via popup buttons, keyboard shortcuts, or the right-click context menu, and protect specific tabs/domains via whitelist or snooze.
```

## Per-permission rationale

### `tabs` _(core)_

```text
Required to enumerate open tabs, read their last-active timestamp, title, and URL (for domain-based whitelist matching), and call chrome.tabs.discard() to unload them. Also used to detect audio playback (mutedInfo/audible) so tabs playing media are skipped, and to display the tab list inside the popup and side panel UI. Without this permission TabRest cannot identify or unload any tabs.
```

### `storage`

```text
Stores user settings (auto-unload timer, RAM threshold, whitelist/blacklist, power mode, notifications toggle, etc.) via chrome.storage.sync so they roam across signed-in devices, and stores tab activity (LRU timestamps), snooze state, and aggregated statistics (tabs unloaded, memory saved) in chrome.storage.local. No browsing history or page content is stored.
```

### `alarms`

```text
Used to schedule periodic background checks via chrome.alarms (every 1 minute for inactive-tab evaluation, every 30 seconds for memory threshold monitoring). chrome.alarms is required because Manifest V3 service workers terminate when idle - setInterval/setTimeout would not survive worker shutdown, breaking the auto-unload feature.
```

### `system.memory`

```text
Used to read total/available system RAM via chrome.system.memory.getInfo() so TabRest can trigger auto-unload when memory pressure crosses the user-configured threshold (60-95%) and display a live RAM usage indicator in the popup. Only aggregate memory stats are read; no process-level or per-application data is collected.
```

### `contextMenus`

```text
Adds right-click menu entries on tabs (Unload tab, Unload other tabs, Snooze tab 30 min / 1 hour, Snooze site 1 hour, Open link in suspended tab) so users can perform tab management actions without opening the popup. No page content is read through context menus.
```

### `tabGroups`

```text
Used to read tab group membership and color so the popup can display tabs grouped together, and to support the "unload entire group" action. Only group metadata (id, title, color, collapsed state) is accessed; no group content or external data is collected.
```

### `scripting`

```text
Used to inject two small content scripts on demand: (1) a form checker that detects unsaved form input so tabs with active forms are skipped during auto-unload, and (2) a title-prefix script that prepends a sleep indicator (💤) to discarded tab titles so users can visually identify suspended tabs. No page content is read or transmitted; the scripts only inspect form state and update document.title locally.
```

### `idle`

```text
Used via chrome.idle.queryState() / onStateChanged to detect when the user goes idle or locks the screen. This lets TabRest pause certain background work and adjust auto-unload timing (e.g., avoid unloading the active tab the moment the user steps away). No user activity data is logged or transmitted.
```

### `notifications`

```text
Used to display optional system notifications when tabs are auto-unloaded (e.g., "5 tabs unloaded, 320 MB freed"). Notifications are user-controllable in Settings and can be turned off entirely. No notification content includes URLs or sensitive page data - only aggregate counts.
```

### `sidePanel`

```text
Enables an optional Side Panel mode where the TabRest UI opens in Chrome's persistent sidebar instead of the popup, so the tab list and stats remain visible as the user switches tabs. This is opt-in via Settings; the default behavior is the standard popup.
```

## Host Permissions & Remote Code

## Host permission justification

**Manifest:** `host_permissions: ["https://*.ingest.us.sentry.io/*"]` + `optional_host_permissions: ["http://*/*", "https://*/*"]`

```text
The required host "https://*.ingest.us.sentry.io/*" is used solely to send crash/error reports to Sentry when the user explicitly opts in to anonymous error reporting (disabled by default in Settings > Privacy & Diagnostics). Reports are sanitized client-side before transmission - no URLs, page content, emails, IP addresses, or browsing history are sent; only stack traces and sanitized error metadata. Users can disable reporting at any time and no traffic to sentry.io occurs while the toggle is off.

The optional hosts "http://*/*" and "https://*/*" are requested only on demand (chrome.permissions.request) when the user enables the "Add 💤 prefix to discarded tab titles" feature, which requires injecting a tiny title-update script into discarded pages. The permission is not granted at install time and the user can revoke it from chrome://extensions at any time.
```

## Remote code disclosure

```text
NO. The extension does not use remote code.

All JavaScript and Wasm shipped with TabRest is bundled inside the extension package. The extension does not load remote scripts via <script src> from external domains, does not eval() remote payloads, and does not use any module loaders that fetch code at runtime.

Note: The Sentry SDK that ships with TabRest sends error reports over HTTPS to sentry.io, but it does not download or execute remote code; it only transmits sanitized error data when the user has explicitly opted in.
```

## Data Usage

Information disclosed in the Chrome Web Store "Privacy practices" tab.

## Data types collected

Tick **none** of the following categories. TabRest does not collect any of them.

| Category                                  | Collected? | Reason                                                    |
| ----------------------------------------- | ---------- | --------------------------------------------------------- |
| Personally identifiable information (PII) | No         | No name, email, or address collected                      |
| Health information                        | No         | Not applicable                                            |
| Financial / payment information           | No         | Free extension, no transactions                           |
| Authentication information                | No         | No password / PIN collected                               |
| Personal communications                   | No         | No email or message reading                               |
| Location                                  | No         | No IP or GPS used                                         |
| Web history                               | No         | URLs/titles processed locally only, never transmitted     |
| User activity                             | No         | No click/keystroke logging; LRU timestamps stored locally |
| Website content                           | No         | Page content not read or transmitted                      |

> **Important note:** TabRest accesses tab URLs/titles (via the `tabs` permission) and reads form state (via `scripting`), but everything is processed locally on the device and **never leaves the user's machine**. When a user opts in to anonymous error reporting, only sanitized stack traces and metadata are sent to Sentry - no URLs, PII, or page content.

## Disclosures

Tick all 3:

- I do not sell or transfer user data to third parties (outside approved use cases - Sentry acts as a processor, not data sale)
- I do not use or transfer user data for purposes unrelated to the single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

## Privacy policy URL

```text
https://tabrest.ohnice.app/docs/privacy-policy/
```

## Screenshots Guide

How to capture the 5 store screenshots required for the Chrome Web Store listing.

## Store icon

- **Size:** 128 x 128 pixels
- **Status:** uploaded

## Technical requirements

| Item       | Spec                                      |
| ---------- | ----------------------------------------- |
| Format     | PNG or JPEG (SVG not accepted)            |
| Size       | **1280x800** preferred, or 640x400        |
| Quantity   | 1 to 5; the store displays up to 5        |
| Output dir | `assets/screenshots/` (create if missing) |

## General setup before capturing

1. **Browser**: Chrome at 1280x800 viewport (View > Actual Size, zoom 100%)
2. **Theme**: light or dark, consistent across all 5 screenshots (dark recommended to match indigo branding)
3. **Test account**: create an empty Chrome profile, load the unpacked extension from a clean HEAD
4. **Demo data**: open 8-12 real tabs (gmail, youtube, github, docs, news sites) so the popup has rich content; click through them so LRU has data; wait a few minutes for stats to accumulate
5. **Capture tool**: macOS `Cmd+Shift+4` then `Space` to capture a window (nice shadow), or use `Shottr`/`CleanShot X` for pixel-perfect captures
6. **Crop**: resize/crop to 1280x800 before upload
7. **Privacy**: blur emails, file names, and sensitive tab content before publishing

## Screenshot 1 - Main popup (REQUIRED)

**Content:** hero shot of the popup with full stats, tab list, and action buttons.

**Steps:**

1. Open 10+ tabs including 1-2 already discarded (right-click > Unload, or wait for the timer)
2. Click the TabRest icon to open the popup
3. Confirm the view shows: top RAM bar, several tabs with the "sleeping" badge, and the "Unload Others" / "Unload Current" buttons
4. Capture the popup alone (popup is roughly 360x600), then composite onto an indigo gradient background to fill 1280x800
5. Optional: add callouts "📊 Live RAM usage" and "💤 Sleeping tabs"

## Screenshot 2 - Options / Settings (REQUIRED)

**Content:** options page with Auto-Unload, Power Mode, and Whitelist visible.

**Steps:**

1. Open `chrome-extension://<ID>/src/options/options.html`
2. Scroll to the section showing the Auto-Unload timer, Power Mode cards, and Whitelist (with sample domains: youtube.com, gmail.com, docs.google.com, github.com, figma.com)
3. Capture the 1280x800 viewport directly
4. Optional callout: "⚙️ Granular control"

## Screenshot 3 - Keyboard shortcuts (graphic)

**Content:** visual representation of the 4 keyboard shortcuts.

**Steps:**

1. Create a 1280x800 graphic with an indigo gradient background (reuse from `promo-banner` SVG)
2. Render 4 keycap designs:
   - `Alt + Shift + D` -> Unload current tab
   - `Alt + Shift + O` -> Unload other tabs
   - `Alt + Shift + Right` -> Unload tabs to the right
   - `Alt + Shift + Left` -> Unload tabs to the left
3. Use Figma/Canva/SVG, export as 1280x800 PNG

## Screenshot 4 - Stats & memory saved

**Content:** popup "Stats" section with real numbers.

**Steps:**

1. Use the extension for 1-2 days to accumulate real stats (Tabs unloaded today/all-time, RAM saved, Member since)
2. Open the popup and scroll to the Stats section
3. Capture the popup zoomed into the stats card
4. Composite onto a background, highlight the numbers with an indigo glow

## Screenshot 5 - Context menu / Snooze

**Content:** right-click menu on a tab showing TabRest actions.

**Steps:**

1. Right-click any tab in the tab bar
2. Capture the full menu showing "Snooze Tab (30 min)", "Snooze Tab (1 hour)", "Snooze Site (1 hour)", "Open Link in Suspended Tab"
3. macOS: must use `Cmd+Shift+5` to record video then extract a frame, since the context menu closes when focus is lost
4. Crop and composite onto an indigo background

## Final PNG export

1. Save files as `assets/screenshots/screenshot-01-popup.png` ... `screenshot-05-context.png`
2. Verify size: `sips -g pixelWidth -g pixelHeight assets/screenshots/*.png`
3. Optimize: `pngquant --quality=80-95 assets/screenshots/*.png --ext .png --force`
4. Upload in order 1 to 5 in the Chrome Web Store dashboard

## Compositing screenshots into promo SVGs

`promo-*.svg` files contain a `📸 SCREENSHOT PLACEHOLDER` region (dashed border). Two ways to composite:

**A. Edit the SVG directly**

1. Open the SVG in an editor
2. Find the `<g transform="translate(...)">` containing the `<rect ... stroke-dasharray>` placeholder
3. Replace with `<image href="screenshots/screenshot-01-popup.png" width="..." height="..."/>`
4. Run `bash scripts/generate-promo-images.sh` to export PNGs

**B. Composite in a design tool (simpler)**

1. Run `bash scripts/generate-promo-images.sh` to get the background PNGs
2. Open Figma/Photopea, import background PNG and screenshot
3. Place the screenshot at the placeholder position, export a flattened PNG

## Promotional Tiles

SVG sources live in `assets/`. PNGs are exported via the helper script.

## File mapping

| Chrome Web Store slot | Spec            | SVG file                                | Status                                      |
| --------------------- | --------------- | --------------------------------------- | ------------------------------------------- |
| Small promo tile      | 440x280 PNG     | `promo-small-440x280.svg`               | export PNG                                  |
| Marquee promo tile    | 1400x560 PNG    | `promo-marquee-1400x560.svg`            | export PNG (newly created)                  |
| Screenshots           | 1280x800 PNG x5 | `promo-banner/02/03/04/05-1280x800.svg` | composite real screenshots, then export PNG |
| (not used in store)   | 920x680         | `promo-large-920x680.svg`               | optional for social/web                     |

## Build PNG

```bash
## Requires: rsvg-convert + imagemagick
brew install librsvg imagemagick

## Export all banner SVGs to PNG (2x supersampling, Lanczos)
bash scripts/generate-promo-images.sh
```

## Banner content status

Aligned with the actual feature set:

- **`promo-04-automation`**: timer text `5 minutes to 4 hours, your choice` (matches options 5/10/15/30/60/120/240 min); RAM threshold `60-95%` (matches actual options).
- **`promo-03-privacy`**: removed `Zero analytics. Zero cloud.` and `We don't watch you` (incorrect since v0.1.0+ ships with Sentry error reporting opt-in). Replaced with `Privacy-first. Local by default. Opt-in only.` plus a card `No Auto-Collect / Reporting is opt-in`.
- **`80% RAM`**: claim is consistent across banners and the website (`website/src/content/docs/*/getting-started.mdx`). The listing's `60-95%` is a threshold range, not a savings claim - no conflict.

## Remaining work before submit

- All banners still show `📸 SCREENSHOT PLACEHOLDER` - composite real screenshots in (see [screenshots-guide.md](screenshots-guide.md) section "Compositing screenshots into promo SVGs").

## Submission Checklist

Pre-submit checks before publishing a new TabRest version to the Chrome Web Store.

## Listing content

- [ ] English description copied into the form
- [ ] Localized descriptions added for each supported locale (vi, es, pt-BR, ja, zh-CN, ko, de, fr, ru, id) - paste from `docs/<locale>/chrome-web-store-listing.md`
- [ ] At least 1 screenshot uploaded (recommended: all 5)
- [ ] Homepage URL: <https://tabrest.ohnice.app>
- [ ] Support URL: <https://github.com/lamngockhuong/tabrest/issues>
- [ ] Small promo tile uploaded (optional)
- [ ] Marquee promo tile uploaded (optional)
- [ ] Privacy practices tab filled (single purpose, permission justifications, host permissions, remote code, data usage)
- [ ] Privacy policy URL set: <https://tabrest.ohnice.app/docs/privacy-policy/>

## Final review

- [ ] All content reviewed once more
- [ ] Preview the listing before clicking submit
