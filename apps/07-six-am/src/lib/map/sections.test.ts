import { describe, expect, it } from "vitest";
import { detectSections } from "./sections";
import type { BarFeatures } from "./types";

const bar = (energy: number, kick: number, bass: number, hats: number, chords: number, vocals = 0): BarFeatures => ({ energy, kick, bass, hats, chords, vocals });
const run = (n: number, f: (i: number) => BarFeatures) => Array.from({ length: n }, (_, i) => f(i));

// A synthetic club track: intro (kick + hats), drop (everything), breakdown (no kick, chords),
// build (no kick, rising hats), drop again, outro (kick only, fading).
const track: BarFeatures[] = [
  ...run(16, () => bar(0.45, 0.9, 0.1, 0.6, 0)),
  ...run(32, () => bar(0.95, 1, 0.9, 0.8, 0.6, 0.4)),
  ...run(16, () => bar(0.3, 0, 0.1, 0.1, 0.8)),
  ...run(8, (i) => bar(0.3 + 0.07 * i, 0, 0.1, 0.1 + 0.11 * i, 0.6)),
  ...run(32, () => bar(1, 1, 0.9, 0.8, 0.6, 0.4)),
  ...run(16, (i) => bar(0.4 - 0.02 * i, 0.9, 0, 0.3, 0)),
];

describe("detectSections", () => {
  it("finds the sections of a synthetic track on their phrase lines and labels them", () => {
    const s = detectSections(track, 124, 0);
    expect(s.map((x) => [x.label, x.startBar, x.endBar])).toEqual([
      ["intro", 0, 16],
      ["drop", 16, 48],
      ["breakdown", 48, 64],
      ["build", 64, 72],
      ["drop", 72, 104],
      ["outro", 104, 120],
    ]);
  });
  it("gives each section its times from the grid", () => {
    const s = detectSections(track, 120, 0.5);
    expect(s[1].startSec).toBeCloseTo(0.5 + 16 * 2, 6);
    expect(s.at(-1)!.endSec).toBeCloseTo(0.5 + 120 * 2, 6);
  });
  it("labels a track with no change at all as one section", () => {
    const s = detectSections(run(64, () => bar(0.8, 1, 0.8, 0.7, 0.5)), 124, 0);
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ label: "drop", startBar: 0, endBar: 64 });
  });
  it("returns nothing for an empty track", () => {
    expect(detectSections([], 124, 0)).toEqual([]);
  });
});
