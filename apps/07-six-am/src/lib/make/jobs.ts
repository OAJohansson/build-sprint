// Make's off-main-thread jobs (S3, L157, L161): what make.worker.ts runs. Read the looped part
// (pattern, features and its level, then zero the copy it was given), render "Mine" over the loop
// at the original's level and in its timing, and "Suggest settings" (analysis by synthesis, ~50
// renders). Pure, so it is unit tested here (jobs.test.ts) and the worker is only a mailbox.
// Only numbers leave a read: the audio copy is zeroed before it returns (L143).
import type { Scale } from "@/lib/synths/theory";
import { readPart, suggestFor, type PartReading } from "./from-part";
import { activeBars, barLevelsDb, gateNotes } from "./gate";
import { abGain, lufs, rmsDb } from "./level";
import type { Suggestion } from "./match";
import { notesForLoop } from "./pattern";
import { synthParams, type Macros, type MakePresetId } from "./presets";
import { renderBass } from "./render";
import { drumsCloseness, drumsFromReading, drumsReport, measureRows, renderDrumsMine, suggestDrum, type DrumSuggestion, type DrumsCloseness, type DrumsReading, type DrumsReport, type RowSound, type RowTarget } from "./drums-make";
import type { DrumMacros, DrumPresetId, DrumRow } from "./drum-synth";
import { readDrums } from "./drums-read";

export type MakeRequest =
  | { type: "read"; id: number; left: Float32Array; right: Float32Array; rate: number; bpm: number; key: string; scale: Scale }
  | { type: "render"; id: number; reading: PartReading; active?: boolean[] | null; preset: MakePresetId; macros: Macros; bpm: number; rate: number; levelDb: number; lufs?: number | null; samples: number }
  | { type: "suggest"; id: number; reading: PartReading; preset: MakePresetId; bpm: number; start?: Partial<Macros> }
  // Phase 5 drums (P3, P6–P8): read the looped drum part, render Mine's three rows, Suggest per row.
  | { type: "drums-read"; id: number; left: Float32Array; right: Float32Array; rate: number; bpm: number }
  | { type: "drums-render"; id: number; reading: DrumsReading; sounds: Record<DrumRow, RowSound>; levels: Record<DrumRow, number | null>; report: DrumsReport; bpm: number; rate: number; samples: number; levelDb: number; lufs: number }
  | { type: "drums-suggest"; id: number; target: RowTarget; preset: DrumPresetId; start?: DrumMacros };

export type MakeResponse =
  | { type: "read"; id: number; reading: PartReading | null; levelDb: number; lufs: number; active: boolean[]; ms: number }
  | { type: "render"; id: number; left: Float32Array<ArrayBuffer>; right: Float32Array<ArrayBuffer>; rate: number; gainDb: number; ms: number }
  | { type: "suggest"; id: number; suggestion: Suggestion; ms: number }
  | { type: "drums-read"; id: number; reading: DrumsReading; targets: Record<DrumRow, RowTarget | null>; report: DrumsReport; levelDb: number; lufs: number; ms: number }
  | { type: "drums-render"; id: number; left: Float32Array<ArrayBuffer>; right: Float32Array<ArrayBuffer>; rate: number; gainDb: number; rowGainsDb: Record<DrumRow, number | null>; closeness: DrumsCloseness; ms: number }
  | { type: "drums-suggest"; id: number; suggestion: DrumSuggestion; ms: number }
  | { type: "error"; id: number; message: string };

/**
 * A rendered pass fitted to the loop: exactly `samples` long (cut or padded with silence), and
 * turned by `shiftMs` (the original's notes sit that late against the bar line), so Mine's notes
 * land where the original's do while both loop.
 */
export function fitLoop(x: Float32Array, samples: number, shiftMs: number, rate: number): Float32Array<ArrayBuffer> {
  const out = new Float32Array(samples);
  const n = Math.min(samples, x.length);
  const k = ((Math.round((shiftMs / 1000) * rate) % samples) + samples) % samples;
  for (let i = 0; i < n; i++) out[(i + k) % samples] = x[i];
  return out;
}

export function runMakeJob(m: MakeRequest): { res: MakeResponse; transfer: ArrayBuffer[] } {
  const t0 = performance.now();
  const ms = () => Math.round(performance.now() - t0);
  try {
    if (m.type === "read") {
      const levelDb = rmsDb(m), loud = lufs(m);
      const reading = readPart(m.left, m.right, m.rate, m.bpm, m.key, m.scale);
      const active = activeBars(barLevelsDb(m.left, m.right, m.rate, m.bpm)); // S3-N2
      m.left.fill(0); m.right.fill(0); // the copy of the original is dropped here (L161)
      return { res: { type: "read", id: m.id, reading, levelDb, lufs: loud, active, ms: ms() }, transfer: [] };
    }
    if (m.type === "render") {
      // Mine plays only in the bars the original plays in (S3-N2).
      const r = renderBass(gateNotes(notesForLoop(m.reading.pattern, m.reading.loopSteps), m.active), synthParams(m.preset, m.macros), { bpm: m.bpm, steps: m.reading.loopSteps, rate: m.rate });
      const shift = m.reading.pattern.offsetMs;
      const left = fitLoop(r.left, m.samples, shift, m.rate), right = fitLoop(r.right, m.samples, shift, m.rate);
      const g = abGain({ rmsDb: m.levelDb, lufs: m.lufs }, { left, right, rate: m.rate });
      for (let i = 0; i < m.samples; i++) { left[i] *= g.gain; right[i] *= g.gain; }
      return { res: { type: "render", id: m.id, left, right, rate: m.rate, gainDb: g.db, ms: ms() }, transfer: [left.buffer, right.buffer] };
    }
    if (m.type === "drums-read") {
      const levelDb = rmsDb(m), loud = lufs(m);
      const reading = drumsFromReading(readDrums(m.left, m.right, m.rate, m.bpm, 0), m.bpm);
      const targets = measureRows(m.left, m.right, m.rate, reading);
      const report = drumsReport(m.left, m.right, m.rate, m.bpm);
      m.left.fill(0); m.right.fill(0); // the copy of the original is dropped here (C2, L161)
      return { res: { type: "drums-read", id: m.id, reading, targets, report, levelDb, lufs: loud, ms: ms() }, transfer: [] };
    }
    if (m.type === "drums-render") {
      const r = renderDrumsMine(m.reading, m.sounds, m.levels, m.bpm, m.rate);
      const left = fitLoop(r.left, m.samples, m.reading.gridMs, m.rate), right = fitLoop(r.right, m.samples, m.reading.gridMs, m.rate);
      const g = abGain({ rmsDb: m.levelDb, lufs: m.lufs }, { left, right, rate: m.rate });
      for (let i = 0; i < m.samples; i++) { left[i] *= g.gain; right[i] *= g.gain; }
      const closeness = drumsCloseness(m.report, drumsReport(left, right, m.rate, m.bpm));
      return { res: { type: "drums-render", id: m.id, left, right, rate: m.rate, gainDb: g.db, rowGainsDb: r.gains, closeness, ms: ms() }, transfer: [left.buffer, right.buffer] };
    }
    if (m.type === "drums-suggest") return { res: { type: "drums-suggest", id: m.id, suggestion: suggestDrum(m.target, m.preset, { start: m.start }), ms: ms() }, transfer: [] };
    return { res: { type: "suggest", id: m.id, suggestion: suggestFor(m.reading, m.preset, m.bpm, m.start), ms: ms() }, transfer: [] };
  } catch (e) {
    return { res: { type: "error", id: m.id, message: e instanceof Error ? e.message : String(e) }, transfer: [] };
  }
}
