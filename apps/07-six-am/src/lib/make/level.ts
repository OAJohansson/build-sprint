// Level-matched A/B (S3, Y9): "Mine" plays at the original part's loudness, so switching A/B
// compares sound, not volume ("louder sounds better"). Measured over the whole loop; the original's
// audio is read in memory and dropped, only the gain is kept. Pure, unit tested (level.test.ts).

export type Stereo = { left: Float32Array; right: Float32Array; rate: number };
export type LevelMethod = "rms" | "lufs";

const db = (x: number) => 10 * Math.log10(x + 1e-20);

/** RMS level of both channels together, dB (−200 for silence). */
export function rmsDb(s: Stereo): number {
  let e = 0;
  const n = Math.min(s.left.length, s.right.length);
  for (let i = 0; i < n; i++) e += s.left[i] * s.left[i] + s.right[i] * s.right[i];
  return n ? db(e / (2 * n)) : -200;
}

type Biquad = [number, number, number, number, number]; // b0 b1 b2 a1 a2 (a0 = 1)

/** ITU-R BS.1770 K-weighting at any sample rate (the two filters, as pyloudnorm derives them). */
function kWeighting(rate: number): Biquad[] {
  const shelf = (() => {
    const G = 3.99984385397, Q = 0.7071752369554193, fc = 1681.9744509555319;
    const A = Math.pow(10, G / 40), w = (2 * Math.PI * fc) / rate, al = Math.sin(w) / (2 * Q), c = Math.cos(w), sA = Math.sqrt(A);
    const a0 = A + 1 - (A - 1) * c + 2 * sA * al;
    return [A * (A + 1 + (A - 1) * c + 2 * sA * al) / a0, -2 * A * (A - 1 + (A + 1) * c) / a0, A * (A + 1 + (A - 1) * c - 2 * sA * al) / a0,
      2 * (A - 1 - (A + 1) * c) / a0, (A + 1 - (A - 1) * c - 2 * sA * al) / a0] as Biquad;
  })();
  const hp = (() => {
    const Q = 0.5003270373253953, fc = 38.13547087613982;
    const w = (2 * Math.PI * fc) / rate, al = Math.sin(w) / (2 * Q), c = Math.cos(w), a0 = 1 + al;
    return [(1 + c) / 2 / a0, -(1 + c) / a0, (1 + c) / 2 / a0, (-2 * c) / a0, (1 - al) / a0] as Biquad;
  })();
  return [shelf, hp];
}

function filter(x: Float32Array, fs: Biquad[]): Float64Array {
  let y = Float64Array.from(x);
  for (const [b0, b1, b2, a1, a2] of fs) {
    const out = new Float64Array(y.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < y.length; i++) { const v = b0 * y[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = y[i]; y2 = y1; y1 = v; out[i] = v; }
    y = out;
  }
  return y;
}

/** Integrated loudness (LUFS, BS.1770: 400 ms blocks, 75 % overlap, −70 LUFS and −10 LU gates). */
export function lufs(s: Stereo): number {
  const fs = kWeighting(s.rate);
  const L = filter(s.left, fs), R = filter(s.right, fs);
  const n = Math.min(L.length, R.length), B = Math.round(0.4 * s.rate), step = Math.round(0.1 * s.rate);
  const z: number[] = [];
  const block = (a: number, b: number) => { let e = 0; for (let i = a; i < b; i++) e += L[i] * L[i] + R[i] * R[i]; return e / Math.max(1, b - a); };
  if (n < B) z.push(block(0, n));
  else for (let a = 0; a + B <= n; a += step) z.push(block(a, a + B));
  const loud = (e: number) => -0.691 + db(e);
  const abs = z.filter((e) => loud(e) > -70);
  if (!abs.length) return -200;
  const rel = loud(abs.reduce((a, b) => a + b, 0) / abs.length) - 10;
  const gated = abs.filter((e) => loud(e) > rel);
  return loud(gated.reduce((a, b) => a + b, 0) / Math.max(1, gated.length));
}

/**
 * The gain that brings "Mine" to the original's level: dB and linear. 0 dB when either is silent;
 * capped at ±24 dB so a near-silent render can't jump in volume.
 */
export function matchGain(original: Stereo, mine: Stereo, method: LevelMethod = "rms"): { db: number; gain: number } {
  return gainToLevel((method === "lufs" ? lufs : rmsDb)(original), mine, method);
}

/**
 * The same gain from the original's level alone (dB, measured the same way), so the original's
 * audio can be dropped once it is measured (Make's worker keeps this number only, L161).
 */
export function gainToLevel(targetDb: number, mine: Stereo, method: LevelMethod = "rms"): { db: number; gain: number } {
  const a = targetDb, b = (method === "lufs" ? lufs : rmsDb)(mine);
  if (a <= -120 || b <= -120) return { db: 0, gain: 1 };
  const d = Math.max(-24, Math.min(24, a - b));
  return { db: Math.round(d * 100) / 100, gain: Math.pow(10, d / 20) };
}
