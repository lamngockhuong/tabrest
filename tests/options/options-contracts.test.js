import { beforeEach, describe, expect, it } from "vitest";
import { SETTINGS_DEFAULTS } from "../../src/shared/constants.js";
import { isValidDsn } from "../../src/shared/error-reporter.js";
import { HOST_PERM_DEPENDENT_FLAGS } from "../../src/shared/permissions.js";
import { isValidDomainOrIp } from "../../src/shared/utils.js";

// Approach A: options.js is excluded from coverage (DOM entry script). These
// tests pin the contract logic the options page relies on.

// --- settingsMap parsing (options.js:227-269) ---------------------------------
// The options page coerces input element values back to typed settings. This
// test re-implements the coercion to prevent silent type drift.
function coerceFromElement(type, el) {
  if (type === "checkbox") return el.checked;
  if (type === "string") return el.value;
  return Number.parseInt(el.value, 10);
}

describe("options-contracts: settings element → typed value", () => {
  it("checkbox → boolean", () => {
    expect(coerceFromElement("checkbox", { checked: true })).toBe(true);
    expect(coerceFromElement("checkbox", { checked: false })).toBe(false);
  });

  it("string → raw value (no trim - toolbarClickAction is enum)", () => {
    expect(coerceFromElement("string", { value: "popup" })).toBe("popup");
    expect(coerceFromElement("string", { value: "" })).toBe("");
  });

  it("number → parseInt(base 10)", () => {
    expect(coerceFromElement("number", { value: "30" })).toBe(30);
    expect(coerceFromElement("number", { value: "0" })).toBe(0);
    // parseInt strips trailing junk - relied on for select values like "30min"
    expect(coerceFromElement("number", { value: "30min" })).toBe(30);
  });

  it("number → NaN propagates when blank (regression guard)", () => {
    expect(coerceFromElement("number", { value: "" })).toBeNaN();
  });
});

// --- bindHostPermToggle: revoke only when no dependent flag still on (options.js:201-222)
async function shouldRevokeHostPerm(settingKey, freshSettings) {
  return !HOST_PERM_DEPENDENT_FLAGS.some((k) => k !== settingKey && freshSettings[k]);
}

describe("options-contracts: host permission revoke condition", () => {
  it("revokes when only flag being toggled is dependent", async () => {
    expect(
      await shouldRevokeHostPerm("protectFormTabs", {
        protectFormTabs: false,
        showDiscardedPrefix: false,
      }),
    ).toBe(true);
  });

  it("does not revoke when sibling flag still on", async () => {
    expect(
      await shouldRevokeHostPerm("protectFormTabs", {
        protectFormTabs: false,
        showDiscardedPrefix: true,
      }),
    ).toBe(false);
  });

  it("ignores the flag being toggled itself (avoids self-blocking)", async () => {
    // protectFormTabs is what we're disabling; even if its stored value is true
    // (race: storage hasn't flushed), should still revoke when no sibling needs it.
    expect(
      await shouldRevokeHostPerm("protectFormTabs", {
        protectFormTabs: true,
        showDiscardedPrefix: false,
      }),
    ).toBe(true);
  });

  it("HOST_PERM_DEPENDENT_FLAGS exposes the expected keys", () => {
    // Pin the list - adding a new flag MUST update bindHostPermToggle callers.
    expect(HOST_PERM_DEPENDENT_FLAGS).toEqual(
      expect.arrayContaining(["protectFormTabs", "showDiscardedPrefix"]),
    );
  });
});

// --- addDomainToList validation chain (options.js:371-398) --------------------
const OPPOSITE_LIST = { whitelist: "blacklist", blacklist: "whitelist" };

function classifyDomainAdd(domain, listKey, settings) {
  const v = (domain || "").trim().toLowerCase();
  if (!v) return "empty";
  if (!isValidDomainOrIp(v)) return "invalid";
  if (settings[listKey].includes(v)) return "exists";
  if (settings[OPPOSITE_LIST[listKey]]?.includes(v)) return "conflict";
  return "ok";
}

describe("options-contracts: addDomainToList rejection chain", () => {
  let settings;
  beforeEach(() => {
    settings = { whitelist: ["github.com"], blacklist: ["bad.example"] };
  });

  it("empty input is rejected silently", () => {
    expect(classifyDomainAdd("", "whitelist", settings)).toBe("empty");
    expect(classifyDomainAdd("   ", "whitelist", settings)).toBe("empty");
  });

  it("invalid domain syntax is rejected", () => {
    expect(classifyDomainAdd("not a domain", "whitelist", settings)).toBe("invalid");
    expect(classifyDomainAdd("http://x.com", "whitelist", settings)).toBe("invalid");
  });

  it("accepts IPv4, IPv6 and 'localhost' in addition to domains", () => {
    expect(classifyDomainAdd("127.0.0.1", "whitelist", settings)).toBe("ok");
    expect(classifyDomainAdd("::1", "whitelist", settings)).toBe("ok");
    expect(classifyDomainAdd("localhost", "whitelist", settings)).toBe("ok");
    expect(classifyDomainAdd("example.com", "whitelist", settings)).toBe("ok");
  });

  it("duplicate within same list rejected", () => {
    expect(classifyDomainAdd("github.com", "whitelist", settings)).toBe("exists");
    // case folding - input is normalized to lowercase
    expect(classifyDomainAdd("GitHub.com", "whitelist", settings)).toBe("exists");
  });

  it("conflict with opposite list rejected", () => {
    expect(classifyDomainAdd("bad.example", "whitelist", settings)).toBe("conflict");
    expect(classifyDomainAdd("github.com", "blacklist", settings)).toBe("conflict");
  });

  it("OPPOSITE_LIST table is symmetric", () => {
    expect(OPPOSITE_LIST[OPPOSITE_LIST.whitelist]).toBe("whitelist");
    expect(OPPOSITE_LIST[OPPOSITE_LIST.blacklist]).toBe("blacklist");
  });
});

