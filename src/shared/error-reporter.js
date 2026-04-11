// Error reporting module with privacy-focused sanitization
// Supports both automatic error capture and manual bug reports
// Privacy-first: strips PII (URLs, emails, domains) before any reporting

import { getSettings } from "./storage.js";

// Sentry DSN - set via options page or leave empty to disable auto-reporting
let sentryDsn = "";
let sentryInitialized = false;

// Patterns to redact from error messages
const PII_PATTERNS = [
  /https?:\/\/[^\s"'<>]+/gi, // URLs
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, // Emails
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, // IP addresses
];

/**
 * Sanitize string by removing PII patterns
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
export function sanitizeString(str) {
  if (!str || typeof str !== "string") return str;
  let sanitized = str;
  for (const pattern of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }
  return sanitized;
}

/**
 * Sanitize error object for reporting
 * @param {Error} error - Error object
 * @returns {Object} Sanitized error data
 */
export function sanitizeError(error) {
  return {
    name: error?.name || "Error",
    message: sanitizeString(error?.message || "Unknown error"),
    stack: sanitizeString(error?.stack || ""),
  };
}

/**
 * Initialize error reporter
 * Checks settings and sets up global error handlers
 * @param {Object} options - Configuration options
 */
export async function initErrorReporter(options = {}) {
  // Prevent duplicate initialization (and duplicate listeners)
  if (sentryInitialized) return;

  const settings = await getSettings();

  // Respect user opt-out
  if (settings.enableErrorReporting === false) {
    console.log("[ErrorReporter] Disabled by user preference");
    return;
  }

  // Set DSN if provided
  if (options.dsn) {
    sentryDsn = options.dsn;
  }

  // Set up global error handler for uncaught errors
  self.addEventListener("error", (event) => {
    captureError(event.error || new Error(event.message), {
      source: "uncaught",
      filename: sanitizeString(event.filename),
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Set up unhandled promise rejection handler
  self.addEventListener("unhandledrejection", (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    captureError(error, { source: "unhandledrejection" });
  });

  sentryInitialized = true;
  console.log("[ErrorReporter] Initialized");
}

/**
 * Capture and report an error
 * @param {Error} error - Error to capture
 * @param {Object} context - Additional context
 */
export function captureError(error, context = {}) {
  const sanitizedError = sanitizeError(error);
  const sanitizedContext = {};

  // Sanitize context values
  for (const [key, value] of Object.entries(context)) {
    if (typeof value === "string") {
      sanitizedContext[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null) {
      sanitizedContext[key] = JSON.parse(sanitizeString(JSON.stringify(value)));
    } else {
      sanitizedContext[key] = value;
    }
  }

  // Log locally for debugging
  console.error("[ErrorReporter] Captured:", sanitizedError.message, sanitizedContext);

  // Store in local buffer for manual reporting
  storeError(sanitizedError, sanitizedContext);

  // Send to Sentry if configured (future enhancement)
  if (sentryDsn && sentryInitialized) {
    sendToSentry(sanitizedError, sanitizedContext);
  }
}

/**
 * Capture a message/event (non-error)
 * @param {string} message - Message to capture
 * @param {string} level - Severity level (info, warning, error)
 * @param {Object} context - Additional context
 */
export function captureMessage(message, level = "info", context = {}) {
  const sanitizedMessage = sanitizeString(message);

  console.log(`[ErrorReporter] ${level.toUpperCase()}: ${sanitizedMessage}`);

  if (sentryDsn && sentryInitialized) {
    sendMessageToSentry(sanitizedMessage, level, context);
  }
}

/**
 * Submit a manual bug report
 * @param {string} description - User's description of the issue
 * @param {Object} diagnostics - Sanitized diagnostic data from log-collector
 * @returns {boolean} Success status
 */
export function reportBug(description, diagnostics) {
  const sanitizedDescription = sanitizeString(description);

  const report = {
    type: "manual_report",
    description: sanitizedDescription,
    diagnostics,
    timestamp: new Date().toISOString(),
    version: chrome.runtime.getManifest().version,
  };

  console.log("[ErrorReporter] Manual bug report:", report);

  // Store locally
  storeReport(report);

  // Send to Sentry if configured
  if (sentryDsn && sentryInitialized) {
    return sendReportToSentry(report);
  }

  // Return true - report stored locally even without Sentry
  return true;
}

// --- Internal Storage ---

const ERROR_BUFFER_KEY = "tabrest_error_buffer";
const BUG_REPORTS_KEY = "tabrest_bug_reports";
const MAX_STORED_ERRORS = 10;
const MAX_STORED_REPORTS = 5;

/**
 * Store item in a bounded buffer
 */
async function storeToBuffer(key, item, maxSize) {
  try {
    const data = await chrome.storage.local.get(key);
    const buffer = data[key] || [];
    buffer.push(item);
    while (buffer.length > maxSize) buffer.shift();
    await chrome.storage.local.set({ [key]: buffer });
  } catch (e) {
    console.warn(`[ErrorReporter] Failed to store to ${key}:`, e);
  }
}

/**
 * Store error in local buffer
 */
async function storeError(error, context) {
  await storeToBuffer(
    ERROR_BUFFER_KEY,
    { error, context, timestamp: new Date().toISOString() },
    MAX_STORED_ERRORS,
  );
}

/**
 * Store manual report
 */
async function storeReport(report) {
  await storeToBuffer(BUG_REPORTS_KEY, report, MAX_STORED_REPORTS);
}

/**
 * Get stored errors (for debugging/manual export)
 * @returns {Promise<Array>} Stored errors
 */
export async function getStoredErrors() {
  try {
    const data = await chrome.storage.local.get(ERROR_BUFFER_KEY);
    return data[ERROR_BUFFER_KEY] || [];
  } catch {
    return [];
  }
}

/**
 * Clear stored errors
 */
export async function clearStoredErrors() {
  await chrome.storage.local.remove([ERROR_BUFFER_KEY, BUG_REPORTS_KEY]);
}

// --- Sentry Integration (TODO: implement when DSN configured) ---

function sendToSentry(_error, _context) {}
function sendMessageToSentry(_message, _level, _context) {}
function sendReportToSentry(_report) {
  return true;
}
