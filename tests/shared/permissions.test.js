import { beforeEach, describe, expect, it, vi } from "vitest";

const importPermissions = () => import("../../src/shared/permissions.js");

describe("permissions", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("HOST_PERM_DEPENDENT_FLAGS", () => {
    it("lists the settings that share the optional permission", async () => {
      const { HOST_PERM_DEPENDENT_FLAGS } = await importPermissions();
      expect(HOST_PERM_DEPENDENT_FLAGS).toEqual(["protectFormTabs", "showDiscardedPrefix"]);
    });
  });

  describe("hasHostPermission", () => {
    it("queries chrome.permissions.contains with both origins", async () => {
      chrome.permissions.contains.mockResolvedValue(true);
      const { hasHostPermission } = await importPermissions();

      const result = await hasHostPermission();

      expect(result).toBe(true);
      expect(chrome.permissions.contains).toHaveBeenCalledWith({
        origins: ["http://*/*", "https://*/*"],
      });
    });

    it("caches the result across calls", async () => {
      chrome.permissions.contains.mockResolvedValue(true);
      const { hasHostPermission } = await importPermissions();

      await hasHostPermission();
      await hasHostPermission();
      await hasHostPermission();

      expect(chrome.permissions.contains).toHaveBeenCalledTimes(1);
    });

    it("invalidates cache when permission added", async () => {
      chrome.permissions.contains.mockResolvedValue(false);
      const { hasHostPermission } = await importPermissions();

      await hasHostPermission();
      // Trigger onAdded listener with new permission state
      const onAddedListener = chrome.permissions.onAdded.addListener.mock.calls[0]?.[0];
      expect(onAddedListener).toBeTypeOf("function");
      onAddedListener();

      chrome.permissions.contains.mockResolvedValue(true);
      const result = await hasHostPermission();
      expect(result).toBe(true);
      expect(chrome.permissions.contains).toHaveBeenCalledTimes(2);
    });

    it("invalidates cache when permission removed", async () => {
      chrome.permissions.contains.mockResolvedValue(true);
      const { hasHostPermission } = await importPermissions();

      await hasHostPermission();
      const onRemovedListener = chrome.permissions.onRemoved.addListener.mock.calls[0]?.[0];
      expect(onRemovedListener).toBeTypeOf("function");
      onRemovedListener();

      chrome.permissions.contains.mockResolvedValue(false);
      const result = await hasHostPermission();
      expect(result).toBe(false);
    });
  });

  describe("requestHostPermission", () => {
    it("requests both host origins and primes the cache on grant", async () => {
      chrome.permissions.request.mockResolvedValue(true);
      chrome.permissions.contains.mockResolvedValue(false); // Should not be called after grant
      const { requestHostPermission, hasHostPermission } = await importPermissions();

      const granted = await requestHostPermission();
      expect(granted).toBe(true);
      expect(chrome.permissions.request).toHaveBeenCalledWith({
        origins: ["http://*/*", "https://*/*"],
      });

      // Cache primed: should not call contains
      const cached = await hasHostPermission();
      expect(cached).toBe(true);
      expect(chrome.permissions.contains).not.toHaveBeenCalled();
    });

    it("primes cache to false when request denied", async () => {
      chrome.permissions.request.mockResolvedValue(false);
      const { requestHostPermission, hasHostPermission } = await importPermissions();

      const granted = await requestHostPermission();
      expect(granted).toBe(false);

      const cached = await hasHostPermission();
      expect(cached).toBe(false);
      expect(chrome.permissions.contains).not.toHaveBeenCalled();
    });
  });

  describe("removeHostPermission", () => {
    it("clears cache when removal succeeds", async () => {
      chrome.permissions.contains.mockResolvedValue(true);
      chrome.permissions.remove.mockResolvedValue(true);
      const { removeHostPermission, hasHostPermission } = await importPermissions();

      await hasHostPermission();
      const removed = await removeHostPermission();

      expect(removed).toBe(true);
      const after = await hasHostPermission();
      expect(after).toBe(false);
    });

    it("preserves cache when removal fails", async () => {
      chrome.permissions.contains.mockResolvedValue(true);
      chrome.permissions.remove.mockResolvedValue(false);
      const { removeHostPermission, hasHostPermission } = await importPermissions();

      await hasHostPermission();
      const removed = await removeHostPermission();

      expect(removed).toBe(false);
      const after = await hasHostPermission();
      expect(after).toBe(true); // still cached as true
    });
  });
});
