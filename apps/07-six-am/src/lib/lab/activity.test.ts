import { describe, expect, it } from "vitest";
import { BarLevels, barActivity, laneBlocks, parseLevels } from "./activity";
import { LoopBuffer } from "./loop-buffer";

// LS1-N1: lanes from what the separated parts play, bar by bar. Bars at 120 BPM are 2 s.
const RATE = 100; // samples a second, small for the test
const tone = (n: number, amp: number) => Float32Array.from({ length: n }, (_, i) => (i % 2 ? amp : -amp));
const region = (n: number, amps: number[]) => amps.flatMap((a) => [tone(n, a), tone(n, a)]);

describe("bar levels from the separated parts", () => {
  it("averages each part per bar, from the bar's start; half a bar heard counts", () => {
    const L = new BarLevels(4, 120, 0.5);
    // 3 s of audio from track 0.5 s (bar 1 start): bar 1 whole, bar 2 half.
    L.add(region(300, [0.1, 0, 1, 0.01]), 0, 300, 0.5, RATE, 1);
    expect(L.levels.slice(0, 4).map((p) => p[0])).toEqual([-20, -120, 0, -40]);
    expect(L.levels[0][1]).toBe(-20);
    expect(L.levels[0][2]).toBeNull();
  });
  it("skips audio before the run (skip) and before bar 1; a new pass over a bar starts it over", () => {
    const L = new BarLevels(2, 120, 1);
    L.add(region(300, [0.1, 0.1, 0.1, 0.1]), 100, 200, 1, RATE, 1); // samples 100.. are at 1 s
    expect(L.levels[0][0]).toBe(-20);
    L.add(region(200, [1, 1, 1, 1]), 0, 200, 1, RATE, 2);
    expect(L.levels[0][0]).toBe(0);
    // Before the first downbeat: nothing.
    const M = new BarLevels(2, 120, 2);
    expect(M.add(region(100, [1, 1, 1, 1]), 0, 100, 0, RATE, 1)).toEqual([]);
  });
  it("splits the drums into a low band (kick) and a high band (hats), LS1-N7", () => {
    const rate = 44100, n = rate * 2;
    const low = Float32Array.from({ length: n }, (_, i) => 0.5 * Math.sin((2 * Math.PI * 50 * i) / rate));
    const high = Float32Array.from({ length: n }, (_, i) => 0.5 * Math.sin((2 * Math.PI * 12000 * i) / rate));
    const z = new Float32Array(n);
    const K = new BarLevels(1, 120, 0);
    K.add([low, low, z, z, z, z, z, z], 0, n, 0, rate, 1);
    const H = new BarLevels(1, 120, 0);
    H.add([high, high, z, z, z, z, z, z], 0, n, 0, rate, 1);
    expect(K.levels[4][0]! - K.levels[5][0]!).toBeGreaterThan(20);
    expect(H.levels[5][0]! - H.levels[4][0]!).toBeGreaterThan(20);
  });
  it("keeps levels saved on the map until a bar is heard again", () => {
    const L = new BarLevels(2, 120, 0, [[-10, null], [null, null], [null, null], [null, null]]);
    expect(L.levels[0]).toEqual([-10, null]);
  });
});

describe("lane clips", () => {
  it("active within 15 dB of the part's loud bars, maybe within 21, quiet below; null not heard", () => {
    expect(barActivity([-18, -20, -30, -38, -60, null])).toEqual([2, 2, 2, 1, 0, null]);
    expect(barActivity([null, null])).toEqual([null, null]);
    // A part that is all bleed never reads as playing.
    expect(barActivity([-58, -60, -62])).toEqual([0, 0, 0]);
  });
  it("heard bars replace the estimate; the rest of the estimate stays", () => {
    const levels = [null, null, -20, -20, -70, null, null, null];
    const r = laneBlocks(levels, [{ from: 1, to: 7, level: "likely" }]);
    expect(r.heard).toEqual([{ from: 3, to: 5, level: "likely" }]);
    expect(r.estimate).toEqual([{ from: 1, to: 3, level: "likely" }, { from: 6, to: 7, level: "likely" }]);
  });
  it("the map's saved levels are whitelisted", () => {
    expect(parseLevels([[1.4, null], [null, null], [null, null], [null, -200]], 2)).toBeNull();
    expect(parseLevels([[1.4, null], [null, null], [null, null], [null, -20]], 2)).toEqual([[1, null], [null, null], [null, null], [null, -20]]);
    expect(parseLevels([[1]], 1)).toBeNull();
    expect(parseLevels([[1], [1], [1], [1], [1], [null]], 1)).toEqual([[1], [1], [1], [1], [1], [null]]);
  });
});

describe("a loop at the track's start", () => {
  it("completes with a silent head and fades the audio in after it", () => {
    const b = new LoopBuffer(100, 5, 2);
    b.write([new Float32Array(105).fill(1), new Float32Array(105).fill(1)], 10); // the run starts 10 samples in
    expect(b.complete).toBe(false);
    b.fillSilence(10);
    expect(b.complete).toBe(true);
    const out = b.build()[0];
    expect(out[5]).toBe(0);
    expect(out[10]).toBe(0); // fade-in starts at 0
    expect(out[12]).toBeCloseTo(0.4);
    expect(out[50]).toBe(1);
  });
});
