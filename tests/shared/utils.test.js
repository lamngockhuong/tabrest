import { describe, it, expect } from "vitest";
import { formatBytes, isValidDomainOrIp } from "../../src/shared/utils.js";

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
