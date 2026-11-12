// Make for melody / chords (Phase 5 slice 2, P4, P6–P9): from the note reader (notes-read.ts) to what
// Make plays, measures and saves. Pure TS, run in Make's worker (jobs.ts) and the tests. Only numbers
// come out of the original (C2): the notes, each row's level and sound measures.
//
// - Rows: Chords, and a Lead row only when the reader finds a separate line above the chords (single
//   notes over the chords' top); else Chords alone. Doubtful rows (the spike's weak spots: a held pad
//   read as repeated notes, a swelling pad with bleed snapping to drum hits, faint bleed) are off in
//   Mine until "Play anyway", with a short reason in the row (as drums, L225, U2).
// - Suggest (P6) and the row's closeness (L233): analysis by synthesis per note event. Each measured
//   event of the original (a chord, or a lead note) is compared with the same notes rendered by a
//   candidate sound: the spectrum over four slices of the event, the level envelope over it, the
//   room after the notes end and the width. The copied notes are the same on both sides, so only
//   the sound counts.
// - Save (P9): a row folded to its 1-, 2-, 4-, 8- or 16-bar repeat (a progression often runs 8 bars).
import { chordFromChroma } from "@/lib/lab/chords";
import { dB, fft, hann, toMono } from "./dsp";
import type { NotesReading, ReadNote } from "./notes-read";
import { MELODY_ROWS, POLY_KNOBS, clampPolyMacros, renderPoly, type MelodyPresetId, type MelodyRow, type PolyMacros } from "./poly-synth";
import { secondsPer16th, type MakeNote } from "./render";

// ── Rows ────────────────────────────────────────────────────────────────────────────────────────

/** One note as Make plays it: `t` and `dur` in seconds in the loop; `step`/`off` on the 16th grid. */
export type MelNote = { t: number; dur: number; midi: number; vel: number; step: number; off: number; durSteps: number };
export type MelodyRowRead = { notes: MelNote[]; doubtful: boolean; why: string | null; note: string | null };
export type MelodyReading = { rows: Record<MelodyRow, MelodyRowRead>; steps: number; bars: number; lead: boolean; tuningCents: number };

/** Notes starting within this of each other are one event (a chord). */
const CLUSTER_S = 0.03;
// shortcut: the Lead split (single notes above the chords' median top, at least max(4, bars/2) of them) and the doubtful rules below were picked on the spike's bench; re-check on real parts.
export const LEAD_MIN = 4;

/** Events: notes grouped by start (a chord is one event). */
export function eventsOf(notes: Pick<MelNote, "t" | "midi" | "dur" | "vel">[]): { t: number; notes: number[] }[] {
  const order = notes.map((_, i) => i).sort((a, b) => notes[a].t - notes[b].t);
  const ev: { t: number; notes: number[] }[] = [];
  for (const i of order) {
    const last = ev[ev.length - 1];
    if (last && notes[i].t - last.t <= CLUSTER_S) last.notes.push(i);
    else ev.push({ t: notes[i].t, notes: [i] });
  }
  return ev;
}

/** Splits the read notes into Chords and, when there is a separate line above them, Lead. */
export function splitRows(notes: ReadNote[], bars: number): { chords: ReadNote[]; lead: ReadNote[] } {
  const ev = eventsOf(notes);
  const chordEv = ev.filter((e) => e.notes.length >= 2);
  if (chordEv.length < 2) return { chords: notes, lead: [] };
  const tops = chordEv.map((e) => Math.max(...e.notes.map((i) => notes[i].midi))).sort((a, b) => a - b);
  const top = tops[Math.floor(tops.length / 2)];
  const leadIdx = new Set<number>();
  for (const e of ev) if (e.notes.length === 1 && notes[e.notes[0]].midi > top) leadIdx.add(e.notes[0]);
  if (leadIdx.size < Math.max(LEAD_MIN, Math.floor(bars / 2))) return { chords: notes, lead: [] };
  return { chords: notes.filter((_, i) => !leadIdx.has(i)), lead: notes.filter((_, i) => leadIdx.has(i)) };
}

