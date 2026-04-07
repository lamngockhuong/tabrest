/**
 * Build script for TabRest Chrome extension
 * - Minifies JS files with esbuild
 * - Copies static assets (HTML, CSS, icons, locales)
 * - Outputs to dist/ directory
 */

import * as esbuild from "esbuild";
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");

// Clean dist directory
console.log("🧹 Cleaning dist/...");
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// Find all JS files in src/
function findFiles(dir, ext) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findFiles(path, ext));
    } else if (entry.name.endsWith(ext)) {
      files.push(path);
    }
  }
  return files;
}

// Minify JS files
console.log("📦 Minifying JavaScript...");
const jsFiles = findFiles(join(ROOT, "src"), ".js");
let totalOriginal = 0;
let totalMinified = 0;

for (const file of jsFiles) {
  const relPath = relative(ROOT, file);
  const outPath = join(DIST, relPath);

  mkdirSync(dirname(outPath), { recursive: true });

  const original = readFileSync(file, "utf-8");
  totalOriginal += original.length;

  const result = await esbuild.transform(original, {
    minify: true,
    format: "esm",
    target: "chrome100",
    legalComments: "none",
  });

  writeFileSync(outPath, result.code);
  totalMinified += result.code.length;

  const savings = ((1 - result.code.length / original.length) * 100).toFixed(1);
  console.log(`  ✓ ${relPath} (${savings}% smaller)`);
}

// Copy static assets
console.log("\n📋 Copying static assets...");

// Copy manifest.json
cpSync(join(ROOT, "manifest.json"), join(DIST, "manifest.json"));
console.log("  ✓ manifest.json");

// Copy only PNG icons (exclude SVG source files)
mkdirSync(join(DIST, "icons"), { recursive: true });
for (const file of readdirSync(join(ROOT, "icons"))) {
  if (file.endsWith(".png")) {
    cpSync(join(ROOT, "icons", file), join(DIST, "icons", file));
    console.log(`  ✓ icons/${file}`);
  }
}

// Copy _locales
cpSync(join(ROOT, "_locales"), join(DIST, "_locales"), { recursive: true });
console.log("  ✓ _locales/");

// Copy HTML and CSS files from src/
const htmlFiles = findFiles(join(ROOT, "src"), ".html");
const cssFiles = findFiles(join(ROOT, "src"), ".css");

for (const file of [...htmlFiles, ...cssFiles]) {
  const relPath = relative(ROOT, file);
  const outPath = join(DIST, relPath);
  mkdirSync(dirname(outPath), { recursive: true });
  cpSync(file, outPath);
  console.log(`  ✓ ${relPath}`);
}

// Summary
const totalSavings = ((1 - totalMinified / totalOriginal) * 100).toFixed(1);
console.log("\n✅ Build complete!");
console.log(`   JS: ${(totalOriginal / 1024).toFixed(1)}KB → ${(totalMinified / 1024).toFixed(1)}KB (${totalSavings}% smaller)`);

// Calculate total dist size
function getDirSize(dir) {
  let size = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      size += getDirSize(path);
    } else {
      size += statSync(path).size;
    }
  }
  return size;
}

const distSize = getDirSize(DIST);
console.log(`   Total: ${(distSize / 1024).toFixed(1)}KB`);
