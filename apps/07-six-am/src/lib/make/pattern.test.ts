import { describe, expect, it } from "vitest";
import { inScale } from "@/lib/synths/theory";
import { estimatePattern, snapToKey } from "./pattern";
import { synthParams } from "./presets";
import { renderBass, type MakeNote } from "./render";

const RATE = 22050;
const mono = (r: { left: Float32Array; right: Float32Array }) => r.left.map((x, i) => (x + r.right[i]) / 2);
/** `bars`-bar figure repeated over `total` bars. */
const repeat = (fig: MakeNote[], bars: number, total: number) =>
  Array.from({ length: total / bars }, (_, r) => fig.map((n) => ({ ...n, step: n.step + r * bars * 16 }))).flat();

describe("snapToKey", () => {
  it("moves a slightly sharp or flat pitch to the nearest note in the scale", () => {
    expect(snapToKey(33.3, 9, "minor")).toBe(33); // A1
    expect(snapToKey(34.6, 9, "minor")).toBe(35); // B1
    expect(snapToKey(37, 9, "minor")).toBe(36); // C#2 is out of A minor: down to C2 (tie goes down)
    for (let m = 20; m < 60; m += 0.37) expect(inScale(snapToKey(m, 2, "major"), 2, "major")).toBe(true);
  });
});

describe("estimatePattern", () => {
  it("finds an offbeat 1-bar bass's steps and notes", () => {
    const fig: MakeNote[] = [2, 6, 10, 14].map((step, i) => ({ step, midi: i === 3 ? 36 : 33, dur: 2, vel: 0.9 }));
    const p = synthParams("round-sub", { tone: 0.4, length: 0.3, pitchDrop: 0, drive: 0, wobble: 0, width: 0, sub: 0, weight: 0 });
    const r = renderBass(repeat(fig, 1, 4), p, { bpm: 124, steps: 64, rate: RATE });
    const est = estimatePattern(mono(r), RATE, 124, "A", "minor")!;
    expect(est.bars).toBe(1);
    expect(est.notes.map((n) => [n.step, n.midi])).toEqual(fig.map((n) => [n.step, n.midi]));
    expect(est.confidence).toBeGreaterThanOrEqual(0.9);
  });
  it("finds a 2-bar figure with a held, legato pitch change", () => {
    const fig: MakeNote[] = [
      { step: 0, midi: 33, dur: 4, vel: 0.9 }, { step: 4, midi: 31, dur: 4, vel: 0.9 }, // legato: no gap
      { step: 10, midi: 33, dur: 2, vel: 0.8 }, { step: 16, midi: 29, dur: 6, vel: 0.9 }, { step: 26, midi: 28, dur: 2, vel: 0.8 },
    ];
    const p = synthParams("reese", { tone: 0.3, length: 1, pitchDrop: 0, drive: 0, wobble: 0, width: 0, sub: 0, weight: 0 });
    const r = renderBass(repeat(fig, 2, 8), p, { bpm: 122, steps: 128, rate: RATE });
    const est = estimatePattern(mono(r), RATE, 122, "A", "minor")!;
    expect(est.bars).toBe(2);
    expect(est.notes.map((n) => [n.step, n.midi])).toEqual(fig.map((n) => [n.step, n.midi]));
    expect(est.notes.every((n) => inScale(n.midi, 9, "minor"))).toBe(true);
  });
  it("finds the grid when the audio sits 40 ms late or 25 ms early against the bar line", () => {
    const fig: MakeNote[] = [0, 3, 6, 10, 12].map((step, i) => ({ step, midi: [31, 31, 34, 31, 29][i], dur: 2, vel: 0.9 }));
    const p = synthParams("rubber-pluck", { tone: 0.4, length: 0.25, pitchDrop: 0, drive: 0, wobble: 0, width: 0, sub: 0, weight: 0 });
    const m = mono(renderBass(repeat(fig, 1, 4), p, { bpm: 126, steps: 64, rate: RATE }));
    for (const shiftS of [0.04, -0.025]) {
      const k = Math.round(Math.abs(shiftS) * RATE), x = new Float32Array(m.length);
      if (shiftS > 0) x.set(m.subarray(0, m.length - k), k); else x.set(m.subarray(k));
      const est = estimatePattern(x, RATE, 126, "G", "minor")!;
      expect(Math.abs(est.offsetMs - shiftS * 1000)).toBeLessThanOrEqual(6);
      expect(est.notes.map((n) => [n.step, n.midi]).filter(([s]) => s !== 0 || shiftS > 0)).toEqual(fig.map((n) => [n.step, n.midi]).filter(([s]) => s !== 0 || shiftS > 0));
    }
  });
  it("needs a key and at least a bar", () => {
    expect(estimatePattern(new Float32Array(RATE * 4), RATE, 124, "H", "minor")).toBeNull();
    expect(estimatePattern(new Float32Array(RATE), RATE, 124, "A", "minor")).toBeNull();
  });
});
