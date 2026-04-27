// Clipboard-based import/export helpers shared by options + popup.
// Schema: { version, type, ...payload }. Bumping IMPORT_EXPORT_VERSION on
// breaking format changes lets older exports still be detected and rejected.

export const IMPORT_EXPORT_VERSION = 1;

/**
 * Serialize a payload and copy it to the clipboard.
 * @param {string} type - Logical kind: "whitelist" | "blacklist" | "sessions".
 * @param {object} data - Type-specific fields (entries, sessions, etc.).
 * @returns {Promise<string>} The JSON string written to clipboard.
 */
export async function exportPayload(type, data) {
  const payload = { version: IMPORT_EXPORT_VERSION, type, ...data };
  const text = JSON.stringify(payload, null, 2);
  await navigator.clipboard.writeText(text);
  return text;
}

/**
 * Parse + validate an imported JSON string.
 * @param {string} text - Raw clipboard / textarea contents.
 * @param {string} expectedType - Type the caller expects (e.g. "whitelist").
 * @returns {{ok: true, data: object} | {ok: false, error: string}}
 */
export function parseImport(text, expectedType) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "invalidJson" };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "invalidShape" };
  }
  if (parsed.version !== IMPORT_EXPORT_VERSION) {
    return { ok: false, error: "unsupportedVersion" };
  }
  if (parsed.type !== expectedType) {
    return { ok: false, error: "wrongType" };
  }
  return { ok: true, data: parsed };
}
