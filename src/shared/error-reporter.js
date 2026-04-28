// Error reporting module with privacy-focused sanitization
// Supports both automatic error capture and manual bug reports
// Privacy-first: strips PII (URLs, emails, domains) before any reporting

import { getSettings } from "./storage.js";
import {
  SENTRY_DSN,
  ERROR_QUOTA_KEY,
  ERROR_DEDUP_KEY,
  ERROR_DAILY_CAP,
  ERROR_DEDUP_WINDOW_MS,
  ERROR_REPEAT_SAMPLE_RATE,
  ERROR_DEDUP_MAX_ENTRIES,
  SURFACES,
} from "./constants.js";
import { getBrowserInfo } from "./utils.js";

// Module-scope transport state, populated by initErrorReporter
let parsedDsn = null;
let rawDsn = null; // original DSN string for envelope headers
let cachedAuthHeader = null;
let cachedAppVersion = null;
let cachedBrowserName = null;
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

  // Resolve DSN priority: explicit options.dsn > settings.customSentryDsn > compiled constant
  // Empty/whitespace customSentryDsn falls through to the built-in SENTRY_DSN constant.
  const dsnString = options.dsn || settings.customSentryDsn?.trim() || SENTRY_DSN;

  cachedAppVersion = chrome.runtime.getManifest().version;
  cachedBrowserName = getBrowserInfo().name;

  if (dsnString) {
    parsedDsn = parseDsn(dsnString);
    if (parsedDsn) {
      rawDsn = dsnString;
      cachedAuthHeader = buildAuthHeader(parsedDsn.publicKey, "tabrest", cachedAppVersion);
    } else {
      console.warn("[ErrorReporter] Invalid DSN - local buffer only");
    }
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

  for (const [key, value] of Object.entries(context)) {
    if (typeof value === "string") {
      sanitizedContext[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null) {
      sanitizedContext[key] = JSON.parse(sanitizeString(JSON.stringify(value)));
    } else {
      sanitizedContext[key] = value;
    }
  }

  console.error("[ErrorReporter] Captured:", sanitizedError.message, sanitizedContext);

  storeError(sanitizedError, sanitizedContext);

  // Fire-and-forget: keep captureError synchronous so onMessage handlers
  // can return false for sync response.
  if (parsedDsn && sentryInitialized) {
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

  if (parsedDsn && sentryInitialized) {
    sendMessageToSentry(sanitizedMessage, level, context);
  }
}

/**
 * Submit a manual bug report.
 * Always returns a Promise<boolean> so callers have a uniform contract.
 * @param {string} description - User's description of the issue
 * @param {Object} diagnostics - Sanitized diagnostic data from log-collector
 * @returns {Promise<boolean>} true on success (or local-only fallback when DSN absent)
 */
export async function reportBug(description, diagnostics) {
  const sanitizedDescription = sanitizeString(description);

  const report = {
    type: "manual_report",
    description: sanitizedDescription,
    diagnostics,
    timestamp: new Date().toISOString(),
    version: cachedAppVersion || chrome.runtime.getManifest().version,
  };

  console.log("[ErrorReporter] Manual bug report:", report);

  storeReport(report);

  if (parsedDsn && sentryInitialized) {
    return sendReportToSentry(report);
  }

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

// --- Fingerprint, Quota, and Dedup Helpers ---

/**
 * FNV-1a 32-bit hash — sync, no async, no Web Crypto.
 * @param {string} str
 * @returns {string} lowercase hex
 */
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/**
 * Compute fingerprint hash for a sanitized error.
 * Uses name + first 3 stack lines. Falls back to "no-stack" when stack is absent.
 * @param {{name: string, stack: string}} sanitizedError
 * @returns {string}
 */
function computeFingerprint(sanitizedError) {
  const name = sanitizedError?.name || "Error";
  const stack = sanitizedError?.stack || "";
  const stackPart = stack
    ? stack.split("\n").slice(0, 3).join("|")
    : "no-stack";
  return fnv1a(`${name}::${stackPart}`);
}

/**
 * Compute fingerprint hash for a sanitized message event.
 * @param {string} sanitizedMessage
 * @param {string} level
 * @returns {string}
 */
function computeMessageFingerprint(sanitizedMessage, level) {
  return fnv1a(`msg::${level}::${(sanitizedMessage || "").slice(0, 200)}`);
}

/**
 * Return today's date in UTC as "YYYY-MM-DD".
 * @returns {string}
 */
function getTodayUtc() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Check daily quota and increment if allowed.
 * Caller must invoke this ONLY when actually about to send — sampled-out
 * events skip this so they don't burn the user's daily cap.
 * Resets counter at UTC midnight (lazy reset on first call of the new day).
 * @returns {Promise<{allowed: boolean, count: number, cap: number}>}
 */
async function checkAndIncrementQuota() {
  const today = getTodayUtc();
  const data = await chrome.storage.local.get(ERROR_QUOTA_KEY);
  let quota = data[ERROR_QUOTA_KEY] || { date: today, count: 0 };
  if (quota.date !== today) quota = { date: today, count: 0 };
  if (quota.count >= ERROR_DAILY_CAP) {
    return { allowed: false, count: quota.count, cap: ERROR_DAILY_CAP };
  }
  quota.count++;
  await chrome.storage.local.set({ [ERROR_QUOTA_KEY]: quota });
  return { allowed: true, count: quota.count, cap: ERROR_DAILY_CAP };
}

/**
 * Decide whether a given fingerprint should be sent and return the in-memory
 * dedup map (caller persists once via persistDedup after recording the send).
 * Performs GC + LRU eviction on the map. Does NOT write to storage.
 * @param {string} fingerprint
 * @returns {Promise<{shouldSend: boolean, isFirst: boolean, map: Object}>}
 */
async function checkDedup(fingerprint) {
  const now = Date.now();
  const data = await chrome.storage.local.get(ERROR_DEDUP_KEY);
  const map = data[ERROR_DEDUP_KEY] || {};

  for (const [fp, entry] of Object.entries(map)) {
    if (now - entry.lastSeenAt >= ERROR_DEDUP_WINDOW_MS) {
      delete map[fp];
    }
  }

  const entries = Object.entries(map);
  if (entries.length > ERROR_DEDUP_MAX_ENTRIES) {
    entries.sort((a, b) => a[1].lastSeenAt - b[1].lastSeenAt);
    const toRemove = entries.slice(0, entries.length - ERROR_DEDUP_MAX_ENTRIES);
    for (const [fp] of toRemove) delete map[fp];
  }

  const existing = map[fingerprint];
  const isFirst = !existing;
  const shouldSend = isFirst || Math.random() < ERROR_REPEAT_SAMPLE_RATE;

  return { shouldSend, isFirst, map };
}

/**
 * Mutate the supplied map to record a send attempt and persist it.
 * Single storage write per send path (no separate read).
 * @param {Object} map - dedup map returned by checkDedup
 * @param {string} fingerprint
 * @param {boolean} sent - whether the envelope was actually transmitted
 */
async function persistDedup(map, fingerprint, sent) {
  const now = Date.now();
  const entry = map[fingerprint] || { firstSeenAt: now, count: 0, sentCount: 0 };
  entry.count++;
  if (sent) entry.sentCount++;
  entry.lastSeenAt = now;
  map[fingerprint] = entry;
  await chrome.storage.local.set({ [ERROR_DEDUP_KEY]: map });
}

/**
 * Backward-compatible recordSend retained for tests / external callers.
 * Reads the map fresh, applies the update, and writes once.
 * @param {string} fingerprint
 * @param {boolean} sent
 */
async function recordSend(fingerprint, sent) {
  const data = await chrome.storage.local.get(ERROR_DEDUP_KEY);
  const map = data[ERROR_DEDUP_KEY] || {};
  await persistDedup(map, fingerprint, sent);
}

// --- Sentry Transport Helpers ---

/**
 * Parse a Sentry DSN string into its components.
 * Returns null if the DSN is missing or malformed.
 * @param {string} dsn
 * @returns {{publicKey: string, host: string, projectId: string, ingestUrl: string}|null}
 */
function parseDsn(dsn) {
  if (!dsn || typeof dsn !== "string") return null;
  const match = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)$/);
  if (!match) return null;
  const [, publicKey, host, projectId] = match;
  return {
    publicKey,
    host,
    projectId,
    ingestUrl: `https://${host}/api/${projectId}/envelope/`,
  };
}

/**
 * Public DSN format check used by the options page validator.
 * Single source of truth — keeps options UI in lock-step with the transport.
 * @param {string} dsn
 * @returns {boolean}
 */
export function isValidDsn(dsn) {
  return parseDsn(dsn) !== null;
}

/**
 * Build the X-Sentry-Auth header value.
 * Uses public key only - no client secret required for browser-style ingestion.
 * Sentry envelope protocol version 7.
 * @param {string} publicKey
 * @param {string} clientName
 * @param {string} clientVersion
 * @returns {string}
 */
function buildAuthHeader(publicKey, clientName, clientVersion) {
  return `Sentry sentry_version=7,sentry_key=${publicKey},sentry_client=${clientName}/${clientVersion}`;
}

/**
 * Generate a Sentry-compatible 32-character hex event ID.
 * @returns {string}
 */
function generateEventId() {
  return crypto.randomUUID().replace(/-/g, "");
}

/**
 * Parse V8/Firefox stack trace string into Sentry frame objects.
 * Best-effort: drops unparseable lines. If zero lines parse, returns a
 * single frame using the raw stack text as the function field.
 * Caps output at 50 frames.
 * @param {string} sanitizedStack
 * @returns {Array<{filename: string, function: string, lineno: number|undefined, colno: number|undefined}>}
 */
function parseStackFrames(sanitizedStack) {
  if (!sanitizedStack || typeof sanitizedStack !== "string") {
    return [{ filename: "<unknown>", function: "<unknown>" }];
  }

  const lines = sanitizedStack.split("\n");
  const frames = [];

  // V8: "    at FunctionName (file:line:col)" or "    at file:line:col"
  // Firefox: "FunctionName@file:line:col"
  const V8_RE = /^\s+at\s+(?:(.+?)\s+\((.+):(\d+):(\d+)\)|(.+):(\d+):(\d+))\s*$/;
  const FF_RE = /^(.+?)@(.+):(\d+):(\d+)\s*$/;

  for (const line of lines) {
    const v8 = line.match(V8_RE);
    if (v8) {
      if (v8[2]) {
        // "at FunctionName (file:line:col)"
        frames.push({
          filename: v8[2],
          function: v8[1] || "<anonymous>",
          lineno: parseInt(v8[3], 10),
          colno: parseInt(v8[4], 10),
        });
      } else {
        // "at file:line:col" (no function name)
        frames.push({
          filename: v8[5],
          function: "<anonymous>",
          lineno: parseInt(v8[6], 10),
          colno: parseInt(v8[7], 10),
        });
      }
      continue;
    }

    const ff = line.match(FF_RE);
    if (ff) {
      frames.push({
        filename: ff[2],
        function: ff[1] || "<anonymous>",
        lineno: parseInt(ff[3], 10),
        colno: parseInt(ff[4], 10),
      });
    }
  }

  if (frames.length === 0) {
    // Fallback: raw stack text as function field for at least some signal
    return [{ filename: "<unknown>", function: sanitizedStack.slice(0, 500) }];
  }

  // Cap at 50 frames
  return frames.slice(0, 50);
}

/**
 * Build Sentry event payload for an error.
 * Sentry expects frames in reverse-chronological order (caller first, callee last).
 * V8 stacks are top-down (innermost first), so we reverse to match Sentry convention.
 * @param {Object} sanitizedError - {name, message, stack}
 * @param {Object} context - Sanitized context metadata
 * @param {string} level - "error"|"warning"|"info"
 * @returns {Object}
 */
function buildEventPayload(sanitizedError, context, level = "error") {
  const appVersion = cachedAppVersion || chrome.runtime.getManifest().version;
  const browserName = cachedBrowserName || getBrowserInfo().name;

  // Sentry expects frames in caller-first order; V8 stacks are innermost-first.
  const rawFrames = parseStackFrames(sanitizedError.stack || "");
  const frames = [...rawFrames].reverse();

  return {
    event_id: generateEventId(),
    timestamp: new Date().toISOString(),
    platform: "javascript",
    level,
    exception: {
      values: [
        {
          type: sanitizedError.name,
          value: sanitizedError.message,
          stacktrace: { frames },
        },
      ],
    },
    tags: {
      surface: context.surface || "unknown",
      extension_version: appVersion,
      browser: browserName,
    },
    contexts: {
      app: { app_version: appVersion },
      runtime: { name: "chrome" },
    },
    release: `tabrest@${appVersion}`,
    user: { ip_address: null },
  };
}

/**
 * Build Sentry message payload for a non-error event.
 * @param {string} sanitizedMessage
 * @param {string} level
 * @param {Object} context
 * @returns {Object}
 */
function buildMessagePayload(sanitizedMessage, level = "info", context = {}) {
  const appVersion = cachedAppVersion || chrome.runtime.getManifest().version;
  const browserName = cachedBrowserName || getBrowserInfo().name;

  return {
    event_id: generateEventId(),
    timestamp: new Date().toISOString(),
    platform: "javascript",
    level,
    message: { formatted: sanitizedMessage },
    tags: {
      surface: context.surface || "unknown",
      extension_version: appVersion,
      browser: browserName,
    },
    contexts: {
      app: { app_version: appVersion },
      runtime: { name: "chrome" },
    },
    release: `tabrest@${appVersion}`,
    user: { ip_address: null },
  };
}

/**
 * Build Sentry payload for a manual bug report.
 * Attaches sanitized diagnostics to extra.diagnostics.
 * @param {Object} report - {description, diagnostics, timestamp, version}
 * @returns {Object}
 */
function buildManualReportPayload(report) {
  const appVersion = cachedAppVersion || chrome.runtime.getManifest().version;
  const browserName = cachedBrowserName || getBrowserInfo().name;

  // report.description was already sanitized by reportBug — don't re-sanitize.
  return {
    event_id: generateEventId(),
    timestamp: new Date().toISOString(),
    platform: "javascript",
    level: "info",
    message: { formatted: report.description || "Manual bug report" },
    extra: {
      diagnostics: report.diagnostics || null,
    },
    tags: {
      surface: SURFACES.MANUAL_REPORT,
      extension_version: appVersion,
      browser: browserName,
    },
    contexts: {
      app: { app_version: appVersion },
      runtime: { name: "chrome" },
    },
    release: `tabrest@${appVersion}`,
    user: { ip_address: null },
  };
}

/**
 * Build a Sentry envelope string: 3 newline-joined JSON lines.
 * Envelope format: envelope-header\nitem-header\nitem-payload
 * @param {Object} payload - Sentry event payload
 * @param {string} fullDsn - Original DSN string (included in envelope header per spec)
 * @returns {string}
 */
function buildEnvelope(payload, fullDsn) {
  const envelopeHeader = JSON.stringify({
    event_id: payload.event_id,
    sent_at: new Date().toISOString(),
    dsn: fullDsn,
  });
  const itemHeader = JSON.stringify({
    type: "event",
    content_type: "application/json",
  });
  const itemPayload = JSON.stringify(payload);
  return `${envelopeHeader}\n${itemHeader}\n${itemPayload}`;
}

/**
 * POST a Sentry envelope to the ingest endpoint.
 * Uses keepalive:true so the request survives service worker termination.
 * Credentials are explicitly omitted (DSN public key is not a secret).
 * On network error returns {ok: false, status: 0}.
 * On 429 reads the retry-after header.
 * @param {string} envelope
 * @param {string} ingestUrl
 * @param {string} authHeader
 * @returns {Promise<{ok: boolean, status: number, retryAfter: string|null}>}
 */
async function sendEnvelope(envelope, ingestUrl, authHeader) {
  try {
    const res = await fetch(ingestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": authHeader,
      },
      body: envelope,
      keepalive: true,
      credentials: "omit",
    });
    return {
      ok: res.ok,
      status: res.status,
      retryAfter: res.status === 429 ? res.headers.get("retry-after") : null,
    };
  } catch {
    // Network failure or SW terminated mid-flight
    return { ok: false, status: 0, retryAfter: null };
  }
}

