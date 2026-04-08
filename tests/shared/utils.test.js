import { describe, it, expect } from "vitest";
import { formatBytes } from "../../src/shared/utils.js";

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
