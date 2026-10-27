// Y4: Make synth and Studio library blocks in key and on tempo, from the rendered audio.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { renderBass, secondsPer16th, type MakeNote } from "@/lib/make/render";
import { MAKE_PRESETS, MAKE_PRESET_IDS, synthParams, type Macros, type MakePresetId } from "@/lib/make/presets";
import { notesForLoop } from "@/lib/make/pattern";
import { libLoopFrom, notesInKey, renderLibPass } from "@/lib/make/lib-loop";
import { inScale, pitchClass, scalePitchClasses, type Scale } from "@/lib/synths/theory";
import { hzToMidi, mono, onsetAt, rng, yinHz } from "./grade";

const RATE = 22050;
const SETTINGS: { key: string; scale: Scale; bpm: number }[] = [
  { key: "A#", scale: "minor", bpm: 124 }, { key: "F#", scale: "major", bpm: 122.4 }, { key: "C", scale: "minor", bpm: 128 },
  { key: "E", scale: "minor", bpm: 90 }, { key: "G", scale: "minor", bpm: 126.05 },
];
type Row = { set: string; preset: string; setting: string; notes: number; pitched: number; inScale: number; intended: number; maxCents: number; onsets: number; maxOnsetMs: number; meanOnsetMs: number };
const rows: Row[] = [];

/** A 4-bar line: scale notes between MIDI 28 and 48, each followed by a rest, so every onset starts from silence. */
function pattern(r: () => number, key: string, scale: Scale, minDur: number): MakeNote[] {
  const pcs = scalePitchClasses(pitchClass(key)!, scale);
  const pool: number[] = []; for (let m = 28; m <= 48; m++) if (pcs.includes(m % 12)) pool.push(m);
  const out: MakeNote[] = []; let step = Math.floor(r() * 2);
  while (step < 60) { const dur = minDur + Math.floor(r() * 3); if (step + dur >= 64) break; out.push({ step, midi: pool[Math.floor(r() * pool.length)], dur, vel: 0.7 + 0.3 * r() }); step += dur + 1 + Math.floor(r() * 2); }
  return out;
}

function grade(set: string, preset: string, s: { key: string; scale: Scale; bpm: number }, notes: MakeNote[], x: Float32Array, gateSteps: (n: MakeNote, i: number) => number, settleS: number) {
  const sps = secondsPer16th(s.bpm), tonic = pitchClass(s.key)!;
  let pitched = 0, ins = 0, intended = 0, maxC = 0, on = 0, maxO = 0, sumO = 0;
  notes.forEach((n, i) => {
    const start = Math.round(n.step * sps * RATE);
    const prevEnd = i > 0 ? notes[i - 1].step + gateSteps(notes[i - 1], i - 1) : -99;
    if (n.step - prevEnd >= 1) { // starts from (near) silence: onset measurable
      const o = onsetAt(x, start - Math.round(0.02 * RATE), Math.round(0.05 * RATE));
      if (o !== null) { const ms = ((o - start) / RATE) * 1000; on++; maxO = Math.max(maxO, Math.abs(ms)); sumO += Math.abs(ms); }
    }
    const gate = gateSteps(n, i) * sps;
    const a = settleS, b = gate * 0.95;
    if (b - a < 0.06) return; // too short to read past the pitch drop
    const seg = x.subarray(start + Math.round(a * RATE), start + Math.round(b * RATE));
    const hz = yinHz(seg, RATE, 30, 400);
    if (!hz) return;
    pitched++;
    let m = hzToMidi(hz);
    // octave errors of the detector: fold to the intended octave before judging cents
    while (m - n.midi > 6) m -= 12; while (n.midi - m > 6) m += 12;
    const near = Math.round(m), cents = Math.abs(m - n.midi) * 100;
    if (inScale(near, tonic, s.scale)) ins++;
    if (near === n.midi) intended++;
    maxC = Math.max(maxC, cents);
  });
  rows.push({ set, preset, setting: `${s.key} ${s.scale} ${s.bpm}`, notes: notes.length, pitched, inScale: ins, intended, maxCents: Math.round(maxC), onsets: on, maxOnsetMs: +maxO.toFixed(2), meanOnsetMs: on ? +(sumO / on).toFixed(2) : 0 });
}

describe("Y4 synth in key and on tempo", () => {
  it("Make synth: 4 presets × 5 keys/tempos × 2 macro sets", () => {
    const r = rng(7);
    for (const s of SETTINGS) for (const id of MAKE_PRESET_IDS) {
      for (const variant of ["no-drop", "preset", "short"] as const) {
        const macros: Macros = variant === "no-drop" ? { ...MAKE_PRESETS[id].macros, pitchDrop: 0, length: 0.75 } : variant === "preset" ? { ...MAKE_PRESETS[id].macros, length: 0.75 } : { ...MAKE_PRESETS[id].macros, length: 0.25 };
        const p = synthParams(id as MakePresetId, macros);
        const notes = pattern(r, s.key, s.scale, variant === "no-drop" ? 2 : 3);
        const played = notesForLoop({ bars: 4, notes }, 64).sort((a, b) => a.step - b.step);
        const out = renderBass(played, p, { bpm: s.bpm, steps: 64, rate: RATE });
        const settle = Math.max(0.025, p.dropSemis > 0 ? p.dropS * 5 : 0.02, p.attackS * 2);
        grade(`make-${variant}`, id, s, played, mono(out.left, out.right), (n, i) => Math.min(n.dur, p.lengthSteps, (played[i + 1]?.step ?? 64) - n.step), settle);
      }
    }
  });
  it("Studio library blocks: saved sandbox sounds dropped into 5 tracks (transposed per L197)", () => {
    const saved = JSON.parse(fs.readFileSync(new URL("./sandbox-sounds.json", import.meta.url), "utf8")).sounds;
    for (const snd of saved) for (const s of SETTINGS) {
      const l = libLoopFrom(snd);
      const notes = notesInKey(l, s.key, s.scale).sort((a, b) => a.step - b.step);
      const out = renderLibPass(l, s, RATE);
      const p = synthParams(l.preset, l.macros);
      const loopNotes = notesForLoop({ bars: l.bars, notes }, l.bars * 16);
      const settle = Math.max(0.025, p.dropSemis > 0 ? p.dropS * 5 : 0.02);
      grade("studio-lib", `${snd.name} [${l.preset}] from ${l.key} ${l.scale}`, s, loopNotes, mono(out.left, out.right), (n, i) => Math.min(n.dur, p.lengthSteps, (loopNotes[i + 1]?.step ?? l.bars * 16) - n.step), settle);
    }
  });
  it("report", () => {
    fs.writeFileSync(new URL("./y4-results.json", import.meta.url), JSON.stringify(rows, null, 1));
    const sum = (k: keyof Row, f: (r: Row) => boolean = () => true) => rows.filter(f).reduce((a, r) => a + (r[k] as number), 0);
    for (const set of [...new Set(rows.map((r) => r.set))]) {
      const f = (r: Row) => r.set === set;
      console.log(set, { renders: rows.filter(f).length, notes: sum("notes", f), pitched: sum("pitched", f), inScale: sum("inScale", f), intended: sum("intended", f), maxCents: Math.max(...rows.filter(f).map((r) => r.maxCents)), onsets: sum("onsets", f), maxOnsetMs: Math.max(...rows.filter(f).map((r) => r.maxOnsetMs)) });
    }
    expect(rows.length).toBeGreaterThan(0);
  });
});
