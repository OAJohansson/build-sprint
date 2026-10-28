// Make for drums (Phase 5, P3, P6–P8, L215, L216, L225): from the drum reader's three rows to what
// Make plays, measures and saves. Pure TS, run in Make's worker (jobs.ts) and in the unit tests.
// Only numbers come out of the original (C2): the hits, each row's level and hit shape, and a
// step-by-step report for the closeness score; the audio itself is read and dropped.
//
// - Rows: each hit's step, its offset in 16ths (swing kept) and velocity; a row of a few faint
//   hits on a mostly empty row is "doubtful" (bleed, L225): off in Mine until "Play anyway".
// - Suggest (P6): analysis by synthesis, like the bass's. The original row's hits are measured where
//   no other row's hit sits near them (band energy in 17 bands × 4 slices of the hit, plus the
//   kick's note and the hats' width); one hit is rendered per candidate knob setting and measured
//   the same way; a coordinate search keeps the closest. Gold ticks only: it never turns a knob.
// - Closeness (P8, 0–100): per row band, how the energy moves step by step (envelope) and where it
//   jumps (onsets), plus the overall band balance.
// - Save (P9): a row folded to its 1-, 2- or 4-bar repeat for the library.
import { band, correlation, stepEnergy } from "./closeness";
import { dB, fft, hann, toMono } from "./dsp";
import { DRUM_PRESETS, DRUM_ROWS, ROW_KNOBS, ROW_MIDI, clampDrumMacros, kickHz, renderDrumHits, type DrumKnobId, type DrumMacros, type DrumPresetId, type DrumRow } from "./drum-synth";
import { GATE, type DrumReading } from "./drums-read";
import { secondsPer16th, type MakeNote } from "./render";

// ── Rows ────────────────────────────────────────────────────────────────────────────────────────

/** One hit as Make plays it: `t` seconds after the loop's start, `off` in 16ths, `db` vs the loop's biggest hit. */
export type RowHit = { step: number; off: number; vel: number; t: number; db: number | null; faint: boolean };
export type DrumRowRead = { hits: RowHit[]; doubtful: boolean; why: string | null };
export type DrumsReading = { rows: Record<DrumRow, DrumRowRead>; steps: number; bars: number; gridMs: number; swingMs: number };

const BLEED_FROM: Record<DrumRow, string> = { kick: "the bass", clap: "the chords", hats: "another part" };
/** A hit this close (dB) above its row's gate counts as faint. */
// shortcut: "doubtful" = at most one hit per 2 bars and every hit within 8 dB of the row's gate (GATE.db, tuned on the spike's bench); re-tune once data-evals' real-track hand check says how bleed reads.
export const FAINT_DB = 8;

/** The reader's rows as Make plays them, with the doubtful rows marked (L225). */
export function drumsFromReading(r: DrumReading, bpm: number): DrumsReading {
  const sps = secondsPer16th(bpm), bars = Math.max(1, Math.round(r.steps / 16));
  const rows = {} as Record<DrumRow, DrumRowRead>;
  DRUM_ROWS.forEach((row, k) => {
    const hits = r.rows[row].map((h) => {
      const db = h.db ?? null;
      return { step: h.step, off: Math.round((h.offsetMs / 1000 / sps) * 1000) / 1000, vel: h.vel, t: Math.round((r.gridMs / 1000 + h.step * sps + h.offsetMs / 1000) * 100000) / 100000, db, faint: db !== null && db < GATE.db[k] + FAINT_DB };
    });
    const doubtful = hits.length > 0 && hits.length <= Math.max(1, Math.floor(bars / 2)) && hits.every((h) => h.faint);
    rows[row] = { hits, doubtful, why: doubtful ? `${hits.length} faint mark${hits.length === 1 ? "" : "s"}, probably ${BLEED_FROM[row]} bleeding through: off in Mine` : null };
  });
  return { rows, steps: r.steps, bars, gridMs: r.gridMs, swingMs: r.swingMs };
}

// ── Measuring one row's hits (Suggest's target) ─────────────────────────────────────────────────

const EDGES = [30, 60, 90, 130, 180, 250, 350, 500, 700, 1000, 1400, 2000, 2800, 4000, 5600, 8000, 11000, 16000];
const NB = EDGES.length - 1;
/** Slices of a hit (s after its start): the attack, its body, its ring, its tail. */
const SLICES: [number, number][] = [[0, 0.01], [0.01, 0.035], [0.035, 0.09], [0.09, 0.25]];
/** Each row's own band (Hz), for its level and the closeness envelopes (drums-read's ROW_BANDS). */
export const ROW_BAND: Record<DrumRow, [number, number]> = { kick: [30, 180], clap: [700, 5600], hats: [5600, 16000] };

