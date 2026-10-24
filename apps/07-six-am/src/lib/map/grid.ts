// The bar grid: seconds ↔ bars at a tempo, phrase snapping, and measuring the grid (tempo refine,
// beat phase, first downbeat) from a whole track's onset curve. Pure, unit tested (grid.test.ts).
import { BEATS_PER_BAR } from "./types";

// shortcut: house/techno range only (90–200 BPM after folding); a real half-time genre (dubstep at
// 70, hip hop at 85) gets double-time bars. Upgrade with a per-genre range if those get mapped.
/** The grid's tempo: half-time readings folded up to the dance-floor range (62 → 124). */
export function gridTempo(bpm: number): number {
  if (!(bpm > 0) || !Number.isFinite(bpm)) return 0;
  let b = bpm;
  while (b < 90) b *= 2;
  while (b > 200) b /= 2;
  return b;
}

/** Length of one bar in seconds. */
export const barSeconds = (bpm: number, beatsPerBar = BEATS_PER_BAR) => (60 / bpm) * beatsPerBar;

/** Seconds from the track's start → bars from the first downbeat (fractional; negative before it). */
export function secondsToBars(sec: number, bpm: number, originSec = 0, beatsPerBar = BEATS_PER_BAR): number {
  return (sec - originSec) / barSeconds(bpm, beatsPerBar);
}

/** Bars from the first downbeat → seconds from the track's start. */
export function barsToSeconds(bars: number, bpm: number, originSec = 0, beatsPerBar = BEATS_PER_BAR): number {
  return originSec + bars * barSeconds(bpm, beatsPerBar);
}

/**
 * A section boundary (in bars) snapped to the phrase grid: the nearest 8-bar line when it is within
 * 2 bars of one, otherwise the nearest 4-bar line; never before 0 or past the last bar.
 */
export function snapToPhrase(bar: number, totalBars: number): number {
  const end = Math.max(0, Math.round(totalBars));
  if (!Number.isFinite(bar) || bar <= 0) return 0;
  if (bar >= end) return end;
  const eight = Math.round(bar / 8) * 8;
  const snapped = Math.abs(bar - eight) <= 2 ? eight : Math.round(bar / 4) * 4;
  return Math.min(end, Math.max(0, snapped));
}

/** Whole bars from the first downbeat to the end (a last bar counts once it is half there). */
export function wholeBars(durationSec: number, bpm: number, originSec = 0): number {
  if (!(bpm > 0) || !(durationSec > originSec)) return 0;
  return Math.max(0, Math.round(secondsToBars(durationSec, bpm, originSec)));
}

/**
 * Refine a tempo over the whole track: the tempo (within ±1.5 % of the guess) whose beat comb lines
 * up best with the onset curve over the entire track, measured as the phase coherence
 * |Σ o[t]·e^(−2πi·t·f)| / Σ o[t]. Over hundreds of beats a 0.1 % error drifts the phase
 * visibly, so this is much finer than a 30 s reading. Returns the beat phase too (time of a beat).
 */
export function refineTempo(onset: ArrayLike<number>, fps: number, guessBpm: number): { bpm: number; coherence: number; beatSec: number } {
  const n = onset.length;
  let total = 0;
  for (let i = 0; i < n; i++) total += onset[i];
  if (!(guessBpm > 0) || !(total > 0)) return { bpm: guessBpm, coherence: 0, beatSec: 0 };
  const at = (bpm: number) => {
    const w = (2 * Math.PI * bpm) / 60 / fps;
    let re = 0, im = 0;
    for (let i = 0; i < n; i++) { const o = onset[i]; if (o) { re += o * Math.cos(w * i); im -= o * Math.sin(w * i); } }
    return { re, im, c: Math.hypot(re, im) / total };
  };
  let best = { bpm: guessBpm, ...at(guessBpm) };
  // Coarse 0.02 BPM steps, then 0.002 around the best.
  for (const [span, step] of [[guessBpm * 0.015, 0.02], [0.03, 0.002]] as const) {
    const centre = best.bpm;
    for (let b = centre - span; b <= centre + span + 1e-9; b += step) {
      const r = at(b);
      if (r.c > best.c) best = { bpm: b, ...r };
    }
  }
  const period = 60 / best.bpm;
  // Angle of the sum = −ω·t0, so a beat sits at t0 = −angle/ω (mod one beat).
  const angle = Math.atan2(best.im, best.re);
  let beatSec = ((-angle / (2 * Math.PI)) * period) % period;
  if (beatSec < 0) beatSec += period;
  return { bpm: Math.round(best.bpm * 100) / 100, coherence: Math.round(best.c * 1000) / 1000, beatSec };
}

/** Coherence of the onset curve with a beat comb at exactly this tempo, and the comb's beat phase. */
function combAt(onset: ArrayLike<number>, fps: number, bpm: number): { coherence: number; beatSec: number } {
  const w = (2 * Math.PI * bpm) / 60 / fps;
  let re = 0, im = 0, total = 0;
  for (let i = 0; i < onset.length; i++) { const o = onset[i]; if (o) { re += o * Math.cos(w * i); im -= o * Math.sin(w * i); total += o; } }
  const period = 60 / bpm;
  let beatSec = ((-Math.atan2(im, re) / (2 * Math.PI)) * period) % period;
  if (beatSec < 0) beatSec += period;
  return { coherence: total > 0 ? Math.hypot(re, im) / total : 0, beatSec };
}

