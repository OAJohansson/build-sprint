// Independent measurements for the Lab evals (not the product's own estimators).
export function yinHz(x: Float32Array, rate: number, lo = 30, hi = 500): number | null {
  const maxLag = Math.floor(rate / lo), minLag = Math.floor(rate / hi);
  const W = x.length - maxLag;
  if (W < maxLag) return null;
  const d = new Float64Array(maxLag + 1);
  for (let tau = 1; tau <= maxLag; tau++) { let s = 0; for (let i = 0; i < W; i++) { const v = x[i] - x[i + tau]; s += v * v; } d[tau] = s; }
  let run = 0; const cm = new Float64Array(maxLag + 1); cm[0] = 1;
  for (let tau = 1; tau <= maxLag; tau++) { run += d[tau]; cm[tau] = run ? (d[tau] * tau) / run : 1; }
  let tau = -1;
  for (let t = minLag; t <= maxLag; t++) if (cm[t] < 0.15) { while (t + 1 <= maxLag && cm[t + 1] < cm[t]) t++; tau = t; break; }
  if (tau < 0) { let best = minLag; for (let t = minLag; t <= maxLag; t++) if (cm[t] < cm[best]) best = t; if (cm[best] > 0.4) return null; tau = best; }
  const a = cm[tau - 1] ?? cm[tau], b = cm[tau], c = cm[tau + 1] ?? cm[tau];
  const den = a - 2 * b + c; const off = den ? (0.5 * (a - c)) / den : 0;
  return rate / (tau + off);
}
export const hzToMidi = (hz: number) => 69 + 12 * Math.log2(hz / 440);
export const mono = (l: Float32Array, r: Float32Array) => { const m = new Float32Array(l.length); for (let i = 0; i < l.length; i++) m[i] = (l[i] + r[i]) / 2; return m; };
/** First sample at or after `from` where |x| exceeds `frac` of the peak in [from, from+win). */
export function onsetAt(x: Float32Array, from: number, win: number, frac = 0.05): number | null {
  let pk = 0; for (let i = Math.max(0, from); i < Math.min(x.length, from + win); i++) pk = Math.max(pk, Math.abs(x[i]));
  if (pk < 1e-4) return null;
  for (let i = Math.max(0, from); i < Math.min(x.length, from + win); i++) if (Math.abs(x[i]) >= frac * pk) return i;
  return null;
}
/** Seeded PRNG. */
export function rng(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; }; }
