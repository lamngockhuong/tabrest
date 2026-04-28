import { describe, it, expect, vi, beforeEach } from "vitest";
import { __test__ } from "../../src/shared/error-reporter.js";

const {
  parseDsn,
  buildAuthHeader,
  generateEventId,
  parseStackFrames,
  buildEventPayload,
  buildMessagePayload,
  buildManualReportPayload,
  buildEnvelope,
  sendEnvelope,
} = __test__;

// ---- parseDsn ----------------------------------------------------------------

describe("parseDsn", () => {
  it("parses a valid Sentry DSN", () => {
    const result = parseDsn("https://abc@o123.ingest.us.sentry.io/456");
    expect(result).toEqual({
      publicKey: "abc",
      host: "o123.ingest.us.sentry.io",
      projectId: "456",
      ingestUrl: "https://o123.ingest.us.sentry.io/api/456/envelope/",
    });
  });

  it("returns null for an invalid DSN", () => {
    expect(parseDsn("invalid")).toBeNull();
    expect(parseDsn("")).toBeNull();
    expect(parseDsn(null)).toBeNull();
    expect(parseDsn(undefined)).toBeNull();
  });

  it("parses the real production DSN", () => {
    const real =
      "https://2b6ab992bad3bb998e5026532fabccb3@o4511298350612480.ingest.us.sentry.io/4511298353496064";
    const result = parseDsn(real);
    expect(result).not.toBeNull();
    expect(result.publicKey).toBe("2b6ab992bad3bb998e5026532fabccb3");
    expect(result.ingestUrl).toBe(
      "https://o4511298350612480.ingest.us.sentry.io/api/4511298353496064/envelope/",
    );
  });
});

// ---- buildAuthHeader ---------------------------------------------------------

describe("buildAuthHeader", () => {
  it("produces correct format", () => {
    const h = buildAuthHeader("mykey", "tabrest", "1.2.3");
    expect(h).toBe("Sentry sentry_version=7,sentry_key=mykey,sentry_client=tabrest/1.2.3");
  });
});

// ---- generateEventId ---------------------------------------------------------

