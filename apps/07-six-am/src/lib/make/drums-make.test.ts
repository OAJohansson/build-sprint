// Make for drums (Phase 5): the drum synth in tempo with its swing, the same on every render,
// doubtful rows, the fold for the library, Suggest closer than the preset, the closeness score, and
// a saved row landing on its own Studio lane and rendering the same after a reload.
import { describe, expect, it } from "vitest";
import { dropLibSound } from "@/lib/studio-drop";
import type { Doc } from "@/lib/timeline";
import { DRUM_PRESET_IDS, DRUM_PRESETS, DRUM_ROWS, ROW_KNOBS, ROW_PRESETS, clampDrumMacros, drumKnobWord, drumSuggestLine, renderDrumRow } from "./drum-synth";
import { drumsCloseness, drumsFromReading, drumsReport, foldRow, measureRows, renderDrumsMine, suggestDrum } from "./drums-make";
import { readDrums, type DrumReading } from "./drums-read";
import { DRUM_SPECS, renderDrums } from "./layers-bench";
import { parseNewSound, parseSoundPatch, suggestDrumName, type LibrarySound } from "./library";
import { libLaneType, libLoopFrom, parseLibLoop, renderLibPass } from "./lib-loop";
import { secondsPer16th } from "./render";

const RATE = 44100;

describe("the drum synth", () => {
  it("has 4 presets per row with the row's knobs (T124)", () => {
    for (const row of DRUM_ROWS) expect(ROW_PRESETS[row]).toHaveLength(4);
    expect(ROW_PRESETS.kick.map((id) => DRUM_PRESETS[id].name)).toEqual(["Deep 909", "Punch", "Round 808", "Tight"]);
    expect(ROW_PRESETS.clap.map((id) => DRUM_PRESETS[id].name)).toEqual(["Wide clap", "Snap", "Rim", "Tight snare"]);
    expect(ROW_PRESETS.hats.map((id) => DRUM_PRESETS[id].name)).toEqual(["Open 909", "Closed tick", "Shaker", "Ride"]);
    for (const id of DRUM_PRESET_IDS) expect(Object.keys(clampDrumMacros(id, undefined)).sort()).toEqual([...ROW_KNOBS[DRUM_PRESETS[id].row]].sort());
    expect(drumKnobWord("kick-deep-909", "tune", 0.38)).toMatch(/^A1 · 5\d Hz$/);
  });

  it("puts every hit on its step plus its swing offset, in tempo (Z4: ≤ 5 ms)", () => {
    for (const bpm of [120, 124, 128]) for (const id of DRUM_PRESET_IDS) {
      const sps = secondsPer16th(bpm);
      const hits = [{ step: 0, vel: 1 }, { step: 6, off: 0.2, vel: 0.8 }, { step: 12, off: -0.1, vel: 1 }];
      const r = renderDrumRow(id, DRUM_PRESETS[id].macros, hits, { bpm, steps: 16, rate: RATE });
      expect(r.left.length).toBe(Math.round(16 * sps * RATE));
      for (const h of hits.slice(1)) {
        const at = Math.round((h.step + (h.off ?? 0)) * sps * RATE);
        // The first sample clearly above what was ringing before the hit.
        let pre = 0;
        for (let i = at - 200; i < at - 20; i++) pre = Math.max(pre, Math.abs(r.left[i]));
        let first = -1;
        for (let i = at - 220; i < at + RATE * 0.01; i++) if (Math.abs(r.left[i]) > pre * 2 + 1e-3) { first = i; break; }
        expect(Math.abs(first - at) / RATE * 1000, `${id} at ${bpm}`).toBeLessThanOrEqual(5);
      }
    }
  });

  it("renders the same pattern sample for sample every time (seeded noise)", () => {
    const hits = [{ step: 2, vel: 0.9 }, { step: 6, off: 0.1, vel: 0.5 }];
    for (const id of ["clap-wide", "hats-open-909", "kick-punch"] as const) {
      const a = renderDrumRow(id, DRUM_PRESETS[id].macros, hits, { bpm: 124, steps: 16, rate: 22050 });
      const b = renderDrumRow(id, DRUM_PRESETS[id].macros, hits, { bpm: 124, steps: 16, rate: 22050 });
      expect(Buffer.from(a.left.buffer).equals(Buffer.from(b.left.buffer))).toBe(true);
    }
  });

  it("says the Mentor's line from the ticks", () => {
    const line = drumSuggestLine("kick-deep-909", { tune: 0.6, decay: 0.42, click: 0.2, drive: 0.2 }, { tune: 0.38, decay: 0.42, click: 0.55, drive: 0.2 }, "kick");
    expect(line).toMatch(/^Click up to snappy, Tune down to A1\. The original kick is snappier and lower\.$/);
  });
});

/** A reading with the given steps per row (no audio), as the reader returns it. */
const reading = (rows: Partial<Record<"kick" | "clap" | "hats", [number, number?][]>>, steps = 128): DrumReading => ({
  hits: [], steps, gridMs: 0, swingMs: 0,
  rows: { kick: [], clap: [], hats: [], ...Object.fromEntries(Object.entries(rows).map(([k, xs]) => [k, xs!.map(([step, db]) => ({ step, offsetMs: 0, vel: 1, db: db ?? -3 }))])) },
});

