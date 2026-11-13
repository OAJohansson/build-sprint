// Make for FX (Phase 5 slice 3): the generators and their timing from the map's sections, the
// measure behind Suggest (and its honest "nothing clear" case), the A/B level, and a saved FX row on
// the FX lane rendering the same after a reload.
import { describe, expect, it } from "vitest";
import { dropLibSound } from "@/lib/studio-drop";
import { lanesOf } from "@/lib/studio-lanes";
import type { Doc } from "@/lib/timeline";
import { measureFx, renderFxMine } from "./fx-make";
import { FX_KNOBS, FX_PRESET_IDS, FX_ROWS, clampFxMacros, fxKnobWord, fxPlan, fxRowPresets, renderFxEvent, renderFxRow, rootMidiOf, FX_PRESETS } from "./fx-synth";
import { kBlocks, kLoopEnergy, lufs } from "./level";
import { editLibLoop, libLaneType, libLoopFrom, parseLibLoop, renderLibPass, type FxLoop } from "./lib-loop";
import { parseNewSound, suggestFxName, type LibrarySound } from "./library";
import { secondsPer16th } from "./render";

const RATE = 22050, BPM = 124, barS = 16 * secondsPer16th(BPM);
const home = Object.fromEntries(FX_ROWS.map((r) => [r, {}])) as never;

describe("FX generators", () => {
  it("has the rows' presets and knobs (sound-check.md, T124)", () => {
    expect(fxRowPresets("impact").map((id) => FX_PRESETS[id].name)).toEqual(["Big hit", "Sub drop", "Crash"]);
    expect(fxRowPresets("down").map((id) => FX_PRESETS[id].name)).toEqual(["Dark fall", "Noise fall"]);
    expect(fxRowPresets("riser").map((id) => FX_PRESETS[id].name)).toEqual(["Bright noise", "Reverse crash", "Synth riser"]);
    expect(FX_KNOBS).toEqual({ impact: ["size", "tone", "tail"], down: ["drop", "tone", "length"], riser: ["rise", "tone", "width"] });
    for (const id of FX_PRESET_IDS) for (const k of FX_KNOBS[FX_PRESETS[id].row]) expect(fxKnobWord(id, k, 0.5)).not.toBe(fxKnobWord(id, k, 0.6));
  });

  it("times the rows to the section: the hit on the drop's first beat, the riser into the next section", () => {
    const p = fxPlan(97, 8, [65, 97, 105], home);
    expect(p.impact).toMatchObject({ atBar: 0, label: "bar 97" });
    expect(p.down).toMatchObject({ atBar: 0, bars: 2, label: "bars 97–98" });
    expect(p.riser).toMatchObject({ atBar: 6, bars: 2, label: "bars 103–104" });
    // A loop starting mid-section: the hit falls on the next section start inside it.
    expect(fxPlan(93, 8, [97], home).impact.atBar).toBe(4);
  });

  it("renders the same every time; a riser grows to its end; a sub drop lands on the root", () => {
    for (const id of FX_PRESET_IDS) {
      const a = renderFxEvent(id, {}, barS, 33, RATE)[0], b = renderFxEvent(id, {}, barS, 33, RATE)[0];
      expect(Buffer.from(a.buffer).equals(Buffer.from(b.buffer)), id).toBe(true);
    }
    const r = renderFxEvent("fx-riser-noise", {}, 2 * barS, 33, RATE)[0];
    const e = (a: number, b: number) => { let s = 0; for (let i = Math.round(a * r.length); i < Math.round(b * r.length); i++) s += r[i] * r[i]; return s; };
    expect(e(0.75, 0.95)).toBeGreaterThan(e(0.05, 0.25) * 10);
    // Sub drop: the last third's zero crossings sit near A1 (55 Hz) for a track in A.
    const sd = renderFxEvent("fx-impact-subdrop", { tail: 0.75 }, 4 * barS, rootMidiOf("A"), RATE)[0];
    const from = Math.round(sd.length * 0.62), to = Math.round(sd.length * 0.8);
    let ups = 0; for (let i = from + 1; i < to; i++) if (sd[i - 1] < 0 && sd[i] >= 0) ups++;
    expect(ups / ((to - from) / RATE)).toBeGreaterThan(50);
    expect(ups / ((to - from) / RATE)).toBeLessThan(60);
  });
});

