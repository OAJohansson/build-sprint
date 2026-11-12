// Make for melody / chords (Phase 5 slice 2): the poly synth in tempo and the same every time, the
// Chords/Lead split, doubtful rows, the fold for the library, Suggest and the row's closeness, the
// A/B level, and a saved row landing on its lane and rendering the same after a reload.
import { describe, expect, it } from "vitest";
import { dropLibSound } from "@/lib/studio-drop";
import { lanesOf } from "@/lib/studio-lanes";
import type { Doc } from "@/lib/timeline";
import { runMakeJob } from "./jobs";
import { CHORD_SPECS, renderChordPart } from "./layers-bench";
import { lufs } from "./level";
import { parseNewSound, suggestMelodyName, type LibrarySound } from "./library";
import { libLaneType, libLoopFrom, parseLibLoop, renderLibPass } from "./lib-loop";
import { foldMelodyRow, measureMelody, melodyFromReading, melodyRowCloseness, restrikeShare, suggestMelody, type MelNote } from "./melody-make";
import { readNotes } from "./notes-read";
import { MELODY_PRESET_IDS, POLY_KNOBS, POLY_PRESETS, clampPolyMacros, polyKnobWord, polySuggestLine, presetId, renderPolyRow, ROW_DEFAULT } from "./poly-synth";
import { secondsPer16th } from "./render";

const RATE = 44100;

describe("the poly synth", () => {
  it("has Stab, Pluck, Pad and Keys for each row, with the six knobs", () => {
    expect(Object.values(POLY_PRESETS).map((p) => p.name)).toEqual(["Stab", "Pluck", "Pad", "Keys"]);
    expect(MELODY_PRESET_IDS).toHaveLength(8);
    for (const id of MELODY_PRESET_IDS) expect(Object.keys(clampPolyMacros(id, undefined)).sort()).toEqual([...POLY_KNOBS].sort());
  });

  it("starts every note on its step plus offset (Z4: ≤ 5 ms) and renders the same every time", () => {
    for (const id of MELODY_PRESET_IDS) {
      const bpm = 124, sps = secondsPer16th(bpm);
      const notes = [{ step: 2, midi: 57, dur: 1, vel: 1 }, { step: 8, off: 0.2, midi: 60, dur: 2, vel: 0.8 }];
      const a = renderPolyRow(id, { attack: 0, space: 0 }, notes, { bpm, steps: 16, rate: RATE });
      for (const n of notes) {
        const at = Math.round((n.step + (n.off ?? 0)) * sps * RATE);
        let pre = 0;
        for (let i = at - 300; i < at - 30; i++) pre = Math.max(pre, Math.abs(a.left[i]));
        let first = -1;
        for (let i = at - 300; i < at + RATE * 0.01; i++) if (Math.abs(a.left[i]) > pre * 2 + 1e-4) { first = i; break; }
        expect(Math.abs(first - at) / RATE * 1000, id).toBeLessThanOrEqual(5);
      }
      const b = renderPolyRow(id, { attack: 0, space: 0 }, notes, { bpm, steps: 16, rate: RATE });
      expect(Buffer.from(a.left.buffer).equals(Buffer.from(b.left.buffer))).toBe(true);
    }
  });

  it("says each knob in words that change on a small drag, and the Mentor's line", () => {
    for (const id of MELODY_PRESET_IDS) for (const k of POLY_KNOBS) expect(polyKnobWord(id, k, 0.5), `${id} ${k}`).not.toBe(polyKnobWord(id, k, 0.56));
    expect(polySuggestLine("chords-stab", { length: 0.5, space: 0.1 }, { length: 0.2, space: 0.45 }, "stabs")).toMatch(/^(Length down to 1\/16, Space up to room|Space up to room, Length down to 1\/16)\. The original stabs are /);
  });
});

const read = (i: number, seed = 1) => {
  const spec = CHORD_SPECS[i];
  const { mono } = renderChordPart(spec, { rate: RATE, seed });
  const d = melodyFromReading(readNotes(mono, undefined, RATE, spec.bpm, spec.key), spec.bpm, mono.length / RATE);
  return { spec, mono, d };
};

describe("rows", () => {
  it("finds a Lead row only over a separate line above the chords", () => {
    expect(read(0).d.lead).toBe(false); // stabs: Chords alone
    const pl = read(4).d; // a pluck lead over a pad
    expect(pl.lead).toBe(true);
    expect(pl.rows.lead.notes.length).toBeGreaterThanOrEqual(8);
    expect(pl.rows.lead.doubtful).toBe(false);
  });

  it("marks a held note chopped into repeats, and faint sparse bleed, as doubtful", () => {
    const n = (t: number, midi = 57): MelNote => ({ t, dur: 0.24, midi, vel: 0.8, step: 0, off: 0, durSteps: 2 });
    expect(restrikeShare([n(0), n(0.25), n(0.5), n(0.75)])).toBeGreaterThanOrEqual(0.5);
    const chopped = melodyFromReading({ notes: Array.from({ length: 12 }, (_, i) => ({ t: i * 0.25, dur: 0.24, midi: 57, vel: 0.8, step: i * 2, offsetMs: 0 })), tuningCents: 0 }, 120, 16);
    expect(chopped.rows.chords.doubtful).toBe(true);
    expect(chopped.rows.chords.note).toMatch(/held pad/);
    const faint = melodyFromReading({ notes: [{ t: 3, dur: 0.2, midi: 60, vel: 0.1, step: 24, offsetMs: 0 }], tuningCents: 0 }, 120, 16);
    expect(faint.rows.chords.doubtful).toBe(true);
    expect(read(0).d.rows.chords.doubtful).toBe(false);
  });

  it("folds a progression to its 8-bar repeat and a 2-bar riff to a short one", () => {
    expect(foldMelodyRow(read(0).d.rows.chords.notes, read(0).d.steps).bars).toBe(8);
    // The riff repeats every 2 bars; the reader's small bar-to-bar differences can make 4 the shortest clean fold.
    expect(foldMelodyRow(read(5).d.rows.chords.notes, read(5).d.steps).bars).toBeLessThanOrEqual(4);
  });
});