describe("generateEventId", () => {
  it("returns a 32-char hex string without dashes", () => {
    const id = generateEventId();
    expect(id).toHaveLength(32);
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it("generates unique IDs", () => {
    expect(generateEventId()).not.toBe(generateEventId());
  });
});

// ---- parseStackFrames --------------------------------------------------------

describe("parseStackFrames", () => {
  it("parses a V8 stack trace", () => {
    const stack = `Error: something
    at doThing (chrome-extension://abc/src/foo.js:10:5)
    at main (chrome-extension://abc/src/bar.js:20:3)`;
    const frames = parseStackFrames(stack);
    expect(frames.length).toBe(2);
    expect(frames[0]).toMatchObject({ function: "doThing", lineno: 10, colno: 5 });
    expect(frames[1]).toMatchObject({ function: "main", lineno: 20, colno: 3 });
  });

  it("returns fallback frame for unparseable stack", () => {
    const frames = parseStackFrames("this is not a real stack");
    expect(frames).toHaveLength(1);
    expect(frames[0].filename).toBe("<unknown>");
    expect(typeof frames[0].function).toBe("string");
  });

  it("returns fallback frame for empty input", () => {
    const frames = parseStackFrames("");
    expect(frames).toHaveLength(1);
  });

  it("caps frames at 50", () => {
    const lines = Array.from(
      { length: 60 },
      (_, i) => `    at fn${i} (file.js:${i}:0)`,
    ).join("\n");
    const frames = parseStackFrames(`Error\n${lines}`);
    expect(frames.length).toBe(50);
  });
});

// ---- buildEventPayload -------------------------------------------------------

describe("buildEventPayload", () => {
  beforeEach(() => {
    chrome.runtime.getManifest.mockReturnValue({ version: "0.0.5" });
  });

  it("has required Sentry event fields", () => {
    const payload = buildEventPayload(
      { name: "TypeError", message: "bad value", stack: "" },
      { surface: "popup" },
      "error",
    );
    expect(payload.platform).toBe("javascript");
    expect(payload.level).toBe("error");
    expect(payload.event_id).toMatch(/^[0-9a-f]{32}$/);
    expect(payload.release).toBe("tabrest@0.0.5");
    expect(payload.exception.values[0].type).toBe("TypeError");
    expect(payload.tags.surface).toBe("popup");
    expect(payload.user).toEqual({ ip_address: null });
  });

  it("reverses frames for Sentry caller-first convention", () => {
    const stack = `Error\n    at inner (a.js:1:1)\n    at outer (b.js:2:2)`;
    const payload = buildEventPayload({ name: "Error", message: "x", stack }, {}, "error");
    const frames = payload.exception.values[0].stacktrace.frames;
    // After reversal, 'outer' (index 1 in raw) should be first
    expect(frames[0].function).toBe("outer");
    expect(frames[1].function).toBe("inner");
  });
});

// ---- buildMessagePayload -----------------------------------------------------

describe("buildMessagePayload", () => {
  beforeEach(() => {
    chrome.runtime.getManifest.mockReturnValue({ version: "0.0.5" });
  });

  it("has message.formatted and no exception field", () => {
    const payload = buildMessagePayload("hello world", "info", {});
    expect(payload.message.formatted).toBe("hello world");
    expect(payload.exception).toBeUndefined();
    expect(payload.platform).toBe("javascript");
  });
});

// ---- buildManualReportPayload ------------------------------------------------

describe("buildManualReportPayload", () => {
  beforeEach(() => {
    chrome.runtime.getManifest.mockReturnValue({ version: "0.0.5" });
  });

  it("uses description as formatted message and attaches diagnostics", () => {
    const payload = buildManualReportPayload({
      description: "Something broke",
      diagnostics: { tabs: 3 },
    });
    expect(payload.message.formatted).toBe("Something broke");
    expect(payload.extra.diagnostics).toEqual({ tabs: 3 });
    expect(payload.level).toBe("info");
    expect(payload.tags.surface).toBe("manual_report");
  });

  it("defaults message when description is empty", () => {
    const payload = buildManualReportPayload({ description: "", diagnostics: null });
    expect(payload.message.formatted).toBe("Manual bug report");
  });
});

// ---- buildEnvelope -----------------------------------------------------------

describe("buildEnvelope", () => {
  it("produces exactly 3 newline-separated JSON lines", () => {
    const payload = { event_id: "abc123", timestamp: "2026-01-01T00:00:00Z" };
    const envelope = buildEnvelope(payload, "https://example.sentry.io");
    const lines = envelope.split("\n");
    expect(lines).toHaveLength(3);
    // Each line must be valid JSON
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });

  it("envelope header contains event_id, sent_at, and dsn", () => {
    const payload = { event_id: "deadbeef00000000deadbeef00000000", timestamp: "x" };
    const dsn = "https://key@host.sentry.io/123";
    const envelope = buildEnvelope(payload, dsn);
    const header = JSON.parse(envelope.split("\n")[0]);
    expect(header.event_id).toBe("deadbeef00000000deadbeef00000000");
    expect(header.dsn).toBe(dsn);
    expect(typeof header.sent_at).toBe("string");
  });

  it("item header type is 'event'", () => {
    const envelope = buildEnvelope({ event_id: "x", timestamp: "x" }, "https://x.io");
    const itemHeader = JSON.parse(envelope.split("\n")[1]);
    expect(itemHeader.type).toBe("event");
    expect(itemHeader.content_type).toBe("application/json");
  });

  it("third line is the payload JSON", () => {
    const payload = { event_id: "x", timestamp: "y", level: "error" };
    const envelope = buildEnvelope(payload, "https://x.io");
    const parsed = JSON.parse(envelope.split("\n")[2]);
    expect(parsed.level).toBe("error");
  });
});

// ---- sendEnvelope ------------------------------------------------------------

describe("sendEnvelope", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("POSTs to ingestUrl with correct headers", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => null },
    });

    const result = await sendEnvelope("envelope-body", "https://host/api/1/envelope/", "Sentry sentry_key=k");
    expect(fetch).toHaveBeenCalledWith(
      "https://host/api/1/envelope/",
      expect.objectContaining({
        method: "POST",
        body: "envelope-body",
        keepalive: true,
        credentials: "omit",
        headers: expect.objectContaining({
          "Content-Type": "application/x-sentry-envelope",
          "X-Sentry-Auth": "Sentry sentry_key=k",
        }),
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });

  it("returns retryAfter on 429", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: { get: (h) => (h === "retry-after" ? "60" : null) },
    });
    const result = await sendEnvelope("body", "https://x.io", "auth");
    expect(result.ok).toBe(false);
    expect(result.retryAfter).toBe("60");
  });

  it("returns {ok:false, status:0} on network error", async () => {
    fetch.mockRejectedValueOnce(new Error("network down"));
    const result = await sendEnvelope("body", "https://x.io", "auth");
    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
  });
});
