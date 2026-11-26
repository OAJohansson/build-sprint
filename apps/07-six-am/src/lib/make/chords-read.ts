// Phase 6 spike (K2, K3, L251): chord NAMES per bar from the looped "other" part, not every note.
// Two readers give the same output (ChordsReading), so data-evals can grade them side by side:
//
// - A, "dsp" (readChords): a chroma vector (energy per pitch class, 100 Hz–2 kHz) per 16th, summed per
//   bar, with the lowest strong note of each frame counted again for the root; matched against chord
//   templates (major, minor, 7, maj7, m7, sus2, sus4, dim), a little in favour of the track's key;
//   a loop that repeats every 1, 2 or 4 bars is blended with its repeats and a short smoothing keeps
//   a 3–4 chord loop a loop. A bar gets two chords only when its halves clearly differ. Chord times
//   are the onset reader's (notes-read.ts loopAttacks, ~25 ms in Phase 5) where the pitched band rises.
// - B, "basic-pitch" (chordsFromNotes): Basic Pitch's notes (notes-bp.ts) folded into the same chroma
//   and templates, with the notes' onsets as chord times.
//
// Each chord event is struck (a stab) or held (a pad, L251) and lasts as long as the part sounds it.
// voiceChord turns a name into a standard voicing near the original's register, and chordsMelodyReading
// into MelNotes so the poly synth / Suggest / A-B / Save path (melody-make.ts) can play it.
// Only numbers come out of the original (C2). Pure TS, run in Make's worker (jobs.ts).
import { PITCHES } from "@/lib/lab/chords";
import { pitchClass, scalePitchClasses, type Scale } from "@/lib/synths/theory";
import { decimate, fft, hann, powerSpec, toMono } from "./dsp";
import { eventsOf, playedOf, type MelNote, type MelodyReading } from "./melody-make";
import { loopAttacks, type ReadNote } from "./notes-read";

export type ChordType = "maj" | "min" | "7" | "maj7" | "m7" | "sus2" | "sus4" | "dim";
export const CHORD_TYPES: Record<ChordType, { iv: readonly number[]; suffix: string }> = {
  maj: { iv: [0, 4, 7], suffix: "" },
  min: { iv: [0, 3, 7], suffix: "m" },
  "7": { iv: [0, 4, 7, 10], suffix: "7" },
  maj7: { iv: [0, 4, 7, 11], suffix: "maj7" },
  m7: { iv: [0, 3, 7, 10], suffix: "m7" },
  sus2: { iv: [0, 2, 7], suffix: "sus2" },
  sus4: { iv: [0, 5, 7], suffix: "sus4" },
  dim: { iv: [0, 3, 6], suffix: "dim" },
};
const TYPES = Object.keys(CHORD_TYPES) as ChordType[];

export type ChordGuess = { name: string; root: number; type: ChordType; score: number };
/** One cell of the chord grid: a bar, or half a bar when the chord clearly changes inside it. `name` "" = no chord heard. */
export type ChordCell = { bar: number; startStep: number; steps: number; name: string; root: number | null; type: ChordType | null; score: number; alternatives: ChordGuess[] };
/** One chord as the part plays it: start and length in seconds in the loop, its cell, struck (a stab) or held (a pad). */
export type ChordEvent = { t: number; dur: number; step: number; off: number; cell: number; struck: boolean; held: boolean; vel: number };
export type ChordsReader = "dsp" | "basic-pitch";
export type ChordsReading = { reader: ChordsReader; bpm: number; steps: number; bars: number; register: number; tuningCents: number; cells: ChordCell[]; events: ChordEvent[] };
type Key = { key: string; scale: Scale };

// shortcut: weights (root 0.15, out of key 0.02 per tone, change 0.05, loop blend 0.5, split margin 0.1, silent −30 dB) picked by reasoning and the synthetic guards, not on real parts; tune on the spike's real-track grade.
export const CHORD_OPT = { rootW: 0.15, keyW: 0.02, changeCost: 0.05, loopBlend: 0.5, loopSim: 0.9, splitMargin: 0.1, silentDb: -30, alternatives: 6 };

export const chordName = (root: number, type: ChordType) => PITCHES[((root % 12) + 12) % 12] + CHORD_TYPES[type].suffix;
const mod12 = (n: number) => ((n % 12) + 12) % 12;

