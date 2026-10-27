// "Mine" plays the original part's rhythm (S3): a 1–4 bar note pattern estimated from the looped
// part in memory (L161). Onsets on a 16th grid at the track's tempo, each note's pitch read by
// autocorrelation and snapped into the key. Only these numbers come out; the audio is read and
// dropped. Pure, unit tested (pattern.test.ts).
import { inScale, pitchClass, type Scale } from "@/lib/synths/theory";
import { secondsPer16th, type MakeNote } from "./render";

export type EstimatedPattern = {
  bars: 1 | 2 | 4;
  notes: MakeNote[];
  /** Share of the loop's notes that agree with the folded pattern (1 = it repeats exactly). */
  confidence: number;
  /** Where the onsets' grid sits against the given bar line (ms; + = later). */
  offsetMs: number;
};

const DECIM = 4;
const db = (x: number) => 10 * Math.log10(x + 1e-12);

/** Nearest MIDI note in the key's scale (ties go down). */
export function snapToKey(midi: number, tonic: number, scale: Scale): number {
  let best = Math.round(midi);
  let bestD = Infinity;
  for (let c = Math.floor(midi) - 2; c <= Math.ceil(midi) + 2; c++) {
    const d = Math.abs(midi - c);
    if (inScale(c, tonic, scale) && d < bestD - 1e-9) { best = c; bestD = d; }
  }
  return best;
}

/** Fundamental (Hz) of a stretch of low-passed, decimated audio by normalised autocorrelation; null if unpitched. */
export function pitchHz(x: Float32Array, rate: number, lo = 30, hi = 400): number | null {
  const n = x.length;
  const minLag = Math.floor(rate / hi), maxLag = Math.min(Math.ceil(rate / lo), Math.floor(n / 2));
  if (maxLag <= minLag + 2) return null;
  const r: number[] = [];
  for (let lag = 0; lag <= maxLag; lag++) {
    let ac = 0, e = 0;
    for (let i = 0; i + lag < n; i++) { ac += x[i] * x[i + lag]; e += x[i] * x[i] + x[i + lag] * x[i + lag]; }
    r.push(e > 0 ? (2 * ac) / e : 0);
  }
  let best = -1;
  for (let lag = minLag; lag <= maxLag; lag++) if (best < 0 || r[lag] > r[best]) best = lag;
  if (best < 0 || r[best] < 0.5) return null;
  // The first peak close to the best one avoids octave-down errors.
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (r[lag] >= 0.9 * r[best] && r[lag] >= r[lag - 1] && r[lag] >= r[lag + 1]) { best = lag; break; }
  }
  const y0 = r[best - 1] ?? r[best], y1 = r[best], y2 = r[best + 1] ?? r[best];
  const d = y0 - 2 * y1 + y2;
  const lag = best + (d !== 0 ? (0.5 * (y0 - y2)) / d : 0);
  return rate / lag;
}

type Step = { onset: boolean; midi: number | null; dur: number; level: number; rise: number };

/**
 * The note pattern of a mono loop that starts on a bar line, at `bpm`, in `key` `scale`. Null when
 * the key is unknown or the loop is under a bar.
 */
