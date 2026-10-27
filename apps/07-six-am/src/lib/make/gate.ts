// Mine plays only where the original part plays (S3-N2): the loop's bars measured from the part in
// memory (RMS per bar), quiet bars marked silent, and Mine's notes dropped there (and cut at the
// bar line before one). Pure; numbers only (L143). Tested in gate.test.ts.
import { secondsPer16th, type MakeNote } from "./render";

/** A bar this far under the loop's loudest bar counts as silent (dB). */
export const SILENT_UNDER_DB = 18;
/** …and any bar under this level (dB RMS) is silent whatever the rest does. */
export const SILENT_FLOOR_DB = -60;

/** RMS level (dB) of each whole bar of a stereo loop that starts on a bar line. */
export function barLevelsDb(left: Float32Array, right: Float32Array, rate: number, bpm: number): number[] {
  const barLen = Math.round(secondsPer16th(bpm) * 16 * rate);
  const n = Math.min(left.length, right.length), bars = Math.max(1, Math.round(n / barLen));
  return Array.from({ length: bars }, (_, b) => {
    let e = 0, c = 0;
    for (let i = b * barLen; i < Math.min(n, (b + 1) * barLen); i++) { e += left[i] * left[i] + right[i] * right[i]; c += 2; }
    return c ? 10 * Math.log10(e / c + 1e-20) : -200;
  });
}

/** Which bars the part plays in (true) from their levels. */
export function activeBars(levels: number[]): boolean[] {
  const top = Math.max(-200, ...levels);
  return levels.map((v) => v > SILENT_FLOOR_DB && v >= top - SILENT_UNDER_DB);
}

/** Mine's notes kept to the bars the original plays in; a note never rings into a silent bar. */
export function gateNotes(notes: MakeNote[], active: boolean[] | null | undefined): MakeNote[] {
  if (!active?.length) return notes;
  const on = (bar: number) => active[bar] ?? true;
  return notes.filter((n) => on(Math.floor(n.step / 16))).map((n) => {
    const bar = Math.floor(n.step / 16);
    let end = n.step + n.dur;
    for (let b = bar + 1; b * 16 < end; b++) if (!on(b)) { end = b * 16; break; }
    return end === n.step + n.dur ? n : { ...n, dur: end - n.step };
  });
}