/** Where each row's shape is measured from (Hz): a clap and hats often sit on a kick's tail (a clap
 *  on the beat in four-on-the-floor), so the kick's range would swamp their shape. */
export const SHAPE_FROM: Record<DrumRow, number> = { kick: 0, clap: 250, hats: 2000 };

/** Band energies (dB re their sum) of each slice of a hit at sample `a`, slices cut at `end` s,
 *  over the bands from `fromHz` up. */
function hitShape(x: Float32Array, a: number, end: number, rate: number, fromHz = 0): number[] {
  const out: number[] = [];
  for (const [s0, s1] of SLICES) {
    const from = a + Math.round(s0 * rate), to = a + Math.round(Math.min(s1, end) * rate);
    const e = new Array(NB).fill(0);
    if (s0 < end && to > from) {
      let n = 512; while (n < to - from) n <<= 1;
      const re = new Float64Array(n), im = new Float64Array(n), w = to - from, win = hann(w);
      for (let i = 0; i < w; i++) { const j = from + i; re[i] = j >= 0 && j < x.length ? x[j] * win[i] : 0; }
      fft(re, im);
      for (let k = 1; k <= n / 2; k++) {
        const f = (k * rate) / n;
        if (f < EDGES[0] || f >= EDGES[NB]) continue;
        let b = 0; while (b < NB - 1 && f >= EDGES[b + 1]) b++;
        e[b] += re[k] * re[k] + im[k] * im[k];
      }
    }
    out.push(...e.filter((_, b) => EDGES[b] >= fromHz));
  }
  const tot = out.reduce((s, v) => s + v, 0);
  return out.map((v) => Math.max(-60, Math.round(dB(v / (tot || 1)) * 10) / 10));
}

/** The kick's note: zero-crossing pitch of the low band 30–90 ms after the hit (null when unclear). */
function lowHz(low: Float32Array, a: number, end: number, rate: number): number | null {
  const s = a + Math.round(0.03 * rate), e = a + Math.round(Math.min(0.09, end) * rate);
  const ups: number[] = [];
  for (let i = Math.max(1, s); i < Math.min(e, low.length); i++) if (low[i - 1] < 0 && low[i] >= 0) ups.push(i);
  return ups.length >= 2 ? rate / ((ups[ups.length - 1] - ups[0]) / (ups.length - 1)) : null;
}

/** Side against mid (dB) over a hit's first `end` s: how wide it is. */
function sideDb(L: Float32Array, R: Float32Array, a: number, end: number, rate: number): number {
  let m = 0, s = 0;
  for (let i = a; i < Math.min(L.length, a + Math.round(end * rate)); i++) { const x = (L[i] + R[i]) / 2, y = (L[i] - R[i]) / 2; m += x * x; s += y * y; }
  return Math.max(-40, dB(s / (m || 1e-20)));
}

const median = (xs: number[]) => { const v = xs.filter(Number.isFinite).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : NaN; };

/** What Suggest aims at for one row: the median hit shape, its note (kick), width (hats) and the row's level. */
export type RowTarget = { shape: number[]; endS: number; hz: number | null; side: number | null; levelDb: number; n: number };

/** Each hit's level: RMS (dB) of the row's band over its first 50 ms, median over hits. */
function rowLevel(bandX: Float32Array, starts: number[], rate: number): number {
  const w = Math.round(0.05 * rate);
  return median(starts.map((a) => { let e = 0; for (let i = Math.max(0, a); i < Math.min(bandX.length, a + w); i++) e += bandX[i] * bandX[i]; return dB(e / w); }));
}

/** At most this many hits are measured per row (the clearest: no other row's hit near). */
const MAX_HITS = 12;

