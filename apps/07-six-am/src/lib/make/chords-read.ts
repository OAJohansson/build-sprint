// Phase 6 spike (K2, K3, L251): chord NAMES per bar from the looped "other" part, not every note.
// Two readers give the same output (ChordsReading), so data-evals can grade them side by side:
//
// - A, "dsp" (readChords): a chroma vector (energy per pitch class, 100 Hz–2 kHz) per 16th, summed per
//   bar, with the lowest strong note of each frame counted again for the root and the notes that rise
//   at a strike counted again (L256); named in two steps, a triad (maj, m, sus2, sus4, dim) first,
//   then a 7th (7, maj7, m7) only if it stands out (L256, rankChords), a little in favour of the key;
//   a loop that repeats every 1, 2 or 4 bars is blended with its repeats and a short smoothing keeps
//   a 3–4 chord loop a loop. A bar gets two chords only when its halves clearly differ. Chord times
//   are the onset reader's (notes-read.ts loopAttacks, ~25 ms in Phase 5) where the pitched band rises
//   with a strike's shape (U-1: a pumped or tremolo pad is one held chord, not a strike per beat).
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
import { NOTE_FFT, framePitches, loopAttacks, type ReadNote } from "./notes-read";

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

export type ChordGuess = { name: string; root: number; type: ChordType; score: number };
/** One cell of the chord grid: a bar, or half a bar when the chord clearly changes inside it. `name` "" = no chord heard. */
export type ChordCell = { bar: number; startStep: number; steps: number; name: string; root: number | null; type: ChordType | null; score: number; alternatives: ChordGuess[] };
/** One chord as the part plays it: start and length in seconds in the loop, its cell, struck (a stab) or held (a pad). */
export type ChordEvent = { t: number; dur: number; step: number; off: number; cell: number; struck: boolean; held: boolean; vel: number };
export type ChordsReader = "dsp" | "basic-pitch";
export type ChordsReading = { reader: ChordsReader; bpm: number; steps: number; bars: number; register: number; tuningCents: number; cells: ChordCell[]; events: ChordEvent[] };
type Key = { key: string; scale: Scale };

// shortcut: weights (root 0.15, out of key 0.02 per triad tone, change 0.05, loop blend 0.5, split margin 0.1, half energy −20 dB, silent −30 dB; L256: 3rd gate 0.3, sus 0.04, 7th 0.2 of the triad and 2× the noise, 7th +0.005 / −0.03, struck ×2; U-2/CH-7: sus/dim margin 0.05 over another root's triad, dim −0.04, a strike counts only with 2+ pitch classes rising) picked by reasoning and modelled fixtures (chords-fixture.ts), not fitted on real parts; re-grade on the real loops (data-evals) before trusting them.
export const CHORD_OPT = {
  rootW: 0.15, keyW: 0.02, changeCost: 0.05, loopBlend: 0.5, loopSim: 0.9, splitMargin: 0.1, splitEnergy: 0.01, silentDb: -30, alternatives: 6,
  // L256 (CH-1): the type is chosen in two steps, a triad first, then a 7th only when it stands out.
  thirdGate: 0.3, susW: 0.04, sevenRel: 0.2, sevenNoise: 2, sevenEdge: 0.03, sevenUp: 0.005,
  // U-2, CH-7: a sus or dim must beat a major/minor triad on another root sharing two of its notes by this much; dim, like sus, a little under anyway.
  rareMargin: 0.05, dimW: 0.04,
  // CH-7: a strike counts extra only when at least this many pitch classes rise together (a chord, not a lead note).
  struckPcs: 2,
  // L256 (CH-2): a step with a strike counts this much more than sustained bleed (1 = twice).
  struckW: 2,
};

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

const TRIADS: ChordType[] = ["maj", "min", "sus2", "sus4", "dim"];
const median = (v: number[]) => { const q = [...v].sort((x, y) => x - y); return q.length ? q[q.length >> 1] : 0; };

