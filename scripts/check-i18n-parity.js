#!/usr/bin/env node
// Validates `_locales/<lang>/messages.json` parity against `_locales/en/messages.json`.
// Checks: same key set, same placeholder tokens, identical placeholders objects, no em/en dashes.
// Exits non-zero on drift; prints actionable report.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const localesDir = join(root, "_locales");
const masterLocale = "en";

const PLACEHOLDER_RE = /\$[A-Z0-9_]+\$|\$\d+/g;
const DASH_RE = /[—–]/;
const MAX_ERRORS_REPORTED = 20;

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

const extractPlaceholders = (str) => {
  if (typeof str !== "string") return [];
  const matches = str.match(PLACEHOLDER_RE);
  return matches ? matches.sort() : [];
};

const main = () => {
  const masterPath = join(localesDir, masterLocale, "messages.json");
  if (!existsSync(masterPath)) {
    console.error(`Master locale missing: ${masterPath}`);
    process.exit(1);
  }
  const master = readJson(masterPath);
  const masterKeys = Object.keys(master);

  const locales = readdirSync(localesDir).filter(
    (d) => d !== masterLocale && existsSync(join(localesDir, d, "messages.json"))
  );

  let totalErrors = 0;
  const report = [`Master: ${masterLocale} (${masterKeys.length} keys)\n`];

  for (const locale of locales) {
    const path = join(localesDir, locale, "messages.json");
    let data;
    try {
      data = readJson(path);
    } catch (e) {
      report.push(`[${locale}] FAIL: invalid JSON - ${e.message}`);
      totalErrors++;
      continue;
    }

    const errors = [];
    const localeKeys = Object.keys(data);

    const missing = masterKeys.filter((k) => !(k in data));
    const extra = localeKeys.filter((k) => !(k in master));
    if (missing.length) errors.push(`missing keys: ${missing.join(", ")}`);
    if (extra.length) errors.push(`extra keys: ${extra.join(", ")}`);

    for (const key of masterKeys) {
      if (!(key in data)) continue;
      const masterEntry = master[key];
      const localeEntry = data[key];

      const masterPlaceholders = extractPlaceholders(masterEntry.message);
      const localePlaceholders = extractPlaceholders(localeEntry.message);
      if (
        masterPlaceholders.length !== localePlaceholders.length ||
        masterPlaceholders.some((p, i) => p !== localePlaceholders[i])
      ) {
        errors.push(
          `[${key}] placeholder drift: master=[${masterPlaceholders.join(",")}] locale=[${localePlaceholders.join(",")}]`
        );
      }

      if (masterEntry.placeholders) {
        const same = JSON.stringify(masterEntry.placeholders) === JSON.stringify(localeEntry.placeholders);
        if (!same) errors.push(`[${key}] placeholders object differs from master`);
      }

      if (typeof localeEntry.message === "string" && DASH_RE.test(localeEntry.message)) {
        errors.push(`[${key}] em/en dash detected in message`);
      }
    }

    if (errors.length) {
      report.push(`[${locale}] FAIL (${errors.length} issues):`);
      for (const e of errors.slice(0, MAX_ERRORS_REPORTED)) report.push(`  - ${e}`);
      if (errors.length > MAX_ERRORS_REPORTED) {
        report.push(`  ... and ${errors.length - MAX_ERRORS_REPORTED} more`);
      }
      totalErrors += errors.length;
    } else {
      report.push(`[${locale}] PASS (${localeKeys.length} keys)`);
    }
  }

  report.push("");
  report.push(`Total locales checked: ${locales.length}`);
  report.push(totalErrors === 0 ? "Result: PASS" : `Result: FAIL (${totalErrors} issues)`);

  console.log(report.join("\n"));
  process.exit(totalErrors === 0 ? 0 : 1);
};

main();