describe("Suggest and the row's closeness (P6, Z6, L233)", () => {
  it("lands closer than the starting preset, and the row's score rises with the ticks, on ≥ 5 of 6 parts", () => {
    let closer = 0;
    for (let i = 0; i < CHORD_SPECS.length; i++) {
      const { spec, mono, d } = read(i);
      const t = measureMelody(mono, mono, RATE, d).chords!;
      const id = presetId("chords", ROW_DEFAULT.chords);
      const s = suggestMelody(t, id, spec.bpm);
      if (s.distance < s.presetDistance && melodyRowCloseness(t, id, s.macros, spec.bpm).score > melodyRowCloseness(t, id, {}, spec.bpm).score) closer++;
    }
    expect(closer).toBeGreaterThanOrEqual(5);
  }, 60000);

  it("matches the original's loudness on A/B (Z5)", () => {
    const { spec, mono } = read(0);
    const res = runMakeJob({ type: "melody-read", id: 1, left: mono.slice(), right: mono.slice(), rate: RATE, bpm: spec.bpm, key: spec.key }).res;
    if (res.type !== "melody-read") throw new Error(res.type);
    for (const kind of ["stab", "pad", "keys"] as const) {
      const sounds = { chords: { preset: presetId("chords", kind), macros: {}, on: true }, lead: { preset: presetId("lead", "pluck"), macros: {}, on: true } };
      const r = runMakeJob({ type: "melody-render", id: 2, reading: res.reading, sounds, targets: res.targets, bpm: spec.bpm, rate: RATE, samples: mono.length, levelDb: res.levelDb, lufs: res.lufs }).res;
      if (r.type !== "melody-render") throw new Error(r.type === "error" ? r.message : r.type);
      expect(Math.abs(lufs(r) - lufs({ left: mono, right: mono, rate: RATE })), kind).toBeLessThanOrEqual(0.1);
      expect(r.rowCloseness.chords?.score).toBeGreaterThanOrEqual(0);
    }
  }, 30000);
});

describe("saving a melody row (P9)", () => {
  const notes = [{ step: 2, midi: 57, dur: 1, vel: 1 }, { step: 2, midi: 60, dur: 1, vel: 1 }, { step: 2, midi: 64, dur: 1, vel: 1 }, { step: 66, off: 0.1, midi: 53, dur: 1.5, vel: 0.8 }];
  const raw = (preset: string) => ({ part: "other", preset, macros: { space: 0.9 }, pattern: { bars: 8, notes }, key: "A", scale: "minor", bpm: 124, source: { title: "Lost in The Loop", url: "https://soundcloud.com/x/y" } });

  it("parses an 8-bar row with its knobs, a preset-first name and matching tags", () => {
    const s = parseNewSound(raw("chords-stab"))!;
    expect(s.pattern.bars).toBe(8);
    expect(s.pattern.notes[3].off).toBe(0.1);
    expect(s.name).toBe("Stab chords, roomy, from Lost in The Loop");
    expect(s.tags).toContain("roomy");
    expect(suggestMelodyName("lead-pluck", {}, null)).toBe("Pluck lead");
    expect(parseNewSound({ ...raw("chords-stab"), part: "bass" })).toBeNull();
  });

  it("drops chords → Chords, a pad → Pads, the lead → Lead, and renders the same after a reload", () => {
    for (const [preset, lane] of [["chords-stab", "chords"], ["chords-keys", "chords"], ["chords-pad", "pads"], ["lead-pluck", "lead"]] as const) {
      const s = { ...parseNewSound(raw(preset))!, id: "0f8fad5b-d9cb-469f-a165-70867728950e", createdAt: "", updatedAt: "" } as LibrarySound;
      expect(libLaneType(s)).toBe(lane);
      const out = dropLibSound({ regions: [], muted: [false, false, false, false] } as unknown as Doc, s, 1)!;
      expect(lanesOf(out.doc).find((l) => l.id === out.laneId)!.type).toBe(lane);
      const copy = libLoopFrom(s), back = parseLibLoop(JSON.parse(JSON.stringify(copy)))!;
      const a = renderLibPass(copy, { key: "C", scale: "minor", bpm: 126 }, 22050), b = renderLibPass(back, { key: "C", scale: "minor", bpm: 126 }, 22050);
      expect(Buffer.from(a.left.buffer).equals(Buffer.from(b.left.buffer))).toBe(true);
      expect(a.left.length).toBe(Math.round(8 * 16 * secondsPer16th(126) * 22050));
    }
  });
});
