import { describe, expect, it } from "vitest";
import { createState } from "../../src/pages/onboarding/state.js";

describe("onboarding wizard state", () => {
  it("initializes at step 0 with given total", () => {
    const s = createState(6);
    expect(s.stepIndex).toBe(0);
    expect(s.total).toBe(6);
    expect(s.isFirst()).toBe(true);
    expect(s.isLast()).toBe(false);
  });

  it("rejects non-positive totals", () => {
    expect(() => createState(0)).toThrow();
    expect(() => createState(-1)).toThrow();
    expect(() => createState(1.5)).toThrow();
  });

  it("advance increments and clamps at total - 1", () => {
    const s = createState(3);
    expect(s.advance()).toBe(1);
    expect(s.advance()).toBe(2);
    expect(s.advance()).toBe(2);
    expect(s.isLast()).toBe(true);
  });

  it("retreat decrements and clamps at 0", () => {
    const s = createState(3);
    s.advance();
    s.advance();
    expect(s.retreat()).toBe(1);
    expect(s.retreat()).toBe(0);
    expect(s.retreat()).toBe(0);
    expect(s.isFirst()).toBe(true);
  });

});