describe("rows as Make plays them", () => {
  it("marks a row of a few faint hits on an empty row as doubtful (L225), not a real one", () => {
    const d = drumsFromReading(reading({ kick: [[32, -30], [100, -31]], clap: [[4], [12], [20], [28]], hats: [[2, -40]] }, 256), 124);
    expect(d.rows.kick.doubtful).toBe(true);
    expect(d.rows.kick.why).toBe("2 faint marks, probably the bass bleeding through: off in Mine");
    expect(d.rows.clap.doubtful).toBe(false);
    expect(drumsFromReading(reading({ kick: [], clap: [] }), 124).rows.kick.doubtful).toBe(false); // empty: nothing to doubt
  });

  it("folds a row to its shortest repeat for the library, keeping swing", () => {
    const four = Array.from({ length: 32 }, (_, i) => ({ step: i * 4, off: 0, vel: 1 }));
    expect(foldRow("kick", four, 128)).toEqual({ bars: 1, notes: [0, 4, 8, 12].map((step) => ({ step, midi: 36, dur: 1, vel: 1 })) });
    const twoBar = [0, 4, 8, 12, 16, 20, 24, 28, 30].flatMap((s) => [0, 32, 64, 96].map((r) => ({ step: r + s, off: s % 2 ? 0 : 0.12, vel: 0.8 })));
    const f = foldRow("hats", twoBar, 128);
    expect(f.bars).toBe(2);
    expect(f.notes.map((n) => n.step)).toEqual([0, 4, 8, 12, 16, 20, 24, 28, 30]);
    expect(f.notes[0].off).toBe(0.12);
    expect(foldRow("clap", [], 128)).toEqual({ bars: 1, notes: [] });
  });
});

describe("Suggest and closeness on a known loop", () => {
  const { mono } = renderDrums(DRUM_SPECS[0], { bars: 4, rate: RATE, seed: 7 });
  const bpm = DRUM_SPECS[0].bpm;
  const d = drumsFromReading(readDrums(mono, mono, RATE, bpm), bpm);
  const targets = measureRows(mono, mono, RATE, d);

  it("measures every row of a full beat", () => {
    for (const row of DRUM_ROWS) expect(targets[row]?.n).toBeGreaterThanOrEqual(3);
  });

  it("Suggest lands closer than the starting preset on every row (Z6)", () => {
    for (const row of DRUM_ROWS) {
      const s = suggestDrum(targets[row]!, ROW_PRESETS[row][0]);
      expect(s.distance, row).toBeLessThan(s.presetDistance);
      expect(Object.keys(s.macros).sort()).toEqual([...ROW_KNOBS[row]].sort());
    }
  });

  it("scores the loop against itself near 100 and silence low", () => {
    const self = drumsReport(mono, mono, RATE, bpm);
    expect(drumsCloseness(self, self).score).toBeGreaterThanOrEqual(99);
    const z = new Float32Array(mono.length);
    expect(drumsCloseness(self, drumsReport(z, z, RATE, bpm)).score).toBeLessThan(40);
  });

  it("Mine plays every row at the original row's level", () => {
    const sounds = Object.fromEntries(DRUM_ROWS.map((r) => [r, { preset: ROW_PRESETS[r][0], macros: DRUM_PRESETS[ROW_PRESETS[r][0]].macros, on: true }])) as never;
    const levels = Object.fromEntries(DRUM_ROWS.map((r) => [r, targets[r]!.levelDb])) as never;
    const m = renderDrumsMine(d, sounds, levels, bpm, RATE);
    const score = drumsCloseness(drumsReport(mono, mono, RATE, bpm), drumsReport(m.left, m.right, RATE, bpm)).score;
    expect(score).toBeGreaterThan(50);
  });
});

describe("saving a drum row (P9)", () => {
  const raw = { part: "drums", preset: "kick-deep-909", macros: { tune: 0.3, decay: 0.5, click: 2, pitchDrop: 1 }, pattern: { bars: 1, notes: [{ step: 0, midi: 36, dur: 1, vel: 1 }, { step: 6, midi: 36, dur: 1, vel: 0.6, off: 0.15 }] }, key: "A", scale: "minor", bpm: 124, source: { title: "Lost in The Loop", url: "https://soundcloud.com/x/y" } };

  it("parses a row's sound: its knobs only, its swing kept, a drum name", () => {
    const s = parseNewSound(raw)!;
    expect(s.macros).toEqual({ tune: 0.3, decay: 0.5, click: 1, drive: 0.2 });
    expect(s.pattern.notes[1].off).toBe(0.15);
    expect(s.name).toBe(suggestDrumName("kick-deep-909", s.macros as never, "Lost in The Loop"));
    expect(s.name).toBe("Punchy kick, from Lost in The Loop"); // Click at full
    expect(parseNewSound({ ...raw, part: "bass" })).toBeNull();
    // A kick stays a kick: a hats preset in a patch is ignored.
    expect(parseSoundPatch({ preset: "hats-ride" }, { preset: "kick-deep-909" })).toEqual({});
  });

  it("drops onto the Kick, Claps & snares and Hats lanes and renders the same after a reload", () => {
    for (const [preset, lane] of [["kick-deep-909", "kick"], ["clap-tight-snare", "clap"], ["hats-shaker", "hats"]] as const) {
      const s = { ...parseNewSound({ ...raw, preset })!, id: "0f8fad5b-d9cb-469f-a165-70867728950e", createdAt: "", updatedAt: "" } as LibrarySound;
      expect(libLaneType(s)).toBe(lane);
      const doc: Doc = { regions: [], muted: [false, false, false, false] } as unknown as Doc;
      const out = dropLibSound(doc, s, 1)!;
      expect(out.doc.lanes!.find((l) => l.id === out.laneId)!.type).toBe(lane);
      const copy = libLoopFrom(s);
      const back = parseLibLoop(JSON.parse(JSON.stringify(copy)))!;
      const a = renderLibPass(copy, { key: "C", scale: "minor", bpm: 126 }, 22050), b = renderLibPass(back, { key: "C", scale: "minor", bpm: 126 }, 22050);
      expect(Buffer.from(a.left.buffer).equals(Buffer.from(b.left.buffer))).toBe(true);
    }
  });
});