/** Suggest's targets and each row's level, measured on the looped drum part (numbers only). */
export function measureRows(left: Float32Array, right: Float32Array, rate: number, d: DrumsReading): Record<DrumRow, RowTarget | null> {
  const mono = toMono(left, right);
  const all = DRUM_ROWS.flatMap((row) => d.rows[row].hits.map((h) => ({ row, t: h.t })));
  const out = {} as Record<DrumRow, RowTarget | null>;
  const low = band(mono, rate, 30, 150);
  for (const row of DRUM_ROWS) {
    const hits = d.rows[row].hits;
    if (!hits.length) { out[row] = null; continue; }
    // How long a hit has before the next one of its row (the window every measure uses).
    const gaps = hits.map((h, i) => (hits[i + 1]?.t ?? h.t + 1) - h.t);
    const endS = Math.min(0.25, Math.max(0.04, median(gaps)));
    const clear = hits.filter((h) => all.every((o) => o.row === row || o.t < h.t - 0.03 || o.t > h.t + Math.min(endS, 0.09)));
    const pool = clear.length >= 3 ? clear : hits, every = Math.max(1, Math.ceil(pool.length / MAX_HITS));
    const use = pool.filter((_, i) => i % every === 0).slice(0, MAX_HITS);
    const starts = use.map((h) => Math.round(h.t * rate));
    const shapes = starts.map((a) => hitShape(mono, a, endS, rate, SHAPE_FROM[row]));
    const shape = shapes[0].map((_, i) => median(shapes.map((s) => s[i])));
    const levelDb = rowLevel(band(mono, rate, ...ROW_BAND[row]), hits.map((h) => Math.round(h.t * rate)), rate);
    out[row] = {
      shape, endS, n: use.length, levelDb: Math.round(levelDb * 10) / 10,
      hz: row === "kick" ? (median(starts.map((a) => lowHz(low, a, endS, rate) ?? NaN)) || null) : null,
      side: row === "hats" ? median(starts.map((a) => sideDb(left, right, a, endS, rate))) : null,
    };
  }
  return out;
}

/** How far a measured hit is from the target (lower = closer): band shape in dB, the kick's note, the hats' width. */
export function rowDistance(t: RowTarget, shape: number[], hz: number | null, side: number | null): number {
  let s = 0, w = 0;
  for (let i = 0; i < t.shape.length; i++) {
    const wi = Math.pow(10, t.shape[i] / 10) + 0.002;
    s += wi * Math.min(30, Math.abs(shape[i] - t.shape[i]));
    w += wi;
  }
  let d = s / w;
  if (t.hz && hz) d += 0.6 * Math.min(12, Math.abs(12 * Math.log2(hz / t.hz)));
  if (t.side !== null && side !== null) d += 0.08 * Math.min(30, Math.abs(side - t.side));
  return d;
}

/** One hit of a candidate sound, measured as the original's hits are. */
export function measureCandidate(preset: DrumPresetId, m: DrumMacros, t: RowTarget, rate = 44100) {
  const r = renderDrumHits(preset, m, [{ t: 0, vel: 1 }, { t: t.endS, vel: 0 }], { lenS: t.endS + 0.01, rate, wrap: false });
  const mono = toMono(r.left, r.right), row = DRUM_PRESETS[preset].row;
  return {
    shape: hitShape(mono, 0, t.endS, rate, SHAPE_FROM[row]),
    hz: row === "kick" ? lowHz(band(mono, rate, 30, 150), 0, t.endS, rate) : null,
    side: row === "hats" ? sideDb(r.left, r.right, 0, t.endS, rate) : null,
  };
}

export type DrumSuggestion = { macros: DrumMacros; distance: number; presetDistance: number; renders: number };
/** The pull towards the preset's own settings (per knob, per full-range move squared). */
export const DRUM_PRIOR = 2;

/**
 * Knob values for `preset` whose hit measures closest to the row's target ("Suggest for kick"):
 * a coarse sweep of each knob, then a finer one round the best, from the preset's own (or `start`).
 */