/** A loop of `bars` bars of quiet pad-ish noise, plus the given FX events (numbers only, our own sounds). */
function loop(bars: number, fx: { id: Parameters<typeof renderFxEvent>[0]; atBar: number; lenBars: number }[]) {
  const n = Math.round(bars * barS * RATE), x = new Float32Array(n);
  let s = 1;
  for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; x[i] = ((s / 2147483647) * 2 - 1) * 0.003; }
  for (const f of fx) { const [l] = renderFxEvent(f.id, clampFxMacros(f.id, {}), f.lenBars * barS, 33, RATE); const a = Math.round(f.atBar * barS * RATE); for (let i = 0; i < l.length && a + i < n; i++) x[a + i] += l[i] * 3; }
  return x;
}

describe("Suggest's measure (P6, honest when nothing is there)", () => {
  const plan = fxPlan(97, 8, [97, 105], home);
  it("hears a riser into the next section and ticks Rise for its length", () => {
    const x = loop(8, [{ id: "fx-riser-noise", atBar: 6, lenBars: 2 }]);
    const m = measureFx(x, x, RATE, BPM, plan, 8);
    expect(m.riser.ticks).not.toBeNull();
    expect(Math.abs((m.riser.ticks!.rise ?? 0) - 0.5)).toBeLessThanOrEqual(0.15); // 2 bars
  });
  it("hears a hit on the first beat and ticks Tail; never ticks Size", () => {
    const x = loop(8, [{ id: "fx-impact-big", atBar: 0, lenBars: 2 }]);
    const m = measureFx(x, x, RATE, BPM, plan, 8);
    expect(m.impact.ticks?.tail).toBeDefined();
    expect(m.impact.ticks?.size).toBeUndefined();
  });
  it("says where a riser lands in the track's bars, and calls a half-bar jump no riser (FX-F3)", () => {
    const x = loop(8, [{ id: "fx-riser-noise", atBar: 6, lenBars: 2 }]);
    expect(measureFx(x, x, RATE, BPM, plan, 8, 97).riser.heard).toMatch(/into bar 105$/);
    const fill = loop(8, [{ id: "fx-riser-noise", atBar: 7.5, lenBars: 0.5 }]);
    expect(measureFx(fill, fill, RATE, BPM, plan, 8, 97).riser.ticks).toBeNull();
  });
  it("calls a borderline jump on the first beat a faint jump, without ticks (FX-R1)", () => {
    // A short click 7 dB over the drop: not a hit worth ticking, every read.
    const x = loop(8, []);
    const a = 0, n = Math.round(0.02 * RATE);
    for (let i = 0; i < n; i++) x[a + i] += (i % 2 ? 1 : -1) * 0.0068;
    const m = measureFx(x, x, RATE, BPM, plan, 8, 97).impact;
    expect(m.ticks).toBeNull();
  });
  it("gives no ticks, and says so, where the original has no FX", () => {
    const x = loop(8, []);
    const m = measureFx(x, x, RATE, BPM, plan, 8);
    for (const r of FX_ROWS) expect(m[r].ticks, r).toBeNull();
    expect(m.riser.heard).toMatch(/no clear riser/);
  });
});

