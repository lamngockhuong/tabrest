import { describe, it, expect } from "vitest";
import { matchesDomainList } from "../../src/background/unload-manager.js";

describe("matchesDomainList", () => {
  describe("exact domain matching", () => {
    it("matches exact domain", () => {
      const domains = ["youtube.com", "google.com"];
      expect(matchesDomainList("https://youtube.com/watch?v=123", domains)).toBe(true);
      expect(matchesDomainList("https://google.com/search", domains)).toBe(true);
    });

    it("does not match different domain", () => {
      const domains = ["youtube.com"];
      expect(matchesDomainList("https://vimeo.com/video", domains)).toBe(false);
    });
  });

  describe("subdomain matching", () => {
    it("matches subdomains of listed domain", () => {
      const domains = ["google.com"];
      expect(matchesDomainList("https://docs.google.com/document", domains)).toBe(true);
      expect(matchesDomainList("https://mail.google.com/inbox", domains)).toBe(true);
      expect(matchesDomainList("https://www.google.com/search", domains)).toBe(true);
    });

    it("does not match domain that contains listed domain as substring", () => {
      const domains = ["google.com"];
      // "fakegoogle.com" contains "google.com" but is not a subdomain
      expect(matchesDomainList("https://fakegoogle.com/fake", domains)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("returns false for null URL", () => {
      expect(matchesDomainList(null, ["google.com"])).toBe(false);
    });

    it("returns false for undefined URL", () => {
      expect(matchesDomainList(undefined, ["google.com"])).toBe(false);
    });

    it("returns false for empty domain list", () => {
      expect(matchesDomainList("https://google.com", [])).toBe(false);
    });

    it("returns false for null domain list", () => {
      expect(matchesDomainList("https://google.com", null)).toBe(false);
    });

    it("returns false for invalid URL", () => {
      expect(matchesDomainList("not-a-valid-url", ["google.com"])).toBe(false);
    });

    it("handles chrome:// URLs", () => {
      expect(matchesDomainList("chrome://extensions", ["extensions"])).toBe(true);
      expect(matchesDomainList("chrome://extensions", ["google.com"])).toBe(false);
    });
  });

  describe("common whitelist scenarios", () => {
    const whitelist = ["youtube.com", "gmail.com", "docs.google.com", "miro.com", "figma.com"];

    it("matches YouTube video URLs", () => {
      expect(matchesDomainList("https://www.youtube.com/watch?v=dQw4w9WgXcQ", whitelist)).toBe(true);
      expect(matchesDomainList("https://youtube.com/playlist?list=123", whitelist)).toBe(true);
    });

    it("matches Gmail URLs", () => {
      expect(matchesDomainList("https://mail.google.com/mail/u/0/", whitelist)).toBe(false); // mail.google.com != gmail.com
      expect(matchesDomainList("https://gmail.com/", whitelist)).toBe(true);
    });

    it("matches Google Docs URLs", () => {
      expect(matchesDomainList("https://docs.google.com/document/d/123", whitelist)).toBe(true);
    });

    it("matches design tool URLs", () => {
      expect(matchesDomainList("https://miro.com/app/board/123", whitelist)).toBe(true);
      expect(matchesDomainList("https://www.figma.com/file/123", whitelist)).toBe(true);
    });
  });
});
