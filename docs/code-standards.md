# TabRest - Code Standards

## Language & Runtime

- **JavaScript:** ES2020+ with ES Modules
- **No TypeScript:** Vanilla JS for simplicity
- **No transpilation:** Direct execution in Chrome

## File Naming

- **Directories:** lowercase, single word when possible
- **JS files:** kebab-case (e.g., `tab-tracker.js`)
- **HTML/CSS:** match JS filename (e.g., `popup.js`, `popup.html`, `popup.css`)

## Module Organization

### Import Order

```javascript
// 1. Constants and config
import { ALARM_NAMES, SETTINGS_DEFAULTS } from "../shared/constants.js";

// 2. Shared utilities
import { getSettings } from "../shared/storage.js";

// 3. Sibling modules
import { discardTab } from "./unload-manager.js";
```

### Export Pattern

```javascript
// Named exports preferred
export function doSomething() {}
export async function doSomethingAsync() {}

// Group related exports at bottom for re-exports
export { isWhitelisted as isUrlWhitelisted };
```

## Coding Conventions

### Async/Await

```javascript
// Prefer async/await over .then()
async function handleMessage(message) {
  const settings = await getSettings();
  const result = await discardTab(tabId, { settings });
  return result;
}
```

### Error Handling

```javascript
// Try-catch with silent fallback for expected failures
try {
  await chrome.tabs.sendMessage(tabId, { action: "checkFormData" });
} catch {
  // Content script not loaded - proceed without check
}

// Log unexpected errors
try {
  await riskyOperation();
} catch (error) {
  console.error("Failed operation:", error);
}
```

### Timeout Patterns

```javascript
// Promise.race for timeouts
const response = await Promise.race([
  chrome.tabs.sendMessage(tabId, message),
  new Promise((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
]);
```

## Chrome Extension Patterns

### Service Worker State

```javascript
// Use chrome.alarms instead of setInterval
chrome.alarms.create(ALARM_NAMES.TAB_CHECK, { periodInMinutes: 1 });

// In-memory cache with storage backup
let tabActivity = {};
await saveTabActivity(tabActivity); // Persist on changes
```

### Debounced Storage Writes

```javascript
let saveTimeout = null;

function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await saveTabActivity(tabActivity);
  }, 1000);
}
```

### Message Passing

```javascript
// Background: keep channel open for async
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // Keep channel open
});

// Popup: await response
const result = await chrome.runtime.sendMessage({ command: "get-stats" });
```

## Settings Management

### Default Values

```javascript
// Centralize in constants.js
export const SETTINGS_DEFAULTS = {
  unloadDelayMinutes: 30,
  memoryThresholdPercent: 80,
  // ...
};
```

### Sync Check Pattern

```javascript
// Pass settings as parameter to avoid redundant fetches
function isWhitelisted(url, settings) {
  return matchesDomainList(url, settings?.whitelist);
}

// Caller fetches once for batch operations
const settings = await getSettings();
for (const tab of tabs) {
  await discardTab(tab.id, { settings });
}
```

## UI Patterns

### DOM Manipulation

```javascript
// Query once, cache references
const elements = {
  memoryUsage: document.getElementById("memory-usage"),
  tabList: document.getElementById("tab-list"),
};

// Update in batch
function updateUI(data) {
  elements.memoryUsage.textContent = `${data.percent}%`;
}
```

### Event Delegation

```javascript
// Single listener for list actions
tabList.addEventListener("click", (e) => {
  const action = e.target.dataset.action;
  const tabId = e.target.closest("[data-tab-id]")?.dataset.tabId;
  if (action && tabId) handleAction(action, tabId);
});
```

## Security Considerations

### URL Validation

```javascript
// Validate URLs before processing
try {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return false; // Reject non-http URLs
  }
} catch {
  return false; // Invalid URL
}
```

### Script Injection

```javascript
// Limit to tabs that support scripting
try {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (prefix) => {
      /* safe operation */
    },
    args: [prefix],
  });
} catch {
  // Tab may not support injection (chrome://, about:, etc.)
}

// On-demand injection with optional host permissions (v0.0.4+)
async function injectFormChecker(tabId, settings) {
  if (!settings.protectFormTabs) return; // Feature gate

  // Ensure permission granted
  const hasPermission = await chrome.permissions.contains({
    permissions: ["scripting"],
    origins: ["http://*/*", "https://*/*"],
  });

  if (!hasPermission) {
    // Request permission or skip injection
    return;
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content/form-checker.js"],
  });
}
```

## Comments

### When to Comment

```javascript
// Explain non-obvious business logic
// Phase 5: Apply power mode multiplier to delay
const effectiveDelay =
  settings.unloadDelayMinutes * powerConfig.delayMultiplier;

// Document API quirks
// Tab may close between query and discard - expected during batch ops
```

### JSDoc for Public Functions

```javascript
/**
 * Check if tab should be protected from unloading
 * @param {object} tab - Chrome tab object
 * @param {object} settings - Current settings
 * @returns {Promise<{protected: boolean, reason?: string}>}
 */
async function shouldProtectTab(tab, settings) {}
```

## Testing Approach

- Manual testing via `chrome://extensions`
- Service worker logs: Inspect service worker view
- Console logging with `[TabRest]` prefix for easy filtering
- No automated test framework (simple extension)

## Feature Flags & Conditional Behavior

### Feature Gate Pattern

```javascript
// Always check settings before executing optional features
if (settings.protectFormTabs) {
  await injectFormChecker(tabId);
}

if (settings.useSidePanel) {
  // Use side panel rendering path
} else {
  // Use popup rendering path
}
```

### Version-aware Behavior

```javascript
// Use semver utilities from shared/utils.js
import { compareSemVer } from "../shared/utils.js";

async function handleUpdate() {
  const lastVersion = await storage.get("tabrest_lastVersion");
  const currentVersion = chrome.runtime.getManifest().version;

  // Only open changelog on minor/major bumps, not patches
  if (compareSemVer(currentVersion, lastVersion) >= "minor") {
    chrome.tabs.create({ url: "pages/changelog.html" });
  }
}
```

## Import/Export Schema Versioning

```javascript
// Phase 10: Versioned schemas for forward compatibility
export const EXPORT_SCHEMA_VERSION = 1;

export function validateImportData(importedData) {
  if (!importedData.version) {
    throw new Error("Missing schema version");
  }

  if (importedData.version > EXPORT_SCHEMA_VERSION) {
    console.warn("Future schema version; some features may not import");
  }

  // Parse based on version
  return parseData(importedData);
}
```

## Linting

- **Tool:** Biome
- **Config:** `biome.json`
- **Commands:**

  ```bash
  pnpm run lint       # Check
  pnpm run lint:fix   # Auto-fix
  pnpm run format     # Format
  ```
