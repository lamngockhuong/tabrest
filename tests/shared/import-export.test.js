import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  exportPayload,
  IMPORT_EXPORT_VERSION,
  parseImport,
} from "../../src/shared/import-export.js";

describe("parseImport", () => {
  it("rejects invalid JSON", () => {
    expect(parseImport("not json", "whitelist")).toEqual({ ok: false, error: "invalidJson" });
  });

  it("rejects null / arrays / non-objects", () => {
    expect(parseImport("null", "whitelist")).toEqual({ ok: false, error: "invalidShape" });
    expect(parseImport("[]", "whitelist")).toEqual({ ok: false, error: "invalidShape" });
    expect(parseImport('"a"', "whitelist")).toEqual({ ok: false, error: "invalidShape" });
  });

  it("rejects unsupported version", () => {
    const text = JSON.stringify({ version: 99, type: "whitelist", entries: [] });
    expect(parseImport(text, "whitelist")).toEqual({ ok: false, error: "unsupportedVersion" });
  });

  it("rejects mismatched type", () => {
    const text = JSON.stringify({
      version: IMPORT_EXPORT_VERSION,
      type: "blacklist",
      entries: [],
    });
    expect(parseImport(text, "whitelist")).toEqual({ ok: false, error: "wrongType" });
  });

  it("accepts a valid payload", () => {
    const payload = {
      version: IMPORT_EXPORT_VERSION,
      type: "whitelist",
      entries: ["example.com"],
    };
    const result = parseImport(JSON.stringify(payload), "whitelist");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual(payload);
  });
});

describe("exportPayload", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } },
      configurable: true,
      writable: true,
    });
  });

  it("writes JSON with version + type to clipboard", async () => {
    const text = await exportPayload("sessions", { sessions: [{ name: "a", tabs: [] }] });
    const parsed = JSON.parse(text);
    expect(parsed.version).toBe(IMPORT_EXPORT_VERSION);
    expect(parsed.type).toBe("sessions");
    expect(parsed.sessions).toEqual([{ name: "a", tabs: [] }]);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
  });
});
