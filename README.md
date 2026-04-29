🇬🇧 **English** | 🇻🇳 [Tiếng Việt](README.vi.md)

<p align="center">
  <img src="icons/icon-128.png" alt="TabRest Logo" width="128" height="128">
</p>

<h1 align="center">TabRest</h1>

<p align="center">
  Rest your tabs, free your memory - a Chrome extension that automatically unloads inactive tabs.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?logo=googlechrome" alt="Manifest V3">
  <img src="https://img.shields.io/github/actions/workflow/status/lamngockhuong/tabrest/ci.yml?branch=main&logo=github" alt="CI Status">
  <img src="https://img.shields.io/badge/code_style-biome-60a5fa?logo=biome" alt="Code Style: Biome">
  <img src="https://img.shields.io/badge/JavaScript-ES_Modules-f7df1e?logo=javascript&logoColor=black" alt="JavaScript ES Modules">
  <img src="https://img.shields.io/github/license/lamngockhuong/tabrest" alt="License">
</p>

## Features

- **Auto-unload inactive tabs** - Configurable timer (5min to 4hrs)
- **Memory threshold** - Unload when RAM exceeds 60-95%
- **Per-tab memory limit** - Unload tabs using >100MB-1GB JS heap
- **Startup unload** - Free memory when browser opens
- **Manual controls** - Unload current/left/right/other tabs
- **Close duplicate tabs** - One-click dedup in current window
- **Tab search** - Live filter tab list by title or URL
- **Tab groups** - Unload entire tab groups
- **Side panel mode** - Open TabRest in Chrome's side panel (opt-in)
- **Snooze tabs/sites** - Temporarily protect tabs or domains (30min-2hrs)
- **Suspend warning toast** - 3s on-page warning before auto-discard
- **Visual indicator** - Customizable prefix (💤) on discarded tab titles
- **Whitelist** - Protect sites from auto-unload (supports localhost & IP)
- **Import/Export** - Back up whitelists, blacklists, and sessions to JSON
- **Sessions** - Save and restore tab sets
- **Scroll restore** - Restore scroll position when tabs reload
- **YouTube timestamp** - Resume videos at last position after reload
- **Skip when offline** - Don't discard tabs when network unavailable
- **Idle-only mode** - Only auto-unload when computer is idle
- **Power Mode** - Battery-saver, normal, or performance profiles
- **Auto-unload notifications** - Get notified when tabs are unloaded
- **Memory tooltip** - Hover stats to see estimated RAM saved per tab
- **Onboarding wizard** - Interactive multi-step setup on first run
- **Opt-in error reporting** - Anonymous crash reports via Sentry (off by default) plus manual bug-report submit
- **Auto-open changelog** - Opens release notes on minor/major updates
- **Optional host permissions** - Form protection only requests access when enabled
- **RAM usage display** - Live RAM % in popup header
- **Statistics** - Track tabs unloaded and memory saved
- **Multi-language** - English and Vietnamese supported

## Keyboard Shortcuts

| Shortcut      | Action                   |
| ------------- | ------------------------ |
| `Alt+Shift+D` | Unload current tab       |
| `Alt+Shift+O` | Unload other tabs        |
| `Alt+Shift+→` | Unload tabs to the right |
| `Alt+Shift+←` | Unload tabs to the left  |

## Installation

### From Source

1. Clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the project folder

### From Chrome Web Store

Coming soon.

## How It Works

TabRest uses Chrome's native `chrome.tabs.discard()` API to unload tabs. Discarded tabs:

- Stay visible in the tab bar
- Preserve their scroll position and form data
- Reload instantly when clicked
- Free up memory while inactive

## Project Structure

```text
tabrest/
├── manifest.json           # Extension config (MV3)
├── _locales/               # i18n translations (en, vi)
├── src/
│   ├── background/         # Service worker modules
│   ├── content/            # Form checker, YouTube tracker
│   ├── popup/              # Popup / side panel UI
│   ├── options/            # Settings page
│   ├── pages/              # Onboarding, changelog
│   └── shared/             # Shared utilities
├── icons/                  # Extension icons
├── website/                # Astro docs site (tabrest.ohnice.app)
└── docs/                   # Project documentation
```

## Development

```bash
pnpm install          # Install dependencies
pnpm run lint         # Check code with Biome
pnpm run lint:fix     # Auto-fix lint issues
pnpm run format       # Format code
pnpm run ci           # Run full CI (validate + lint)
```

## Promo Assets

Chrome Web Store promotional images are in `assets/` as SVG sources.

```bash
./scripts/generate-promo-images.sh   # Generate PNG files
```

## Privacy

- No data collection
- No external servers
- All settings stored locally
- See [Privacy Policy](docs/privacy-policy.md)

## Sponsor

If you find this extension useful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/GitHub_Sponsors-Support-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lamngockhuong)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-Support-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/lamngockhuong)
[![MoMo](https://img.shields.io/badge/MoMo-Support-ae2070)](https://me.momo.vn/khuong)

## Other Projects

- [GitHub Flex](https://github.com/lamngockhuong/github-flex) - Cross-browser extension that enhances GitHub's interface with productivity features
- [Termote](https://github.com/lamngockhuong/termote) - Remote control CLI tools (Claude Code, GitHub Copilot, any terminal) from mobile/desktop via PWA

## License

MIT
