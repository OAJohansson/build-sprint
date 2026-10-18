import { describe, expect, it } from "vitest";
import { buildIndex, previewHits, stepOfBar, STEPS } from "./schedule";
import type { Recipe } from "./recipes";
import type { Region } from "./timeline";

// "acid-line" is a 4-bar loop (64 steps); this recipe hits its first and last 16th.
const recipes: Record<string, Recipe> = {
  "acid-line": { inst: "acid", notes: [{ step: 0, note: "A1", dur: 1, vel: 1 }, { step: 63, note: "E2", dur: 4, vel: 1 }] },
};
const region = (start: number, length: number): Region => ({ id: "r", loopId: "acid-line", track: 1, start, length });

describe("buildIndex", () => {
  it("places each repeat of a loop on the grid", () => {
    const index = buildIndex([region(9, 8)], recipes);
    expect([...index.keys()].sort((a, b) => a - b)).toEqual([128, 191, 192, 255]);
  });
  it("cuts a note that would ring past the end of its region", () => {
    const index = buildIndex([region(9, 4)], recipes);
    expect(index.get(191)?.[0].note.dur).toBe(1);
  });
  it("is empty for an empty timeline", () => {
    expect(buildIndex([], recipes).size).toBe(0);
  });
  it("lets a repeat end exactly where the next loop starts", () => {
    const index = buildIndex([region(1, 4), { ...region(5, 4), id: "s" }], recipes);
    expect(index.get(64)).toHaveLength(1);
  });
});

describe("stepOfBar", () => {
  it("maps bars to steps, starting mid-bar and staying on the grid", () => {
    expect(stepOfBar(1)).toBe(0);
    expect(stepOfBar(37)).toBe(576);
    expect(stepOfBar(37.5)).toBe(584);
    expect(stepOfBar(99)).toBe(STEPS - 1);
  });
});

describe("previewHits", () => {
  it("loops a preview on its own length", () => {
    expect(previewHits(recipes["acid-line"], 4, 64)).toHaveLength(1);
    expect(previewHits(recipes["acid-line"], 4, 127)[0].note).toBe("E2");
  });
});
