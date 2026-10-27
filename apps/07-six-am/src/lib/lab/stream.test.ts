import { describe, expect, it } from "vitest";
import { makePlan, playDelay, step } from "./stream";

describe("rolling separation plan", () => {
  const plan = makePlan(44100, 3, 0.5, 0.03);

  it("first step needs only hop + guard of audio and zero-pads the window's left", () => {
    const s = step(plan, 0);
    expect(s.end).toBe(plan.hop + plan.guard);
    expect(s.windowStart).toBeLessThan(0);
    expect(s.regionStart).toBe(-plan.fade);
    expect(s.from + s.length).toBe(plan.window - plan.guard);
  });

  it("neighbouring regions overlap by exactly the fade and never leave a gap", () => {
    for (let k = 0; k < 50; k++) {
      const a = step(plan, k);
      const b = step(plan, k + 1);
      expect(a.regionStart + a.length - b.regionStart).toBe(plan.fade);
      expect(b.end - a.end).toBe(plan.hop);
    }
  });

  it("the region always lies inside its window", () => {
    const s = step(plan, 7);
    expect(s.from).toBeGreaterThanOrEqual(0);
    expect(s.from + s.length).toBeLessThanOrEqual(plan.window);
  });

  it("delay covers the region's span plus compute", () => {
    expect(playDelay(plan, 44100, 1, 0.5)).toBeCloseTo(3 + 0.5 + 0.03 + 1.5, 2);
  });

  it("refuses a hop that doesn't fit in one window", () => {
    expect(() => makePlan(44100, 8, 0.5)).toThrow();
  });
});