/** The share of a row's notes that repeat (pitch and position) over 1-, 2-, 4- or 8-bar repeats. */
export function noteRepeatShare(notes: Pick<MelNote, "step" | "midi">[], steps: number): number {
  if (!notes.length) return 1;
  const on = new Set(notes.map((n) => `${n.step}:${n.midi}`));
  let best = 0;
  for (const P of [16, 32, 64, 128]) {
    const reps = Math.floor(steps / P);
    if (reps < 2) continue;
    const seen = new Map<string, number>();
    for (const n of notes) { const k = `${n.step % P}:${n.midi}`; seen.set(k, (seen.get(k) ?? 0) + 1); }
    let kept = 0;
    for (const [k, c] of seen) { const [p, midi] = k.split(":").map(Number); let n = 0; for (let r = 0; r < reps; r++) if (on.has(`${r * P + p}:${midi}`)) n++; if (n >= Math.max(2, reps / 2)) kept += c; }
    best = Math.max(best, kept / notes.length);
  }
  return best;
}

/** The share of notes struck again right where the same pitch just ended (a held note chopped up). */
export function restrikeShare(notes: Pick<MelNote, "t" | "dur" | "midi">[]): number {
  if (notes.length < 2) return 0;
  const by = new Map<number, { t: number; dur: number }[]>();
  for (const n of notes) by.set(n.midi, [...(by.get(n.midi) ?? []), n]);
  let re = 0;
  for (const xs of by.values()) { xs.sort((a, b) => a.t - b.t); for (let i = 1; i < xs.length; i++) if (xs[i].t - (xs[i - 1].t + xs[i - 1].dur) < 0.05) re++; }
  return re / notes.length;
}

export const MEL_DOUBT = { faintVel: 0.3, restrike: 0.35, repeat: 0.4, minNotes: 8 };

/** The reader's notes as Make plays them, split into rows, doubtful rows marked. */
export function melodyFromReading(r: NotesReading, bpm: number, loopS: number): MelodyReading {
  const sps = secondsPer16th(bpm), steps = Math.floor(loopS / sps + 0.01), bars = Math.max(1, Math.round(steps / 16));
  const split = splitRows(r.notes.filter((n) => n.t < loopS), bars);
  const rows = {} as Record<MelodyRow, MelodyRowRead>;
  for (const row of MELODY_ROWS) {
    const notes: MelNote[] = split[row].map((n) => ({ t: n.t, dur: n.dur, midi: n.midi, vel: n.vel, step: ((n.step % steps) + steps) % steps, off: Math.round((n.offsetMs / 1000 / sps) * 1000) / 1000, durSteps: Math.max(0.25, Math.round((n.dur / sps) * 100) / 100) }));
    const sparse = notes.length > 0 && notes.length <= Math.max(1, Math.floor(bars / 2)) && notes.every((n) => n.vel < MEL_DOUBT.faintVel);
    const chopped = !sparse && notes.length >= MEL_DOUBT.minNotes && restrikeShare(notes) >= MEL_DOUBT.restrike;
    // Chords repeat; a lead line often doesn't inside one loop, so the repeat test is for Chords only.
    const irregular = row === "chords" && !sparse && !chopped && notes.length >= MEL_DOUBT.minNotes && steps >= 32 && noteRepeatShare(notes, steps) < MEL_DOUBT.repeat;
    rows[row] = {
      notes, doubtful: sparse || chopped || irregular,
      why: sparse ? `${notes.length} faint note${notes.length === 1 ? "" : "s"}, probably another part bleeding through: off in Mine`
        : chopped ? `${notes.length} notes, many struck again where the same note just ended: probably a held pad read as repeated notes, off in Mine`
          : irregular ? `${notes.length} notes on no repeating pattern: probably a swelling pad or bleed, off in Mine` : null,
      note: sparse ? "Probably another part bleeding through" : chopped ? "Probably a held pad, read as repeated notes" : irregular ? "No repeating pattern: probably a swell or bleed" : null,
    };
  }
  return { rows, steps, bars, lead: rows.lead.notes.length > 0, tuningCents: r.tuningCents };
}

