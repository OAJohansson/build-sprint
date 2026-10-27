import { describe, expect, it } from "vitest";
import { readDrums } from "./drums-read";
import { DRUM_SPECS, renderDrums, scoreDrums } from "./layers-bench";

const RATE = 44100;

describe("readDrums", () => {
  it("reads a four-on-the-floor loop into kick, clap and hat rows on time", () => {
    const { mono, truth } = renderDrums(DRUM_SPECS[0], { bars: 2, rate: RATE, seed: 1 });
    const r = readDrums(mono, undefined, RATE, DRUM_SPECS[0].bpm);
    const s = scoreDrums(truth, r.hits);
    expect(s.recall).toBeGreaterThanOrEqual(0.9);
    expect(s.p95AbsMs).toBeLessThanOrEqual(10);
    expect(r.rows.kick.map((h) => h.step)).toEqual([0, 4, 8, 12, 16, 20, 24, 28]);
    expect(r.rows.clap.map((h) => h.step)).toEqual([4, 12, 20, 28]);
    expect(r.rows.hats.map((h) => h.step)).toEqual([2, 6, 10, 14, 18, 22, 26, 30]);
  });

  it("keeps swing as a per-step offset", () => {
    const { mono } = renderDrums(DRUM_SPECS[2], { bars: 2, rate: RATE, seed: 2 });
    const r = readDrums(mono, undefined, RATE, DRUM_SPECS[2].bpm);
    expect(r.swingMs).toBeGreaterThan(15);
    expect(r.swingMs).toBeLessThan(35);
  });

  it("returns empty rows for a silent or empty loop", () => {
    for (const x of [new Float32Array(RATE * 4), new Float32Array(0)]) {
      const r = readDrums(x, x, RATE, 124);
      expect(r.hits).toEqual([]);
      expect(r.rows).toEqual({ kick: [], clap: [], hats: [] });
    }
  });

  it("reads a hats-only loop as hats only", () => {
    const { mono, truth } = renderDrums(DRUM_SPECS[5], { bars: 2, rate: RATE, seed: 3 });
    const r = readDrums(mono, undefined, RATE, DRUM_SPECS[5].bpm);
    expect(r.rows.kick).toEqual([]);
    expect(r.rows.clap).toEqual([]);
    expect(r.rows.hats.length).toBeGreaterThanOrEqual(Math.floor(truth.length * 0.9));
  });
});
