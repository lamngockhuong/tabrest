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

- **Auto-unload inactive tabs** - Configurable timer (15min to 4hrs)
- **Memory threshold** - Unload when RAM exceeds 60-90%
- **Startup unload** - Free memory when browser opens
- **Manual controls** - Unload current/left/right/other tabs
- **Tab groups** - Unload entire tab groups
- **Visual indicator** - Customizable prefix (💤) on discarded tab titles
- **Whitelist** - Protect sites from auto-unload
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

```
tabrest/
├── manifest.json           # Extension config (MV3)
├── _locales/               # i18n translations (en, vi)
├── src/
│   ├── background/         # Service worker modules
│   ├── popup/              # Popup UI
│   ├── options/            # Settings page
│   └── shared/             # Shared utilities
├── icons/                  # Extension icons
└── docs/                   # Store assets
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

## License

MIT
