import { describe, expect, it } from "vitest";
import { decideAction } from "../../src/pages/onboarding/decide-action.js";
import { createState } from "../../src/pages/onboarding/state.js";

function stateAt(total, idx) {
  const s = createState(total);
  for (let i = 0; i < idx; i++) s.advance();
  return s;
}

describe("onboarding wizard decideAction", () => {
  it('next on a non-final step advances and persists', () => {
    expect(decideAction({ action: "next", state: stateAt(6, 2) })).toEqual({
      effect: "advance",
      persist: true,
    });
  });

  it('next on the final step is a no-op (Finish handles last)', () => {
    expect(decideAction({ action: "next", state: stateAt(6, 5) })).toEqual({ effect: "none" });
  });

  it('skip advances without persisting', () => {
    expect(decideAction({ action: "skip", state: stateAt(6, 1) })).toEqual({
      effect: "advance",
      persist: false,
    });
  });

  it('skip on the final step is a no-op', () => {
    expect(decideAction({ action: "skip", state: stateAt(6, 5) })).toEqual({ effect: "none" });
  });

  it('back retreats from non-first step', () => {
    expect(decideAction({ action: "back", state: stateAt(6, 3) })).toEqual({ effect: "retreat" });
  });

  it('back at step 0 is a no-op', () => {
    expect(decideAction({ action: "back", state: stateAt(6, 0) })).toEqual({ effect: "none" });
  });

  it('skip-all closes the window from any step', () => {
    expect(decideAction({ action: "skip-all", state: stateAt(6, 0) })).toEqual({ effect: "close" });
    expect(decideAction({ action: "skip-all", state: stateAt(6, 4) })).toEqual({ effect: "close" });
  });

  it('finish closes only on the last step', () => {
    expect(decideAction({ action: "finish", state: stateAt(6, 5) })).toEqual({ effect: "close" });
    expect(decideAction({ action: "finish", state: stateAt(6, 2) })).toEqual({ effect: "none" });
  });

  it('unknown action is a no-op', () => {
    expect(decideAction({ action: "explode", state: stateAt(6, 1) })).toEqual({ effect: "none" });
  });
});