/** Chord names as they change, one per bar where the row's notes make one (the strip's top line). */
export function chordNames(notes: Pick<MelNote, "step" | "durSteps" | "midi">[], steps: number): { bar: number; name: string }[] {
  const out: { bar: number; name: string }[] = [];
  for (let b = 0; b < Math.ceil(steps / 16); b++) {
    const chroma = new Array(12).fill(0);
    for (const n of notes) if (n.step >= b * 16 && n.step < b * 16 + 16) chroma[((n.midi % 12) + 12) % 12] += Math.min(n.durSteps, 16);
    const name = chordFromChroma(chroma);
    if (name && name !== out[out.length - 1]?.name) out.push({ bar: b, name });
  }
  return out;
}

// ── Measuring a row's sound (Suggest's target, the row's closeness) ─────────────────────────────

const EDGES = [100, 200, 300, 450, 700, 1000, 1500, 2200, 3200, 4500, 6500, 9000];
const NB = EDGES.length - 1;
const SLICES: [number, number][] = [[0, 0.04], [0.04, 0.15], [0.15, 0.5], [0.5, 1.2]];
const ENV_AT = [0.01, 0.03, 0.06, 0.1, 0.16, 0.25, 0.4, 0.6, 0.9];

/** One event's numbers: spectrum per slice (dB re total), level envelope (dB under its peak), room after the notes, width. */
export type EventFeatures = { shape: (number | null)[]; env: (number | null)[]; tail: number | null; side: number };
/** One measured event of the original row: its notes (relative times) and its numbers. */
export type MelEvent = { notes: { dt: number; dur: number; midi: number; vel: number }[]; win: number; f: EventFeatures };
export type MelodyTarget = { events: MelEvent[]; levelDb: number };

function bandsOf(x: Float32Array, from: number, to: number, rate: number): number[] {
  const e = new Array(NB).fill(0);
  const w = Math.max(0, Math.min(x.length, to) - Math.max(0, from));
  if (w < 32) return e;
  let n = 512; while (n < w) n <<= 1;
  const re = new Float64Array(n), im = new Float64Array(n), win = hann(w);
  for (let i = 0; i < w; i++) re[i] = x[Math.max(0, from) + i] * win[i];
  fft(re, im);
  for (let k = 1; k <= n / 2; k++) {
    const f = (k * rate) / n;
    if (f < EDGES[0] || f >= EDGES[NB]) continue;
    let b = 0; while (b < NB - 1 && f >= EDGES[b + 1]) b++;
    e[b] += re[k] * re[k] + im[k] * im[k];
  }
  return e;
}
const rms = (x: Float32Array, a: number, b: number) => { let s = 0, n = 0; for (let i = Math.max(0, a); i < Math.min(x.length, b); i++) { s += x[i] * x[i]; n++; } return n ? s / n : 0; };

