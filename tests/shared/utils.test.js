import { describe, it, expect } from "vitest";
import {
  formatBytes,
  isMinorOrMajorBump,
  isValidDomainOrIp,
  parseSemver,
} from "../../src/shared/utils.js";

describe("formatBytes", () => {
  it("returns '0 B' for zero bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("returns '0 B' for null/undefined", () => {
    expect(formatBytes(null)).toBe("0 B");
    expect(formatBytes(undefined)).toBe("0 B");
  });

  it("formats bytes correctly", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes correctly", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes correctly", () => {
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(1572864)).toBe("1.5 MB");
  });

  it("formats gigabytes correctly", () => {
    expect(formatBytes(1073741824)).toBe("1 GB");
    expect(formatBytes(2147483648)).toBe("2 GB");
  });
});

describe("isValidDomainOrIp", () => {
  it("accepts localhost", () => {
    expect(isValidDomainOrIp("localhost")).toBe(true);
    expect(isValidDomainOrIp("LOCALHOST")).toBe(true);
  });

  it("accepts IPv4 addresses", () => {
    expect(isValidDomainOrIp("127.0.0.1")).toBe(true);
    expect(isValidDomainOrIp("192.168.1.1")).toBe(true);
    expect(isValidDomainOrIp("0.0.0.0")).toBe(true);
    expect(isValidDomainOrIp("255.255.255.255")).toBe(true);
  });

  it("accepts IPv6 addresses", () => {
    expect(isValidDomainOrIp("::1")).toBe(true);
    expect(isValidDomainOrIp("fe80::1")).toBe(true);
    expect(isValidDomainOrIp("2001:db8::1")).toBe(true);
  });

  it("accepts regular domains", () => {
    expect(isValidDomainOrIp("example.com")).toBe(true);
    expect(isValidDomainOrIp("sub.example.com")).toBe(true);
    expect(isValidDomainOrIp("my-site.co.uk")).toBe(true);
  });

  it("rejects invalid input", () => {
    expect(isValidDomainOrIp("invalid")).toBe(false);
    expect(isValidDomainOrIp("256.256.256.256")).toBe(false);
    expect(isValidDomainOrIp("")).toBe(false);
    expect(isValidDomainOrIp(null)).toBe(false);
    expect(isValidDomainOrIp(undefined)).toBe(false);
    expect(isValidDomainOrIp(123)).toBe(false);
  });

  it("rejects malformed IPv6 with triple-colon or extra compression", () => {
    expect(isValidDomainOrIp(":::")).toBe(false);
    expect(isValidDomainOrIp(":::1:2")).toBe(false);
    expect(isValidDomainOrIp("1:2:::3")).toBe(false);
    expect(isValidDomainOrIp("abcd:::")).toBe(false);
    expect(isValidDomainOrIp("1::2::3")).toBe(false);
  });
});

describe("parseSemver", () => {
  it("parses standard semver", () => {
    expect(parseSemver("1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
    expect(parseSemver("0.0.4")).toEqual({ major: 0, minor: 0, patch: 4 });
  });

  it("ignores pre-release suffix", () => {
    expect(parseSemver("1.2.3-beta.1")).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it("returns null for invalid input", () => {
    expect(parseSemver("")).toBe(null);
    expect(parseSemver(null)).toBe(null);
    expect(parseSemver(undefined)).toBe(null);
    expect(parseSemver("1.2")).toBe(null);
    expect(parseSemver("abc")).toBe(null);
    expect(parseSemver(123)).toBe(null);
  });
});

describe("isMinorOrMajorBump", () => {
  it("returns false for patch bumps", () => {
    expect(isMinorOrMajorBump("0.0.4", "0.0.5")).toBe(false);
    expect(isMinorOrMajorBump("1.2.3", "1.2.99")).toBe(false);
  });

  it("returns true for minor bumps", () => {
    expect(isMinorOrMajorBump("0.0.4", "0.1.0")).toBe(true);
    expect(isMinorOrMajorBump("1.2.3", "1.3.0")).toBe(true);
  });

  it("returns true for major bumps", () => {
    expect(isMinorOrMajorBump("0.9.9", "1.0.0")).toBe(true);
    expect(isMinorOrMajorBump("1.5.5", "2.0.0")).toBe(true);
  });

  it("returns false for downgrades", () => {
    expect(isMinorOrMajorBump("1.2.0", "1.1.0")).toBe(false);
    expect(isMinorOrMajorBump("2.0.0", "1.9.9")).toBe(false);
  });

  it("returns false for invalid versions", () => {
    expect(isMinorOrMajorBump(null, "1.0.0")).toBe(false);
    expect(isMinorOrMajorBump("1.0.0", null)).toBe(false);
    expect(isMinorOrMajorBump("abc", "1.0.0")).toBe(false);
  });

  it("handles same version", () => {
    expect(isMinorOrMajorBump("1.0.0", "1.0.0")).toBe(false);
  });
});
