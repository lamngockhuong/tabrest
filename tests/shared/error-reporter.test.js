import { describe, it, expect } from "vitest";
import { sanitizeString, sanitizeError } from "../../src/shared/error-reporter.js";

describe("sanitizeString", () => {
  it("returns input unchanged if no PII patterns", () => {
    expect(sanitizeString("Tab count: 42, Memory: 80%")).toBe("Tab count: 42, Memory: 80%");
  });

  it("returns non-strings unchanged", () => {
    expect(sanitizeString(null)).toBe(null);
    expect(sanitizeString(undefined)).toBe(undefined);
    expect(sanitizeString(123)).toBe(123);
  });

  it("redacts HTTP URLs", () => {
    expect(sanitizeString("Error loading http://example.com/page")).toBe(
      "Error loading [REDACTED]"
    );
  });

  it("redacts HTTPS URLs", () => {
    expect(sanitizeString("Error loading https://private.com/secret/page?token=abc")).toBe(
      "Error loading [REDACTED]"
    );
  });

  it("redacts email addresses", () => {
    expect(sanitizeString("User email: user@example.com caused error")).toBe(
      "User email: [REDACTED] caused error"
    );
  });

  it("redacts IP addresses", () => {
    expect(sanitizeString("Connected to 192.168.1.100 failed")).toBe(
      "Connected to [REDACTED] failed"
    );
  });

  it("handles multiple PII instances", () => {
    const input = "Visited https://a.com and https://b.com with user@test.com from 10.0.0.1";
    const result = sanitizeString(input);

    expect(result).not.toContain("https://");
    expect(result).not.toContain("@test.com");
    expect(result).not.toContain("10.0.0.1");
    expect(result).toContain("[REDACTED]");
  });

  it("preserves error context while redacting URLs", () => {
    const input = "Failed to fetch https://api.example.com/users: 404 Not Found";
    const result = sanitizeString(input);

    expect(result).toContain("Failed to fetch");
    expect(result).toContain("404 Not Found");
    expect(result).not.toContain("api.example.com");
  });
});

describe("sanitizeError", () => {
  it("sanitizes error message", () => {
    const error = new Error("Failed to load https://secret.com/data");
    const result = sanitizeError(error);

    expect(result.name).toBe("Error");
    expect(result.message).toBe("Failed to load [REDACTED]");
    expect(result.message).not.toContain("secret.com");
  });

  it("handles null/undefined error", () => {
    const result = sanitizeError(null);

    expect(result.name).toBe("Error");
    expect(result.message).toBe("Unknown error");
  });

  it("preserves error type name", () => {
    const error = new TypeError("Invalid URL: https://bad.url");
    const result = sanitizeError(error);

    expect(result.name).toBe("TypeError");
    expect(result.message).not.toContain("bad.url");
  });

  it("sanitizes stack trace", () => {
    const error = new Error("Test error");
    // Simulate a stack trace with file paths
    error.stack = `Error: Test error
    at fetch (https://example.com/bundle.js:123:45)
    at loadData (file:///Users/test@email.com/project/app.js:10:5)`;

    const result = sanitizeError(error);

    expect(result.stack).not.toContain("example.com");
    expect(result.stack).not.toContain("test@email.com");
    expect(result.stack).toContain("[REDACTED]");
  });
});
