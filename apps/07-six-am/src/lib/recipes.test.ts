import { describe, expect, it } from "vitest";
import { RECIPES } from "./recipes";
import { LOOPS } from "./timeline";

// The crate and the recipes are two lists that must agree; a typo would make a loop silent.
describe("recipes", () => {
  it("gives every loop in the crate a recipe, and nothing extra", () => {
    expect(Object.keys(RECIPES).sort()).toEqual(LOOPS.map((l) => l.id).sort());
  });
  it("keeps every note inside its loop and in a sane range", () => {
    for (const loop of LOOPS) {
      const steps = loop.bars * 16;
      for (const note of RECIPES[loop.id].notes) {
        expect(note.step, `${loop.id} step`).toBeGreaterThanOrEqual(0);
        expect(note.step, `${loop.id} step`).toBeLessThan(steps);
        expect(note.dur, `${loop.id} dur`).toBeGreaterThan(0);
        expect(note.vel, `${loop.id} vel`).toBeGreaterThan(0);
        expect(note.vel, `${loop.id} vel`).toBeLessThanOrEqual(1);
      }
    }
  });
  it("has 12 loops in each of the four groups", () => {
    expect([0, 1, 2, 3].map((t) => LOOPS.filter((l) => l.track === t).length)).toEqual([12, 12, 12, 12]);
  });
});
