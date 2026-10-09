import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAllFormModified,
  clearFormModified,
  isFormModified,
  markFormModified,
} from "../../src/background/form-modified-store.js";
import { FORM_MODIFIED_KEY } from "../../src/shared/constants.js";

let store;

beforeEach(() => {
  store = {};
  chrome.storage.local.get.mockImplementation((key) => Promise.resolve({ [key]: store[key] }));
  chrome.storage.local.set.mockImplementation((items) => {
    Object.assign(store, items);
    return Promise.resolve();
  });
  chrome.storage.local.remove.mockImplementation((key) => {
    delete store[key];
    return Promise.resolve();
  });
});

describe("form-modified-store", () => {
  it("remembers the flag for the same tab and document", async () => {
    await markFormModified(7, "doc-a");
    expect(await isFormModified(7, "doc-a")).toBe(true);
  });

  it("a new document in the same tab does not inherit the flag", async () => {
    await markFormModified(7, "doc-a");
    expect(await isFormModified(7, "doc-b")).toBe(false);
  });

  it("other tabs are unaffected", async () => {
    await markFormModified(7, "doc-a");
    expect(await isFormModified(8, "doc-a")).toBe(false);
  });

  it("ignores a sender without a documentId", async () => {
    await markFormModified(7, undefined);
    expect(store[FORM_MODIFIED_KEY]).toBeUndefined();
    expect(await isFormModified(7, undefined)).toBe(false);
  });

  it("clears one tab when it closes", async () => {
    await markFormModified(7, "doc-a");
    await markFormModified(8, "doc-b");
    await clearFormModified(7);
    expect(await isFormModified(7, "doc-a")).toBe(false);
    expect(await isFormModified(8, "doc-b")).toBe(true);
  });

  it("concurrent marks for different tabs both survive", async () => {
    await Promise.all([markFormModified(7, "doc-a"), markFormModified(8, "doc-b")]);
    expect(await isFormModified(7, "doc-a")).toBe(true);
    expect(await isFormModified(8, "doc-b")).toBe(true);
  });

  it("clears everything on browser startup", async () => {
    await markFormModified(7, "doc-a");
    await clearAllFormModified();
    expect(await isFormModified(7, "doc-a")).toBe(false);
  });
});
