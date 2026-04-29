import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const en = JSON.parse(readFileSync(resolve("_locales/en/messages.json"), "utf8"));
const vi = JSON.parse(readFileSync(resolve("_locales/vi/messages.json"), "utf8"));

const obKeys = Object.keys(en).filter((k) => k.startsWith("ob"));

describe("onboarding i18n parity (en + vi)", () => {
  it("at least 30 ob* keys exist in the en locale", () => {
    expect(obKeys.length).toBeGreaterThanOrEqual(30);
  });

  it("every ob* key in en exists in vi with a non-empty message", () => {
    const missing = obKeys.filter((k) => !vi[k]?.message);
    expect(missing).toEqual([]);
  });

  it("every ob* en entry has a non-empty description", () => {
    const missing = obKeys.filter((k) => !en[k]?.description);
    expect(missing).toEqual([]);
  });

  it("no ob* message in either locale uses em or en dash", () => {
    const offenders = [];
    for (const k of obKeys) {
      if (/[–—]/.test(en[k].message)) offenders.push(`en:${k}`);
      if (vi[k] && /[–—]/.test(vi[k].message)) offenders.push(`vi:${k}`);
    }
    expect(offenders).toEqual([]);
  });
});