/**
 * Every chord ranked for a chroma vector (12 numbers, C first), in two steps (L256, CH-1):
 *
 * 1. Triads (maj, m, sus2, sus4, dim) by cosine to their 3-note template, plus the share of the low
 *    notes on the root (`bass`), less a little per triad tone outside the key. So a 4-note chord can't
 *    take the root from the triad inside it (CH-2: Fm read as D♭maj7) and a quiet 4th tone doesn't
 *    lose to cosine's bias for smaller templates (CH-1: G7 read as G).
 * 2. Colour, per root: a sus chord ranks under that root's major or minor whenever a 3rd is clearly
 *    there (a loud 9th made B♭m read B♭sus2), and a little under them anyway; a 7th (♭7 on a major
 *    or minor triad, 7 on a major) ranks above its triad only when it stands out: at least a quarter
 *    of the triad's mean, twice the median of the other non-chord tones, and above the other 7th.
 *    Otherwise it ranks just under. The out-of-key penalty never counts the 7th (a V7 in a minor key,
 *    a G7 on a G-major map).
 */
export function rankChords(chroma: number[], bass?: number[], key?: Key): ChordGuess[] {
  const norm = Math.hypot(...chroma);
  if (!(norm > 0)) return [];
  const bSum = bass ? bass.reduce((a, b) => a + b, 0) : 0;
  const inKey = keyPcs(key);
  const O = CHORD_OPT;
  const out: ChordGuess[] = [];
  const push = (root: number, type: ChordType, score: number) => out.push({ name: chordName(root, type), root, type, score: Math.round(score * 1000) / 1000 });
  const triads: Record<ChordType, number>[] = [];
  for (let root = 0; root < 12; root++) {
    const c = (i: number) => chroma[mod12(root + i)];
    const rootShare = bSum > 0 ? bass![root] / bSum : 0;
    const tri = {} as Record<ChordType, number>;
    for (const type of TRIADS) {
      const iv = CHORD_TYPES[type].iv;
      const cos3 = iv.reduce((a, i) => a + c(i), 0) / (norm * Math.sqrt(iv.length));
      const outKey = inKey ? iv.filter((i) => !inKey.has(mod12(root + i))).length : 0;
      tri[type] = cos3 + O.rootW * rootShare - O.keyW * outKey;
    }
    const third = Math.max(c(3), c(4)), ref = (c(0) + c(7)) / 2, best3 = Math.max(tri.maj, tri.min);
    for (const sus of ["sus2", "sus4"] as const) tri[sus] = third >= O.thirdGate * ref ? Math.min(tri[sus] - O.susW, best3 - O.sevenEdge) : tri[sus] - O.susW;
    tri.dim -= O.dimW; // a diminished triad is as rare in house as a sus (CH-7)
    triads[root] = tri;
  }
  // U-2, CH-7: a sus or dim names the notes only when no major or minor triad on another root explains
  // two of its three notes about as well: a minor chord's added 9th next to the root a half bar before
  // read Fm as B♭sus2, and a lead note a minor 3rd under the root read B♭m as Gdim. Within `rareMargin`
  // of such a triad, it ranks just under it (still an alternative).
  for (let root = 0; root < 12; root++) {
    const tri = triads[root];
    for (const type of ["sus2", "sus4", "dim"] as const) {
      const pcs = CHORD_TYPES[type].iv.map((i) => mod12(root + i));
      let rival = -Infinity;
      for (let r2 = 0; r2 < 12; r2++) for (const t2 of ["maj", "min"] as const) {
        if (r2 === root) continue;
        const shared = CHORD_TYPES[t2].iv.filter((i) => pcs.includes(mod12(r2 + i))).length;
        if (shared >= 2) rival = Math.max(rival, triads[r2][t2]);
      }
      if (tri[type] < rival + O.rareMargin) tri[type] = Math.min(tri[type], rival - O.sevenEdge);
    }
  }
  for (let root = 0; root < 12; root++) {
    const c = (i: number) => chroma[mod12(root + i)];
    const tri = triads[root];
    for (const type of TRIADS) push(root, type, tri[type]);
    for (const [base, sevenths] of [["maj", [[10, "7"], [11, "maj7"]]], ["min", [[10, "m7"]]]] as const) {
      const iv = CHORD_TYPES[base].iv, mean = iv.reduce((a, i) => a + c(i), 0) / iv.length;
      const others = [1, 2, 3, 4, 5, 6, 8, 9].filter((i) => !(iv as readonly number[]).includes(i)).map(c);
      const floor = median(others);
      for (const [ext, type] of sevenths) {
        const s = c(ext), clear = s >= O.sevenRel * mean && s >= O.sevenNoise * floor && s >= c(ext === 10 ? 11 : 10);
        push(root, type, tri[base] + (clear ? O.sevenUp : -O.sevenEdge));
      }
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
export type StepHarmony = { chroma: number[][]; bass: number[][]; energy: number[]; struck?: number[] };

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
  // L256 (CH-2): at a strike, the notes that rose (this step's chroma less the one two steps before,
  // as a ~186 ms frame already hears an attack a step early) count again, `struckW` times. A pad or
  // bleed that sounds under the stabs never rises, so it can't take the root from them. Bass weighs
  // struck steps the same way. No strikes (a pad loop): unchanged.
  // CH-7: only a chord's strike counts extra, where at least two pitch classes rise together (each by a
  // quarter of the biggest rise); a lead's single note struck over a held chord doesn't, so a brief high
  // note can't outweigh the chord it sits on.
  const rise = h.chroma.map((v, s) => { const p = h.chroma[(s - 2 + steps) % steps]; return v.map((x, i) => Math.max(0, x - p[i])); });
  const chordStrike = (s: number) => { const top = Math.max(...rise[s]); return top > 0 && rise[s].filter((d) => d >= 0.25 * top).length >= CHORD_OPT.struckPcs; };
  const st = (s: number) => (chordStrike(s) ? Math.min(1, h.struck?.[s] ?? 0) : 0);
  const chromaW = h.chroma.map((v, s) => { const k = st(s); return k ? v.map((x, i) => x + CHORD_OPT.struckW * k * rise[s][i]) : v; });
  const bassW = h.bass.map((v, s) => { const k = st(s); return k ? v.map((x) => x * (1 + CHORD_OPT.struckW * k)) : v; });
  const sum = (a: number, b: number, f: (s: number) => number[]) => { let v = zeros(); for (let s = a; s < Math.min(b, steps); s++) v = add(v, f(s)); return v; };
  const energyOf = (a: number, b: number) => { let e = 0; for (let s = a; s < Math.min(b, steps); s++) e += h.energy[s]; return e; };
  const barE = Array.from({ length: bars }, (_, b) => energyOf(b * 16, b * 16 + 16));
  const loud = Math.max(1e-20, ...barE);
  const silent = (e: number) => 10 * Math.log10(e / loud + 1e-20) < CHORD_OPT.silentDb;
  const barChroma = loopBlend(Array.from({ length: bars }, (_, b) => sum(b * 16, b * 16 + 16, (s) => chromaW[s])));
  const barBass = Array.from({ length: bars }, (_, b) => sum(b * 16, b * 16 + 16, (s) => bassW[s]));
  type Raw = { bar: number; startStep: number; steps: number; ranked: ChordGuess[] };
  const raw: Raw[] = [];
  for (let b = 0; b < bars; b++) {
    if (silent(barE[b])) { raw.push({ bar: b, startStep: b * 16, steps: 16, ranked: [] }); continue; }
    const whole = rankChords(barChroma[b], barBass[b], key);
    const halves = [0, 8].map((o) => ({ o, e: energyOf(b * 16 + o, b * 16 + o + 8), r: rankChords(sum(b * 16 + o, b * 16 + o + 8, (s) => chromaW[s]), sum(b * 16 + o, b * 16 + o + 8, (s) => bassW[s]), key) }));
    const top = whole[0]?.name;
    // U-2: a bar that reads as a sus (or dim) while its halves read two different major/minor chords is
    // those two chords blended (B♭m then Fm made B♭ C F), so it splits without the margin.
    const rare = (t?: ChordType) => t === "sus2" || t === "sus4" || t === "dim";
    const blend = rare(whole[0]?.type) && halves.every((x) => x.r.length && !rare(x.r[0].type) && x.r[0].score > (x.r.find((g) => g.name === top)?.score ?? 0));
    const differs = halves.every((x) => x.r.length && x.e >= CHORD_OPT.splitEnergy * barE[b]) && halves[0].r[0].name !== halves[1].r[0].name &&
      (blend || halves.some((x) => x.r[0].name !== top && x.r[0].score - (x.r.find((g) => g.name === top)?.score ?? 0) >= CHORD_OPT.splitMargin));
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
export type Onset = { t: number; vel: number; end: number; steep?: number };

/**
 * Chord events from onsets and cells (L251): every onset starts the chord of the cell it falls in (a
 * stab up to half a 16th early belongs to the next cell). A cell with no onset of its own (a pad) is
 * held from its start, unless a chord of the same name still sounds there (a pad held over two bars
 * stays one chord, H3). An event lasts until the part stops sounding it, the next event, the end of
 * its cell when the next cell's chord differs, or the loop's end; it is held when that is 1.5 beats or more.
 */
export function eventsFromOnsets(onsets: Onset[], cells: ChordCell[], bpm: number, steps: number, held?: boolean[]): ChordEvent[] {
  const sps = 60 / bpm / 4, loopS = steps * sps;
  // H3, N-1: in a held cell (heldCells) only a clear strike starts a chord; swells and pumps don't.
  const heldCell = (k: number) => !!held?.[k];
  const cellAt = (t: number) => { const s = t / sps + 0.5; let k = -1; cells.forEach((c, i) => { if (s >= c.startStep && s < c.startStep + c.steps) k = i; }); return k; };
  const evs: { t: number; vel: number; end: number; cell: number; struck: boolean }[] = [];
  for (const o of [...onsets].sort((a, b) => a.t - b.t)) {
    // Attacks just before the loop's start are the loop's end read round (it has its own copy of them).
    if (o.t < -0.012 || o.t >= loopS) continue;
    const t = Math.max(0, o.t), k = cellAt(t);
    if (k < 0 || !cells[k].name) continue;
    if (heldCell(k) && !((o.steep ?? Infinity) >= HELD_OPT.keepDb)) continue;
    evs.push({ t, vel: o.vel, end: o.end, cell: k, struck: true });
  }
  // Same chord without a break: every cell from `a` to `b` carries the name (a held chord spans them).
  const sameRun = (a: number, b: number) => { for (let j = a; j <= b; j++) if (cells[j].name !== cells[b].name) return false; return true; };
  cells.forEach((c, i) => {
    if (!c.name) return;
    const t0 = c.startStep * sps, cellEnd = (c.startStep + c.steps) * sps;
    // A held cell gets its chord at its line (N-1: a soft pad's change, not a later swell), unless a
    // strike already starts it; a struck cell only when it has no onset of its own (as before).
    if (heldCell(i) ? evs.some((e) => e.cell === i && e.t <= t0 + 0.5 * sps) : evs.some((e) => e.struck && e.cell === i)) return;
    const sounding = evs.find((e) => e.t < t0 && e.end >= t0 - 0.05 && e.cell < i && sameRun(e.cell, i) && !evs.some((q) => q.t > e.t && q.t < t0));
    if (sounding) { if (!sounding.struck || heldCell(i)) sounding.end = Math.max(sounding.end, cellEnd); return; }
    evs.push({ t: t0, vel: 0.8, end: cellEnd, cell: i, struck: false });
  });
  evs.sort((a, b) => a.t - b.t);
  return evs.map((e, i) => {
    const next = evs[i + 1]?.t ?? loopS;
    const cellEnd = (cells[e.cell].startStep + cells[e.cell].steps) * sps;
    const changesAfter = !!cells[e.cell + 1] && cells[e.cell + 1].name !== cells[e.cell].name;
    const stop = Math.min(next, loopS, Math.max(e.end, e.t + 0.03), changesAfter ? Math.max(cellEnd, e.t + 0.03) : Infinity);
    const dur = Math.max(0.03, stop - e.t), step = Math.round(e.t / sps);
    const held = dur >= 6 * sps || (heldCell(e.cell) && !e.struck);
    return { t: Math.round(e.t * 10000) / 10000, dur: Math.round(dur * 10000) / 10000, step: step % steps, off: Math.round((e.t / sps - step) * 1000) / 1000, cell: e.cell, struck: e.struck && !held, held, vel: Math.round(e.vel * 100) / 100 };
  });
}

// shortcut: held cell (H3, N-1: the part's 400–3000 Hz level over the cell: lower quartile ≥ −15 dB and median ≥ −9 dB of its 95th percentile, and at most one strike of ≥ 6 dB in 20 ms per half bar; inside it only a ≥ 9 dB strike starts a new event) picked on modelled pads, tremolo, pumped and ringing stabs (chords-fixture.ts); re-grade H2/H3 on real loops before trusting it.
export const HELD_OPT = { lowDb: -15, midDb: -9, countDb: 6, perSteps: 8, keepDb: 9 };

/**
 * Which cells the part holds (H3, N-1), decided per cell, not per onset: the part keeps sounding
 * through the cell (its level never falls far: a pump's dips and a swell's troughs are short or
 * shallow, a stab's decay is not) and at most one clear strike per half bar lands in it (a ringing
 * stab struck again and again sounds on too, but is struck every beat). A held cell plays as one held
 * chord from its line; only clear strikes inside it start a new event.
 */
export function heldCells(cells: ChordCell[], onsets: Onset[], at: (t: number) => number, bpm: number): boolean[] {
  const sps = 60 / bpm / 4, O = HELD_OPT;
  return cells.map((c) => {
    if (!c.name) return false;
    const t0 = c.startStep * sps, t1 = (c.startStep + c.steps) * sps, v: number[] = [];
    for (let t = t0; t < t1; t += 0.0029) v.push(at(t));
    if (v.length < 8) return false;
    v.sort((a, b) => a - b);
    const q = (p: number) => v[Math.floor(p * (v.length - 1))], top = q(0.95);
    const clear = onsets.filter((o) => o.t >= t0 - 0.5 * sps && o.t < t1 - 0.5 * sps && (o.steep ?? Infinity) >= O.countDb).length;
    return q(0.25) >= top + O.lowDb && q(0.5) >= top + O.midDb && clear <= Math.max(1, Math.floor(c.steps / O.perSteps));
  });
}

// ── Reader A: DSP chroma ───────────────────────────────────────────────────────────────────────

const NF = NOTE_FFT; // the note reader's frame: at ~11 kHz, 186 ms, 5.4 Hz bins
// Fundamentals from G2 (98 Hz, under it is the bass's bleed) up; the estimate looks up to ~1.4 kHz and
// uses harmonics up to ~2 kHz and beyond. −42 dB floor as the note reader.
const LO_MIDI = 43, HI_MIDI = 96, FLOOR_DB = -42;
// shortcut: onset filter (mark ≥ 0.15, pitched band 100–1200 Hz up ≥ 3 dB, within 30 dB of the loudest, sounds until 12 dB down) picked by reasoning; check against the real stab labels.
export const ONSET_OPT = { mark: 0.15, riseDb: 3, floorDb: -30, decayDb: 12, bandLo: 100, bandHi: 1200 };
// shortcut: strike test (U-1: 400–3000 Hz on 23 ms frames; ≥ 6 dB in 20 ms, or ≥ 3 dB in 20 ms that is ≥ 70 % of the whole rise; dips up to 250 ms bridged) picked on modelled pumped pads, tremolo and stabs (chords-fixture.ts), not fitted on real parts; re-grade H2/H3 on real loops (data-evals) before trusting it.
export const STRIKE_OPT = { bandLo: 400, bandHi: 3000, fft: 256, steepDb: 6, minDb: 3, share: 0.7, riseS: 0.02, lookS: 0.1, bridgeS: 0.25 };

/**
 * The attack shape of a rise in the part's pitched band (U-1, H3): `steep`, the most it climbs in 20 ms
 * around `t`; `share`, that as a part of the whole climb from the lowest point since the previous
 * candidate (at most 100 ms back) to the peak just after. A struck chord, even one struck again while it
 * rings, gets most of its rise in a few ms; a sidechain pump climbs back over 100–300 ms and a tremolo or
 * LFO swells as slowly as it fades, so their 20 ms share stays small.
 */
export function attackShape(at: (t: number) => number, t: number, prevT: number) {
  const O = STRIKE_OPT, d = 0.0029;
  let steep = -Infinity, post = -Infinity, low = Infinity;
  for (let c = -O.riseS; c <= 0.03 + 1e-9; c += d) steep = Math.max(steep, at(t + c) - at(t + c - O.riseS));
  for (let c = 0; c <= 0.07 + 1e-9; c += d) post = Math.max(post, at(t + c));
  for (let c = Math.max(-O.lookS, prevT - t + 0.01); c <= 1e-9; c += d) low = Math.min(low, at(t + c));
  const whole = post - (Number.isFinite(low) ? low : at(t));
  return { steep, share: steep / Math.max(0.5, whole) };
}
export const isStrike = (a: { steep: number; share: number }) => a.steep >= STRIKE_OPT.steepDb || (a.steep >= STRIKE_OPT.minDb && a.share >= STRIKE_OPT.share);

/**
 * Harmony per 16th of a looped part (the loop read round, so the first bar's window sees the last).
 * Chroma from each frame's fundamentals, not its raw peaks: a stab's own harmonics (the 3rd, 5th and
 * 7th partials land on other note names) are cancelled by the note reader's greedy estimate
 * (framePitches, notes-read.ts), so a C over a G bass doesn't read as G7.
 */
export function harmonyOf(x: Float32Array, r: number, bpm: number): StepHarmony & { register: number; tuningCents: number } {
  const sps = 60 / bpm / 4, steps = Math.max(1, Math.floor(x.length / r / sps + 0.01));
  const hop = Math.round(r * 0.0232), frames = Math.floor(x.length / hop);
  const w = hann(NF), re = new Float64Array(NF), im = new Float64Array(NF);
  const mags: Float64Array[] = [];
  let loud = 0;
  for (let f = 0; f < frames; f++) {
    const at = f * hop - NF / 2;
    for (let i = 0; i < NF; i++) { const j = ((at + i) % x.length + x.length) % x.length; re[i] = x[j] * w[i]; im[i] = 0; }
    fft(re, im);
    const m = new Float64Array(NF / 2 + 1);
    for (let k = 0; k <= NF / 2; k++) { m[k] = Math.hypot(re[k], im[k]); if (m[k] > loud) loud = m[k]; }
    mags.push(m);
  }
  const floor = loud * Math.pow(10, FLOOR_DB / 20);
  const per = mags.map((m) => framePitches(m, r, floor));
  // Tuning: the median offset of the fundamentals from equal temperament.
  const devs = per.flat().map(([m]) => m - Math.round(m)).sort((p, q) => p - q);
  const tune = devs.length ? devs[devs.length >> 1] : 0;
  const chroma = Array.from({ length: steps }, zeros), bass = Array.from({ length: steps }, zeros), energy = new Array(steps).fill(0);
  let regW = 0, regS = 0;
  for (let f = 0; f < frames; f++) {
    const s = Math.floor((f * hop) / r / sps) % steps;
    const ps = per[f].map(([m, a]) => ({ midi: Math.round(m - tune), amp: a })).filter((p) => p.midi >= LO_MIDI && p.midi <= HI_MIDI);
    if (!ps.length) continue;
    let top = 0;
    for (const p of ps) { chroma[s][mod12(p.midi)] += Math.sqrt(p.amp); energy[s] += p.amp * p.amp; top = Math.max(top, p.amp); }
    // The root: the lowest strong note in the frame, counted again. CH-7: when the only strong note is a
    // lead on top of quieter notes still sounding (a tenth of it or more), the lowest of those is the low note.
    const strong = ps.filter((p) => p.amp >= 0.3 * top).sort((p, q) => p.midi - q.midi);
    const under = strong.length === 1 ? ps.filter((p) => p.midi < strong[0].midi && p.amp >= 0.1 * top).sort((p, q) => p.midi - q.midi) : [];
    const low = under[0] ?? strong[0];
    if (low) { const v = Math.sqrt(low.amp); bass[s][mod12(low.midi)] += v; regW += v; regS += v * low.midi; }
  }
  // The register: the low note (a chord's bottom) plus half a closed voicing's span, so voiceChord puts
  // the voicing's root about where the original's is.
  return { chroma, bass, energy, register: regW ? Math.round(regS / regW + 5.5) : 60, tuningCents: Math.round(tune * 100) };
}

/** A band's level (dB) of a looped part on `n`-point frames, smoothed over ±2 hops, read round at any time. */
export function bandLevel(x: Float32Array, r: number, n: number, hop: number, lo: number, hi: number) {
  const { frames, bins, p } = powerSpec(x, n, hop);
  const kLo = Math.ceil((lo * n) / r), kHi = Math.floor((hi * n) / r);
  const env = new Float64Array(frames);
  for (let f = 0; f < frames; f++) { let e = 0; for (let k = kLo; k <= kHi; k++) e += p[f * bins + k]; env[f] = 10 * Math.log10(e + 1e-20); }
  const sm = new Float64Array(frames), W = 2, wrap = (f: number) => ((f % frames) + frames) % frames;
  for (let f = 0; f < frames; f++) { let s = 0; for (let j = f - W; j <= f + W; j++) s += env[wrap(j)]; sm[f] = s / (2 * W + 1); }
  return { frames, sm, at: (t: number) => (frames ? sm[wrap(Math.round((t * r) / hop))] : -200) };
}

/**
 * Onsets of a looped part where its pitched band rises (the attack reader's marks, timed by its finer
 * curve), kept only where the rise has a strike's shape (U-1, attackShape): a pad under a sidechain pump,
 * a tremolo or an LFO is one sounding chord, not a strike on every beat. An onset sounds until the band
 * falls 12 dB; a dip that comes back within 250 ms without a strike (the pump's) doesn't end it.
 */
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
  const cands: { t: number; s: number; after: number }[] = [];
  const loopEnd = x.length / r;
  for (const m of marks) {
    if (m.s < ONSET_OPT.mark) continue;
    const after = maxIn(m.t + 0.005, m.t + 0.06);
    // At the loop's start the 50 ms before it are the loop's end (it plays round).
    const before = m.t > 0.05 ? minIn(m.t - 0.05, m.t - 0.003) : Math.min(minIn(loopEnd - (0.05 - m.t), loopEnd), m.t > 0.006 ? minIn(0, m.t - 0.003) : Infinity);
    if (after - before < ONSET_OPT.riseDb || after < peak + ONSET_OPT.floorDb) continue;
    let fb: { t: number; s: number } | null = null;
    for (const q of fine) if (Math.abs(q.t - m.t) <= 0.02 && (!fb || q.s > fb.s)) fb = q;
    cands.push({ t: fb ? fb.t : m.t, s: m.s, after });
  }
  cands.sort((a, b) => a.t - b.t);
  // U-1: the strike test, on its own finer band level (23 ms frames, above the kick's body).
  const lv = bandLevel(x, r, STRIKE_OPT.fft, hop, STRIKE_OPT.bandLo, STRIKE_OPT.bandHi);
  const kept = cands.map((c, i) => ({ ...c, shape: attackShape(lv.at, c.t, i ? cands[i - 1].t : cands.length > 1 ? cands[cands.length - 1].t - loopEnd : -Infinity) })).filter((c) => isStrike(c.shape));
  const bridge = Math.round((STRIKE_OPT.bridgeS * r) / hop);
  return kept.map((c, i) => {
    // Sounds until the band falls 12 dB under its level just after the onset; a dip that climbs back
    // within 250 ms with no strike in it (a sidechain pump) doesn't end it (U-1).
    const nextF = i + 1 < kept.length ? fr(kept[i + 1].t) - 3 : frames - 1, thr = c.after - ONSET_OPT.decayDb;
    let f = fr(c.t + 0.06);
    for (;;) {
      while (f < frames - 1 && sm[f] > thr) f++;
      if (f >= frames - 1) break;
      let g = f + 1;
      while (g < Math.min(frames - 1, f + bridge, nextF) && sm[g] <= thr) g++;
      if (g < Math.min(frames - 1, f + bridge, nextF) && sm[g] > thr) { f = g; continue; }
      break;
    }
    return { t: c.t, vel: Math.min(1, 0.4 + 0.6 * c.s), end: (f * hop) / r, steep: Math.round(c.shape.steep * 10) / 10 };
  });
}

/** Reader A: chord names per bar of a looped mono-or-stereo "other" part, with their times (numbers only). */
export function readChords(left: Float32Array, right: Float32Array | undefined, rate: number, bpm: number, key?: Key): ChordsReading {
  const mono = toMono(left, right);
  const dec = Math.max(1, Math.round(rate / 11025));
  const x = decimate(mono, dec), r = rate / dec;
  const sps = 60 / bpm / 4, steps = Math.max(1, Math.floor(x.length / r / sps + 0.01)), bars = Math.max(1, Math.round(steps / 16));
  if (x.length < r * 0.5) return { reader: "dsp", bpm, steps, bars, register: 60, tuningCents: 0, cells: [], events: [] };
  const h = harmonyOf(x, r, bpm);
  const onsets = chordOnsets(x, r);
  // The strikes per 16th (L256): the step an onset falls in, at its strength, weighs the notes it starts.
  const struck = new Array(h.energy.length).fill(0);
  for (const o of onsets) { const s = Math.floor(Math.max(0, o.t) / sps) % struck.length; struck[s] = Math.max(struck[s], o.vel); }
  const cells = cellsFromHarmony({ ...h, struck }, key);
  const hop = Math.max(1, Math.round(r * 0.0029));
  const lv = bandLevel(x, r, STRIKE_OPT.fft, hop, STRIKE_OPT.bandLo, STRIKE_OPT.bandHi);
  const events = eventsFromOnsets(onsets, cells, bpm, steps, heldCells(cells, onsets, lv.at, bpm));
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
