// Make's off-main-thread jobs (S3, L157, L161): what make.worker.ts runs. Read the looped part
// (pattern, features and its level, then zero the copy it was given), render "Mine" over the loop
// at the original's level and in its timing, and "Suggest settings" (analysis by synthesis, ~50
// renders). Pure, so it is unit tested here (jobs.test.ts) and the worker is only a mailbox.
// Only numbers leave a read: the audio copy is zeroed before it returns (L143).
import type { Scale } from "@/lib/synths/theory";
import { readPart, suggestFor, type PartReading } from "./from-part";
import { activeBars, barLevelsDb, gateNotes } from "./gate";
import { abGain, gainToLevel, kBlocks, lufs, rmsDb } from "./level";
import type { Suggestion } from "./match";
import { notesForLoop } from "./pattern";
import { synthParams, type Macros, type MakePresetId } from "./presets";
import { renderBass } from "./render";
import { drumsCloseness, drumsFromReading, rowCloseness, suggestDrumRow, drumsReport, measureRows, renderDrumsMine, type DrumSuggestion, type DrumsCloseness, type DrumsReading, type DrumsReport, type RowSound, type RowTarget } from "./drums-make";
import type { DrumMacros, DrumPresetId, DrumRow } from "./drum-synth";
import { readDrums } from "./drums-read";
import { readNotes, type NotesReading } from "./notes-read";
import { readNotesBP } from "./notes-bp";
import { MELODY_READER } from "./melody-reader";
import type { GraphModel } from "@tensorflow/tfjs";
import { measureMelody, melodyFromReading, melodyRowCloseness, renderMelodyMine, suggestMelody, type MelodyReading, type MelodyRowSound, type MelodySuggestion, type MelodyTarget } from "./melody-make";
import type { MelodyPresetId, MelodyRow, PolyMacros } from "./poly-synth";
import { measureFx, renderFxMine, type FxMeasure, type FxRowSound } from "./fx-make";
import type { FxPlan, FxRow } from "./fx-synth";

export type MakeRequest =
  | { type: "read"; id: number; left: Float32Array; right: Float32Array; rate: number; bpm: number; key: string; scale: Scale }
  | { type: "render"; id: number; reading: PartReading; active?: boolean[] | null; preset: MakePresetId; macros: Macros; bpm: number; rate: number; levelDb: number; lufs?: number | null; samples: number }
  | { type: "suggest"; id: number; reading: PartReading; preset: MakePresetId; bpm: number; start?: Partial<Macros> }
  // Phase 5 drums (P3, P6–P8): read the looped drum part, render Mine's three rows, Suggest per row.
  | { type: "drums-read"; id: number; left: Float32Array; right: Float32Array; rate: number; bpm: number }
  | { type: "drums-render"; id: number; reading: DrumsReading; sounds: Record<DrumRow, RowSound>; levels: Record<DrumRow, number | null>; report: DrumsReport; bpm: number; rate: number; samples: number; levelDb: number; lufs: number; targets?: Record<DrumRow, RowTarget | null> }
  | { type: "drums-suggest"; id: number; target: RowTarget; preset: DrumPresetId; start?: DrumMacros }
  // Phase 5 slice 2, melody: read the looped "other" part, render Mine's rows, Suggest per row.
  | { type: "melody-read"; id: number; left: Float32Array; right: Float32Array; rate: number; bpm: number; key?: { key: string; scale: Scale } }
  | { type: "melody-render"; id: number; reading: MelodyReading; sounds: Record<MelodyRow, MelodyRowSound>; targets: Record<MelodyRow, MelodyTarget | null>; bpm: number; rate: number; samples: number; levelDb: number; lufs: number }
  | { type: "melody-suggest"; id: number; target: MelodyTarget; preset: MelodyPresetId; bpm: number; start?: PolyMacros }
  // Phase 5 slice 3, FX: measure the drop (its FX-carrying parts, its loudness), render Mine's FX.
  | { type: "fx-read"; id: number; fxL: Float32Array; fxR: Float32Array; mixL: Float32Array; mixR: Float32Array; drL: Float32Array; drR: Float32Array; rate: number; bpm: number; plan: FxPlan; loopBars: number; fromBar?: number }
  | { type: "fx-render"; id: number; plan: FxPlan; sounds: Record<FxRow, FxRowSound>; rootMidi: number; bpm: number; rate: number; samples: number; mixRmsDb: number; blocksA: number[] };