export function estimatePattern(mono: Float32Array, rate: number, bpm: number, key: string, scale: Scale, debug?: (steps: { onset: boolean; midi: number | null; level: number; rise: number }[]) => void): EstimatedPattern | null {
  const tonic = pitchClass(key);
  const sps = secondsPer16th(bpm);
  const total = Math.floor(mono.length / rate / sps + 0.01);
  if (tonic === null || total < 16) return null;
  // Decimated copy for pitch (bass lives below ~400 Hz).
  const dr = rate / DECIM, low = new Float32Array(Math.floor(mono.length / DECIM));
  for (let i = 0; i < low.length; i++) { let s = 0; for (let j = 0; j < DECIM; j++) s += mono[i * DECIM + j]; low[i] = s / DECIM; }
  // Energy envelope every 3 ms over a centred 25 ms window (longer than a bass cycle, so a held
  // note reads flat), from a running sum of squares.
  const cum = new Float64Array(mono.length + 1);
  for (let i = 0; i < mono.length; i++) cum[i + 1] = cum[i] + mono[i] * mono[i];
  const half = Math.round(rate * 0.0125), hop = Math.round(rate * 0.003), frames = Math.floor(mono.length / hop);
  const env = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    const a = Math.max(0, f * hop - half), b = Math.min(mono.length, f * hop + half);
    env[f] = db((cum[b] - cum[a]) / Math.max(1, b - a));
  }
  const fAt = (s: number) => Math.round(s / (hop / rate));
  const LAG = fAt(0.025);
  const maxDb = Math.max(...env);
  const floor = maxDb - 30;

  // The grid's phase: where onsets line up best, within ±half a 16th of the given bar line (the
  // map's downbeat and the loop's placement are estimates, tens of ms off).
  const riseAt = (f: number) => (f >= LAG && f < frames && env[f] > floor ? Math.max(0, env[f] - env[f - LAG]) : 0);
  let offset = 0, bestScore = -1;
  for (let o = -sps / 2; o < sps / 2; o += 0.003) {
    let score = 0;
    for (let k = 0; k < total; k++) {
      let m = 0;
      // The centred 25 ms window rises most about half a window after an onset.
      const c = fAt(k * sps + o + 0.0125);
      for (let f = c - 1; f <= c + 1; f++) m = Math.max(m, riseAt(f));
      score += m;
    }
    if (score > bestScore + 1e-6 || (Math.abs(score - bestScore) <= 1e-6 && Math.abs(o) < Math.abs(offset))) { bestScore = score; offset = o; }
  }
  const steps: Step[] = [];
  for (let k = 0; k < total; k++) {
    const t = k * sps + offset;
    let rise = 0, level = -Infinity;
    for (let f = Math.max(LAG, fAt(t - 0.005)); f <= Math.min(frames - 1, fAt(t + 0.03)); f++) rise = Math.max(rise, env[f] - env[f - LAG]);
    for (let f = Math.max(0, fAt(t + 0.005)); f <= Math.min(frames - 1, fAt(t + 0.04)); f++) level = Math.max(level, env[f]);
    let midi: number | null = null;
    if (level > floor) {
      const a = Math.max(0, Math.round((t + Math.min(0.035, sps * 0.3)) * dr)), len = Math.round(Math.min(0.08, sps * 0.65) * dr);
      const hz = pitchHz(low.subarray(a, Math.min(low.length, a + len)), dr);
      if (hz && hz >= 25 && hz <= 420) midi = 69 + 12 * Math.log2(hz / 440); // bass range only
    }
    steps.push({ onset: level > floor && rise >= 6, midi, dur: 0, level, rise });
  }
  // A held note that changes pitch is a new note too (legato lines).
  for (let k = 1; k < total; k++) {
    const s = steps[k], prev = steps[k - 1];
    // …but not a fading tail (its level holds within 3 dB of the step before).
    if (!s.onset && s.midi !== null && prev.midi !== null && s.level > floor && s.level >= prev.level - 3 && Math.abs(s.midi - prev.midi) >= 0.7) s.onset = true;
  }
  // Lengths: until the level falls 12 dB under the note's start, or the next note.
  for (let k = 0; k < total; k++) {
    if (!steps[k].onset) continue;
    const start = steps[k].level, f0 = Math.max(0, fAt(k * sps + offset));
    let end = k + 1;
    while (end < total && !steps[end].onset) end++;
    let f = f0 + fAt(0.01);
    const last = Math.min(frames - 1, fAt(end * sps + offset));
    while (f < last && env[f] > start - 12) f++;
    steps[k].dur = Math.max(1, Math.min(end - k, Math.round(((f - f0) * hop) / rate / sps)));
    if (steps[k].midi !== null) steps[k].midi = snapToKey(steps[k].midi!, tonic, scale);
  }
  debug?.(steps.map((x) => ({ onset: x.onset, midi: x.midi, level: Math.round(x.level * 10) / 10, rise: Math.round(x.rise * 10) / 10 })));
  // Fold to the shortest period (1, 2 or 4 bars) the loop repeats with.
  const token = (s: Step) => (s.onset && s.midi !== null ? s.midi : -1);
  let chosen: { bars: 1 | 2 | 4; agree: number } | null = null;
  for (const bars of [1, 2, 4] as const) {
    const P = bars * 16;
    if (P > total) break;
    let agree = 0;
    const majority = Array.from({ length: P }, (_, i) => mode(steps.filter((_, k) => k % P === i).map(token)));
    // Only steps where a note plays (here or in the fold) count: rests agree too easily.
    let counted = 0;
    steps.forEach((s, k) => { const t = token(s), m = majority[k % P]; if (t < 0 && m < 0) return; counted++; if (t === m) agree++; });
    const a = counted ? agree / counted : 1;
    if (!chosen || a > chosen.agree + 1e-9) chosen = { bars, agree: a };
    if (a >= 0.9) { chosen = { bars, agree: a }; break; }
  }
  const P = chosen!.bars * 16;
  const notes: MakeNote[] = [];
  const maxLevel = Math.max(...steps.filter((s) => s.onset).map((s) => s.level), floor);
  for (let i = 0; i < P; i++) {
    const reps = steps.filter((_, k) => k % P === i);
    const m = mode(reps.map(token));
    if (m < 0) continue;
    const same = reps.filter((s) => token(s) === m);
    notes.push({
      step: i, midi: m,
      dur: median(same.map((s) => s.dur)),
      vel: Math.round(Math.max(0.3, Math.min(1, 1 + (median(same.map((s) => s.level)) - maxLevel) / 30)) * 100) / 100,
    });
  }
  return { bars: chosen!.bars, notes, confidence: Math.round(chosen!.agree * 100) / 100, offsetMs: Math.round(offset * 1000) };
}

function mode(xs: number[]): number {
  const c = new Map<number, number>();
  let best = xs[0] ?? -1, n = 0;
  for (const x of xs) { const k = (c.get(x) ?? 0) + 1; c.set(x, k); if (k > n) { n = k; best = x; } }
  return best;
}
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

/**
 * The notes "Mine" plays over a loop of `steps` 16ths: the pattern repeated, each note lasting
 * until the next one starts (Length then decides how much of that it sounds).
 */
export function notesForLoop(p: Pick<EstimatedPattern, "bars" | "notes">, steps: number): MakeNote[] {
  const P = p.bars * 16;
  const one = [...p.notes].sort((a, b) => a.step - b.step);
  if (!one.length) return [];
  const all: MakeNote[] = [];
  for (let r = 0; r * P < steps; r++) for (const n of one) if (r * P + n.step < steps) all.push({ ...n, step: r * P + n.step });
  return all.map((n, i) => ({ ...n, dur: (all[i + 1]?.step ?? steps) - n.step }));
}
