import { describe, expect, it } from "vitest";
import { classifyHats } from "./hats-split";
import { KIT_909, renderDrums, rng, type DrumSpec } from "./layers-bench";

const RATE = 44100;
const sps = (bpm: number) => 60 / bpm / 4;

/** A four-on-the-floor bar with a hat on every 8th; the offbeat ones open (synthetic, Six AM's own sounds). */
const SPEC: DrumSpec = { name: "8th hats, offbeat open", bpm: 124, kit: KIT_909, bars: [{ kick: [0, 4, 8, 12], clap: [4, 12], hats: [0, 2, 4, 6, 8, 10, 12, 14] }], openHatSteps: [2, 6, 10, 14] };

function hatsOf(spec: DrumSpec, seed = 3) {
  const { mono, truth } = renderDrums(spec, { bars: 4, rate: RATE, seed });
  const hats = truth.filter((h) => h.row === "hats");
  const open = hats.map((h) => (spec.openHatSteps ?? []).includes(Math.round((h.t - (spec.gridOffsetMs ?? 0) / 1000) / sps(spec.bpm)) % 16));
  return { mono, times: hats.map((h) => h.t), open };
}

describe("open-hat reader (L268, W5)", () => {
  it("labels the offbeat open hats open and the closed ones closed", () => {
    const { mono, times, open } = hatsOf(SPEC);
    const got = classifyHats(mono, RATE, times);
    expect(got).toHaveLength(times.length);
    expect(got.map((h) => h.open)).toEqual(open);
    // Open ones ring on; a closed one is short, or its tail is a clap's (body, not air).
    for (const h of got) expect(h.open ? h.decayDb > -10 && h.airDb > 10 : h.decayDb < -20 || h.airDb < -5).toBe(true);
  });

  it("a long metallic open hat (909-style, 150 ms ring) is still open", () => {
    const { mono, times, open } = hatsOf({ ...SPEC, kit: { ...KIT_909, hatMetal: true, openTau: 0.15 } }, 7);
    expect(classifyHats(mono, RATE, times).map((h) => h.open)).toEqual(open);
  });

  it("a steady high wash under closed hats (a shaker or ride bed) doesn't make them open", () => {
    const { mono, times } = hatsOf({ ...SPEC, openHatSteps: [] }, 11);
    const r = rng(5);
    // Noise ~20 dB under the hats, everywhere: it lifts the floor and the tails alike.
    const washed = mono.map((v) => v + (r() * 2 - 1) * 0.03);
    expect(classifyHats(washed, RATE, times).filter((h) => h.open)).toHaveLength(0);
  });

  it("edges: no hats, silence, and hats too close to hear a tail", () => {
    expect(classifyHats(new Float32Array(RATE), RATE, [])).toEqual([]);
    const quiet = classifyHats(new Float32Array(RATE * 2), RATE, [0.1, 0.5]);
    expect(quiet.every((h) => !h.open)).toBe(true);
    // Two hats 30 ms apart: the first can't ring, so it isn't judged (and isn't open).
    const { mono } = hatsOf(SPEC);
    const close = classifyHats(mono, RATE, [0.5, 0.53]);
    expect(close[0].judged).toBe(false);
    expect(close[0].open).toBe(false);
    expect(close[0].gapMs).toBe(30);
  });

  it("the loop plays round: the last hit's gap runs to the first one a pass later", () => {
    const { mono, times } = hatsOf(SPEC);
    const got = classifyHats(mono, RATE, times);
    const loopS = mono.length / RATE;
    expect(got.at(-1)!.gapMs).toBe(Math.round((times[0] + loopS - times.at(-1)!) * 1000));
  });
});