export type MakeResponse =
  | { type: "read"; id: number; reading: PartReading | null; levelDb: number; lufs: number; active: boolean[]; ms: number }
  | { type: "render"; id: number; left: Float32Array<ArrayBuffer>; right: Float32Array<ArrayBuffer>; rate: number; gainDb: number; ms: number }
  | { type: "suggest"; id: number; suggestion: Suggestion; ms: number }
  | { type: "drums-read"; id: number; reading: DrumsReading; targets: Record<DrumRow, RowTarget | null>; report: DrumsReport; levelDb: number; lufs: number; ms: number }
  | { type: "drums-render"; id: number; left: Float32Array<ArrayBuffer>; right: Float32Array<ArrayBuffer>; rate: number; gainDb: number; rowGainsDb: Record<DrumRow, number | null>; closeness: DrumsCloseness; rowCloseness: Record<DrumRow, { score: number; distance: number } | null>; ms: number }
  | { type: "drums-suggest"; id: number; suggestion: DrumSuggestion & { closer: { preset: DrumPresetId; macros: DrumMacros; distance: number } | null }; ms: number }
  | { type: "melody-read"; id: number; reading: MelodyReading; targets: Record<MelodyRow, MelodyTarget | null>; levelDb: number; lufs: number; reader: "dsp" | "basic-pitch"; ms: number }
  | { type: "melody-render"; id: number; left: Float32Array<ArrayBuffer>; right: Float32Array<ArrayBuffer>; rate: number; gainDb: number; rowGainsDb: Record<MelodyRow, number | null>; rowCloseness: Record<MelodyRow, { score: number; distance: number } | null>; ms: number }
  | { type: "melody-suggest"; id: number; suggestion: MelodySuggestion; ms: number }
  | { type: "fx-read"; id: number; measures: Record<FxRow, FxMeasure>; level: { bed: { rmsDb: number; lufs: number; blocks: number[] }; noBed: { rmsDb: number; lufs: number; blocks: number[] } }; ms: number }
  | { type: "fx-render"; id: number; left: Float32Array<ArrayBuffer>; right: Float32Array<ArrayBuffer>; rate: number; partsDb: number; ms: number }
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

/** A melody read's rows, targets and level from whichever reader's notes; then the copy is zeroed (C2). */
function finishMelodyRead(m: Extract<MakeRequest, { type: "melody-read" }>, notes: NotesReading, t0: number, reader: "dsp" | "basic-pitch" = "dsp"): { res: MakeResponse; transfer: ArrayBuffer[] } {
  const levelDb = rmsDb(m), loud = lufs(m);
  const reading = melodyFromReading(notes, m.bpm, m.left.length / m.rate);
  const targets = measureMelody(m.left, m.right, m.rate, reading);
  m.left.fill(0); m.right.fill(0); // the copy of the original is dropped here (C2, L161)
  return { res: { type: "melody-read", id: m.id, reading, targets, levelDb, lufs: loud, reader, ms: Math.round(performance.now() - t0) }, transfer: [] };
}

/**
 * The worker's entry: as runMakeJob, but a melody read goes through Basic Pitch when MELODY_READER says
 * so (L245; async: the model is fetched once, on the first melody read). If the model can't load or
 * run, the DSP reader reads instead, so Melody still works.
 */
