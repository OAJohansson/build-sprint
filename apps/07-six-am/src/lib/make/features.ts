// What patch matching compares (S3, L157): a few numbers measured from a part in memory or from a
// render of "Mine". Level-independent except `levelDb`, so loudness doesn't decide the match.
// Pure; the audio is read and dropped (L143).
import { bandShareDb } from "./meter";
import { secondsPer16th } from "./render";

export type PartFeatures = {
  /** Brightness: energy-weighted RMS frequency of the sound (Hz), a cheap spectral centroid. */
  brightHz: number;
  /** Median note length in 16ths: from the onset until 12 dB under the note's peak. */
  lengthSteps: number;
  /** Median fall in pitch from a note's start to its body, semitones. */
  dropSemis: number;
  /** 99th-percentile level over RMS inside the notes (dB): soft clipping (Drive) lowers it. The
   *  percentile, not the peak, so a click of kick bleed in a separated part doesn't decide it. */
  crestDb: number;
  /** How much brightness moves within held notes (std of log2 brightness): Wobble. */
  wobble: number;
  /** Side over mid RMS (0 = mono). */
  width: number;
  /** RMS level of the loop, dB. */
  levelDb: number;
  /** L209: share of the energy below 100 Hz (the sub) and in 100–400 Hz (the body), dB re total.
   *  Optional: readings taken before L209 don't have them, and then they don't count. */
  lowDb?: number;
  bodyDb?: number;
};

/** The largest fall in pitch read as a pitch drop (semitones): the presets go up to 12. */
export const DROP_MAX = 12;
/** Brightness movement inside notes under this is the filter envelope and separation noise, not
 *  a wobble (renders with Wobble off read 0.03–0.19; the real basses 0.10–0.15). */
export const WOBBLE_FLOOR = 0.2;
/** The most a crest difference counts (dB). */
export const CREST_CAP = 2;

const db = (x: number) => 10 * Math.log10(x + 1e-12);
const p99 = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(0.99 * (s.length - 1))]; };
const median = (xs: number[]) => { const s = xs.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

/** Times (s) of upward zero crossings of a low-passed copy, from `a` to `b` samples. */
function periodHz(x: Float32Array, a: number, b: number, rate: number): number | null {
  const ups: number[] = [];
  for (let i = Math.max(1, a); i < Math.min(b, x.length); i++) if (x[i - 1] < 0 && x[i] >= 0) ups.push(i - 1 + -x[i - 1] / (x[i] - x[i - 1]));
  if (ups.length < 3) return null;
  return rate / ((ups[ups.length - 1] - ups[0]) / (ups.length - 1));
}

/**
 * Features of a stereo part whose notes start on these 16ths (`onsets`, counted from the start
 * of the audio, at `bpm`).
 */
export function measureFeatures(left: Float32Array, right: Float32Array, rate: number, bpm: number, onsets: number[]): PartFeatures {
  const n = Math.min(left.length, right.length);
  const sps = secondsPer16th(bpm);
  const mid = new Float32Array(n);
  let em = 0, es = 0;
  for (let i = 0; i < n; i++) { const m = (left[i] + right[i]) / 2, s = (left[i] - right[i]) / 2; mid[i] = m; em += m * m; es += s * s; }
  // Two one-pole low-passes at 150 Hz: mostly the fundamental, for the zero-crossing pitch.
  const lp = new Float32Array(n), c = Math.exp((-2 * Math.PI * 150) / rate);
  let y1 = 0, y2 = 0;
  for (let i = 0; i < n; i++) { y1 = (1 - c) * mid[i] + c * y1; y2 = (1 - c) * y1 + c * y2; lp[i] = y2; }

  // Frames of 20 ms: level and RMS frequency (sqrt of diff energy over energy).
  const F = Math.round(rate * 0.02), frames = Math.floor(n / F);
  const lev = new Float32Array(frames), bright = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let e = 0, d = 0;
    for (let i = f * F + 1; i < (f + 1) * F; i++) { e += mid[i] * mid[i]; const dd = mid[i] - mid[i - 1]; d += dd * dd; }
    lev[f] = db(e / F);
    bright[f] = e > 0 ? (rate / (2 * Math.PI)) * Math.sqrt(d / e) : 0;
  }
  const top = Math.max(-120, ...lev);
  let bw = 0, bs = 0;
  for (let f = 0; f < frames; f++) if (lev[f] > top - 25 && bright[f] > 0) { const w = Math.pow(10, lev[f] / 10); bw += w; bs += w * Math.log2(bright[f]); }
  const brightHz = bw > 0 ? Math.pow(2, bs / bw) : 0;

  const sorted = [...new Set(onsets)].sort((a, b) => a - b);
  // F1 (evals 26 Oct): in a separated bass the kick bleeds in on the beats, and its falling pitch
  // read as a 9–15 semitone "pitch drop" (and a high crest). Notes off the beat carry no kick: the
  // drop and crest come from those when there are enough of them (both sides, original and Mine,
  // are measured this way, so the comparison stays fair).
  const offBeat = sorted.filter((st) => st % 4 !== 0);
  const useOff = offBeat.length >= 3 ? new Set(offBeat) : null;
  const lengths: number[] = [], drops: number[] = [], wob: number[] = [];
  let sq = 0, cnt = 0;
  const mags: number[] = [];
  sorted.forEach((st, j) => {
    const a = Math.round(st * sps * rate);
    const end = Math.min(n, Math.round((sorted[j + 1] ?? Infinity) * sps * rate));
    if (a >= n || end - a < rate * 0.02) return;
    // Length: 2 ms steps of a 10 ms window until 12 dB under the note's peak.
    const W = Math.round(rate * 0.01), H = Math.round(rate * 0.002);
    let pk = -Infinity, t = a, fall = end;
    const win = (i: number) => { let e = 0; for (let k = i; k < Math.min(n, i + W); k++) e += mid[k] * mid[k]; return db(e / W); };
    for (; t + W < end; t += H) { const v = win(t); if (v > pk) pk = v; else if (v < pk - 12 && t > a + rate * 0.01) { fall = t; break; } }
    lengths.push(Math.min((end - a) / rate / sps, (fall - a) / rate / sps));
    // Pitch: the first periods after 5 ms against 60–100 ms in.
    const early = periodHz(lp, a + Math.round(rate * 0.005), a + Math.round(rate * 0.045), rate);
    const late = periodHz(lp, a + Math.round(rate * 0.06), Math.min(end, a + Math.round(rate * 0.12)), rate);
    const clean = !useOff || useOff.has(st);
    // A fall outside −2…+12 semitones is not a synth's pitch drop (a kick's sweep, a wrong period).
    const drop = early && late ? 12 * Math.log2(early / late) : null;
    if (clean && drop !== null && drop >= -2 && drop <= DROP_MAX) drops.push(drop);
    // Crest and wobble inside the note's body.
    if (clean) for (let i = a; i < Math.min(fall, end); i++) { if ((i & 3) === 0) mags.push(Math.abs(mid[i])); sq += mid[i] * mid[i]; cnt++; }
    const body: number[] = [];
    for (let f = Math.ceil((a + rate * 0.06) / F); f < Math.floor(Math.min(fall, end) / F); f++) if (bright[f] > 0) body.push(Math.log2(bright[f]));
    if (body.length >= 4) { const m = body.reduce((x, y) => x + y, 0) / body.length; wob.push(Math.sqrt(body.reduce((x, y) => x + (y - m) ** 2, 0) / body.length)); }
  });
  return {
    brightHz,
    lengthSteps: median(lengths),
    dropSemis: drops.length ? median(drops) : 0,
    crestDb: cnt && mags.length ? db((p99(mags) ** 2) / (sq / cnt)) : 0,
    wobble: wob.length ? median(wob) : 0,
    width: em > 0 ? Math.sqrt(es / em) : 0,
    levelDb: db(em / Math.max(1, n)),
    ...bands(left, right, rate),
  };
}