/**
 * The tempo from the beats themselves. The comb alone can't decide between the true tempo and
 * near neighbours (±0.3 BPM) when the kick stops for a breakdown: the two kick blocks line up again
 * after a whole extra beat across the gap. So: follow the beats from the comb's guess one by one
 * (each predicted from the last one heard, so a slightly wrong guess can't skip a beat), fit a
 * straight line through each unbroken run of beats, and combine the runs' slopes (long runs count
 * most). Within a run every beat is counted right, so the slope is the true beat length to a few
 * hundredths of a BPM; the comb then only sets the phase.
 */
export function trackTempo(onset: ArrayLike<number>, fps: number, guessBpm: number): { bpm: number; coherence: number; beatSec: number; beats: number } {
  const coarse = refineTempo(onset, fps, guessBpm);
  const n = onset.length;
  if (!(coarse.bpm > 0) || n < fps * 10) return { ...coarse, beats: 0 };
  // Peaks of the onset curve, to sub-frame precision (parabola through the top three frames).
  let sum = 0, sq = 0;
  for (let i = 0; i < n; i++) { sum += onset[i]; sq += onset[i] * onset[i]; }
  const mean = sum / n, sd = Math.sqrt(Math.max(0, sq / n - mean * mean));
  const strong = mean + 1.5 * sd;
  const peakNear = (t: number, half: number): number | null => {
    const a = Math.max(1, Math.floor((t - half) * fps)), b = Math.min(n - 2, Math.ceil((t + half) * fps));
    let best = -1, bv = strong;
    for (let i = a; i <= b; i++) if (onset[i] > bv && onset[i] >= onset[i - 1] && onset[i] >= onset[i + 1]) { bv = onset[i]; best = i; }
    if (best < 0) return null;
    const y0 = onset[best - 1], y1 = onset[best], y2 = onset[best + 1], d = y0 - 2 * y1 + y2;
    return (best + (d !== 0 ? (0.5 * (y0 - y2)) / d : 0)) / fps;
  };
  const P0 = 60 / coarse.bpm;
  const runs: { k: number; t: number }[][] = [];
  let run: { k: number; t: number }[] = [];
  let last: { k: number; t: number } | null = null;
  for (let k = 0, t = coarse.beatSec; t < n / fps; k++, t += P0) {
    const predicted = last ? last.t + (k - last.k) * P0 : t;
    const obs = peakNear(predicted, P0 / 4);
    if (obs !== null) {
      if (last && k - last.k > 16) { runs.push(run); run = []; }
      run.push({ k, t: obs });
      last = { k, t: obs };
    }
  }
  runs.push(run);
  let num = 0, den = 0, beats = 0;
  for (const r of runs) {
    if (r.length < 8) continue;
    const kb = r.reduce((x, o) => x + o.k, 0) / r.length, tb = r.reduce((x, o) => x + o.t, 0) / r.length;
    let sxy = 0, sxx = 0;
    for (const o of r) { sxy += (o.k - kb) * (o.t - tb); sxx += (o.k - kb) ** 2; }
    if (sxx > 0) { num += sxy; den += sxx; beats += r.length; }
  }
  const period = den > 0 ? num / den : P0;
  // A slope far off the guess means the runs followed something else: keep the comb's tempo.
  // The runs can also latch onto bass notes instead of beats (a rolling sub bass): then the comb at
  // their tempo falls apart, so the slope is kept only while the comb still mostly holds at it.
  const slope = 60 / period;
  const atSlope = Math.abs(slope / coarse.bpm - 1) < 0.01 ? combAt(onset, fps, slope) : null;
  const useSlope = !!atSlope && atSlope.coherence >= 0.85 * coarse.coherence;
  const bpm = useSlope ? slope : coarse.bpm;
  const final = useSlope ? atSlope! : combAt(onset, fps, bpm);
  return { bpm: Math.round(bpm * 100) / 100, coherence: Math.round(final.coherence * 1000) / 1000, beatSec: final.beatSec, beats };
}

/**
 * Which beat starts the bar: for each of the 4 phases, average the feature rows over each bar and sum
 * the squared bar-to-bar changes. Elements enter on downbeats, so at the true phase a change lands in
 * one bar boundary (one big jump); at a wrong phase it is split over two smaller ones, and squares
 * punish the split. A clap on 2 and 4 is in every bar at every phase, so it doesn't bias the choice.
 * `rows(t0, t1)` returns the mean feature vector between two times.
 */
export function pickDownbeat(beatSec: number, bpm: number, durationSec: number, rows: (t0: number, t1: number) => number[]): { phase: number; confidence: number; scores: number[] } {
  const period = 60 / bpm, bar = period * BEATS_PER_BAR;
  const scores: number[] = [];
  for (let phase = 0; phase < BEATS_PER_BAR; phase++) {
    let start = beatSec + phase * period;
    while (start - bar >= -period / 2) start -= bar;
    let prev: number[] | null = null, s = 0;
    for (let t = start; t + bar <= durationSec; t += bar) {
      const v = rows(t, t + bar);
      if (prev) for (let k = 0; k < v.length; k++) s += (v[k] - prev[k]) ** 2;
      prev = v;
    }
    scores.push(s);
  }
  const order = scores.map((s, i) => [s, i] as const).sort((a, b) => b[0] - a[0]);
  const [top, second] = [order[0][0], order[1][0]];
  return { phase: order[0][1], confidence: top > 0 ? Math.round(((top - second) / top) * 100) / 100 : 0, scores };
}

/** The first downbeat at or after the music starts (less half a beat, for a soft first hit). */
export function firstDownbeat(beatSec: number, phase: number, bpm: number, soundStartSec: number): number {
  const period = 60 / bpm, bar = period * BEATS_PER_BAR;
  let t = beatSec + phase * period;
  const from = Math.max(0, soundStartSec - period / 2);
  while (t - bar >= from) t -= bar;
  while (t < from) t += bar;
  return Math.round(t * 1000) / 1000;
}