export async function runMakeJobAsync(m: MakeRequest, loadModel: () => Promise<GraphModel>): Promise<{ res: MakeResponse; transfer: ArrayBuffer[] }> {
  if (m.type !== "melody-read" || MELODY_READER !== "basic-pitch") return runMakeJob(m);
  const t0 = performance.now();
  try {
    return finishMelodyRead(m, await readNotesBP(m.left, m.right, m.rate, m.bpm, loadModel(), m.key, 0), t0, "basic-pitch");
  } catch (e) {
    console.warn("[make] Basic Pitch failed, reading with the DSP reader", e);
    try { return finishMelodyRead(m, readNotes(m.left, m.right, m.rate, m.bpm, m.key, 0), t0); } catch (e2) {
      m.left.fill(0); m.right.fill(0);
      return { res: { type: "error", id: m.id, message: e2 instanceof Error ? e2.message : String(e2) }, transfer: [] };
    }
  }
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
      // D-F5: drums match the original's perceived loudness (LUFS) outright. The bass's 0.9 dB leash to
      // the RMS match (abGain) left bright, short drum sets up to 2.4 LU off. RMS only when LUFS can't read.
      const g = m.lufs > -70 ? gainToLevel(m.lufs, { left, right, rate: m.rate }, "lufs") : gainToLevel(m.levelDb, { left, right, rate: m.rate });
      for (let i = 0; i < m.samples; i++) { left[i] *= g.gain; right[i] *= g.gain; }
      const closeness = drumsCloseness(m.report, drumsReport(left, right, m.rate, m.bpm));
      // U1: each row's own closeness, on Suggest's measure (one hit rendered per row).
      const rowClose = Object.fromEntries((["kick", "clap", "hats"] as DrumRow[]).map((row) => {
        const t = m.targets?.[row];
        return [row, t ? rowCloseness(t, m.sounds[row].preset, m.sounds[row].macros) : null];
      })) as Record<DrumRow, { score: number; distance: number } | null>;
      return { res: { type: "drums-render", id: m.id, left, right, rate: m.rate, gainDb: g.db, rowGainsDb: r.gains, closeness, rowCloseness: rowClose, ms: ms() }, transfer: [left.buffer, right.buffer] };
    }
    if (m.type === "melody-read") return finishMelodyRead(m, readNotes(m.left, m.right, m.rate, m.bpm, m.key, 0), t0);
    if (m.type === "melody-render") {
      const r = renderMelodyMine(m.reading, m.sounds, m.targets, m.bpm, m.rate, m.samples);
      const left = r.left as Float32Array<ArrayBuffer>, right = r.right as Float32Array<ArrayBuffer>;
      // As drums (D-F5): the original's perceived loudness, outright.
      const g = m.lufs > -70 ? gainToLevel(m.lufs, { left, right, rate: m.rate }, "lufs") : gainToLevel(m.levelDb, { left, right, rate: m.rate });
      for (let i = 0; i < m.samples; i++) { left[i] *= g.gain; right[i] *= g.gain; }
      const rowClose = Object.fromEntries((["chords", "lead"] as MelodyRow[]).map((row) => {
        const t = m.targets[row];
        return [row, t && m.reading.rows[row].notes.length ? melodyRowCloseness(t, m.sounds[row].preset, m.sounds[row].macros, m.bpm) : null];
      })) as Record<MelodyRow, { score: number; distance: number } | null>;
      return { res: { type: "melody-render", id: m.id, left, right, rate: m.rate, gainDb: g.db, rowGainsDb: r.gains, rowCloseness: rowClose, ms: ms() }, transfer: [left.buffer, right.buffer] };
    }
    if (m.type === "fx-read") {
      const measures = measureFx(m.fxL, m.fxR, m.rate, m.bpm, m.plan, m.loopBars, m.fromBar ?? 1);
      const n = m.mixL.length, bl = new Float32Array(n), br = new Float32Array(n);
      for (let i = 0; i < n; i++) { bl[i] = m.mixL[i] + m.drL[i]; br[i] = m.mixR[i] + m.drR[i]; }
      // Numbers only: the level, the loudness, and its 400 ms block energies (for B's loudness with FX on top).
      const lv = (l: Float32Array, r: Float32Array) => ({ rmsDb: Math.round(rmsDb({ left: l, right: r, rate: m.rate }) * 100) / 100, lufs: Math.round(lufs({ left: l, right: r, rate: m.rate }) * 100) / 100, blocks: kBlocks({ left: l, right: r, rate: m.rate }) });
      const level = { bed: lv(bl, br), noBed: lv(m.mixL, m.mixR) };
      for (const x of [m.fxL, m.fxR, m.mixL, m.mixR, m.drL, m.drR, bl, br]) x.fill(0); // the copies of the original are dropped here (C2)
      return { res: { type: "fx-read", id: m.id, measures, level, ms: ms() }, transfer: [] };
    }
    if (m.type === "fx-render") {
      const r = renderFxMine(m.plan, m.sounds, { rootMidi: m.rootMidi, bpm: m.bpm, rate: m.rate, samples: m.samples, mixRmsDb: m.mixRmsDb, blocksA: m.blocksA });
      const left = r.left as Float32Array<ArrayBuffer>, right = r.right as Float32Array<ArrayBuffer>;
      return { res: { type: "fx-render", id: m.id, left, right, rate: m.rate, partsDb: r.partsDb, ms: ms() }, transfer: [left.buffer, right.buffer] };
    }
    if (m.type === "melody-suggest") return { res: { type: "melody-suggest", id: m.id, suggestion: suggestMelody(m.target, m.preset, m.bpm, { start: m.start }), ms: ms() }, transfer: [] };
    if (m.type === "drums-suggest") return { res: { type: "drums-suggest", id: m.id, suggestion: suggestDrumRow(m.target, m.preset, { start: m.start }), ms: ms() }, transfer: [] };
    return { res: { type: "suggest", id: m.id, suggestion: suggestFor(m.reading, m.preset, m.bpm, m.start), ms: ms() }, transfer: [] };
  } catch (e) {
    return { res: { type: "error", id: m.id, message: e instanceof Error ? e.message : String(e) }, transfer: [] };
  }
}
