// How close Mine sounds to the original part (owner, 27 Oct: "still too thin, not that boom boom
// boom"). Band shares alone weren't enough, so this measures what the ear follows, as numbers only
// (the audio is read in memory and dropped, L143):
// - per 16th step, the energy in four bands (sub 30–60, low 60–120, body 120–400, high > 400 Hz):
//   where the boom sits in time;
// - per note, the attack (to the low band's peak), the low band's decay, and the low band's pitch
//   drop over the first 60 ms (every onset, on the beat too: the F1 fix skipped those);
// - a 1/3-octave spectrum, 31.5 Hz–2 kHz, each band in dB re the total;
// - loudness as RMS and LUFS.
// `closeness` turns two reports into one score (0–100). Pure; tested in closeness.test.ts.
import { lufs, rmsDb } from "./level";
import { secondsPer16th } from "./render";

export const BANDS = [[30, 60], [60, 120], [120, 400], [400, 8000]] as const;
export const BAND_NAMES = ["sub 30–60", "low 60–120", "body 120–400", "high >400"] as const;
export const THIRDS = [31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000];

type Bq = [number, number, number, number, number];
const lp = (f: number, rate: number, q = Math.SQRT1_2): Bq => { const w = Math.tan((Math.PI * f) / rate), n = 1 / (1 + w / q + w * w); return [w * w * n, 2 * w * w * n, w * w * n, 2 * (w * w - 1) * n, (1 - w / q + w * w) * n]; };
const hp = (f: number, rate: number, q = Math.SQRT1_2): Bq => { const w = Math.tan((Math.PI * f) / rate), n = 1 / (1 + w / q + w * w); return [n, -2 * n, n, 2 * (w * w - 1) * n, (1 - w / q + w * w) * n]; };
const bp = (f: number, rate: number, q: number): Bq => { const w0 = (2 * Math.PI * f) / rate, al = Math.sin(w0) / (2 * q), a0 = 1 + al; return [al / a0, 0, -al / a0, (-2 * Math.cos(w0)) / a0, (1 - al) / a0]; };
function run(x: Float32Array, fs: Bq[]): Float32Array {
  let y = x;
  for (const [b0, b1, b2, a1, a2] of fs) {
    const o = new Float32Array(y.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < y.length; i++) { const v = b0 * y[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = y[i]; y2 = y1; y1 = v; o[i] = v; }
    y = o;
  }
  return y;
}
const db = (e: number) => 10 * Math.log10(e + 1e-14);
const median = (xs: number[]) => { const s = xs.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

/** A band-limited copy of a mono signal (4th-order edges). */
export function band(mono: Float32Array, rate: number, lo: number, hi: number): Float32Array {
  return run(mono, [hp(lo, rate), hp(lo, rate), ...(hi < rate / 2.2 ? [lp(hi, rate), lp(hi, rate)] : [])]);
}

/** Energy (dB) per 16th step of a mono signal at `bpm`. */
export function stepEnergy(x: Float32Array, rate: number, bpm: number): number[] {
  const S = secondsPer16th(bpm) * rate, steps = Math.floor(x.length / S + 0.01);
  return Array.from({ length: steps }, (_, k) => {
    let e = 0; const a = Math.round(k * S), b = Math.min(x.length, Math.round((k + 1) * S));
    for (let i = a; i < b; i++) e += x[i] * x[i];
    return Math.round(db(e / Math.max(1, b - a)) * 10) / 10;
  });
}

export type NoteShape = { attackMs: number; decayMs: number; lowDropSemis: number };
export type LoopReport = {
  /** Per band (BANDS), dB per 16th step. */
  steps: number[][];
  /** 1/3-octave bands (THIRDS), dB re the total over those bands. */
  spectrum: number[];
  /** Medians over the notes, and the same for notes on the beat / off the beat. */
  notes: NoteShape; onBeat: NoteShape | null; offBeat: NoteShape | null;
  rmsDb: number; lufs: number;
};

/** The low band's (30–120 Hz) attack, decay and early pitch fall at one onset. */
function noteShape(low: Float32Array, lowLp: Float32Array, rate: number, a: number, end: number): NoteShape | null {
  const W = Math.round(rate * 0.005);
  if (end - a < W * 4) return null;
  let pk = -Infinity, pkAt = a;
  const win = (i: number) => { let e = 0; for (let k = i; k < Math.min(end, i + W); k++) e += low[k] * low[k]; return db(e / W); };
  for (let t = a; t < Math.min(end, a + rate * 0.08); t += W) { const v = win(t); if (v > pk) { pk = v; pkAt = t; } }
  let t = pkAt;
  while (t + W < end && win(t) > pk - 12) t += W;
  // Zero-crossing pitch of the low band in 5–30 ms against 40–70 ms.
  const hz = (s: number, e: number) => {
    const ups: number[] = [];
    for (let i = Math.max(1, s); i < Math.min(e, end, lowLp.length); i++) if (lowLp[i - 1] < 0 && lowLp[i] >= 0) ups.push(i);
    return ups.length >= 2 ? rate / ((ups[ups.length - 1] - ups[0]) / (ups.length - 1)) : null;
  };
  const early = hz(a + Math.round(rate * 0.005), a + Math.round(rate * 0.035)), late = hz(a + Math.round(rate * 0.04), a + Math.round(rate * 0.075));
  return { attackMs: Math.round(((pkAt - a) / rate) * 1000), decayMs: Math.round(((t - a) / rate) * 1000), lowDropSemis: early && late ? Math.round(12 * Math.log2(early / late) * 10) / 10 : 0 };
}
const med = (xs: NoteShape[]): NoteShape | null => (xs.length ? { attackMs: median(xs.map((x) => x.attackMs)), decayMs: median(xs.map((x) => x.decayMs)), lowDropSemis: median(xs.map((x) => x.lowDropSemis)) } : null);

/** The report for a stereo loop that starts on a bar line, with its notes' onset steps. */
export function analyseLoop(left: Float32Array, right: Float32Array, rate: number, bpm: number, onsets: number[]): LoopReport {
  const n = Math.min(left.length, right.length), mono = new Float32Array(n);
  for (let i = 0; i < n; i++) mono[i] = (left[i] + right[i]) / 2;
  const steps = BANDS.map(([lo, hi]) => stepEnergy(band(mono, rate, lo, hi), rate, bpm));
  // Spectrum on a copy decimated by 4 (bands up to 2 kHz).
  const D = 4, dr = rate / D, dec = band(mono, rate, 20, dr * 0.45).filter((_, i) => i % D === 0);
  const pw = THIRDS.map((f) => { const y = run(dec, [bp(f, dr, 4.32), bp(f, dr, 4.32)]); let e = 0; for (const v of y) e += v * v; return e / y.length; });
  const tot = pw.reduce((a, b) => a + b, 0);
  const spectrum = pw.map((e) => Math.round(db(e / tot) * 10) / 10);
  const low = band(mono, rate, 30, 120), lowLp = run(mono, [lp(120, rate), lp(120, rate)]);
  const S = secondsPer16th(bpm) * rate;
  const sorted = [...new Set(onsets)].sort((a, b) => a - b);
  const shapes = sorted.map((st, j) => ({ st, s: noteShape(low, lowLp, rate, Math.round(st * S), Math.min(n, Math.round((sorted[j + 1] ?? st + 4) * S))) })).filter((x) => x.s) as { st: number; s: NoteShape }[];
  return {
    steps, spectrum,
    notes: med(shapes.map((x) => x.s)) ?? { attackMs: 0, decayMs: 0, lowDropSemis: 0 },
    onBeat: med(shapes.filter((x) => x.st % 4 === 0).map((x) => x.s)), offBeat: med(shapes.filter((x) => x.st % 4 !== 0).map((x) => x.s)),
    rmsDb: Math.round(rmsDb({ left, right, rate }) * 10) / 10, lufs: Math.round(lufs({ left, right, rate }) * 10) / 10,
  };
}

/** Pearson correlation; 0 when either side is flat. */
export function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; sab += x * y; saa += x * x; sbb += y * y; }
  return saa > 1e-9 && sbb > 1e-9 ? sab / Math.sqrt(saa * sbb) : 0;
}

