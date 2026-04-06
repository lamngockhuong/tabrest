# Privacy Policy for TabRest

Last updated: 2026-04-06

## Data Collection

TabRest does NOT collect, store, or transmit any personal data to external servers.

## Data Storage

All data is stored locally on your device using Chrome's storage API:

- **Extension settings** (sync storage) - Syncs with your Chrome account if signed in
- **Tab activity timestamps** (local storage only) - Used to track inactive tabs
- **Usage statistics** (local storage only) - Tabs unloaded count and estimated memory saved

## Permissions Explained

| Permission      | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| `tabs`          | Required to list, query, and discard tabs            |
| `storage`       | Required to save your settings and statistics        |
| `alarms`        | Required for timer-based auto-unload functionality   |
| `system.memory` | Required to monitor RAM usage for threshold triggers |
| `contextMenus`  | Required for right-click context menu options        |
| `tabGroups`     | Required for tab group unload features               |

## Third Parties

This extension does not communicate with any external servers or third parties. All functionality runs entirely within your browser.

## Data Retention

- Settings persist until you uninstall the extension or clear browser data
- Statistics can be reset manually from the options page
- No data is retained after extension removal

## Updates

This privacy policy may be updated when new features are added. The "Last updated" date will reflect any changes.

## Contact

For questions about this privacy policy, please open an issue on our GitHub repository.

## Open Source

TabRest is open source. You can review the complete source code to verify our privacy practices.