describe("A/B (P7)", () => {
  it("turns the drop with Mine's FX down so it is as loud as the drop as is (within 0.5 LU)", () => {
    const n = Math.round(8 * barS * RATE), mix = new Float32Array(n);
    let s = 7; for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; mix[i] = ((s / 2147483647) * 2 - 1) * 0.1; }
    const A = lufs({ left: mix, right: mix, rate: RATE });
    const sounds = { impact: { preset: "fx-impact-big", macros: {}, on: true }, down: { preset: "fx-down-dark", macros: {}, on: true }, riser: { preset: "fx-riser-noise", macros: {}, on: true } } as const;
    const r = renderFxMine(fxPlan(97, 8, [97, 105], home), sounds as never, { rootMidi: 33, bpm: BPM, rate: RATE, samples: n, mixRmsDb: 10 * Math.log10(0.01 / 3), blocksA: kBlocks({ left: mix, right: mix, rate: RATE }) });
    expect(r.partsDb).toBeLessThan(0);
    const g = Math.pow(10, r.partsDb / 20), bl = mix.map((v, i) => v * g + r.left[i]), br = mix.map((v, i) => v * g + r.right[i]);
    expect(Math.abs(lufs({ left: bl, right: br, rate: RATE }) - A)).toBeLessThanOrEqual(0.5);
  });
});

describe("A/B with a silent bar the riser fills (FX-R3)", () => {
  it("keeps B within 1 dB of A, gated or not", () => {
    const n = Math.round(8 * barS * RATE), mix = new Float32Array(n);
    let s = 3; for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; mix[i] = ((s / 2147483647) * 2 - 1) * 0.1; }
    for (let i = Math.round(6 * barS * RATE); i < Math.round(7 * barS * RATE); i++) mix[i] = 0; // a silent bar before the drop
    const sounds = { impact: { preset: "fx-impact-big", macros: {}, on: false }, down: { preset: "fx-down-dark", macros: {}, on: false }, riser: { preset: "fx-riser-noise", macros: { rise: 0.5 }, on: true } } as const;
    const r = renderFxMine(fxPlan(97, 8, [97, 105], home), sounds as never, { rootMidi: 33, bpm: BPM, rate: RATE, samples: n, mixRmsDb: 10 * Math.log10(0.01 / 3), blocksA: kBlocks({ left: mix, right: mix, rate: RATE }) });
    const g = Math.pow(10, r.partsDb / 20), bl = mix.map((v, i) => v * g + r.left[i]), br = mix.map((v, i) => v * g + r.right[i]);
    const ung = (l: Float32Array, rr: Float32Array) => { const z = kBlocks({ left: l, right: rr, rate: RATE }); return 10 * Math.log10(z.reduce((a, b) => a + b, 0) / z.length); };
    expect(Math.abs(ung(bl, br) - ung(mix, mix))).toBeLessThanOrEqual(0.1);
    expect(Math.abs(lufs({ left: bl, right: br, rate: RATE }) - lufs({ left: mix, right: mix, rate: RATE }))).toBeLessThanOrEqual(1);
  });
});

describe("A/B on the real sum, a hit on the bass's note (FX-R3, round 2)", () => {
  it("keeps B within 0.2 dB of A as heard looping, where added energies miss", () => {
    // Lost 73–80-like: an A1 bass every beat, a silent last bar, the Big hit (its 55 Hz thump) on bar 1.
    const n = Math.round(8 * barS * RATE), beat = barS / 4, L = new Float32Array(n), R = new Float32Array(n);
    for (let i = 0; i < Math.round(7 * barS * RATE); i++) { const t = i / RATE, u = t % beat; L[i] = R[i] = 0.3 * Math.sin(2 * Math.PI * 55 * t + Math.PI) * Math.exp(-u / 0.2); }
    const sounds = { impact: { preset: "fx-impact-big", macros: { size: 1 }, on: true }, down: { preset: "fx-down-dark", macros: {}, on: true }, riser: { preset: "fx-riser-noise", macros: {}, on: true } } as const;
    const o = { rootMidi: 33, bpm: BPM, rate: RATE, samples: n, mixRmsDb: 10 * Math.log10(kLoopEnergy({ left: L, right: R, rate: RATE }) / 2), blocksA: kBlocks({ left: L, right: R, rate: RATE }) };
    const heard = (r: { left: Float32Array; right: Float32Array; partsDb: number }) => {
      const g = Math.pow(10, r.partsDb / 20);
      return 10 * Math.log10(kLoopEnergy({ left: L.map((v, i) => v * g + r.left[i]), right: R.map((v, i) => v * g + r.right[i]), rate: RATE }) / kLoopEnergy({ left: L, right: R, rate: RATE }));
    };
    const exact = heard(renderFxMine(fxPlan(97, 8, [97, 105], home), sounds as never, { ...o, mix: { left: L.slice(), right: R.slice() } }));
    const blocks = heard(renderFxMine(fxPlan(97, 8, [97, 105], home), sounds as never, o));
    expect(Math.abs(exact)).toBeLessThanOrEqual(0.2);
    console.info(`FX-R3 sim: B − A ${exact.toFixed(2)} dB on the real sum, ${blocks.toFixed(2)} dB with added energies`);
  });
});

