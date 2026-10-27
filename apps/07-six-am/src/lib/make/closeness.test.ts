// The closeness test (owner, 27 Oct): identical sounds score 100; a different envelope, octave or
// spectrum scores lower; the per-note shape reads attack, decay and a low pitch drop.
import { describe, expect, it } from "vitest";
import { analyseLoop, closeness, correlation, stepEnergy } from "./closeness";
import { MAKE_PRESETS, synthParams } from "./presets";
import { renderBass, type MakeNote } from "./render";

const RATE = 22050, BPM = 124;
const fig = (midi = 33): MakeNote[] => [0, 4, 8, 12, 16, 20, 24, 28].map((step) => ({ step, midi, dur: 2, vel: 0.9 }));
const rep = (notes: MakeNote[], m = MAKE_PRESETS["round-sub"].macros, preset: "round-sub" | "acid-line" = "round-sub") => {
  const r = renderBass(notes, synthParams(preset, m), { bpm: BPM, steps: 32, rate: RATE });
  return analyseLoop(r.left, r.right, RATE, BPM, notes.map((n) => n.step));
};

describe("closeness", () => {
  it("scores the same sound 100", () => {
    const a = rep(fig());
    const c = closeness(a, a);
    expect(c.score).toBe(100);
    expect(c.spectrumRmsDb).toBe(0);
  });
  it("scores an octave up, a brighter preset and offbeat notes lower", () => {
    const a = rep(fig());
    expect(closeness(a, rep(fig(45))).score).toBeLessThan(80);
    expect(closeness(a, rep(fig(), MAKE_PRESETS["acid-line"].macros, "acid-line")).score).toBeLessThan(80);
    const off = fig().map((n) => ({ ...n, step: n.step + 2 }));
    expect(closeness(a, rep(off)).envelope[1]).toBeLessThan(0.5);
  });
  it("reads a fast low pitch drop and a short decay per note", () => {
    const long = fig().map((n) => ({ ...n, dur: 4 }));
    const drop = rep(long, { ...MAKE_PRESETS["round-sub"].macros, pitchDrop: 1, length: 0.25, sub: 0, weight: 0 });
    const flat = rep(long, { ...MAKE_PRESETS["round-sub"].macros, pitchDrop: 0, length: 0.75, sub: 0, weight: 0 });
    expect(drop.notes.lowDropSemis).toBeGreaterThan(flat.notes.lowDropSemis + 2);
    expect(drop.notes.decayMs).toBeLessThan(flat.notes.decayMs);
  });
  it("step energy and correlation", () => {
    const x = new Float32Array(Math.round(RATE * 60 / BPM)); // one beat = 4 steps
    for (let i = 0; i < x.length / 8; i++) x[i] = 1; // the first half of step 0
    const e = stepEnergy(x, RATE, BPM);
    expect(e).toHaveLength(4);
    expect(e[0]).toBeGreaterThan(e[1] + 40);
    expect(correlation([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(correlation([1, 1, 1], [1, 2, 3])).toBe(0);
  });
});
