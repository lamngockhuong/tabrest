import { describe, it, expect, vi, afterEach } from "vitest";
import { getUILanguage, localizeHtml, t } from "../../src/shared/i18n.js";

describe("t", () => {
  it("returns translated message when present", () => {
    chrome.i18n.getMessage.mockReturnValueOnce("Hello world");
    expect(t("greeting")).toBe("Hello world");
    expect(chrome.i18n.getMessage).toHaveBeenCalledWith("greeting", undefined);
  });

  it("falls back to key when no translation exists", () => {
    chrome.i18n.getMessage.mockReturnValueOnce("");
    expect(t("missing.key")).toBe("missing.key");
  });

  it("forwards substitutions", () => {
    chrome.i18n.getMessage.mockReturnValueOnce("Hello $1");
    t("greet", ["Khuong"]);
    expect(chrome.i18n.getMessage).toHaveBeenCalledWith("greet", ["Khuong"]);
  });
});

describe("getUILanguage", () => {
  it("delegates to chrome.i18n.getUILanguage", () => {
    chrome.i18n.getUILanguage.mockReturnValueOnce("vi");
    expect(getUILanguage()).toBe("vi");
  });
});

describe("localizeHtml", () => {
  const originalDocument = globalThis.document;

  afterEach(() => {
    if (originalDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = originalDocument;
    }
  });

  const setup = (selectorMap) => {
    globalThis.document = {
      querySelectorAll: vi.fn((sel) => selectorMap[sel] || []),
    };
  };

  it("replaces text content for [data-i18n] elements", () => {
    const el = {
      getAttribute: vi.fn(() => "key.text"),
      textContent: "",
    };
    setup({ "[data-i18n]": [el] });
    chrome.i18n.getMessage.mockImplementation((k) => (k === "key.text" ? "Translated" : ""));

    localizeHtml();

    expect(el.textContent).toBe("Translated");
  });

  it("replaces placeholder for [data-i18n-placeholder]", () => {
    const el = {
      getAttribute: vi.fn(() => "key.ph"),
      placeholder: "",
    };
    setup({ "[data-i18n-placeholder]": [el] });
    chrome.i18n.getMessage.mockImplementation((k) => (k === "key.ph" ? "Type here" : ""));

    localizeHtml();

    expect(el.placeholder).toBe("Type here");
  });

  it("replaces title for [data-i18n-title]", () => {
    const el = {
      getAttribute: vi.fn(() => "key.tip"),
      title: "",
    };
    setup({ "[data-i18n-title]": [el] });
    chrome.i18n.getMessage.mockImplementation((k) => (k === "key.tip" ? "Tooltip" : ""));

    localizeHtml();

    expect(el.title).toBe("Tooltip");
  });

  it("leaves elements untouched when translation missing", () => {
    const el = {
      getAttribute: vi.fn(() => "missing"),
      textContent: "Original",
    };
    setup({ "[data-i18n]": [el] });
    chrome.i18n.getMessage.mockReturnValue("");

    localizeHtml();

    expect(el.textContent).toBe("Original");
  });
});
