// Phase 6 slice 4 (K7, L249): the Lead row as the owner fixes it. The read line (Basic Pitch, weak:
// the spike found 63–75 % wrong notes) is shown per bar on a grid of 16ths, one note at a time; a bar
// the owner touched plays its grid, an untouched bar plays the read notes with their own timing. Pure;
// unit-tested (lead-mine.test.ts).
import type { MelNote } from "./melody-make";

/** A lead note in a bar: its 16th (0–15), length in 16ths, pitch (MIDI). */
export type LeadNote = { at: number; len: number; midi: number };

/** A bar of the read line on the grid: each note on its nearest 16th, as long as it sounds (at least one 16th), cut where the next one starts; one note per 16th. */
export function gridOf(notes: MelNote[], bar: number): LeadNote[] {
  const out: LeadNote[] = [];
  for (const n of [...notes].sort((a, b) => a.step + a.off - (b.step + b.off))) {
    const pos = Math.round(n.step + n.off) - bar * 16;
    if (pos < 0 || pos > 15) continue;
    const prev = out[out.length - 1];
    if (prev && prev.at === pos) { if (n.midi > prev.midi) prev.midi = n.midi; continue; }
    if (prev && prev.at + prev.len > pos) prev.len = pos - prev.at;
    out.push({ at: pos, len: Math.max(1, Math.min(16 - pos, Math.round(n.durSteps))), midi: n.midi });
  }
  return out;
}

/** A tap on the grid at (`midi`, 16th `st`): the note there of that pitch is selected; otherwise a new one-16th note replaces whatever sounds on that 16th. */
export function placeNote(notes: LeadNote[], midi: number, st: number): { notes: LeadNote[]; sel: number | null; placed: boolean } {
  const hit = notes.findIndex((n) => st >= n.at && st < n.at + n.len);
  if (hit >= 0 && notes[hit].midi === midi) return { notes, sel: hit, placed: false };
  const rest = notes.flatMap((n) => {
    if (!(st >= n.at && st < n.at + n.len)) return [n];
    return n.at < st ? [{ ...n, len: st - n.at }] : []; // a note sounding into this 16th stops before it
  });
  const next = [...rest, { at: st, len: 1, midi }].sort((a, b) => a.at - b.at);
  return { notes: next, sel: next.findIndex((n) => n.at === st), placed: true };
}

/** Shorter / Longer by a 16th (never under one, never into the next note or past the bar), or null. */
export function stretchNote(notes: LeadNote[], k: number, d: 1 | -1): LeadNote[] | null {
  const n = notes[k];
  if (!n) return null;
  const len = n.len + d, nextAt = notes.filter((x, j) => j !== k && x.at > n.at).reduce((a, x) => Math.min(a, x.at), 16);
  if (len < 1 || n.at + len > nextAt) return null;
  return notes.map((x, j) => (j === k ? { ...x, len } : x));
}

/** The lead as Mine plays it: bars with their own grid play it on the 16ths; the other bars the read notes as read. */
export function leadNotesOf(read: MelNote[], grids: Record<number, LeadNote[]>, bpm: number, steps: number): MelNote[] {
  const sps = 60 / bpm / 4, out: MelNote[] = [];
  const barOf = (n: MelNote) => Math.floor(Math.round(n.step + n.off) / 16) % Math.max(1, Math.round(steps / 16));
  for (const n of read) if (!grids[barOf(n)]) out.push(n);
  for (const [b, ns] of Object.entries(grids)) {
    for (const x of ns) {
      const step = +b * 16 + x.at;
      if (step >= steps) continue;
      out.push({ t: Math.round(step * sps * 10000) / 10000, dur: Math.round(x.len * sps * 10000) / 10000, midi: x.midi, vel: 0.8, step, off: 0, durSteps: x.len });
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

/** Grids for every bar of the loop from a saved lead pattern (`bars` repeat), by place in the repeat (H9). */
export function gridsFromSaved(notes: { step: number; midi: number; dur: number }[], bars: number, loopBars: number): Record<number, LeadNote[]> {
  const out: Record<number, LeadNote[]> = {};
  for (let b = 0; b < loopBars; b++) {
    const rb = b % bars;
    out[b] = notes.filter((n) => Math.floor(n.step / 16) === rb).map((n) => ({ at: n.step % 16, len: Math.max(1, Math.min(16 - (n.step % 16), Math.round(n.dur))), midi: n.midi })).sort((x, y) => x.at - y.at);
  }
  return out;
}

/** The grid's rows, high to low: the key's notes over the line's range (at least 7), or every note (at least 12) with the switch on. */
export function leadRows(midis: number[], keyPcs: number[] | null, outside: boolean): number[] {
  const lo0 = midis.length ? Math.min(...midis) : 67, hi0 = midis.length ? Math.max(...midis) : 74;
  const ok = (m: number) => outside || !keyPcs || keyPcs.includes(((m % 12) + 12) % 12);
  let lo = lo0, hi = hi0;
  const count = () => { let c = 0; for (let m = lo; m <= hi; m++) if (ok(m)) c++; return c; };
  const want = outside || !keyPcs ? 12 : 7;
  while (count() < want) { if (hi - hi0 <= lo0 - lo) hi++; else lo--; }
  const rows: number[] = [];
  for (let m = hi; m >= lo; m--) if (ok(m) || midis.includes(m)) rows.push(m);
  return rows;
}

/**
 * L-4: how well Mine's lead matches the read line, 0–100: an F-score of notes that start within `tol`
 * seconds of a read note of the same pitch class (each read note once). A planted wrong note lowers it,
 * fixing it brings it back. Null with nothing to compare.
 */
export function leadNoteMatch(read: Pick<MelNote, "t" | "midi">[], mine: Pick<MelNote, "t" | "midi">[], tol: number): number | null {
  if (!read.length && !mine.length) return null;
  if (!read.length || !mine.length) return 0;
  const used = new Set<number>(), pc = (m: number) => ((m % 12) + 12) % 12;
  let hit = 0;
  for (const x of [...mine].sort((a, b) => a.t - b.t)) {
    let best = -1, d = Infinity;
    read.forEach((r, i) => { const e = Math.abs(r.t - x.t); if (!used.has(i) && e <= tol && e < d && pc(r.midi) === pc(x.midi)) { d = e; best = i; } });
    if (best >= 0) { used.add(best); hit++; }
  }
  const p = hit / mine.length, r = hit / read.length;
  return p + r > 0 ? Math.round(((2 * p * r) / (p + r)) * 1000) / 10 : 0;
}
