// The server's own check of a generated loop (S4, L126): is it on tempo and in key? Pure maths on
// mono PCM, no dependencies.
// - Tempo: the app's Ears estimator (spectral-flux onset autocorrelation, src/lib/ears/features.ts)
//   on 16 kHz mono. It's the same estimator data-evals grades X4 with, so a pass here predicts a pass
//   there. On tempo = within ±1 BPM of the request; half, double and 3:2 reads fail.
// - Key: bass-range peak chroma (30–400 Hz, 16384-point frames ≈ 2.7 Hz bins) correlated with
//   Krumhansl–Kessler profiles. Ears' key code starts at 100 Hz and reads a bass loop's harmonics
//   (the 3rd harmonic of the root is the fifth), so loops get this one. In key = same key or relative.
// shortcut: tuned on house/techno bass loops (root-heavy, 30–400 Hz); a loop with no bass, or a
// chromatic line, can read as any key. Fine for "a bass loop like this track"; revisit for chords.
import { estimateBpm, melFrames, SAMPLE_RATE as EARS_RATE } from "@/lib/ears/features";

export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KK_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const FLATS: Record<string, string> = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#", Cb: "B", Fb: "E", "E#": "F", "B#": "C" };

export type Measured = {
  bpm: number;
  key: string;
  scale: "major" | "minor";
  /** Correlation of the bass chroma with the winning key profile (−1…1). */
  keyStrength: number;
  inKey: boolean;
  onTempo: boolean;
};

const pc = (key: string) => NOTES.indexOf(FLATS[key.trim()] ?? key.trim());

/** Same key, or relative major/minor (A minor ≡ C major). */
export function keyMatches(want: { key: string; scale: string }, got: { key: string; scale: string }): boolean {
  const w = pc(want.key), g = pc(got.key);
  if (w < 0 || g < 0) return false;
  const wMinor = !/^maj/i.test(want.scale), gMinor = !/^maj/i.test(got.scale);
  if (wMinor === gMinor) return w === g;
  // relative: the major's root is a minor third above the minor's root
  return wMinor ? (w + 3) % 12 === g : (g + 3) % 12 === w;
}

// ---------- resampling to Ears' 16 kHz (windowed sinc) ----------

export function resample(pcm: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return pcm;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(pcm.length / ratio));
  // Low-pass at 90 % of the lower Nyquist, Blackman-windowed, ±24 input samples (scaled if downsampling).
  const fc = (0.45 * Math.min(from, to)) / from;
  const half = Math.ceil(24 * Math.max(1, ratio / 2.75));
  for (let j = 0; j < out.length; j++) {
    const x = j * ratio;
    const c = Math.floor(x);
    let s = 0, wsum = 0;
    for (let i = c - half + 1; i <= c + half; i++) {
      if (i < 0 || i >= pcm.length) continue;
      const t = i - x;
      const sinc = t === 0 ? 1 : Math.sin(2 * Math.PI * fc * t) / (2 * Math.PI * fc * t);
      const u = (t + half) / (2 * half);
      const win = 0.42 - 0.5 * Math.cos(2 * Math.PI * u) + 0.08 * Math.cos(4 * Math.PI * u);
      const h = sinc * win;
      s += pcm[i] * h;
      wsum += h;
    }
    out[j] = wsum ? s / wsum : 0;
  }
  return out;
}

// ---------- bass-range chroma ----------

function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}

/** 12-bin chroma from spectral peaks between lo and hi Hz (per-frame normalised magnitude). */
export function bassChroma(pcm: Float32Array, sampleRate: number, lo = 30, hi = 400): number[] {
  const N = 16384, hop = 4096;
  const chroma = new Array(12).fill(0);
  const win = new Float64Array(N);
  for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N);
  const binHz = sampleRate / N;
  const kLo = Math.max(2, Math.floor(lo / binHz)), kHi = Math.min(N / 2 - 2, Math.ceil(hi / binHz));
  const re = new Float64Array(N), im = new Float64Array(N), mag = new Float64Array(kHi + 2);
  const last = Math.max(0, pcm.length - N);
  for (let start = 0; start <= last; start += hop) {
    re.fill(0); im.fill(0);
    for (let i = 0; i < N && start + i < pcm.length; i++) re[i] = pcm[start + i] * win[i];
    fft(re, im);
    for (let k = kLo - 1; k <= kHi + 1; k++) mag[k] = Math.hypot(re[k], im[k]);
    // Each frame counts the same (magnitude over the frame's band total), so one loud note
    // doesn't outvote the rest of the line.
    let frame = 0;
    for (let k = kLo; k <= kHi; k++) frame += mag[k];
    for (let k = kLo; frame > 0 && k <= kHi; k++) {
      if (mag[k] <= mag[k - 1] || mag[k] < mag[k + 1]) continue; // peaks only
      // parabolic interpolation of the peak frequency
      const a = mag[k - 1], b = mag[k], c = mag[k + 1];
      const d = a - 2 * b + c;
      const off = d ? (0.5 * (a - c)) / d : 0;
      const hz = (k + off) * binHz;
      const midi = 69 + 12 * Math.log2(hz / 440);
      chroma[((Math.round(midi) % 12) + 12) % 12] += b / frame;
    }
    if (pcm.length < N) break;
  }
  return chroma;
}

function pearson(a: number[], b: number[]) {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

/** Best of the 24 Krumhansl–Kessler keys for a chroma vector. */
export function keyFromChroma(chroma: number[]): { key: string; scale: "major" | "minor"; strength: number } {
  let best = { key: "C", scale: "major" as "major" | "minor", strength: -Infinity };
  for (let r = 0; r < 12; r++) {
    const rot = chroma.map((_, i) => chroma[(i + r) % 12]);
    const maj = pearson(rot, KK_MAJOR), min = pearson(rot, KK_MINOR);
    if (maj > best.strength) best = { key: NOTES[r], scale: "major", strength: maj };
    if (min > best.strength) best = { key: NOTES[r], scale: "minor", strength: min };
  }
  return { ...best, strength: Math.round(best.strength * 1000) / 1000 };
}

/** Measure a loop and compare it with what was asked for. */
export function checkLoop(pcm: Float32Array, sampleRate: number, want: { bpm: number; key: string; scale: string }): Measured {
  const tempo = estimateBpm(melFrames(resample(pcm, sampleRate, EARS_RATE)));
  const k = keyFromChroma(bassChroma(pcm, sampleRate));
  return {
    bpm: tempo.bpm,
    key: k.key,
    scale: k.scale,
    keyStrength: k.strength,
    inKey: keyMatches(want, k),
    onTempo: tempo.bpm > 0 && Math.abs(tempo.bpm - want.bpm) <= 1,
  };
}

/** Ranking when no draw passes: both checks beat one, then key strength as the tie-break. */
export const checkScore = (m: Measured) => (m.onTempo ? 2 : 0) + (m.inKey ? 2 : 0) + m.keyStrength;