export type Closeness = {
  score: number;
  /** Per band: how the energy moves step by step (correlation of the dB curves, floored 40 dB under each band's top). */
  envelope: number[];
  /** Per band: mean level difference, Mine − original, dB (at matched loudness). */
  bandDb: number[];
  /** Per 1/3 octave, Mine − original, dB re each total. */
  spectrumDb: number[];
  spectrumRmsDb: number;
};

/**
 * One closeness score, 0–100: half the step-envelope match (per band, weighted by the original's
 * energy in that band), half the spectrum match (the RMS of the per-band dB differences, weighted
 * by where the original has energy; 0 dB → 1, 6 dB → 0.37).
 */
export function closeness(orig: LoopReport, mine: LoopReport): Closeness {
  const floor = (xs: number[]) => { const top = Math.max(...xs); return xs.map((v) => Math.max(v, top - 40)); };
  const envelope = orig.steps.map((o, b) => Math.round(correlation(floor(o), floor(mine.steps[b] ?? [])) * 100) / 100);
  const mean = (xs: number[]) => db(xs.reduce((a, v) => a + 10 ** (v / 10), 0) / Math.max(1, xs.length));
  const oLvl = orig.steps.map(mean), mLvl = mine.steps.map(mean);
  const oTot = db(oLvl.reduce((a, v) => a + 10 ** (v / 10), 0)), mTot = db(mLvl.reduce((a, v) => a + 10 ** (v / 10), 0));
  const bandDb = oLvl.map((v, b) => Math.round((mLvl[b] - mTot - (v - oTot)) * 10) / 10);
  const wBand = oLvl.map((v) => 10 ** ((v - oTot) / 10));
  const env = envelope.reduce((a, c, b) => a + Math.max(0, c) * wBand[b], 0) / wBand.reduce((a, b) => a + b, 0);
  const spectrumDb = orig.spectrum.map((v, i) => Math.round((mine.spectrum[i] - v) * 10) / 10);
  const wS = orig.spectrum.map((v) => 10 ** (v / 10) + 0.01);
  const spectrumRmsDb = Math.round(Math.sqrt(spectrumDb.reduce((a, d, i) => a + wS[i] * Math.min(30, Math.abs(d)) ** 2, 0) / wS.reduce((a, b) => a + b, 0)) * 10) / 10;
  const score = Math.round(100 * (0.5 * env + 0.5 * Math.exp(-spectrumRmsDb / 6)));
  return { score, envelope, bandDb, spectrumDb, spectrumRmsDb };
}