export function suggestDrum(t: RowTarget, preset: DrumPresetId, o: { start?: DrumMacros; rate?: number } = {}): DrumSuggestion {
  const ids = ROW_KNOBS[DRUM_PRESETS[preset].row], home = clampDrumMacros(preset, undefined);
  let renders = 0;
  const dist = (m: DrumMacros) => { renders++; const c = measureCandidate(preset, m, t, o.rate); return rowDistance(t, c.shape, c.hz, c.side); };
  const prior = (m: DrumMacros) => DRUM_PRIOR * ids.reduce((a, id) => a + ((m[id] ?? 0) - (home[id] ?? 0)) ** 2, 0);
  const presetDistance = dist(home);
  let best = clampDrumMacros(preset, { ...home, ...o.start });
  let bestCost = (o.start ? dist(best) : presetDistance) + prior(best);
  // The kick's note first: it is what the ear hears most, and the shape is measured on that note.
  const order: DrumKnobId[] = ids.includes("tune") ? ["tune", ...ids.filter((x) => x !== "tune")] : ids;
  for (const grid of [[0, 0.2, 0.4, 0.6, 0.8, 1], [-0.1, -0.05, 0.05, 0.1]]) {
    for (const id of order) {
      const base = best[id] ?? 0;
      for (const g of grid) {
        const v = grid.length === 6 ? g : Math.min(1, Math.max(0, base + g));
        if (Math.abs(v - (best[id] ?? 0)) < 1e-6) continue;
        const cand = { ...best, [id]: v };
        const c = dist(cand) + prior(cand);
        if (c < bestCost) { best = cand; bestCost = c; }
      }
    }
  }
  const out: DrumMacros = {};
  for (const id of ids) out[id] = Math.round((best[id] ?? 0) * 100) / 100;
  return { macros: out, distance: dist(out), presetDistance, renders };
}

/** The kick's note as the Mentor says it ("about 55 Hz"). */
export const tuneHz = (preset: DrumPresetId, m: DrumMacros) => Math.round(kickHz(preset, m.tune ?? 0.5));

// ── Closeness (P8) ──────────────────────────────────────────────────────────────────────────────

/** A drum loop measured for the closeness score: per row band, dB per 16th; and the band balance. */
export type DrumsReport = { steps: number[][]; spectrum: number[] };

export function drumsReport(left: Float32Array, right: Float32Array, rate: number, bpm: number): DrumsReport {
  const mono = toMono(left, right);
  const steps = DRUM_ROWS.map((row) => stepEnergy(band(mono, rate, ...ROW_BAND[row]), rate, bpm));
  // Band balance over the whole loop: power per band from 4096-point frames every ~93 ms.
  const n = 4096, e = new Array(NB).fill(0), w = hann(n), re = new Float64Array(n), im = new Float64Array(n);
  for (let a = 0; a + n <= mono.length; a += n) {
    for (let i = 0; i < n; i++) { re[i] = mono[a + i] * w[i]; im[i] = 0; }
    fft(re, im);
    for (let k = 1; k <= n / 2; k++) {
      const f = (k * rate) / n;
      if (f < EDGES[0] || f >= EDGES[NB]) continue;
      let b = 0; while (b < NB - 1 && f >= EDGES[b + 1]) b++;
      e[b] += re[k] * re[k] + im[k] * im[k];
    }
  }
  const tot = e.reduce((s, v) => s + v, 0);
  return { steps, spectrum: e.map((v) => Math.max(-60, Math.round(dB(v / (tot || 1)) * 10) / 10)) };
}

export type DrumsCloseness = { score: number; envelope: number[]; onsets: number[]; bandRmsDb: number };

/**
 * One drums closeness score, 0–100: 40 % how each row band's energy moves step by step (correlation
 * of the dB curves, floored 40 dB under the top), 30 % where it jumps (correlation of the step-to-step
 * rises: the onsets), both weighted by the original's energy in each band, and 30 % the band balance
 * (RMS of the per-band dB differences, weighted by where the original has energy; 0 dB → 1, 6 dB → 0.37).
 */
export function drumsCloseness(orig: DrumsReport, mine: DrumsReport): DrumsCloseness {
  const floor = (xs: number[]) => { const top = Math.max(...xs); return xs.map((v) => Math.max(v, top - 40)); };
  const rise = (xs: number[]) => xs.map((v, i) => (i ? Math.max(0, v - xs[i - 1]) : 0));
  const envelope = orig.steps.map((o, b) => Math.round(correlation(floor(o), floor(mine.steps[b] ?? [])) * 100) / 100);
  const onsets = orig.steps.map((o, b) => Math.round(correlation(rise(floor(o)), rise(floor(mine.steps[b] ?? []))) * 100) / 100);
  const mean = (xs: number[]) => dB(xs.reduce((a, v) => a + 10 ** (v / 10), 0) / Math.max(1, xs.length));
  const lv = orig.steps.map(mean), tot = dB(lv.reduce((a, v) => a + 10 ** (v / 10), 0));
  const wB = lv.map((v) => 10 ** ((v - tot) / 10));
  const wsum = wB.reduce((a, b) => a + b, 0) || 1;
  const env = envelope.reduce((a, c, b) => a + Math.max(0, c) * wB[b], 0) / wsum;
  const ons = onsets.reduce((a, c, b) => a + Math.max(0, c) * wB[b], 0) / wsum;
  const wS = orig.spectrum.map((v) => 10 ** (v / 10) + 0.002);
  const bandRmsDb = Math.round(Math.sqrt(orig.spectrum.reduce((a, v, i) => a + wS[i] * Math.min(30, Math.abs((mine.spectrum[i] ?? -60) - v)) ** 2, 0) / wS.reduce((a, b) => a + b, 0)) * 10) / 10;
  return { score: Math.round(100 * (0.4 * env + 0.3 * ons + 0.3 * Math.exp(-bandRmsDb / 6))), envelope, onsets, bandRmsDb };
}

