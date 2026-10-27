// F2 (evals 26 Oct): the meter and the A/B match use one measure, RMS over both channels.
import { describe, expect, it } from "vitest";
import { abGain, gainToLevel, lufs, rmsDb } from "./level";
import { bandShareDb, stereoDb } from "./meter";
import { MAKE_PRESETS, synthParams } from "./presets";
import { renderBass, type MakeNote } from "./render";

const notes: MakeNote[] = [0, 4, 8, 12, 16, 20, 24, 28].map((step) => ({ step, midi: 33, dur: 3, vel: 0.9 }));

describe("one level measure for A/B (F2)", () => {
  it("the meter reads what the match matched, even for a wide Reese", () => {
    const r = renderBass(notes, synthParams("reese", MAKE_PRESETS.reese.macros), { bpm: 124, steps: 32, rate: 22050 });
    const g = gainToLevel(-16, r);
    const left = r.left.map((x) => x * g.gain), right = r.right.map((x) => x * g.gain);
    expect(Math.abs(stereoDb(left, right) - -16)).toBeLessThan(0.1);
    expect(Math.abs(stereoDb(left, right) - rmsDb({ left, right, rate: 22050 }))).toBeLessThan(0.05);
    // The mono sum is the one that reads lower (the Width layer cancels in it).
    const mono = left.map((x, i) => (x + right[i]) / 2);
    expect(stereoDb(mono, mono)).toBeLessThan(stereoDb(left, right) - 0.5);
  });
  it("silence is the floor", () => {
    expect(stereoDb(new Float32Array(10), new Float32Array(10))).toBe(-120);
    expect(stereoDb(new Float32Array(0), new Float32Array(0))).toBe(-120);
  });
});

describe("bandShareDb (a bass's weight)", () => {
  const sine = (hz: number) => Float32Array.from({ length: 44100 }, (_, i) => Math.sin((2 * Math.PI * hz * i) / 44100));
  it("a 50 Hz sine is nearly all below 100 Hz, a 400 Hz one hardly any", () => {
    const a = sine(50), b = sine(400);
    expect(bandShareDb(a, a, 44100)).toBeGreaterThan(-1);
    expect(bandShareDb(b, b, 44100)).toBeLessThan(-40);
  });
});

describe("A/B gain by loudness within the RMS bar (closeness test)", () => {
  const r = renderBass(notes, synthParams("round-sub", MAKE_PRESETS["round-sub"].macros), { bpm: 124, steps: 32, rate: 22050 });
  it("lands on the loudness target when that's within 0.9 dB of the RMS match", () => {
    const g = abGain({ rmsDb: -16, lufs: lufs(r) + gainToLevel(-16, r).db + 0.5 }, r);
    const out = { left: r.left.map((x) => x * g.gain), right: r.right.map((x) => x * g.gain), rate: 22050 };
    expect(Math.abs(rmsDb(out) - -16)).toBeLessThanOrEqual(0.91);
    expect(g.db).toBeCloseTo(gainToLevel(-16, r).db + 0.5, 1);
  });
  it("never moves more than 0.9 dB from the RMS match, and falls back to it without a loudness", () => {
    expect(abGain({ rmsDb: -16, lufs: lufs(r) + 30 }, r).db).toBeCloseTo(gainToLevel(-16, r).db + 0.9, 1);
    expect(abGain({ rmsDb: -16 }, r)).toEqual(gainToLevel(-16, r));
  });
});