// shortcut: weights picked on renders of the presets plus one real bass (Mason Flint, where kick bleed
// in the separated bass reads as a big pitch drop and high crest); tune with data-evals on Y10's
// five parts, and gate drop/crest by a note's pitch confidence if bleed keeps steering them.
/** L209: the sub and body shares (dB re total) of a stereo sound. */
export function bands(left: Float32Array, right: Float32Array, rate: number): { lowDb: number; bodyDb: number } {
  const lo = bandShareDb(left, right, rate, 100), mid = bandShareDb(left, right, rate, 400);
  const body = Math.max(1e-6, Math.pow(10, mid / 10) - Math.pow(10, lo / 10));
  return { lowDb: lo, bodyDb: Math.round(10 * Math.log10(body) * 10) / 10 };
}

/** How far apart two sounds are on the features patch matching uses (0 = the same). */
export function featureDistance(a: PartFeatures, b: PartFeatures): number {
  const lg = (x: number, y: number) => Math.log2(Math.max(1e-3, x) / Math.max(1e-3, y));
  return (lg(a.brightHz, b.brightHz) / 0.25) ** 2
    + (lg(a.lengthSteps, b.lengthSteps) / 0.35) ** 2
    + ((a.dropSemis - b.dropSemis) / 1.5) ** 2
    // F1: a separated part's transients keep its crest 5–7 dB above any render's; a gap that no
    // knob can close counts at most CREST_CAP, so it stops pushing Drive to 0 on every sound.
    + (Math.max(-CREST_CAP, Math.min(CREST_CAP, a.crestDb - b.crestDb)) / 1.5) ** 2
    + ((Math.max(0, a.wobble - WOBBLE_FLOOR) - Math.max(0, b.wobble - WOBBLE_FLOOR)) / 0.05) ** 2
    + ((a.width - b.width) / 0.08) ** 2
    // L209: Sub and Weight move these; 1.5 dB counts like the others' steps.
    + (a.lowDb !== undefined && b.lowDb !== undefined ? ((a.lowDb - b.lowDb) / 1.5) ** 2 : 0)
    + (a.bodyDb !== undefined && b.bodyDb !== undefined ? ((a.bodyDb - b.bodyDb) / 1.5) ** 2 : 0);
}