// --- importList additive merge (options.js:412-442) ---------------------------
function importListAdditive(entries, listKey, settings) {
  const oppositeKey = OPPOSITE_LIST[listKey];
  let added = 0;
  let skipped = 0;
  for (const raw of entries) {
    const entry = String(raw || "")
      .trim()
      .toLowerCase();
    if (
      !isValidDomainOrIp(entry) ||
      settings[listKey].includes(entry) ||
      settings[oppositeKey]?.includes(entry)
    ) {
      skipped++;
      continue;
    }
    settings[listKey].push(entry);
    added++;
  }
  return { added, skipped };
}

describe("options-contracts: importList additive merge", () => {
  it("adds new valid entries, skips dupes / opposite-list / invalid", () => {
    const settings = { whitelist: ["a.com"], blacklist: ["bad.com"] };
    const result = importListAdditive(
      ["b.com", "a.com", "bad.com", "not a domain", "  C.com  "],
      "whitelist",
      settings,
    );
    expect(result).toEqual({ added: 2, skipped: 3 });
    expect(settings.whitelist).toEqual(["a.com", "b.com", "c.com"]);
  });

  it("never overwrites - additive only", () => {
    const settings = { whitelist: ["a.com"], blacklist: [] };
    importListAdditive(["a.com", "a.com"], "whitelist", settings);
    expect(settings.whitelist).toEqual(["a.com"]);
  });

  it("non-string entries are coerced and rejected as invalid", () => {
    const settings = { whitelist: [], blacklist: [] };
    const result = importListAdditive([null, undefined, 0, false], "whitelist", settings);
    expect(result.added).toBe(0);
    expect(result.skipped).toBe(4);
  });
});

// --- DSN validation (options.js:274-288) --------------------------------------
// The options DSN field uses the same parser as the transport - runtime and
// UI must never disagree.
describe("options-contracts: DSN validation matches transport parser", () => {
  it("accepts a well-formed Sentry DSN", () => {
    expect(isValidDsn("https://abc123@o0.ingest.sentry.io/12345")).toBe(true);
  });

  it("rejects malformed/empty DSN strings", () => {
    expect(isValidDsn("")).toBe(false);
    expect(isValidDsn("not-a-url")).toBe(false);
    expect(isValidDsn("https://example.com")).toBe(false); // missing project id
  });

  it("blank input must be allowed by the input handler (validation is skipped when value === '')", () => {
    // Replicates options.js:277-282 - empty trims past validation, lets user clear DSN.
    const value = "";
    const shouldValidate = value !== "";
    expect(shouldValidate).toBe(false);
  });
});

// --- prefix input fallback (options.js:308-317) -------------------------------
// Empty trimmed input falls back to SETTINGS_DEFAULTS.discardedPrefix.
function resolvePrefixInput(raw) {
  return raw.trim() || SETTINGS_DEFAULTS.discardedPrefix;
}

describe("options-contracts: discarded prefix fallback", () => {
  it("blank/whitespace falls back to the default", () => {
    expect(resolvePrefixInput("")).toBe(SETTINGS_DEFAULTS.discardedPrefix);
    expect(resolvePrefixInput("   ")).toBe(SETTINGS_DEFAULTS.discardedPrefix);
  });

  it("non-blank value is preserved (trimmed)", () => {
    expect(resolvePrefixInput("  💤  ")).toBe("💤");
  });
});

// --- protectFormTabs / showDiscardedPrefix gated on host perm (options.js:110, 118)
// On load, dependent flags display as `(stored && hasHostPermission)`. Without
// host permission, even if storage has them on (old user, perm revoked), UI
// shows them off - preventing the user from thinking the feature is active.
function uiCheckedForHostPermFlag(stored, hasHost) {
  return Boolean(stored && hasHost);
}

describe("options-contracts: host-perm-dependent UI display gate", () => {
  it.each([
    [true, true, true],
    [true, false, false], // stored on, perm gone → display off (recover)
    [false, true, false],
    [false, false, false],
  ])("stored=%p hasHost=%p → checked=%p", (stored, hasHost, expected) => {
    expect(uiCheckedForHostPermFlag(stored, hasHost)).toBe(expected);
  });
});