describe("saving an FX row (P9)", () => {
  const raw = (preset: string, macros = {}) => ({ part: "other", preset, macros, pattern: { bars: 2, notes: [{ step: 0, midi: 33, dur: 32, vel: 1 }] }, key: "A", scale: "minor", bpm: 124, source: { title: "Lost in The Loop", url: "https://soundcloud.com/x/y" } });
  it("saves a long row on an 8-bar pass (FX-R2: a 4.6-bar Reverse crash)", () => {
    const s = parseNewSound({ ...raw("fx-riser-revcrash", { rise: 0.8 }), pattern: { bars: 8, notes: [{ step: 0, midi: 33, dur: 128, vel: 1 }] } });
    expect(s?.pattern.bars).toBe(8);
    const back = parseLibLoop(JSON.parse(JSON.stringify(libLoopFrom({ ...s!, id: "x", createdAt: "", updatedAt: "" } as LibrarySound))));
    expect(back?.bars).toBe(8);
  });
  it("names it preset first and tags it as the shot does", () => {
    const s = parseNewSound(raw("fx-riser-noise"))!;
    expect(s.name).toBe("Bright noise riser, from Lost in The Loop");
    expect(s.tags.slice(0, 2)).toEqual(["fx", "riser"]);
    expect(s.tags).toContain("2 bars");
    expect(suggestFxName("fx-impact-subdrop", { tail: 1 }, null)).toBe("Sub drop, long");
    // FX-F4: the tag says the length the knob shows, not the block's rounded-up pass.
    expect(parseNewSound({ ...raw("fx-impact-subdrop", { tail: 0.6 }) })!.tags).toContain("2.6 bars");
  });
  it("lands every row on the FX lane, renders the same after a reload, and a longer rise grows the block", () => {
    for (const id of ["fx-impact-subdrop", "fx-down-dark", "fx-riser-revcrash"]) {
      const s = { ...parseNewSound(raw(id))!, id: "0f8fad5b-d9cb-469f-a165-70867728950e", createdAt: "", updatedAt: "" } as LibrarySound;
      expect(libLaneType(s)).toBe("fx");
      const out = dropLibSound({ regions: [], muted: [false, false, false, false] } as unknown as Doc, s, 1)!;
      expect(lanesOf(out.doc).find((l) => l.id === out.laneId)!.type).toBe("fx");
      const copy = libLoopFrom(s), back = parseLibLoop(JSON.parse(JSON.stringify(copy)))!;
      const a = renderLibPass(copy, { key: "C", scale: "minor", bpm: 126 }, RATE), b = renderLibPass(back, { key: "C", scale: "minor", bpm: 126 }, RATE);
      expect(Buffer.from(a.left.buffer).equals(Buffer.from(b.left.buffer))).toBe(true);
    }
    const riser = libLoopFrom({ ...parseNewSound(raw("fx-riser-noise"))!, id: "x", createdAt: "", updatedAt: "" } as LibrarySound) as FxLoop;
    expect((editLibLoop(riser, { macros: { rise: 0.75 } }) as FxLoop).bars).toBe(4);
    expect(renderFxRow("fx-riser-noise", {}, { bpm: 124, steps: 32, key: "A", rate: RATE }).left.length).toBe(Math.round(32 * secondsPer16th(124) * RATE));
  });
});
