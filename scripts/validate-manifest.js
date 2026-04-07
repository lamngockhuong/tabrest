import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const REQUIRED_FIELDS = ["manifest_version", "name", "version"];
const REQUIRED_MV3_FIELDS = ["action", "background"];

function validateManifest() {
  const manifestPath = resolve(root, "manifest.json");

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") {
      console.error("❌ manifest.json not found");
    } else {
      console.error("❌ Invalid JSON in manifest.json:", e.message);
    }
    process.exit(1);
  }

  const errors = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!manifest[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // MV3 specific checks
  if (manifest.manifest_version === 3) {
    for (const field of REQUIRED_MV3_FIELDS) {
      if (!manifest[field]) {
        errors.push(`Missing MV3 required field: ${field}`);
      }
    }

    // Check service worker exists
    if (manifest.background?.service_worker) {
      const swPath = resolve(root, manifest.background.service_worker);
      if (!existsSync(swPath)) {
        errors.push(`Service worker not found: ${manifest.background.service_worker}`);
      }
    }
  }

  // Check icons exist
  if (manifest.icons) {
    for (const [size, path] of Object.entries(manifest.icons)) {
      if (!existsSync(resolve(root, path))) {
        errors.push(`Icon not found: ${path} (${size}px)`);
      }
    }
  }

  // Check popup exists
  if (manifest.action?.default_popup) {
    if (!existsSync(resolve(root, manifest.action.default_popup))) {
      errors.push(`Popup not found: ${manifest.action.default_popup}`);
    }
  }

  if (errors.length > 0) {
    console.error("❌ Manifest validation failed:");
    errors.forEach((e) => console.error(`   - ${e}`));
    process.exit(1);
  }

  console.log("✅ manifest.json is valid");
}

validateManifest();
