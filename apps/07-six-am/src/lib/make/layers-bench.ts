// Phase 5 reading bench (spike for the riskiest assumption, L220): test loops with KNOWN drum hits
// and chord notes, rendered in pure TS (no Web Audio, so it runs in Node and Vitest), with the
// other parts bled in at −15 to −25 dB as separation leaves them. Plus the scores the Z1–Z3 bars
// use. Six AM's own synthetic sounds only: no streamed audio is read or written here (C2).
import { midiToHz } from "@/lib/synths/theory";
import type { DrumRow } from "./drums-read";

export const DRUM_ROWS: DrumRow[] = ["kick", "clap", "hats"];
/** A known drum hit: start time (s from the loop's first sample), row, velocity 0–1. */
export type TruthHit = { t: number; row: DrumRow; vel: number };
/** A known note: start (s), length (s), MIDI pitch, velocity 0–1. */
export type TruthNote = { t: number; dur: number; midi: number; vel: number };

export type BenchLoop<T> = { name: string; bpm: number; rate: number; bars: number; mono: Float32Array; truth: T[]; bleedDb: number | null; key?: { key: string; scale: "major" | "minor" } };

/** Seeded random numbers (mulberry32), so a loop renders the same every run. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** RBJ biquad, run in place. */
function biquad(x: Float32Array, type: "lp" | "hp" | "bp", hz: number, q: number, rate: number) {
  const w = (2 * Math.PI * Math.min(hz, rate * 0.45)) / rate, c = Math.cos(w), a = Math.sin(w) / (2 * q);
  let b0: number, b1: number, b2: number;
  if (type === "lp") { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
  else if (type === "hp") { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
  else { b0 = a; b1 = 0; b2 = -a; }
  const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const y = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = y; x[i] = y;
  }
}

// ---- Drum kit (two flavours, so the reader can't overfit one sound) ----

export type Kit = { kickHz: [number, number]; kickDecay: number; clap: "clap" | "snare"; clapHz: number; hatHp: number; openHat: boolean };
export const KIT_909: Kit = { kickHz: [160, 48], kickDecay: 0.32, clap: "clap", clapHz: 1200, hatHp: 7000, openHat: true };
export const KIT_DEEP: Kit = { kickHz: [120, 42], kickDecay: 0.45, clap: "snare", clapHz: 1800, hatHp: 5500, openHat: false };

function hitSound(row: DrumRow, kit: Kit, rate: number, r: () => number, open = false): Float32Array {
  const len = Math.round(rate * (row === "kick" ? kit.kickDecay + 0.1 : row === "clap" ? 0.3 : open ? 0.3 : 0.08));
  const x = new Float32Array(len);
  if (row === "kick") {
    let ph = 0;
    const [f0, f1] = kit.kickHz;
    for (let i = 0; i < len; i++) {
      const t = i / rate;
      ph += (2 * Math.PI * (f1 + (f0 - f1) * Math.exp(-t / 0.03))) / rate;
      x[i] = Math.sin(ph) * Math.exp(-t / (kit.kickDecay / 3));
    }
    const click = new Float32Array(Math.round(rate * 0.004));
    for (let i = 0; i < click.length; i++) click[i] = (r() * 2 - 1) * Math.exp(-i / (rate * 0.001));
    biquad(click, "hp", 1500, 0.7, rate);
    for (let i = 0; i < click.length; i++) x[i] += click[i] * 0.4;
  } else if (row === "clap") {
    const noise = new Float32Array(len);
    for (let i = 0; i < len; i++) noise[i] = r() * 2 - 1;
    biquad(noise, "bp", kit.clapHz, kit.clap === "clap" ? 1.2 : 0.5, rate);
    if (kit.clap === "clap") {
      // Three quick bursts, then a tail.
      for (let i = 0; i < len; i++) {
        const t = i / rate;
        let e = 0.8 * Math.exp(-(t - 0.024) / 0.09) * (t >= 0.024 ? 1 : 0);
        for (const b of [0, 0.008, 0.016]) if (t >= b) e = Math.max(e, Math.exp(-(t - b) / 0.004));
        x[i] = noise[i] * e * 1.6;
      }
    } else {
      let ph = 0;
      for (let i = 0; i < len; i++) {
        const t = i / rate;
        ph += (2 * Math.PI * 190) / rate;
        x[i] = noise[i] * 1.4 * Math.exp(-t / 0.06) + 0.5 * Math.sin(ph) * Math.exp(-t / 0.04);
      }
    }
  } else {
    for (let i = 0; i < len; i++) x[i] = r() * 2 - 1;
    biquad(x, "hp", kit.hatHp, 0.7, rate);
    biquad(x, "hp", kit.hatHp, 0.7, rate);
    const tau = open ? 0.09 : 0.018;
    for (let i = 0; i < len; i++) x[i] *= Math.exp(-i / rate / tau) * 0.9;
  }
  return x;
}

/** One bar of a drum pattern: per row, the 16th steps that play (velocity 1, or [step, vel]). */
export type BarPattern = Partial<Record<DrumRow, (number | [number, number])[]>>;
export type DrumSpec = { name: string; bpm: number; kit: Kit; bars: BarPattern[]; swingMs?: number; openHatSteps?: number[]; jitterMs?: number; gridOffsetMs?: number };

/** Sums `src` into `dst` from sample `at` (clipped at the ends). */
function addAt(dst: Float32Array, src: Float32Array, at: number, g: number) {
  for (let i = 0; i < src.length; i++) { const j = at + i; if (j >= 0 && j < dst.length) dst[j] += src[i] * g; }
}

/**
 * A drum loop of `spec.bars.length` bars (the bar patterns repeat to `bars`). The loop is cut from a
 * longer render, so the first hits sit on the tails of the previous bar as in a real loop. The grid
 * may sit `gridOffsetMs` after the loop's first sample (the map's bar line is an estimate).
 */
export function renderDrums(spec: DrumSpec, o: { bars: number; rate: number; seed: number }) {
  const { rate } = o, r = rng(o.seed), sps = 60 / spec.bpm / 4;
  const n = Math.round(o.bars * 16 * sps * rate);
  const x = new Float32Array(n);
  const truth: TruthHit[] = [];
  const off = (spec.gridOffsetMs ?? 0) / 1000;
  for (let bar = -1; bar <= o.bars; bar++) {
    const p = spec.bars[((bar % spec.bars.length) + spec.bars.length) % spec.bars.length];
    for (const row of DRUM_ROWS) {
      for (const s of p[row] ?? []) {
        const [step, vel] = typeof s === "number" ? [s, 1] : s;
        const swing = step % 2 === 1 ? (spec.swingMs ?? 0) / 1000 : 0;
        const jitter = ((r() * 2 - 1) * (spec.jitterMs ?? 2)) / 1000;
        const t = off + (bar * 16 + step) * sps + swing + jitter;
        const v = vel * (0.85 + 0.15 * r());
        const open = row === "hats" && spec.kit.openHat && (spec.openHatSteps ?? []).includes(step);
        const level = row === "kick" ? 0.9 : row === "clap" ? 0.5 : 0.28;
        addAt(x, hitSound(row, spec.kit, rate, r, open), Math.round(t * rate), level * v);
        if (t >= 0 && t < n / rate - 0.005) truth.push({ t, row, vel: v });
      }
    }
  }
  truth.sort((a, b) => a.t - b.t);
  return { mono: x, truth };
}

// ---- Pitched parts (additive voices, so every note is known exactly) ----

export type Voice = { harmonics: number; tilt: number; attack: number; decay: number; sustain: number; release: number; detune?: number };
export const VOICES = {
  stab: { harmonics: 14, tilt: 1.0, attack: 0.004, decay: 0.12, sustain: 0.0, release: 0.03 },
  pad: { harmonics: 10, tilt: 1.3, attack: 0.03, decay: 0.3, sustain: 0.7, release: 0.15, detune: 0.004 },
  slowPad: { harmonics: 10, tilt: 1.3, attack: 0.15, decay: 0.3, sustain: 0.7, release: 0.2, detune: 0.004 },
  pluck: { harmonics: 16, tilt: 0.9, attack: 0.002, decay: 0.25, sustain: 0.0, release: 0.05 },
  organ: { harmonics: 6, tilt: 0.6, attack: 0.008, decay: 0.05, sustain: 0.9, release: 0.04 },
} satisfies Record<string, Voice>;

/** Renders notes (s) with an additive voice: harmonic h at 1/h^tilt, an ADSR, an optional slight chorus. */
export function renderNotes(notes: TruthNote[], v: Voice, n: number, rate: number, gain = 0.15) {
  const x = new Float32Array(n);
  for (const note of notes) {
    const f0 = midiToHz(note.midi);
    const start = Math.round(note.t * rate), held = note.dur, end = Math.min(n, start + Math.round((held + v.release) * rate));
    const H = Math.min(v.harmonics, Math.floor((rate * 0.45) / f0));
    const amps = Array.from({ length: H }, (_, h) => 1 / Math.pow(h + 1, v.tilt));
    const ph = new Float64Array(H), ph2 = new Float64Array(H);
    for (let i = Math.max(0, start); i < end; i++) {
      const t = (i - start) / rate;
      let env = t < v.attack ? t / v.attack : v.sustain + (1 - v.sustain) * Math.exp(-(t - v.attack) / v.decay);
      if (t > held) env *= Math.exp(-(t - held) / (v.release / 3));
      let s = 0;
      for (let h = 0; h < H; h++) {
        ph[h] += (2 * Math.PI * f0 * (h + 1)) / rate;
        s += amps[h] * Math.sin(ph[h]);
        if (v.detune) { ph2[h] += (2 * Math.PI * f0 * (1 + v.detune) * (h + 1)) / rate; s += amps[h] * Math.sin(ph2[h]); }
      }
      x[i] += s * env * note.vel * gain * (v.detune ? 0.6 : 1);
    }
  }
  return x;
}

export type ChordSpec = { name: string; bpm: number; key: { key: string; scale: "major" | "minor" }; voice: keyof typeof VOICES; bars: number; notes: (bpm: number) => { step: number; len: number; midi: number[]; vel?: number }[]; layer?: { voice: keyof typeof VOICES; notes: (bpm: number) => { step: number; len: number; midi: number[]; vel?: number }[] } };

function expand(fn: ChordSpec["notes"], bpm: number, bars: number, r: () => number, jitterMs: number): TruthNote[] {
  const sps = 60 / bpm / 4, out: TruthNote[] = [];
  for (const c of fn(bpm)) {
    if (c.step >= bars * 16) continue;
    const t = c.step * sps + ((r() * 2 - 1) * jitterMs) / 1000;
    for (const m of c.midi) out.push({ t: Math.max(0, t), dur: c.len * sps, midi: m, vel: (c.vel ?? 1) * (0.85 + 0.15 * r()) });
  }
  return out;
}

export function renderChordPart(spec: ChordSpec, o: { rate: number; seed: number }) {
  const r = rng(o.seed), sps = 60 / spec.bpm / 4;
  const n = Math.round(spec.bars * 16 * sps * o.rate);
  const truth = expand(spec.notes, spec.bpm, spec.bars, r, 2);
  const x = renderNotes(truth, VOICES[spec.voice], n, o.rate);
  if (spec.layer) {
    const t2 = expand(spec.layer.notes, spec.bpm, spec.bars, r, 2);
    const y = renderNotes(t2, VOICES[spec.layer.voice], n, o.rate, 0.1);
    for (let i = 0; i < n; i++) x[i] += y[i];
    truth.push(...t2);
  }
  truth.sort((a, b) => a.t - b.t || a.midi - b.midi);
  return { mono: x, truth };
}

/** A simple offbeat bass line (bleed source): saw-like, low-passed. */
export function renderBassBleed(bpm: number, n: number, rate: number, roots: number[]) {
  const sps = 60 / bpm / 4, notes: TruthNote[] = [];
  for (let s = 2; s * sps * rate < n; s += 4) notes.push({ t: s * sps, dur: sps * 1.5, midi: roots[Math.floor(s / 16) % roots.length], vel: 1 });
  const x = renderNotes(notes, { harmonics: 8, tilt: 1, attack: 0.004, decay: 0.15, sustain: 0.5, release: 0.03 }, n, rate, 0.5);
  return x;
}

export const rms = (x: Float32Array) => { let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; return Math.sqrt(s / Math.max(1, x.length)); };

/** `part` plus each of `others` scaled to `bleedDb` under the part's own RMS (separation leakage), plus a −50 dB noise floor. */
export function withBleed(part: Float32Array, others: Float32Array[], bleedDb: number, seed: number) {
  const out = part.slice(), ref = rms(part), r = rng(seed);
  for (const o of others) {
    const g = (ref * Math.pow(10, bleedDb / 20)) / Math.max(1e-9, rms(o));
    for (let i = 0; i < out.length; i++) out[i] += o[i] * g;
  }
  const nf = ref * Math.pow(10, -50 / 20) * Math.sqrt(3);
  for (let i = 0; i < out.length; i++) out[i] += (r() * 2 - 1) * nf;
  return out;
}

// ---- Scores (Z1–Z3) ----

export type FoundHit = { t: number; row: DrumRow };

/**
 * Z1 and Z2. Events are the distinct onset times (truth hits within 5 ms merged, found hits within
 * 10 ms: one attack read by two rows is one event, timed by its first row). A found event is
 * on time if a truth event lies within `tolMs`. Z2 counts, over on-time events, the row labels
 * that agree (truth ∩ found) against all labels at those events (truth ∪ found): a missed hat under
 * a clap or an extra clap on a kick both count as wrong.
 */
export function scoreDrums(truth: TruthHit[], found: FoundHit[], tolMs = 10) {
  const events = <T extends { t: number; row: DrumRow }>(xs: T[], within: number) => {
    const ev: { t: number; rows: Set<DrumRow> }[] = [];
    for (const x of [...xs].sort((a, b) => a.t - b.t)) {
      const last = ev[ev.length - 1];
      if (last && x.t - last.t <= within) last.rows.add(x.row);
      else ev.push({ t: x.t, rows: new Set([x.row]) });
    }
    return ev;
  };
  const te = events(truth, 0.005), fe = events(found, 0.01), tol = tolMs / 1000;
  const used = new Set<number>();
  const errs: number[] = [];
  let agree = 0, union = 0;
  const perRow = Object.fromEntries(DRUM_ROWS.map((r) => [r, { truth: 0, found: 0, right: 0 }])) as Record<DrumRow, { truth: number; found: number; right: number }>;
  for (const t of te) for (const r of t.rows) perRow[r].truth++;
  for (const f of fe) for (const r of f.rows) perRow[r].found++;
  for (const f of fe) {
    let best = -1, bd = Infinity;
    te.forEach((t, i) => { const d = Math.abs(t.t - f.t); if (!used.has(i) && d <= tol && d < bd) { bd = d; best = i; } });
    if (best < 0) continue;
    used.add(best);
    errs.push((f.t - te[best].t) * 1000);
    const tr = te[best].rows;
    for (const r of new Set([...tr, ...f.rows])) { union++; if (tr.has(r) && f.rows.has(r)) { agree++; perRow[r].right++; } }
  }
  const abs = errs.map(Math.abs).sort((a, b) => a - b);
  return {
    truthEvents: te.length, foundEvents: fe.length, onTime: used.size,
    recall: used.size / Math.max(1, te.length), extra: (fe.length - used.size) / Math.max(1, te.length),
    meanErrMs: errs.reduce((a, b) => a + b, 0) / Math.max(1, errs.length),
    medianAbsMs: abs[Math.floor(abs.length / 2)] ?? 0, p95AbsMs: abs[Math.floor(abs.length * 0.95)] ?? 0,
    labelAgree: agree / Math.max(1, union), perRow,
  };
}

/**
 * Z3. Truth chords = truth notes starting within 10 ms of each other. For each chord, the found
 * notes starting within `tolMs` of it: share of the chord's pitch classes found (averaged over
 * chords). Wrong = found notes whose pitch class is not in a truth chord within `tolMs` (or with no
 * truth onset near), over all found notes.
 */
export function scoreNotes(truth: TruthNote[], found: { t: number; midi: number }[], tolMs = 30) {
  const chords: { t: number; pcs: Set<number>; midis: Set<number> }[] = [];
  for (const n of [...truth].sort((a, b) => a.t - b.t)) {
    const last = chords[chords.length - 1];
    if (last && n.t - last.t <= 0.01) { last.pcs.add(n.midi % 12); last.midis.add(n.midi); }
    else chords.push({ t: n.t, pcs: new Set([n.midi % 12]), midis: new Set([n.midi]) });
  }
  const tol = tolMs / 1000;
  let pcShare = 0, exactShare = 0;
  const errs: number[] = [];
  for (const c of chords) {
    const near = found.filter((f) => Math.abs(f.t - c.t) <= tol);
    const pcs = new Set(near.map((f) => ((f.midi % 12) + 12) % 12));
    const ms = new Set(near.map((f) => f.midi));
    pcShare += [...c.pcs].filter((p) => pcs.has(p)).length / c.pcs.size;
    exactShare += [...c.midis].filter((m) => ms.has(m)).length / c.midis.size;
    for (const f of near) if (c.pcs.has(((f.midi % 12) + 12) % 12)) errs.push((f.t - c.t) * 1000);
  }
  let wrong = 0;
  for (const f of found) {
    const ok = chords.some((c) => Math.abs(f.t - c.t) <= tol && c.pcs.has(((f.midi % 12) + 12) % 12));
    if (!ok) wrong++;
  }
  const abs = errs.map(Math.abs).sort((a, b) => a - b);
  return {
    chords: chords.length, found: found.length,
    pcFound: pcShare / Math.max(1, chords.length), exactFound: exactShare / Math.max(1, chords.length),
    wrong: wrong / Math.max(1, found.length),
    medianAbsMs: abs[Math.floor(abs.length / 2)] ?? 0, p95AbsMs: abs[Math.floor(abs.length * 0.95)] ?? 0,
  };
}

// ---- The bench loops ----

const HOUSE: BarPattern = { kick: [0, 4, 8, 12], clap: [4, 12], hats: [2, 6, 10, 14] };
const SIXTEENTHS = Array.from({ length: 16 }, (_, i) => [i, i % 2 ? 0.55 : i % 4 === 2 ? 1 : 0.75] as [number, number]);

export const DRUM_SPECS: DrumSpec[] = [
  { name: "four-floor, offbeat open hats", bpm: 124, kit: KIT_909, bars: [HOUSE], openHatSteps: [2, 6, 10, 14] },
  { name: "four-floor, 16th hats", bpm: 126, kit: KIT_909, bars: [{ kick: [0, 4, 8, 12], clap: [4, 12], hats: SIXTEENTHS }], gridOffsetMs: 14 },
  { name: "swung 16ths (+25 ms)", bpm: 122, kit: KIT_DEEP, bars: [{ kick: [0, 4, 8, 12], clap: [4, 12], hats: SIXTEENTHS.filter(([s]) => s % 4 !== 0) }], swingMs: 25 },
  { name: "broken beat, ghost snares", bpm: 128, kit: KIT_DEEP, gridOffsetMs: -9, bars: [
    { kick: [0, 3, 10], clap: [4, [7, 0.3], 12], hats: [0, 2, 4, 6, 8, 10, 12, 14] },
    { kick: [0, 6, 9, 14], clap: [4, 12, [15, 0.3]], hats: [2, 3, 6, 10, 11, 14] },
  ] },
  { name: "garage 2-step, swung", bpm: 128, kit: KIT_909, swingMs: 18, openHatSteps: [14], bars: [
    { kick: [0, 7, 10], clap: [4, 12], hats: [2, 5, 6, 10, 13, 14] },
  ] },
  { name: "hats only (breakdown)", bpm: 124, kit: KIT_909, bars: [{ hats: SIXTEENTHS }] },
];

// Chord names to MIDI (C4 = 60). A minor: Am7 Fmaj7 C G; F minor: Fm7 Dbmaj7 Ab Eb.
const Am7 = [57, 60, 64, 67], Fmaj7 = [53, 57, 60, 64], C = [55, 60, 64], G = [55, 59, 62, 67];
const Fm7 = [53, 56, 60, 63], Db = [56, 60, 61, 65], Ab = [56, 60, 63], Eb = [55, 58, 63, 67];
/** The pluck lead's notes per 2 bars (overlapping: each rings 3 16ths, some only 2 apart). */
const LEAD = [[76, 72, 69, 72, 74, 76], [77, 76, 72, 69, 72, 74], [79, 76, 72, 76, 79, 81], [79, 74, 71, 74, 76, 79]];
const each = (bars: number, prog: number[][], perBar: (bar: number, chord: number[]) => { step: number; len: number; midi: number[]; vel?: number }[]) =>
  Array.from({ length: bars }, (_, b) => perBar(b, prog[Math.floor(b / (bars / prog.length >= 2 ? 2 : 1)) % prog.length])).flat();

export const CHORD_SPECS: ChordSpec[] = [
  { name: "offbeat stabs (Am7 F C G)", bpm: 124, key: { key: "A", scale: "minor" }, voice: "stab", bars: 8,
    notes: () => each(8, [Am7, Fmaj7, C, G], (b, c) => [2, 6, 10, 14].map((s) => ({ step: b * 16 + s, len: 1, midi: c }))) },
  { name: "Chicago stabs, syncopated", bpm: 126, key: { key: "F", scale: "minor" }, voice: "stab", bars: 8,
    notes: () => each(8, [Fm7, Db, Ab, Eb], (b, c) => [0, 3, 6, 10, 13].map((s) => ({ step: b * 16 + s, len: 2, midi: c, vel: s === 0 ? 1 : 0.8 }))) },
  { name: "held pads, 1 chord per 2 bars", bpm: 122, key: { key: "A", scale: "minor" }, voice: "pad", bars: 8,
    notes: () => [Am7, Fmaj7, C, G].map((c, i) => ({ step: i * 32, len: 31, midi: c.map((m) => m - 12 + (m < 56 ? 12 : 0)) })) },
  { name: "slow-attack pads (150 ms)", bpm: 120, key: { key: "F", scale: "minor" }, voice: "slowPad", bars: 8,
    notes: () => [Fm7, Db, Ab, Eb].map((c, i) => ({ step: i * 32, len: 31, midi: c })) },
  { name: "pluck lead over a pad (overlap)", bpm: 124, key: { key: "A", scale: "minor" }, voice: "pluck", bars: 8,
    notes: () => Array.from({ length: 8 }, (_, b) => [0, 3, 6, 8, 11, 14].map((s, i) => ({ step: b * 16 + s, len: 3, midi: [LEAD[Math.floor(b / 2) % 4][i]] }))).flat(),
    layer: { voice: "pad", notes: () => [Am7, Fmaj7, C, G].map((c, i) => ({ step: i * 32, len: 31, midi: c.map((m) => m - 12 + (m < 56 ? 12 : 0)), vel: 0.6 })) } },
  { name: "organ chords, 2-bar riff", bpm: 128, key: { key: "F", scale: "minor" }, voice: "organ", bars: 8,
    notes: () => each(8, [Fm7, Eb], (b, c) => [0, 6, 12].map((s) => ({ step: b * 16 + s, len: 3, midi: c }))) },
];

/** The drum bench: each spec at `bleedDb` (null = clean), with an offbeat bass and the first chord part bled in. */
export function drumLoops(bleedDb: number | null, rate = 44100, bars = 8): BenchLoop<TruthHit>[] {
  return DRUM_SPECS.map((spec, i) => {
    const { mono, truth } = renderDrums(spec, { bars, rate, seed: 100 + i });
    let x = mono;
    if (bleedDb !== null) {
      const bass = renderBassBleed(spec.bpm, x.length, rate, [33, 33, 29, 31]);
      const other = renderChordPart({ ...CHORD_SPECS[i % 2], bpm: spec.bpm, bars }, { rate, seed: 7 + i }).mono;
      x = withBleed(mono, [bass, other], bleedDb, 900 + i);
    }
    return { name: spec.name, bpm: spec.bpm, rate, bars, mono: x, truth, bleedDb };
  });
}

/** The chord bench: each spec at `bleedDb`, with a house drum loop and the bass bled in. */
export function chordLoops(bleedDb: number | null, rate = 44100): BenchLoop<TruthNote>[] {
  return CHORD_SPECS.map((spec, i) => {
    const { mono, truth } = renderChordPart(spec, { rate, seed: 300 + i });
    let x = mono;
    if (bleedDb !== null) {
      const drums = renderDrums({ ...DRUM_SPECS[i % 3], bpm: spec.bpm, gridOffsetMs: 0 }, { bars: spec.bars, rate, seed: 50 + i }).mono;
      const bass = renderBassBleed(spec.bpm, x.length, rate, [33, 33, 29, 31]);
      x = withBleed(mono, [drums, bass], bleedDb, 700 + i);
    }
    return { name: spec.name, bpm: spec.bpm, rate, bars: spec.bars, mono: x, truth, bleedDb, key: spec.key };
  });
}
