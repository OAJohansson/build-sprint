// Make's off-main-thread jobs (S3, L157, L161): what make.worker.ts runs. Read the looped part
// (pattern, features and its level, then zero the copy it was given), render "Mine" over the loop
// at the original's level and in its timing, and "Suggest settings" (analysis by synthesis, ~50
// renders). Pure, so it is unit tested here (jobs.test.ts) and the worker is only a mailbox.
// Only numbers leave a read: the audio copy is zeroed before it returns (L143).
import type { Scale } from "@/lib/synths/theory";
import { readPart, suggestFor, type PartReading } from "./from-part";
import { activeBars, barLevelsDb, gateNotes } from "./gate";
import { gainToLevel, rmsDb } from "./level";
import type { Suggestion } from "./match";
import { notesForLoop } from "./pattern";
import { synthParams, type Macros, type MakePresetId } from "./presets";
import { renderBass } from "./render";

export type MakeRequest =
  | { type: "read"; id: number; left: Float32Array; right: Float32Array; rate: number; bpm: number; key: string; scale: Scale }
  | { type: "render"; id: number; reading: PartReading; active?: boolean[] | null; preset: MakePresetId; macros: Macros; bpm: number; rate: number; levelDb: number; samples: number }
  | { type: "suggest"; id: number; reading: PartReading; preset: MakePresetId; bpm: number; start?: Partial<Macros> };

export type MakeResponse =
  | { type: "read"; id: number; reading: PartReading | null; levelDb: number; active: boolean[]; ms: number }
  | { type: "render"; id: number; left: Float32Array<ArrayBuffer>; right: Float32Array<ArrayBuffer>; rate: number; gainDb: number; ms: number }
  | { type: "suggest"; id: number; suggestion: Suggestion; ms: number }
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
      const levelDb = rmsDb(m);
      const reading = readPart(m.left, m.right, m.rate, m.bpm, m.key, m.scale);
      const active = activeBars(barLevelsDb(m.left, m.right, m.rate, m.bpm)); // S3-N2
      m.left.fill(0); m.right.fill(0); // the copy of the original is dropped here (L161)
      return { res: { type: "read", id: m.id, reading, levelDb, active, ms: ms() }, transfer: [] };
    }
    if (m.type === "render") {
      // Mine plays only in the bars the original plays in (S3-N2).
      const r = renderBass(gateNotes(notesForLoop(m.reading.pattern, m.reading.loopSteps), m.active), synthParams(m.preset, m.macros), { bpm: m.bpm, steps: m.reading.loopSteps, rate: m.rate });
      const shift = m.reading.pattern.offsetMs;
      const left = fitLoop(r.left, m.samples, shift, m.rate), right = fitLoop(r.right, m.samples, shift, m.rate);
      const g = gainToLevel(m.levelDb, { left, right, rate: m.rate });
      for (let i = 0; i < m.samples; i++) { left[i] *= g.gain; right[i] *= g.gain; }
      return { res: { type: "render", id: m.id, left, right, rate: m.rate, gainDb: g.db, ms: ms() }, transfer: [left.buffer, right.buffer] };
    }
    return { res: { type: "suggest", id: m.id, suggestion: suggestFor(m.reading, m.preset, m.bpm, m.start), ms: ms() }, transfer: [] };
  } catch (e) {
    return { res: { type: "error", id: m.id, message: e instanceof Error ? e.message : String(e) }, transfer: [] };
  }
}
