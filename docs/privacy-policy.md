# Privacy Policy for TabRest

Last updated: 2026-04-08

## Data Collection

TabRest does NOT collect, store, or transmit any personal data to external servers.

## Data Storage

All data is stored locally on your device using Chrome's storage API:

- **Extension settings** (sync storage) - Syncs with your Chrome account if signed in
- **Tab activity timestamps** (local storage only) - Used to track inactive tabs
- **Usage statistics** (local storage only) - Tabs unloaded count and estimated memory saved
- **YouTube timestamps** (local storage only) - Video playback positions, auto-deleted after 7 days

## Error Reporting (v0.1.0+)

### Overview

TabRest includes an **optional anonymous error reporting feature** powered by Sentry SaaS. This is disabled by default and helps us identify and fix bugs faster.

### What Data is Sent

When enabled, error reports contain:

- **Error message** and stack trace
- **Surface tag** (where error occurred: service_worker, popup, options, content_form, content_youtube)
- **Timestamp** of the error
- **Browser environment** (Chrome version)

### What Data is NOT Sent

- URLs or page titles (all URLs redacted to `[REDACTED]`)
- Email addresses (redacted to `[REDACTED]`)
- IP addresses (actively removed server-side)
- Personal browsing data
- Whitelist/blacklist contents (only counts)
- Form or tab data

### Privacy Safeguards

1. **Client-side redaction:** All error payloads are sanitized before sending. URLs, emails, and IP addresses are replaced with `[REDACTED]`.
2. **Server-side IP anonymization:** Sentry dashboard setting "Prevent Storing of IP Addresses" is enabled.
3. **Rate limiting:** Maximum 100 error reports per user per day.
4. **Deduplication:** Identical errors within 24 hours are automatically deduplicated.
5. **Sampling:** Repeated errors are sampled at 10% to avoid overwhelming reports.
6. **Retention:** Error reports are deleted after 30 days on Sentry.

### How to Enable

1. Click **TabRest icon** in toolbar
2. Click **Options button**
3. Scroll to **Privacy & Diagnostics** section
4. Check **"Enable anonymous error reporting"**

### How to Disable

Uncheck the toggle in **Privacy & Diagnostics** at any time.

### Sentry's Privacy Policy

Sentry is GDPR-compliant and stores data in the US. For details, visit: <https://sentry.io/privacy/>

---

## Permissions Explained

| Permission      | Purpose                                                    |
| --------------- | ---------------------------------------------------------- |
| `tabs`          | Required to list, query, and discard tabs                  |
| `storage`       | Required to save your settings and statistics              |
| `alarms`        | Required for timer-based auto-unload functionality         |
| `system.memory` | Required to monitor RAM usage for threshold triggers       |
| `contextMenus`  | Required for right-click context menu options              |
| `tabGroups`     | Required for tab group unload features                     |
| `scripting`     | Required to add visual indicator to discarded tabs         |
| `idle`          | Required for idle-state-only auto-unload feature           |
| `sentry.io`     | Required to send anonymous error reports (v0.1.0+, opt-in) |

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