/** The numbers of an event starting at sample `a`, `win` seconds long, its notes ending `noteEnd` s in. */
export function eventFeatures(Lall: Float32Array, Rall: Float32Array, at: number, win: number, noteEnd: number, rate: number): EventFeatures {
  // Only the event's own window is read (a mono copy of the whole loop per event was too slow).
  const A = Math.max(0, at), B = Math.min(Lall.length, at + Math.round(win * rate) + 1);
  const L = Lall.subarray(A, Math.max(A, B)), R = Rall.subarray(A, Math.max(A, B)), a = at - A;
  const mono = toMono(L, R);
  const parts: number[][] = SLICES.map(([s0, s1]) => (s0 < win ? bandsOf(mono, a + Math.round(s0 * rate), a + Math.round(Math.min(s1, win) * rate), rate) : []));
  const tot = parts.flat().reduce((s, v) => s + v, 0) || 1e-20;
  const shape = parts.flatMap((p) => (p.length ? p.map((v) => Math.max(-60, Math.round(dB(v / tot) * 10) / 10)) : new Array(NB).fill(null)));
  const fr = Math.round(0.01 * rate);
  const lv = ENV_AT.map((t) => (t < win ? dB(rms(mono, a + Math.round(t * rate) - fr, a + Math.round(t * rate) + fr)) : null));
  const top = Math.max(...lv.filter((v): v is number => v !== null), -200);
  const env = lv.map((v) => (v === null ? null : Math.max(-50, Math.round((v - top) * 10) / 10)));
  const body = rms(mono, a, a + Math.round(Math.min(noteEnd, win) * rate));
  const tail = noteEnd + 0.06 < win ? Math.max(-50, dB(rms(mono, a + Math.round((noteEnd + 0.02) * rate), a + Math.round(Math.min(win, noteEnd + 0.25) * rate)) / (body || 1e-20))) : null;
  let m = 0, sd = 0;
  for (let i = Math.max(0, a); i < Math.min(L.length, a + Math.round(win * rate)); i++) { const x = (L[i] + R[i]) / 2, y = (L[i] - R[i]) / 2; m += x * x; sd += y * y; }
  return { shape, env, tail, side: Math.max(-40, dB(sd / (m || 1e-20))) };
}

/** Events measured per row (the clearest: no other row's event starting inside them), at most this many. */
const MAX_EVENTS = 5;

/** Suggest's targets and each row's level, measured on the looped "other" part (numbers only). */
export function measureMelody(L: Float32Array, R: Float32Array, rate: number, d: MelodyReading): Record<MelodyRow, MelodyTarget | null> {
  const out = {} as Record<MelodyRow, MelodyTarget | null>;
  const allStarts = MELODY_ROWS.flatMap((row) => d.rows[row].notes.map((n) => ({ row, t: n.t })));
  const mono = toMono(L, R);
  for (const row of MELODY_ROWS) {
    const notes = d.rows[row].notes;
    if (!notes.length) { out[row] = null; continue; }
    const ev = eventsOf(notes);
    const cands = ev.map((e, i) => {
      const end = Math.min((ev[i + 1]?.t ?? e.t + 1.2) - e.t, 1.2);
      const ns = e.notes.map((j) => notes[j]);
      return { e, win: end, ns, clear: allStarts.every((o) => o.row === row || o.t <= e.t - 0.02 || o.t >= e.t + end) };
    }).filter((c) => c.win >= 0.12);
    const pool = cands.filter((c) => c.clear).length >= 3 ? cands.filter((c) => c.clear) : cands;
    const every = Math.max(1, Math.ceil(pool.length / MAX_EVENTS));
    const use = pool.filter((_, i) => i % every === 0).slice(0, MAX_EVENTS);
    const events: MelEvent[] = use.map((c) => {
      const noteEnd = Math.max(...c.ns.map((n) => n.t + n.dur)) - c.e.t;
      return { win: c.win, notes: c.ns.map((n) => ({ dt: n.t - c.e.t, dur: n.dur, midi: n.midi, vel: n.vel })), f: eventFeatures(L, R, Math.round(c.e.t * rate), c.win, noteEnd, rate) };
    });
    const levels = cands.map((c) => dB(rms(mono, Math.round(c.e.t * rate), Math.round((c.e.t + c.win) * rate))));
    levels.sort((a, b) => a - b);
    out[row] = events.length ? { events, levelDb: Math.round((levels[Math.floor(levels.length / 2)] ?? -120) * 10) / 10 } : null;
  }
  return out;
}

