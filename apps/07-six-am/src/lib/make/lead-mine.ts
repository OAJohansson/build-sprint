// Phase 6 slice 4 (K7, L249): the Lead row as the owner fixes it. The read line (Basic Pitch, weak:
// the spike found 63–75 % wrong notes) is shown per bar on a grid of 16ths, one note at a time; a bar
// the owner touched plays its grid, an untouched bar plays the read notes with their own timing. Pure;
// unit-tested (lead-mine.test.ts).
import type { MelNote } from "./melody-make";

/** A lead note in a bar: its 16th (0–15), length in 16ths, pitch (MIDI); a read or saved note also keeps how far off the 16th it sits and its strength (LD-1). */
export type LeadNote = { at: number; len: number; midi: number; off?: number; vel?: number };

/** A bar of the read line on the grid: each note on its nearest 16th, as long as it sounds (at least one 16th), cut where the next one starts; one note per 16th. */
export function gridOf(notes: MelNote[], bar: number): LeadNote[] {
  const out: LeadNote[] = [];
  for (const n of [...notes].sort((a, b) => a.step + a.off - (b.step + b.off))) {
    const pos = Math.round(n.step + n.off) - bar * 16;
    if (pos < 0 || pos > 15) continue;
    const prev = out[out.length - 1];
    if (prev && prev.at === pos) {
      // one note per 16th: the higher one, with its own offset and strength
      if (n.midi > prev.midi) { const off = Math.round((n.step + n.off - bar * 16 - pos) * 1000) / 1000; prev.midi = n.midi; prev.vel = n.vel; if (off) prev.off = off; else delete prev.off; }
      continue;
    }
    if (prev && prev.at + prev.len > pos) prev.len = pos - prev.at;
    const off = Math.round((n.step + n.off - bar * 16 - pos) * 1000) / 1000;
    out.push({ at: pos, len: Math.max(1, Math.min(16 - pos, Math.round(n.durSteps))), midi: n.midi, ...(off ? { off } : {}), vel: n.vel });
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
      const off = x.off ?? 0;
      out.push({ t: Math.round(Math.max(0, step + off) * sps * 10000) / 10000, dur: Math.round(x.len * sps * 10000) / 10000, midi: x.midi, vel: x.vel ?? 0.8, step, off, durSteps: x.len });
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

/** Grids for every bar of the loop from a saved lead pattern (`bars` repeat), by place in the repeat (H9). */
export function gridsFromSaved(notes: { step: number; midi: number; dur: number; vel?: number; off?: number }[], bars: number, loopBars: number): Record<number, LeadNote[]> {
  const out: Record<number, LeadNote[]> = {};
  for (let b = 0; b < loopBars; b++) {
    const rb = b % bars;
    // LD-1: every saved note as saved (its offset, length and strength), so the loaded lead plays what was saved.
    out[b] = notes.filter((n) => Math.floor(n.step / 16) === rb).map((n) => ({ at: n.step % 16, len: n.dur, midi: n.midi, ...(n.off ? { off: n.off } : {}), ...(n.vel !== undefined ? { vel: n.vel } : {}) })).sort((x, y) => x.at - y.at);
  }
  return out;
}

/**
 * The grid's rows, high to low (polish round): about one octave of the key's notes (8 rows) centred on
 * the open bar's own notes (the line's median when the bar is empty), widened only to hold every note of
 * the bar plus one more row past a note at the edge; with "Notes outside the key", every note over the same span.
 */
export function leadRows(barMidis: number[], lineMidis: number[], keyPcs: number[] | null, outside: boolean): number[] {
  const med = (v: number[]) => [...v].sort((a, b) => a - b)[v.length >> 1];
  // the middle of the bar's own notes (so a wide bar stays in view), else the line's median
  const center = barMidis.length ? Math.round((Math.min(...barMidis) + Math.max(...barMidis)) / 2) : lineMidis.length ? med(lineMidis) : 67;
  const inKey = (m: number) => !keyPcs || keyPcs.includes(((m % 12) + 12) % 12);
  // the key's 8 notes nearest the centre (ties go up)
  const near = Array.from({ length: 25 }, (_, k) => center - 12 + k).filter(inKey).sort((a, b) => Math.abs(a - center) - Math.abs(b - center) || b - a).slice(0, keyPcs ? 8 : 13);
  let lo = Math.min(...near), hi = Math.max(...near);
  if (barMidis.length) { lo = Math.min(lo, ...barMidis); hi = Math.max(hi, ...barMidis); }
  const step = (m: number, d: 1 | -1) => { let x = m + d; while (!inKey(x)) x += d; return x; };
  if (barMidis.includes(lo)) lo = step(lo, -1);
  if (barMidis.includes(hi)) hi = step(hi, 1);
  const rows: number[] = [];
  for (let m = hi; m >= lo; m--) if (outside || inKey(m) || barMidis.includes(m)) rows.push(m);
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

// shortcut (L-2, T212, T213): 60 %, 40 ms, "another tone of the chord struck with it" and the C3 floor set on
// synthetic fixtures and one live read (Lost 69–76: Basic Pitch's line is the stab's bottom G2), not on labels.
export const CHORD_TOP = { share: 0.6, minNotes: 4, tol: 0.04, lowMedian: 48 };

/**
 * L-2: how much of a "lead" is really the chords' own notes: the share of its notes that are a tone of
 * the chord read in their cell, start while that chord sounds, and are struck together (within 40 ms)
 * with another tone of that chord of another pitch class, above or below (T213: Basic Pitch's line on
 * Lost 69–76 is the stab's bottom G2). A riff over chords plays chord tones too, but on its own; only
 * notes struck as part of the chord count. Phase 5's verdict needs a Lead row the DSP split finds, which
 * it doesn't on Lost, so this guard stands on its own.
 */
export function chordToneShare(
  lead: { t: number; midi: number }[], all: { t: number; midi: number }[],
  chords: { bpm: number; cells: { startStep: number; steps: number; name: string }[]; events: { t: number; dur: number; cell: number }[] },
  tonesOf: (name: string) => number[],
): number {
  if (!lead.length) return 0;
  const sps = 60 / chords.bpm / 4, pc = (m: number) => ((m % 12) + 12) % 12;
  let n = 0;
  for (const x of lead) {
    const s = x.t / sps + 0.5, ci = chords.cells.findIndex((c) => s >= c.startStep && s < c.startStep + c.steps), cell = chords.cells[ci];
    const tones = cell?.name ? tonesOf(cell.name) : [];
    if (!tones.includes(pc(x.midi))) continue;
    if (!chords.events.some((e) => e.cell === ci && x.t >= e.t - CHORD_TOP.tol && x.t <= e.t + e.dur)) continue;
    if (all.some((o) => Math.abs(o.t - x.t) <= CHORD_TOP.tol && pc(o.midi) !== pc(x.midi) && tones.includes(pc(o.midi)))) n++;
  }
  return n / lead.length;
}

/** T213: a line whose median note is under C3 sits where chords and bass live, not a lead. */
export const tooLowForLead = (lead: { midi: number }[]) => {
  if (lead.length < CHORD_TOP.minNotes) return false;
  const v = lead.map((n) => n.midi).sort((a, b) => a - b);
  return v[v.length >> 1] < CHORD_TOP.lowMedian;
};
