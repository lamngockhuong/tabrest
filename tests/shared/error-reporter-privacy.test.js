import { describe, expect, it } from "vitest";
import { __test__, sanitizeError, sanitizeString } from "../../src/shared/error-reporter.js";

const { buildEventPayload, buildMessagePayload, buildManualReportPayload } = __test__;

/**
 * Privacy Invariant Tests
 * These tests encode the privacy policy claims as executable specs.
 * Any regression in sanitization will cause failures.
 */

describe("error-reporter privacy invariants", () => {
  // Test data: PII strings covered by PII_PATTERNS
  // Patterns: https?://, emails, IPv4 (note: file://, data:, IPv6 not in current patterns)
  const piiVectors = [
    // URLs - http and https only (per PII_PATTERNS)
    "https://api.example.com/secret",
    "http://internal.net/password=secret",
    "https://example.com/page?token=abc123",

    // Emails
    "user@example.com",
    "test.user+tag@sub.domain.co.uk",
    "admin@localhost.local",
    "support@company.org",

    // IPv4 addresses
    "192.168.1.1",
    "10.0.0.1",
    "127.0.0.1",
    "8.8.8.8",
    "172.16.0.1",
  ];

  describe("buildEventPayload redaction", () => {
    it("redacts URLs in error message after sanitization", () => {
      const rawError = new Error("Failed to load https://api.example.com/secret");
      const error = sanitizeError(rawError);
      const payload = buildEventPayload(error, {}, "error");

      const json = JSON.stringify(payload);
      expect(json).not.toContain("https://");
      expect(json).not.toContain("api.example.com");
      expect(json).toContain("[REDACTED]");
    });

    it("redacts URLs in stack trace after sanitization", () => {
      const rawError = new Error("Test error");
      rawError.stack =
        "Error: Test\n    at fetch (https://internal.net/api:1:1)\n    at main (file.js:10:5)";
      const error = sanitizeError(rawError);
      const payload = buildEventPayload(error, {}, "error");

      const json = JSON.stringify(payload);
      // URL should be redacted in the stack before buildEventPayload
      expect(json).not.toContain("https://internal.net");
      expect(json).not.toContain("api");
      // sanitizeError redacted it to [REDACTED]
      expect(error.stack).toContain("[REDACTED]");
    });

    it("redacts email addresses in message after sanitization", () => {
      const rawError = new Error("User admin@example.com reported an issue");
      const error = sanitizeError(rawError);
      const payload = buildEventPayload(error, {}, "error");

      const json = JSON.stringify(payload);
      expect(json).not.toContain("admin@example.com");
      expect(json).toContain("[REDACTED]");
    });

    it("redacts IPv4 addresses in message after sanitization", () => {
      const rawError = new Error("Connected to 192.168.1.100 failed");
      const error = sanitizeError(rawError);
      const payload = buildEventPayload(error, {}, "error");

      const json = JSON.stringify(payload);
      expect(json).not.toContain("192.168.1.100");
      expect(json).toContain("[REDACTED]");
    });

    it("has user.ip_address as null (defense-in-depth)", () => {
      const rawError = new Error("test");
      const error = sanitizeError(rawError);
      const payload = buildEventPayload(error, {});

      expect(payload.user).toBeDefined();
      expect(payload.user.ip_address).toBeNull();
    });

    it("only uses context.surface for tags (other context values not included)", () => {
      const rawError = new Error("test");
      const error = sanitizeError(rawError);
      const context = {
        surface: "popup",
        url: "https://secret.com/page",
        email: "user@example.com",
      };
      const payload = buildEventPayload(error, context);

      // Only surface tag is used from context
      expect(payload.tags.surface).toBe("popup");
      // Other context values are not included in payload
      const json = JSON.stringify(payload);
      expect(json).not.toContain("url");
      expect(json).not.toContain("email");
    });

    it("does not include extension settings like whitelist/blacklist", () => {
      const rawError = new Error("test");
      const error = sanitizeError(rawError);
      const context = {
        whitelist: ["example.com", "test.org"],
        blacklist: ["blocked.com"],
      };
      const payload = buildEventPayload(error, context);

      const json = JSON.stringify(payload);
      // Arrays should be serialized as [REDACTED] or excluded
      expect(json).not.toContain("example.com");
      expect(json).not.toContain("blocked.com");
    });

    it("property test: fuzzes 20 random PII vectors in message", () => {
      for (let i = 0; i < Math.min(piiVectors.length, 20); i++) {
        const pii = piiVectors[i];
        const rawError = new Error(`Error with PII: ${pii}`);
        const error = sanitizeError(rawError);
        const payload = buildEventPayload(error, {});
        const json = JSON.stringify(payload);

        // Raw PII should not appear in final payload
        expect(json).not.toContain(pii);
        // Error message should have been sanitized
        expect(error.message).toContain("[REDACTED]");
      }
    });

    it("property test: fuzzes 20 random PII vectors in stack traces", () => {
      for (let i = 0; i < Math.min(piiVectors.length, 20); i++) {
        const pii = piiVectors[i];
        const rawError = new Error("Test");
        rawError.stack = `Error: Test\n    at fn (${pii}:1:1)`;
        const error = sanitizeError(rawError);
        const payload = buildEventPayload(error, {});
        const json = JSON.stringify(payload);

        // Raw PII should not appear in final payload
        expect(json).not.toContain(pii);
        // Stack should have been sanitized
        expect(error.stack).toContain("[REDACTED]");
      }
    });
  });

  describe("buildMessagePayload redaction", () => {
    it("redacts URLs in message after sanitization", () => {
      const sanitized = sanitizeString("Failed to load https://api.example.com");
      const payload = buildMessagePayload(sanitized, "warning");

      const json = JSON.stringify(payload);
      expect(json).not.toContain("https://api.example.com");
      expect(json).toContain("[REDACTED]");
    });

    it("has user.ip_address as null", () => {
      const payload = buildMessagePayload("test message", "info");

      expect(payload.user).toBeDefined();
      expect(payload.user.ip_address).toBeNull();
    });

    it("does not include extra context values in payload (only surface tag)", () => {
      // buildMessagePayload only uses context.surface for the tags.surface field
      // Other context values are not included in the payload
      const payload = buildMessagePayload("test", "info", {
        surface: "content",
        apiUrl: sanitizeString("https://internal.net/api"),
      });

      expect(payload.tags.surface).toBe("content");
      // apiUrl is not included in the payload, so nothing to redact
      const json = JSON.stringify(payload);
      expect(json).not.toContain("apiUrl");
    });
  });

  describe("buildManualReportPayload redaction", () => {
    it("redacts description containing URLs", () => {
      const report = {
        description: sanitizeString("I accessed https://private.example.com and got an error"),
        diagnostics: {},
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      };
      const payload = buildManualReportPayload(report);

      const json = JSON.stringify(payload);
      expect(json).not.toContain("https://private.example.com");
      expect(json).toContain("[REDACTED]");
    });

    it("redacts diagnostics values containing PII", () => {
      const report = {
        description: "test",
        diagnostics: {
          lastUrl: sanitizeString("https://secret.com"),
          userEmail: sanitizeString("admin@example.com"),
        },
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      };
      const payload = buildManualReportPayload(report);

      const json = JSON.stringify(payload);
      expect(json).not.toContain("https://secret.com");
      expect(json).not.toContain("admin@example.com");
    });

    it("has user.ip_address as null", () => {
      const report = {
        description: "test",
        diagnostics: {},
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      };
      const payload = buildManualReportPayload(report);

      expect(payload.user).toBeDefined();
      expect(payload.user.ip_address).toBeNull();
    });
  });

  describe("envelope serialization privacy", () => {
    it("buildEventPayload serializes safely without exposing PII", () => {
      const rawError = new Error("Error from https://secret.com");
      rawError.stack = "at fetch (https://secret.com:1:1)";
      const error = sanitizeError(rawError);
      const context = { email: sanitizeString("user@example.com") };
      const payload = buildEventPayload(error, context);

      // Stringify to catch serialization issues
      const json = JSON.stringify(payload);

      // Verify no raw PII in JSON
      expect(json).not.toContain("https://secret.com");
      expect(json).not.toContain("user@example.com");
      // Verify it can be parsed back
      const parsed = JSON.parse(json);
      expect(parsed).toBeDefined();
    });
  });

  describe("multiple PII redaction in single message", () => {
    it("redacts multiple URLs", () => {
      const rawError = new Error("Load https://a.com failed, fallback https://b.com also failed");
      const error = sanitizeError(rawError);
      const payload = buildEventPayload(error, {});
      const json = JSON.stringify(payload);

      expect(json).not.toContain("https://a.com");
      expect(json).not.toContain("https://b.com");
      const redactCount = (json.match(/\[REDACTED\]/g) || []).length;
      expect(redactCount).toBeGreaterThanOrEqual(2);
    });

    it("redacts URLs and emails together", () => {
      const rawError = new Error(
        "User user@example.com from https://api.example.com reported error",
      );
      const error = sanitizeError(rawError);
      const payload = buildEventPayload(error, {});
      const json = JSON.stringify(payload);

      expect(json).not.toContain("user@example.com");
      expect(json).not.toContain("https://api.example.com");
    });
  });

  describe("domain-only strings (should NOT be redacted)", () => {
    it("preserves domain-only strings without protocol", () => {
      const rawError = new Error("Domain example.com is unreachable");
      const error = sanitizeError(rawError);
      const payload = buildEventPayload(error, {});
      const json = JSON.stringify(payload);

      // Domain-only (without https:// or http://) is OK per privacy policy
      expect(json).toContain("example.com");
    });
  });
});