/** How far a candidate's event is from the original's (lower = closer). */
export function eventDistance(o: EventFeatures, m: EventFeatures): number {
  let s = 0, w = 0;
  const tot = o.shape.reduce<number>((a, v) => a + (v === null ? 0 : Math.pow(10, v / 10)), 0) || 1;
  o.shape.forEach((v, i) => { const x = m.shape[i]; if (v === null || x === null) return; const wi = Math.pow(10, v / 10) / tot + 0.002; s += wi * Math.min(30, Math.abs(v - x)); w += wi; });
  let d = w ? s / w : 0;
  let es = 0, en = 0;
  o.env.forEach((v, i) => { const x = m.env[i]; if (v === null || x === null) return; es += Math.min(30, Math.abs(v - x)); en++; });
  if (en) d += 0.5 * (es / en);
  if (o.tail !== null && m.tail !== null) d += 0.15 * Math.min(30, Math.abs(o.tail - m.tail));
  d += 0.05 * Math.min(30, Math.abs(o.side - m.side));
  return d;
}

/** Each measured event rendered with a candidate sound and measured the same way; the mean distance. */
export function melodyDistance(t: MelodyTarget, id: MelodyPresetId, m: PolyMacros, bpm: number, rate = 22050): number {
  let d = 0;
  for (const e of t.events) {
    const r = renderPoly(id, m, e.notes.map((n) => ({ t: n.dt, dur: n.dur, midi: n.midi, vel: n.vel })), { lenS: e.win + 0.05, rate, wrap: false, bpm });
    const noteEnd = Math.max(...e.notes.map((n) => n.dt + n.dur));
    d += eventDistance(e.f, eventFeatures(r.left, r.right, 0, e.win, noteEnd, rate));
  }
  return d / Math.max(1, t.events.length);
}

export type MelodySuggestion = { macros: Required<PolyMacros>; distance: number; presetDistance: number; renders: number };
export const MELODY_PRIOR = 2;

/** Knob values for `id` whose events measure closest to the row's ("Suggest for chords"): a coordinate search. */
export function suggestMelody(t: MelodyTarget, id: MelodyPresetId, bpm: number, o: { start?: PolyMacros } = {}): MelodySuggestion {
  const home = clampPolyMacros(id, undefined);
  let renders = 0;
  const dist = (m: PolyMacros) => { renders++; return melodyDistance(t, id, m, bpm); };
  const prior = (m: PolyMacros) => MELODY_PRIOR * POLY_KNOBS.reduce((a, k) => a + ((m[k] ?? 0) - home[k]) ** 2, 0);
  const presetDistance = dist(home);
  let best = clampPolyMacros(id, { ...home, ...o.start });
  let bestCost = (o.start ? dist(best) : presetDistance) + prior(best);
  for (const grid of [[0, 0.25, 0.5, 0.75, 1], [-0.1, 0.1]]) {
    for (const k of POLY_KNOBS) {
      const base = best[k];
      for (const g of grid) {
        const v = grid.length === 5 ? g : Math.min(1, Math.max(0, base + g));
        if (Math.abs(v - best[k]) < 1e-6) continue;
        const cand = { ...best, [k]: v };
        const c = dist(cand) + prior(cand);
        if (c < bestCost) { best = cand; bestCost = c; }
      }
    }
  }
  const out = clampPolyMacros(id, Object.fromEntries(POLY_KNOBS.map((k) => [k, Math.round(best[k] * 100) / 100])));
  return { macros: out, distance: dist(out), presetDistance, renders };
}

export const MELODY_SCORE_SCALE = 8;
/** One row's closeness 0–100 (L233): its sound on Suggest's measure, so following its ticks raises it. */
export function melodyRowCloseness(t: MelodyTarget, id: MelodyPresetId, m: PolyMacros, bpm: number) {
  const distance = melodyDistance(t, id, m, bpm);
  return { score: Math.round(100 * Math.exp(-distance / MELODY_SCORE_SCALE)), distance: Math.round(distance * 100) / 100 };
}

// ── Mine over the loop ──────────────────────────────────────────────────────────────────────────

export type MelodyRowSound = { preset: MelodyPresetId; macros: PolyMacros; on: boolean };