/** In the key: its scale, plus the raised 7th in minor (the V7 of a minor key, harmonic minor). */
function keyPcs(key?: Key): Set<number> | null {
  const tonic = key ? pitchClass(key.key) : null;
  if (tonic === null || !key) return null;
  const pcs = new Set(scalePitchClasses(tonic, key.scale));
  if (key.scale === "minor") pcs.add(mod12(tonic + 11));
  return pcs;
}

/**
 * Every chord ranked for a chroma vector (12 numbers, C first): the cosine to the chord's template,
 * plus the share of the low notes on its root (`bass`), less a little per tone outside the key.
 */
export function rankChords(chroma: number[], bass?: number[], key?: Key): ChordGuess[] {
  const norm = Math.hypot(...chroma);
  if (!(norm > 0)) return [];
  const bSum = bass ? bass.reduce((a, b) => a + b, 0) : 0;
  const inKey = keyPcs(key);
  const out: ChordGuess[] = [];
  for (let root = 0; root < 12; root++) {
    for (const type of TYPES) {
      const tones = CHORD_TYPES[type].iv.map((i) => mod12(root + i));
      const cos = tones.reduce((a, t) => a + chroma[t], 0) / (norm * Math.sqrt(tones.length));
      const rootShare = bSum > 0 ? bass![root] / bSum : 0;
      const out_ = inKey ? tones.filter((t) => !inKey.has(t)).length : 0;
      const score = cos + CHORD_OPT.rootW * rootShare - CHORD_OPT.keyW * out_;
      out.push({ name: chordName(root, type), root, type, score: Math.round(score * 1000) / 1000 });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

const cos = (a: number[], b: number[]) => {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < 12; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na > 0 && nb > 0 ? d / Math.sqrt(na * nb) : 0;
};
const add = (a: number[], b: number[], k = 1) => a.map((x, i) => x + k * b[i]);
const zeros = () => new Array(12).fill(0) as number[];

/** Per-16th harmony of a loop: chroma, the low notes' chroma, and the energy, each a list of `steps` vectors. */
export type StepHarmony = { chroma: number[][]; bass: number[][]; energy: number[] };

/**
 * A loop that repeats every 1, 2 or 4 bars: each bar blended with the mean of its repeats, so one
 * noisy bar can't break a progression. The smallest period whose repeats look alike (cosine ≥ 0.9).
 */
export function loopBlend(bars: number[][]): number[][] {
  const n = bars.length;
  for (const P of [1, 2, 4]) {
    if (P >= n || n % P) continue;
    let s = 0, c = 0;
    for (let i = 0; i + P < n; i++) { if (Math.hypot(...bars[i]) && Math.hypot(...bars[i + P])) { s += cos(bars[i], bars[i + P]); c++; } }
    if (!c || s / c < CHORD_OPT.loopSim) continue;
    return bars.map((v, i) => {
      let mean = zeros(), k = 0;
      for (let j = i % P; j < n; j += P) { const nj = Math.hypot(...bars[j]); if (nj) { mean = add(mean, bars[j], 1 / nj); k++; } }
      const nv = Math.hypot(...v);
      if (!k || !nv) return v;
      return add(v.map((x) => x / nv), mean.map((x) => x / k), CHORD_OPT.loopBlend / (1 - CHORD_OPT.loopBlend)).map((x) => x * (1 - CHORD_OPT.loopBlend));
    });
  }
  return bars;
}

/** Viterbi over the cells: each cell's own scores, minus `changeCost` wherever the chord changes. */
export function smoothChords(ranked: ChordGuess[][]): (ChordGuess | null)[] {
  const n = ranked.length;
  if (!n) return [];
  const names = Array.from(new Set(ranked.flatMap((r) => r.map((g) => g.name))));
  if (!names.length) return ranked.map(() => null);
  const score = ranked.map((r) => new Map(r.map((g) => [g.name, g.score])));
  const at = (i: number, s: string) => score[i].get(s) ?? (ranked[i].length ? -1 : 0);
  let prev = names.map((s) => at(0, s));
  const back: number[][] = [];
  for (let i = 1; i < n; i++) {
    const bestPrev = prev.reduce((b, v, j) => (v > prev[b] ? j : b), 0);
    const cur: number[] = [], bk: number[] = [];
    names.forEach((s, j) => {
      const stay = prev[j], move = prev[bestPrev] - CHORD_OPT.changeCost;
      const from = stay >= move ? j : bestPrev;
      cur.push(Math.max(stay, move) + at(i, s)); bk.push(from);
    });
    back.push(bk); prev = cur;
  }
  let j = prev.reduce((b, v, q) => (v > prev[b] ? q : b), 0);
  const path = [j];
  for (let i = n - 2; i >= 0; i--) { j = back[i][j]; path.push(j); }
  path.reverse();
  return path.map((q, i) => ranked[i].find((g) => g.name === names[q]) ?? null);
}

/**
 * Cells from per-16th harmony: one per bar, two when its halves clearly want different chords (the
 * half's own best beats the bar's chord there by `splitMargin`). Silent bars (30 dB under the loudest)
 * get no chord. Each cell keeps its next alternatives with scores (H5).
 */
export function cellsFromHarmony(h: StepHarmony, key?: Key): ChordCell[] {
  const steps = h.energy.length, bars = Math.max(1, Math.round(steps / 16));
  const sum = (a: number, b: number, f: (s: number) => number[]) => { let v = zeros(); for (let s = a; s < Math.min(b, steps); s++) v = add(v, f(s)); return v; };
  const energyOf = (a: number, b: number) => { let e = 0; for (let s = a; s < Math.min(b, steps); s++) e += h.energy[s]; return e; };
  const barE = Array.from({ length: bars }, (_, b) => energyOf(b * 16, b * 16 + 16));
  const loud = Math.max(1e-20, ...barE);
  const silent = (e: number) => 10 * Math.log10(e / loud + 1e-20) < CHORD_OPT.silentDb;
  const barChroma = loopBlend(Array.from({ length: bars }, (_, b) => sum(b * 16, b * 16 + 16, (s) => h.chroma[s])));
  const barBass = Array.from({ length: bars }, (_, b) => sum(b * 16, b * 16 + 16, (s) => h.bass[s]));
  type Raw = { bar: number; startStep: number; steps: number; ranked: ChordGuess[] };
  const raw: Raw[] = [];
  for (let b = 0; b < bars; b++) {
    if (silent(barE[b])) { raw.push({ bar: b, startStep: b * 16, steps: 16, ranked: [] }); continue; }
    const whole = rankChords(barChroma[b], barBass[b], key);
    const halves = [0, 8].map((o) => ({ o, e: energyOf(b * 16 + o, b * 16 + o + 8), r: rankChords(sum(b * 16 + o, b * 16 + o + 8, (s) => h.chroma[s]), sum(b * 16 + o, b * 16 + o + 8, (s) => h.bass[s]), key) }));
    const top = whole[0]?.name;
    const differs = halves.every((x) => x.r.length && x.e >= 0.2 * barE[b]) && halves[0].r[0].name !== halves[1].r[0].name &&
      halves.some((x) => x.r[0].name !== top && x.r[0].score - (x.r.find((g) => g.name === top)?.score ?? 0) >= CHORD_OPT.splitMargin);
    if (differs) for (const x of halves) raw.push({ bar: b, startStep: b * 16 + x.o, steps: 8, ranked: x.r });
    else raw.push({ bar: b, startStep: b * 16, steps: 16, ranked: whole });
  }
  const chosen = smoothChords(raw.map((r) => r.ranked));
  return raw.map((r, i) => {
    const c = chosen[i];
    return {
      bar: r.bar, startStep: r.startStep, steps: r.steps,
      name: c?.name ?? "", root: c?.root ?? null, type: c?.type ?? null, score: c?.score ?? 0,
      alternatives: r.ranked.filter((g) => g.name !== c?.name).slice(0, CHORD_OPT.alternatives),
    };
  });
}

/** An onset as a chord reader found it: when, how strong (0–1), and until when the part sounds it. */
export type Onset = { t: number; vel: number; end: number };

/**
 * Chord events from onsets and cells (L251): every onset starts the chord of the cell it falls in (a
 * stab up to half a 16th early belongs to the next cell). A cell with no onset of its own (a pad) is
 * held from its start, unless a chord of the same name still sounds there (a pad held over two bars
 * stays one chord, H3). An event lasts until the part stops sounding it, the next event, the end of
 * its cell when the next cell's chord differs, or the loop's end; it is held when that is 1.5 beats or more.
 */
export function eventsFromOnsets(onsets: Onset[], cells: ChordCell[], bpm: number, steps: number): ChordEvent[] {
  const sps = 60 / bpm / 4, loopS = steps * sps;
  const cellAt = (t: number) => { const s = t / sps + 0.5; let k = -1; cells.forEach((c, i) => { if (s >= c.startStep && s < c.startStep + c.steps) k = i; }); return k; };
  const evs: { t: number; vel: number; end: number; cell: number; struck: boolean }[] = [];
  for (const o of [...onsets].sort((a, b) => a.t - b.t)) {
    // Attacks just before the loop's start are the loop's end read round (it has its own copy of them).
    if (o.t < -0.012 || o.t >= loopS) continue;
    const t = Math.max(0, o.t), k = cellAt(t);
    if (k < 0 || !cells[k].name) continue;
    evs.push({ t, vel: o.vel, end: o.end, cell: k, struck: true });
  }
  cells.forEach((c, i) => {
    if (!c.name || evs.some((e) => e.struck && e.cell === i)) return;
    const t0 = c.startStep * sps, cellEnd = (c.startStep + c.steps) * sps;
    const sounding = evs.find((e) => e.t < t0 && e.end >= t0 - 0.05 && cells[e.cell].name === c.name);
    if (sounding) { if (!sounding.struck) sounding.end = Math.max(sounding.end, cellEnd); return; }
    evs.push({ t: t0, vel: 0.8, end: cellEnd, cell: i, struck: false });
  });
  evs.sort((a, b) => a.t - b.t);
  return evs.map((e, i) => {
    const next = evs[i + 1]?.t ?? loopS;
    const cellEnd = (cells[e.cell].startStep + cells[e.cell].steps) * sps;
    const changesAfter = !!cells[e.cell + 1] && cells[e.cell + 1].name !== cells[e.cell].name;
    const stop = Math.min(next, loopS, Math.max(e.end, e.t + 0.03), changesAfter ? Math.max(cellEnd, e.t + 0.03) : Infinity);
    const dur = Math.max(0.03, stop - e.t), step = Math.round(e.t / sps);
    const held = dur >= 6 * sps;
    return { t: Math.round(e.t * 10000) / 10000, dur: Math.round(dur * 10000) / 10000, step: step % steps, off: Math.round((e.t / sps - step) * 1000) / 1000, cell: e.cell, struck: e.struck && !held, held, vel: Math.round(e.vel * 100) / 100 };
  });
}

// ── Reader A: DSP chroma ───────────────────────────────────────────────────────────────────────

const N = 4096; // at ~11 kHz: 372 ms, 2.7 Hz bins (a semitone at 100 Hz is 6 Hz)
const LO_HZ = 100, HI_HZ = 2000, BASS_HI_HZ = 400;
// shortcut: onset filter (mark ≥ 0.15, pitched band 100–1200 Hz up ≥ 3 dB, within 30 dB of the loudest, sounds until 12 dB down) picked by reasoning; check against the real stab labels.
export const ONSET_OPT = { mark: 0.15, riseDb: 3, floorDb: -30, decayDb: 12, bandLo: 100, bandHi: 1200 };

/** Harmony per 16th of a looped part (the loop read round, so the first bar's window sees the last). */
export function harmonyOf(x: Float32Array, r: number, bpm: number): StepHarmony & { register: number; tuningCents: number } {
  const sps = 60 / bpm / 4, steps = Math.max(1, Math.floor(x.length / r / sps + 0.01));
  const hop = Math.round(r * 0.0232), frames = Math.floor(x.length / hop);
  const w = hann(N), re = new Float64Array(N), im = new Float64Array(N);
  const kLo = Math.ceil((LO_HZ * N) / r), kHi = Math.min(N / 2 - 1, Math.floor((HI_HZ * N) / r));
  const peaks: { f: number; midi: number; amp: number }[] = [];
  let loud = 0;
  const frameMags: Float64Array[] = [];
  for (let f = 0; f < frames; f++) {
    const at = f * hop - N / 2;
    for (let i = 0; i < N; i++) { const j = ((at + i) % x.length + x.length) % x.length; re[i] = x[j] * w[i]; im[i] = 0; }
    fft(re, im);
    const m = new Float64Array(kHi + 2);
    for (let k = kLo - 1; k <= kHi + 1; k++) { m[k] = Math.hypot(re[k], im[k]); if (m[k] > loud) loud = m[k]; }
    frameMags.push(m);
  }
  const floor = loud * Math.pow(10, -50 / 20);
  for (let f = 0; f < frames; f++) {
    const m = frameMags[f];
    for (let k = kLo; k <= kHi; k++) {
      if (m[k] < floor || m[k] <= m[k - 1] || m[k] < m[k + 1]) continue;
      const a = Math.log(m[k - 1] + 1e-12), b = Math.log(m[k] + 1e-12), c = Math.log(m[k + 1] + 1e-12), d = a - 2 * b + c;
      const off = d < 0 ? (0.5 * (a - c)) / d : 0;
      peaks.push({ f, midi: 69 + 12 * Math.log2(((k + off) * r) / N / 440), amp: Math.exp(b - 0.25 * (a - c) * off) });
    }
  }
  // Tuning: the median offset of the strong peaks from equal temperament.
  const strong = peaks.filter((p) => p.amp > loud * 0.05).map((p) => p.midi - Math.round(p.midi)).sort((a, b) => a - b);
  const tune = strong.length ? strong[strong.length >> 1] : 0;
  const chroma = Array.from({ length: steps }, zeros), bass = Array.from({ length: steps }, zeros), energy = new Array(steps).fill(0);
  const byFrame: { midi: number; amp: number }[][] = Array.from({ length: frames }, () => []);
  for (const p of peaks) byFrame[p.f].push(p);
  let regW = 0, regS = 0;
  for (let f = 0; f < frames; f++) {
    const s = Math.floor((f * hop) / r / sps) % steps, ps = byFrame[f];
    if (!ps.length) continue;
    let top = 0;
    for (const p of ps) { const v = Math.sqrt(p.amp); chroma[s][mod12(Math.round(p.midi - tune))] += v; energy[s] += p.amp * p.amp; top = Math.max(top, p.amp); }
    // The root: the lowest strong note in the frame (its fundamental, under 400 Hz), counted again.
    const low = ps.filter((p) => p.amp >= 0.3 * top && 440 * Math.pow(2, (p.midi - 69) / 12) < BASS_HI_HZ).sort((a, b) => a.midi - b.midi)[0];
    if (low) { const v = Math.sqrt(low.amp); bass[s][mod12(Math.round(low.midi - tune))] += v; regW += v; regS += v * low.midi; }
  }
  // The register: the low note (a chord's bottom; all peaks would count the harmonics too) plus half a
  // closed voicing's span, so voiceChord puts the voicing's root about where the original's is.
  return { chroma, bass, energy, register: regW ? Math.round(regS / regW + 5.5) : 60, tuningCents: Math.round(tune * 100) };
}

/** Onsets of a looped part where its pitched band rises (the attack reader's marks, timed by its finer curve). */
export function chordOnsets(x: Float32Array, r: number): Onset[] {
  const { marks, fine } = loopAttacks(x, r);
  const n = 512, hop = Math.max(1, Math.round(r * 0.0029));
  const { frames, bins, p } = powerSpec(x, n, hop);
  const kLo = Math.ceil((ONSET_OPT.bandLo * n) / r), kHi = Math.floor((ONSET_OPT.bandHi * n) / r);
  const env = new Float64Array(frames);
  for (let f = 0; f < frames; f++) { let e = 0; for (let k = kLo; k <= kHi; k++) e += p[f * bins + k]; env[f] = 10 * Math.log10(e + 1e-20); }
  // Smoothed over ~12 ms so one partial's beating isn't a rise.
  const sm = new Float64Array(frames), W = 2;
  for (let f = 0; f < frames; f++) { let s = 0, c = 0; for (let j = Math.max(0, f - W); j <= Math.min(frames - 1, f + W); j++) { s += env[j]; c++; } sm[f] = s / c; }
  const peak = Math.max(...sm);
  const fr = (t: number) => Math.max(0, Math.min(frames - 1, Math.round((t * r) / hop)));
  const maxIn = (a: number, b: number) => { let m = -Infinity; for (let f = fr(a); f <= fr(b); f++) m = Math.max(m, sm[f]); return m; };
  const minIn = (a: number, b: number) => { let m = Infinity; for (let f = fr(a); f <= fr(b); f++) m = Math.min(m, sm[f]); return m; };
  const out: Onset[] = [];
  for (const m of marks) {
    if (m.s < ONSET_OPT.mark) continue;
    const after = maxIn(m.t + 0.005, m.t + 0.06);
    // At the loop's start the 50 ms before it are the loop's end (it plays round).
    const loopEnd = x.length / r;
    const before = m.t > 0.05 ? minIn(m.t - 0.05, m.t - 0.003) : Math.min(minIn(loopEnd - (0.05 - m.t), loopEnd), m.t > 0.006 ? minIn(0, m.t - 0.003) : Infinity);
    if (after - before < ONSET_OPT.riseDb || after < peak + ONSET_OPT.floorDb) continue;
    let fb: { t: number; s: number } | null = null;
    for (const q of fine) if (Math.abs(q.t - m.t) <= 0.02 && (!fb || q.s > fb.s)) fb = q;
    const t = fb ? fb.t : m.t;
    // Sounds until the band falls 12 dB under its level just after the onset.
    let f = fr(t + 0.06);
    while (f < frames - 1 && sm[f] > after - ONSET_OPT.decayDb) f++;
    out.push({ t, vel: Math.min(1, 0.4 + 0.6 * m.s), end: (f * hop) / r });
  }
  return out;
}

/** Reader A: chord names per bar of a looped mono-or-stereo "other" part, with their times (numbers only). */
export function readChords(left: Float32Array, right: Float32Array | undefined, rate: number, bpm: number, key?: Key): ChordsReading {
  const mono = toMono(left, right);
  const dec = Math.max(1, Math.round(rate / 11025));
  const x = decimate(mono, dec), r = rate / dec;
  const sps = 60 / bpm / 4, steps = Math.max(1, Math.floor(x.length / r / sps + 0.01)), bars = Math.max(1, Math.round(steps / 16));
  if (x.length < r * 0.5) return { reader: "dsp", bpm, steps, bars, register: 60, tuningCents: 0, cells: [], events: [] };
  const h = harmonyOf(x, r, bpm);
  const cells = cellsFromHarmony(h, key);
  const events = eventsFromOnsets(chordOnsets(x, r), cells, bpm, steps);
  if (x !== mono) x.fill(0);
  if (mono !== left) mono.fill(0); // the copies of the original go here (C2)
  return { reader: "dsp", bpm, steps, bars, register: h.register, tuningCents: h.tuningCents, cells, events };
}

// ── Reader B: notes (Basic Pitch) folded into names ────────────────────────────────────────────

/** Notes (any reader's) folded into per-16th harmony: each note adds its velocity × time sounding in each 16th; each event's lowest note counts for the root. */
export function harmonyOfNotes(notes: Pick<ReadNote, "t" | "dur" | "midi" | "vel">[], bpm: number, steps: number): StepHarmony & { register: number } {
  const sps = 60 / bpm / 4, loopS = steps * sps;
  const chroma = Array.from({ length: steps }, zeros), bass = Array.from({ length: steps }, zeros), energy = new Array(steps).fill(0);
  let regW = 0, regS = 0;
  for (const n of notes) {
    if (n.t >= loopS) continue;
    const a = Math.max(0, n.t), b = Math.min(loopS, n.t + n.dur);
    for (let s = Math.floor(a / sps); s < steps && s * sps < b; s++) {
      const ov = Math.min(b, (s + 1) * sps) - Math.max(a, s * sps);
      if (ov <= 0) continue;
      const v = n.vel * (ov / sps);
      chroma[s][mod12(n.midi)] += v; energy[s] += v * v;
    }
  }
  for (const ev of eventsOf(notes as ReadNote[])) {
    const low = ev.notes.map((i) => notes[i]).sort((p, q) => p.midi - q.midi)[0];
    if (!low || low.t >= loopS) continue;
    const s = Math.floor(Math.max(0, low.t) / sps) % steps;
    const v = low.vel * Math.min(low.dur, 4 * sps) / sps;
    bass[s][mod12(low.midi)] += v; regW += v; regS += v * low.midi;
  }
  return { chroma, bass, energy, register: regW ? Math.round(regS / regW + 5.5) : 60 };
}

/** Reader B's output: the notes' chord names per bar, with their onsets as chord times. */
export function chordsFromNotes(notes: ReadNote[], bpm: number, loopS: number, key?: Key, reader: ChordsReader = "basic-pitch", tuningCents = 0): ChordsReading {
  const sps = 60 / bpm / 4, steps = Math.max(1, Math.floor(loopS / sps + 0.01)), bars = Math.max(1, Math.round(steps / 16));
  const inLoop = notes.filter((n) => n.t < loopS);
  const h = harmonyOfNotes(inLoop, bpm, steps);
  const cells = cellsFromHarmony(h, key);
  const loud = Math.max(1e-9, ...inLoop.map((n) => n.vel));
  const onsets: Onset[] = eventsOf(inLoop).map((ev) => {
    const ns = ev.notes.map((i) => inLoop[i]);
    return { t: ev.t, vel: Math.max(...ns.map((n) => n.vel)) / loud, end: Math.max(...ns.map((n) => n.t + n.dur)) };
  });
  return { reader, bpm, steps, bars, register: h.register, tuningCents, cells, events: eventsFromOnsets(onsets, cells, bpm, steps) };
}

// ── Lead: a one-note line ─────────────────────────────────────────────────────────────────────

/**
 * The lead line: the Lead row when the melody split found one; otherwise the top line of the notes
 * (the highest played note of each event, its partials left out), marked so a grader knows which.
 */
export function leadLine(m: MelodyReading): { from: "row" | "top-line"; notes: MelNote[] } {
  if (m.rows.lead.notes.length) return { from: "row", notes: m.rows.lead.notes };
  const all = m.rows.chords.notes;
  const notes = eventsOf(all).map((ev) => {
    const played = playedOf(ev, all);
    return all[(played.length ? played : ev.notes).reduce((a, b) => (all[b].midi > all[a].midi ? b : a))];
  });
  return { from: "top-line", notes };
}

// ── Voicing: names → notes the poly synth plays ───────────────────────────────────────────────

/**
 * A standard voicing: the chord in root position, closed (within an octave), placed so its middle
 * sits nearest `register` (the original's mean pitch, MIDI).
 */
export function voiceChord(root: number, type: ChordType, register = 60): number[] {
  const iv = CHORD_TYPES[type].iv, mean = iv.reduce((a, b) => a + b, 0) / iv.length;
  let best = mod12(root) + 36;
  for (let r = mod12(root) + 24; r <= 96; r += 12) if (Math.abs(r + mean - register) < Math.abs(best + mean - register)) best = r;
  return iv.map((i) => best + i);
}

/** Every chord event as notes in its standard voicing, on the 16th grid (MelNote, as melody-make.ts plays). */
export function chordNotes(c: ChordsReading): MelNote[] {
  const sps = 60 / c.bpm / 4, out: MelNote[] = [];
  for (const e of c.events) {
    const cell = c.cells[e.cell];
    if (!cell?.name || cell.root === null || !cell.type) continue;
    for (const midi of voiceChord(cell.root, cell.type, c.register)) out.push({ t: e.t, dur: e.dur, midi, vel: e.vel, step: e.step, off: e.off, durSteps: Math.max(0.25, Math.round((e.dur / sps) * 100) / 100) });
  }
  return out;
}

/** The chords (voiced) and a lead line as a MelodyReading, so Make's poly synth, Suggest, A/B, score and Save take them as they are. */
export function chordsMelodyReading(c: ChordsReading, lead: MelNote[]): MelodyReading {
  const chords = chordNotes(c);
  const row = (notes: MelNote[]) => ({ notes, doubtful: false, why: null, note: null });
  return { rows: { chords: row(chords), lead: row(lead) }, steps: c.steps, bars: c.bars, lead: lead.length > 0, chords: chords.length > 0, tuningCents: c.tuningCents };
}

// ── For graders: numbers only ─────────────────────────────────────────────────────────────────

/** What a grader gets back (numbers and chord names only; ms from the loop start). */
export function chordsReport(c: ChordsReading, lead: { from: "row" | "top-line"; notes: MelNote[] }, ms: number) {
  const r1 = (s: number) => Math.round(s * 10000) / 10;
  return {
    reader: c.reader, ms, bpm: c.bpm, bars: c.bars, steps: c.steps, register: c.register, tuningCents: c.tuningCents,
    cells: c.cells.map((x) => ({ bar: x.bar + 1, startStep: x.startStep, steps: x.steps, name: x.name, root: x.root, type: x.type, score: x.score, alternatives: x.alternatives.map((g) => ({ name: g.name, score: g.score })) })),
    events: c.events.map((e) => ({ tMs: r1(e.t), durMs: r1(e.dur), step: e.step, cell: e.cell, chord: c.cells[e.cell]?.name ?? "", struck: e.struck, held: e.held, vel: e.vel })),
    lead: { from: lead.from, notes: lead.notes.map((n) => ({ tMs: r1(n.t), durMs: r1(n.dur), midi: n.midi, vel: n.vel, step: n.step })) },
  };
}
export type ChordsReport = ReturnType<typeof chordsReport>;
