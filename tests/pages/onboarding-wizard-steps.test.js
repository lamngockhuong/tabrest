import { describe, expect, it } from "vitest";
import { STEPS } from "../../src/pages/onboarding/steps.js";

const EXPECTED_IDS = ["welcome", "auto-unload", "whitelist", "power-mode", "notifications", "done"];

describe("onboarding wizard step config", () => {
  it("exposes exactly 6 steps in the locked order", () => {
    expect(STEPS).toHaveLength(6);
    expect(STEPS.map((s) => s.id)).toEqual(EXPECTED_IDS);
  });

  it("each step has an id, titleKey, render, and persist", () => {
    for (const step of STEPS) {
      expect(typeof step.id).toBe("string");
      expect(step.id.length).toBeGreaterThan(0);
      expect(typeof step.titleKey).toBe("string");
      expect(step.titleKey.startsWith("ob")).toBe(true);
      expect(typeof step.render).toBe("function");
      expect(typeof step.persist).toBe("function");
    }
  });

  it("welcome and done steps have noop persist (return undefined)", () => {
    const welcome = STEPS[0];
    const done = STEPS[STEPS.length - 1];
    expect(welcome.id).toBe("welcome");
    expect(done.id).toBe("done");
    expect(welcome.persist()).toBeUndefined();
    expect(done.persist()).toBeUndefined();
  });

  it("step ids are unique", () => {
    const ids = STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