// --- Sentry Integration ---

/**
 * Fire-and-forget: send sanitized error to Sentry with quota + dedup gating.
 * The caller (captureError) does not await this to stay synchronous.
 * @param {Object} sanitizedError
 * @param {Object} context
 */
async function sendToSentry(sanitizedError, context) {
  try {
    const fp = computeFingerprint(sanitizedError);
    const dedup = await checkDedup(fp);
    if (!dedup.shouldSend) {
      // Sampled out — record the occurrence without burning quota.
      await persistDedup(dedup.map, fp, false);
      return;
    }
    const quota = await checkAndIncrementQuota();
    if (!quota.allowed) return;
    const payload = buildEventPayload(sanitizedError, context, "error");
    const envelope = buildEnvelope(payload, rawDsn);
    const result = await sendEnvelope(envelope, parsedDsn.ingestUrl, cachedAuthHeader);
    await persistDedup(dedup.map, fp, result.ok);
  } catch {
    // storeError already buffered locally; nothing else to do.
  }
}

/**
 * Send a message-level event to Sentry with quota + dedup gating (non-error).
 * @param {string} sanitizedMessage
 * @param {string} level
 * @param {Object} context
 */
async function sendMessageToSentry(sanitizedMessage, level, context) {
  try {
    const fp = computeMessageFingerprint(sanitizedMessage, level);
    const dedup = await checkDedup(fp);
    if (!dedup.shouldSend) {
      await persistDedup(dedup.map, fp, false);
      return;
    }
    const quota = await checkAndIncrementQuota();
    if (!quota.allowed) return;
    const payload = buildMessagePayload(sanitizedMessage, level, context);
    const envelope = buildEnvelope(payload, rawDsn);
    const result = await sendEnvelope(envelope, parsedDsn.ingestUrl, cachedAuthHeader);
    await persistDedup(dedup.map, fp, result.ok);
  } catch {
    // intentionally swallowed
  }
}

/**
 * Send a manual bug report to Sentry.
 * Bypasses dedup (manual reports are intentional); still respects daily cap.
 * Returns a promise resolving to true if the send succeeded, false otherwise.
 * @param {Object} report
 * @returns {Promise<boolean>}
 */
async function sendReportToSentry(report) {
  try {
    const quota = await checkAndIncrementQuota();
    if (!quota.allowed) return false; // quota exhausted — signal to caller
    const payload = buildManualReportPayload(report);
    const envelope = buildEnvelope(payload, rawDsn);
    const result = await sendEnvelope(envelope, parsedDsn.ingestUrl, cachedAuthHeader);
    return result.ok;
  } catch {
    return false;
  }
}

// --- Test Helpers ---
// Expose internal helpers for unit tests via named export.
// These are not part of the public API and should not be called by production code.
export const __test__ = {
  parseDsn,
  buildAuthHeader,
  generateEventId,
  parseStackFrames,
  buildEventPayload,
  buildMessagePayload,
  buildManualReportPayload,
  buildEnvelope,
  sendEnvelope,
  fnv1a,
  computeFingerprint,
  computeMessageFingerprint,
  getTodayUtc,
  checkAndIncrementQuota,
  checkDedup,
  recordSend,
  persistDedup,
};
