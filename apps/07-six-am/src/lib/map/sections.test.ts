import { describe, expect, it } from "vitest";
import { boundaries, detectSections } from "./sections";
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
  it("keeps a build apart from the drop where the kick comes back (L137)", () => {
    // 16 bars intro, then 16 bars of rising build with no kick, straight into 32 bars of drop.
    const t = [
      ...run(16, () => bar(0.4, 0.9, 0.2, 0.6, 0)),
      ...run(16, (i) => bar(0.4 + 0.03 * i, 0, 0.2, 0.3 + 0.04 * i, 0.5)),
      ...run(32, () => bar(1, 1, 0.9, 0.8, 0.6)),
      ...run(16, () => bar(0.4, 0.9, 0.1, 0.4, 0)),
    ];
    const cuts = detectSections(t, 124, 0).map((x) => x.startBar);
    expect(cuts).toContain(16);
    expect(cuts).toContain(32);
  });
  it("splits the tail where the energy steps down (drop → cooldown → outro)", () => {
    const t = [
      ...run(16, () => bar(0.4, 0.9, 0.2, 0.6, 0)),
      ...run(48, () => bar(1, 1, 0.9, 0.8, 0.6)),
      ...run(16, () => bar(0.65, 1, 0.5, 0.7, 0.3)),
      ...run(16, () => bar(0.3, 0.9, 0, 0.4, 0)),
    ];
    const cuts = detectSections(t, 124, 0).map((x) => x.startBar);
    expect(cuts).toEqual(expect.arrayContaining([16, 64, 80]));
  });
  it("splits a long section at its strongest phrase-aligned change", () => {
    // 64 bars of drop whose hats and chords change at bar 48 (a modest change).
    const t = [
      ...run(16, () => bar(0.4, 0.9, 0.2, 0.6, 0)),
      ...run(32, () => bar(1, 1, 0.9, 0.8, 0.6)),
      ...run(32, () => bar(0.95, 1, 0.9, 0.5, 0.2)),
    ];
    // The split exists, but both halves are drops, so the map shows one drop (N1).
    expect(boundaries(t)).toContain(48);
    expect(detectSections(t, 124, 0).map((x) => x.label)).toEqual(["intro", "drop"]);
  });
  it("never repeats a label back to back, and calls no outro mid-track (N1)", () => {
    // Intro, a drop, then 64 bars that thin out unevenly: the old rules called all of it "outro".
    const t = [
      ...run(8, () => bar(0.4, 0.9, 0.2, 0.6, 0)),
      ...run(24, () => bar(1, 1, 0.9, 0.8, 0.6)),
      ...run(16, () => bar(0.45, 0.2, 0.5, 0.6, 0.3)),
      ...run(16, () => bar(0.7, 0.6, 0.6, 0.7, 0.2)),
      ...run(16, () => bar(0.5, 0.3, 0.4, 0.5, 0.4)),
      ...run(24, () => bar(0.3, 0.8, 0, 0.4, 0)),
    ];
    const s = detectSections(t, 124, 0);
    for (let i = 1; i < s.length; i++) expect(s[i].label).not.toBe(s[i - 1].label);
    for (const x of s) if (x.label === "outro") expect(x.startBar).toBeGreaterThanOrEqual(0.75 * t.length);
    for (const x of s) if (x.label === "intro") expect(x.startBar).toBe(0);
  });
  it("returns nothing for an empty track", () => {
    expect(detectSections([], 124, 0)).toEqual([]);
  });
});
