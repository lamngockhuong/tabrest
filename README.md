# TabRest

Rest your tabs, free your memory - a Chrome extension that automatically unloads inactive tabs.

## Features

- **Auto-unload inactive tabs** - Configurable timer (15min to 4hrs)
- **Memory threshold** - Unload when RAM exceeds 60-90%
- **Startup unload** - Free memory when browser opens
- **Manual controls** - Unload current/left/right/other tabs
- **Tab groups** - Unload entire tab groups
- **Whitelist** - Protect sites from auto-unload
- **Statistics** - Track tabs unloaded and memory saved

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
├── src/
│   ├── background/         # Service worker modules
│   ├── popup/              # Popup UI
│   ├── options/            # Settings page
│   └── shared/             # Shared utilities
├── icons/                  # Extension icons
└── docs/                   # Store assets
```

## Privacy

- No data collection
- No external servers
- All settings stored locally
- See [Privacy Policy](docs/privacy-policy.md)

## License

MIT