// ── Mine over the loop ──────────────────────────────────────────────────────────────────────────

export type RowSound = { preset: DrumPresetId; macros: DrumMacros; on: boolean };

/**
 * Mine's three rows over one pass of the loop (`steps` 16ths from the grid's step 0), each row at the
 * original row's level when there is one (each row's band, median over its hits), summed. The
 * caller turns it by the grid's phase so the hits land where the original's do.
 */
export function renderDrumsMine(d: DrumsReading, sounds: Record<DrumRow, RowSound>, levels: Record<DrumRow, number | null>, bpm: number, rate: number) {
  const sps = secondsPer16th(bpm), lenS = d.steps * sps;
  const n = Math.max(1, Math.round(lenS * rate));
  const left = new Float32Array(n), right = new Float32Array(n);
  const gains = {} as Record<DrumRow, number | null>;
  for (const row of DRUM_ROWS) {
    const s = sounds[row], hits = d.rows[row].hits;
    gains[row] = null;
    if (!s.on || !hits.length) continue;
    const times = hits.map((h) => ({ t: (h.step + h.off) * sps, vel: h.vel }));
    const r = renderDrumHits(s.preset, s.macros, times, { lenS, rate, wrap: true });
    let g = 1;
    const target = levels[row];
    if (target !== null && Number.isFinite(target)) {
      const mineDb = rowLevel(band(toMono(r.left, r.right), rate, ...ROW_BAND[row]), times.map((x) => Math.round(x.t * rate)), rate);
      if (Number.isFinite(mineDb)) { const d = Math.max(-24, Math.min(24, target - mineDb)); g = Math.pow(10, d / 20); gains[row] = Math.round(d * 10) / 10; }
    }
    for (let i = 0; i < n; i++) { left[i] += r.left[i] * g; right[i] += r.right[i] * g; }
  }
  return { left, right, rate, gains };
}

// ── Saving a row (P9) ───────────────────────────────────────────────────────────────────────────

/** The repeat (1, 2 or 4 bars) a saved row keeps, from how well each folds the whole loop. */
export function foldRow(row: DrumRow, hits: Pick<RowHit, "step" | "off" | "vel">[], steps: number): { bars: 1 | 2 | 4; notes: MakeNote[] } {
  const by = new Map(hits.map((h) => [h.step, h]));
  const fold = (bars: 1 | 2 | 4) => {
    const P = bars * 16, reps = Math.max(1, Math.floor(steps / P));
    const notes: MakeNote[] = [];
    let err = 0;
    for (let p = 0; p < P; p++) {
      const here = Array.from({ length: reps }, (_, r) => by.get(r * P + p)).filter(Boolean) as Pick<RowHit, "off" | "vel">[];
      const keep = here.length * 2 >= reps && here.length > 0;
      err += keep ? reps - here.length : here.length;
      if (keep) {
        const off = median(here.map((h) => h.off)), vel = median(here.map((h) => h.vel));
        notes.push({ step: p, midi: ROW_MIDI[row], dur: 1, vel: Math.round(vel * 100) / 100, ...(Math.abs(off) >= 0.005 ? { off: Math.round(Math.max(-0.5, Math.min(0.5, off)) * 100) / 100 } : {}) });
      }
    }
    return { bars, notes, err };
  };
  const options = ([1, 2, 4] as const).filter((b) => b === 1 || steps >= b * 16).map(fold);
  const best = Math.min(...options.map((o) => o.err));
  // The shortest repeat that misses at most a few more hits than the best one.
  const pick = options.find((o) => o.err <= best + Math.max(1, 0.03 * hits.length))!;
  return { bars: pick.bars, notes: pick.notes };
}