/** Mine's rows over the loop (`samples` long), at their read times, each at the original row's level. */
export function renderMelodyMine(d: MelodyReading, sounds: Record<MelodyRow, MelodyRowSound>, targets: Record<MelodyRow, MelodyTarget | null>, bpm: number, rate: number, samples: number) {
  const left = new Float32Array(samples), right = new Float32Array(samples);
  const lenS = samples / rate, gains = {} as Record<MelodyRow, number | null>;
  for (const row of MELODY_ROWS) {
    gains[row] = null;
    const s = sounds[row], notes = d.rows[row].notes;
    if (!s.on || !notes.length) continue;
    const r = renderPoly(s.preset, s.macros, notes.map((n) => ({ t: n.t, dur: n.dur, midi: n.midi, vel: n.vel })), { lenS, rate, wrap: true, bpm });
    let g = 1;
    const target = targets[row]?.levelDb;
    // shortcut: a row's level is matched on its own events' windows over the whole part, so a Lead's windows include the chords under it; good enough for the balance, the whole is matched on LUFS after.
    if (target !== undefined && target > -100) {
      const mono = toMono(r.left, r.right), ev = eventsOf(notes);
      const lv = ev.map((e, i) => dB(rms(mono, Math.round(e.t * rate), Math.round(Math.min(e.t + 1.2, ev[i + 1]?.t ?? e.t + 1.2) * rate)))).sort((a, b) => a - b);
      const mine = lv[Math.floor(lv.length / 2)];
      if (Number.isFinite(mine) && mine > -100) { const db = Math.max(-12, Math.min(12, target - mine)); g = Math.pow(10, db / 20); gains[row] = Math.round(db * 10) / 10; }
    }
    for (let i = 0; i < samples; i++) { left[i] += r.left[i] * g; right[i] += r.right[i] * g; }
  }
  return { left, right, rate, gains };
}

// ── Saving a row (P9) ───────────────────────────────────────────────────────────────────────────

/** A row folded to its shortest repeat (1, 2, 4, 8 or 16 bars) for the library, keeping timing and lengths. */
export function foldMelodyRow(notes: Pick<MelNote, "step" | "off" | "midi" | "durSteps" | "vel">[], steps: number): { bars: 1 | 2 | 4 | 8 | 16; notes: MakeNote[] } {
  const med = (xs: number[]) => { const v = [...xs].sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
  const by = new Map(notes.map((n) => [`${n.step}:${n.midi}`, n]));
  const options = ([1, 2, 4, 8, 16] as const).filter((b) => b === 1 || steps >= b * 16).map((bars) => {
    const P = bars * 16, reps = Math.max(1, Math.floor(steps / P));
    const keys = new Set(notes.map((n) => `${n.step % P}:${n.midi}`));
    const out: MakeNote[] = [];
    let err = 0;
    for (const k of keys) {
      const [p, midi] = k.split(":").map(Number);
      const here = Array.from({ length: reps }, (_, r) => by.get(`${r * P + p}:${midi}`)).filter(Boolean) as typeof notes;
      const keep = here.length * 2 >= reps && here.length > 0;
      err += keep ? reps - here.length : here.length;
      if (keep) {
        const off = med(here.map((h) => h.off));
        out.push({ step: p, midi, dur: Math.min(64, Math.max(0.25, Math.round(med(here.map((h) => h.durSteps)) * 100) / 100)), vel: Math.round(med(here.map((h) => h.vel)) * 100) / 100, ...(Math.abs(off) >= 0.005 ? { off: Math.round(Math.max(-0.5, Math.min(0.5, off)) * 100) / 100 } : {}) });
      }
    }
    return { bars, notes: out.sort((a, b) => a.step - b.step || a.midi - b.midi), err };
  });
  const best = Math.min(...options.map((o) => o.err));
  const pick = options.find((o) => o.err <= best + Math.max(1, 0.03 * notes.length))!;
  return { bars: pick.bars, notes: pick.notes };
}
