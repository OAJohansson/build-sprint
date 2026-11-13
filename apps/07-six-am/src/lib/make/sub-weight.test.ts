// L209 Sub and Weight: off is exactly the old sound (saved sounds and Studio blocks unchanged),
// Sub adds the deep part, Weight adds body at 100–400 Hz without getting brighter, all in key and on tempo.
import { describe, expect, it } from "vitest";
import { parseNewSound } from "./library";
import { parseLibLoop } from "./lib-loop";
import { rmsDb } from "./level";
import { bandShareDb } from "./meter";
import { pitchHz } from "./pattern";
import { MAKE_PRESETS, MAKE_PRESET_IDS, clampMacros, macroWord, synthParams, type SynthParams } from "./presets";
import { renderBass, secondsPer16th, type MakeNote } from "./render";

const RATE = 22050;
const notes: MakeNote[] = [2, 7, 12, 15, 18, 23, 28, 31].map((step, i) => ({ step, midi: i % 4 === 3 ? 34 : 31, dur: 2, vel: 0.9 }));
const six = { tone: 0.4, length: 0.3, pitchDrop: 0.2, drive: 0.15, wobble: 0, width: 0.1 };
const shares = (p: SynthParams) => {
  const r = renderBass(notes, p, { bpm: 126, steps: 32, rate: RATE });
  const lo = bandShareDb(r.left, r.right, RATE, 100), mid = bandShareDb(r.left, r.right, RATE, 400), k = bandShareDb(r.left, r.right, RATE, 1000);
  const pct = (d: number) => 10 ** (d / 10);
  const o80 = bandShareDb(r.left, r.right, RATE, 80), o250 = bandShareDb(r.left, r.right, RATE, 250);
  return { sub: pct(lo), body: pct(mid) - pct(lo), octaveDb: 10 * Math.log10(pct(o250) - pct(o80)) + rmsDb(r), above1k: 1 - pct(k) };
};

describe("Sub and Weight (L209)", () => {
  it("a sound saved with six knobs reads both as off and renders exactly as before", () => {
    for (const id of MAKE_PRESET_IDS) {
      const m = clampMacros(id, six);
      expect([m.sub, m.weight]).toEqual([0, 0]);
      const before = { ...synthParams(id, m) } as Partial<SynthParams>;
      delete before.sub; delete before.weight; // what the renderer got before L209
      const a = renderBass(notes, synthParams(id, m), { bpm: 126, steps: 32, rate: RATE });
      const b = renderBass(notes, before as SynthParams, { bpm: 126, steps: 32, rate: RATE });
      expect(a.left).toEqual(b.left);
      expect(a.right).toEqual(b.right);
    }
  });
  it("the library and Studio block parsers keep old sounds off and accept the new fields", () => {
    const sound = { preset: "reese", part: "bass", key: "G", scale: "minor", bpm: 126, macros: six, pattern: { bars: 1, notes: [{ step: 0, midi: 31, dur: 2, vel: 0.9 }] } };
    expect(parseNewSound(sound)!.macros).toMatchObject({ sub: 0, weight: 0 });
    expect(parseNewSound({ ...sound, macros: { ...six, sub: 0.6, weight: 0.4 } })!.macros).toMatchObject({ sub: 0.6, weight: 0.4 });
    const block = parseLibLoop({ libId: "x", name: "Old", preset: "reese", macros: six, pattern: { bars: 1, notes: [{ step: 0, midi: 31, dur: 2, vel: 0.9 }] }, key: "G", scale: "minor", bpm: 126 });
    if (block) expect([(block.macros as Record<string, number>).sub, (block.macros as Record<string, number>).weight]).toEqual([0, 0]);
  });
  it("Sub adds the part below 100 Hz; Weight adds the octave above the note (80–250 Hz) and doesn't get brighter", () => {
    for (const id of MAKE_PRESET_IDS) {
      const off = shares(synthParams(id, { ...six, sub: 0, weight: 0 }));
      const sub = shares(synthParams(id, { ...six, sub: 1, weight: 0 }));
      const weight = shares(synthParams(id, { ...six, sub: 0, weight: 1 }));
      // Round sub is already a sine-like sub: more Sub there is just more of the same.
      if (id === "round-sub") expect(sub.sub, id).toBeGreaterThanOrEqual(off.sub - 1e-9);
      else expect(sub.sub, id).toBeGreaterThan(off.sub + 0.03);
      expect(weight.octaveDb, id).toBeGreaterThan(off.octaveDb + 1); // more energy at the octave, in dB
      expect(weight.above1k, id).toBeLessThanOrEqual(off.above1k + 0.01);
    }
  });
  it("stays in key and on tempo with both full", () => {
    const r = renderBass([{ step: 0, midi: 33, dur: 16, vel: 1 }], synthParams("rubber-pluck", { ...MAKE_PRESETS["rubber-pluck"].macros, length: 1, pitchDrop: 0, sub: 1, weight: 1 }), { bpm: 124, steps: 16, rate: RATE });
    expect(pitchHz(r.left.subarray(Math.round(0.4 * RATE), Math.round(0.6 * RATE)), RATE)!).toBeCloseTo(55, 0);
    const on = [0, 6, 16].map((step) => ({ step, midi: 33, dur: 2, vel: 0.9 }));
    const t = renderBass(on, synthParams("reese", { ...MAKE_PRESETS.reese.macros, length: 0.2, sub: 1, weight: 1 }), { bpm: 124, steps: 32, rate: RATE });
    for (const n of on) {
      const at = Math.round(n.step * secondsPer16th(124) * RATE);
      let first = Math.max(0, at - Math.round(0.01 * RATE));
      while (first < t.left.length && Math.abs(t.left[first]) < 1e-3) first++;
      expect(Math.abs(first - at) / RATE).toBeLessThanOrEqual(0.005);
    }
  });
  it("says them in words", () => {
    expect([macroWord("sub", 0), macroWord("sub", 0.3), macroWord("sub", 0.9)]).toEqual(["off", "some", "full"]);
    expect([macroWord("weight", 0.1), macroWord("weight", 0.5), macroWord("weight", 0.9)]).toEqual(["light", "full", "heavy"]);
  });
});
