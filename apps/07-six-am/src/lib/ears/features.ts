// Ears v1 audio features, plain TS with no DOM so it runs in a Web Worker (and in Node for checks).
// Input everywhere: 16 kHz mono Float32Array PCM that lives in memory only and is never stored.

import { pickTempo, type TempoRelation } from "./bpm";

export const SAMPLE_RATE = 16000;
const FRAME = 512;
const HOP = 256;
const BANDS = 96;
export const PATCH_FRAMES = 128;
export const PATCH_HOP = 62;

// ---------- FFT (radix-2, in place) ----------

function fftInPlace(re: Float64Array, im: Float64Array) {
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
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}

function hannSymmetric(size: number) {
  // Essentia Windowing type "hann", normalized=false: 0.5 - 0.5 cos(2πi/(N-1)).
  const w = new Float64Array(size);
  for (let i = 0; i < size; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
  return w;
}

/** Magnitude spectra of hann-windowed frames. Frame i is centred on sample i*hop (Essentia FrameCutter, startFromZero=false). */
function stft(pcm: Float32Array, size: number, hop: number, onFrame: (mag: Float64Array, i: number) => void) {
  const win = hannSymmetric(size);
  const re = new Float64Array(size), im = new Float64Array(size), mag = new Float64Array(size / 2 + 1);
  let i = 0;
  for (let centre = 0; centre < pcm.length; centre += hop, i++) {
    const start = centre - size / 2;
    for (let k = 0; k < size; k++) {
      const s = start + k;
      re[k] = s >= 0 && s < pcm.length ? pcm[s] * win[k] : 0;
      im[k] = 0;
    }
    fftInPlace(re, im);
    for (let k = 0; k <= size / 2; k++) mag[k] = Math.hypot(re[k], im[k]);
    onFrame(mag, i);
  }
  return i;
}

// ---------- Essentia TensorflowInputMusiCNN melspectrogram ----------
// Ported from essentia src/algorithms/spectral/tensorflowinputmusicnn.cpp + melbands.cpp + triangularbands.cpp:
// 512 frame, 256 hop, 96 bands 0–8000 Hz, slaneyMel warping, linear weighting, unit_tri normalisation,
// power (|X|²) bands, then log10(1 + 10000·x).

function hz2melSlaney(hz: number) {
  const linSlope = 3 / 200, minLogHz = 1000, logStep = Math.log(6.4) / 27;
  return hz < minLogHz ? hz * linSlope : minLogHz * linSlope + Math.log(hz / minLogHz) / logStep;
}
function mel2hzSlaney(mel: number) {
  const linSlope = 3 / 200, minLogHz = 1000, minLogMel = minLogHz * linSlope, logStep = Math.log(6.4) / 27;
  return mel < minLogMel ? mel / linSlope : minLogHz * Math.exp((mel - minLogMel) * logStep);
}

type Band = { begin: number; weights: Float64Array };
let melBank: Band[] | null = null;
function getMelBank(): Band[] {
  if (melBank) return melBank;
  const lo = hz2melSlaney(0), hi = hz2melSlaney(SAMPLE_RATE / 2);
  const step = (hi - lo) / (BANDS + 1);
  const f: number[] = [];
  for (let i = 0; i < BANDS + 2; i++) f.push(mel2hzSlaney(lo + i * step));
  const bins = FRAME / 2 + 1;
  const scale = SAMPLE_RATE / 2 / (bins - 1);
  melBank = [];
  for (let i = 0; i < BANDS; i++) {
    const s1 = f[i + 1] - f[i], s2 = f[i + 2] - f[i + 1];
    const begin = Math.ceil(f[i] / scale), end = Math.floor(f[i + 2] / scale);
    const weights = new Float64Array(end - begin + 1);
    const area = (s1 + s2) / 2; // unit_tri
    for (let j = begin; j <= end; j++) {
      const hz = j * scale;
      weights[j - begin] = (hz < f[i + 1] ? (hz - f[i]) / s1 : (f[i + 2] - hz) / s2) / area;
    }
    melBank.push({ begin, weights });
  }
  return melBank;
}

export type FrameFeatures = {
  /** frames × 96 log-mel, row-major */
  mel: Float32Array;
  frames: number;
  /** spectral centroid per frame, Hz */
  centroid: Float32Array;
};

export function melFrames(pcm: Float32Array): FrameFeatures {
  const bank = getMelBank();
  const count = Math.ceil(pcm.length / HOP);
  const mel = new Float32Array(count * BANDS);
  const centroid = new Float32Array(count);
  const binHz = SAMPLE_RATE / FRAME;
  stft(pcm, FRAME, HOP, (mag, i) => {
    for (let b = 0; b < BANDS; b++) {
      const { begin, weights } = bank[b];
      let sum = 0;
      for (let k = 0; k < weights.length; k++) {
        const m = mag[begin + k];
        sum += m * m * weights[k];
      }
      mel[i * BANDS + b] = Math.log10(1 + 10000 * sum);
    }
    let num = 0, den = 0;
    for (let k = 0; k < mag.length; k++) { num += k * binHz * mag[k]; den += mag[k]; }
    centroid[i] = den > 0 ? num / den : 0;
  });
  return { mel, frames: count, centroid };
}

/** Patches of 128 frames, hop 62, last partial patch discarded (Essentia defaults for EffnetDiscogs). */
export function patches(f: FrameFeatures): { data: Float32Array; n: number } {
  const n = f.frames < PATCH_FRAMES ? 0 : Math.floor((f.frames - PATCH_FRAMES) / PATCH_HOP) + 1;
  const size = PATCH_FRAMES * BANDS;
  const data = new Float32Array(n * size);
  for (let p = 0; p < n; p++) data.set(f.mel.subarray(p * PATCH_HOP * BANDS, p * PATCH_HOP * BANDS + size), p * size);
  return { data, n };
}

// ---------- Energy ----------

export function rmsDb(pcm: Float32Array) {
  let s = 0;
  for (let i = 0; i < pcm.length; i++) s += pcm[i] * pcm[i];
  const rms = Math.sqrt(s / Math.max(1, pcm.length));
  return { rms, dbfs: rms > 0 ? 20 * Math.log10(rms) : -Infinity };
}

export function median(a: Float32Array) {
  const s = Array.from(a).sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
}

// ---------- BPM ----------
// shortcut: BPM is spectral-flux onset autocorrelation scored over the first four beat multiples
// with a broad prior (bpm.ts), not Essentia's RhythmExtractor2013; fine for steady 4/4 club music,
// upgrade (a tempo CNN) if broken-beat or half-time tracks come out wrong in the evals.

const FPS = SAMPLE_RATE / HOP; // 62.5 frames/s
// Onset mix (low bands vs all bands) and the weight of the half-beat lag in the tempo score: the
// half-beat term punishes 2:3 and 4:3 candidates, whose half-beat falls between 8th notes.
const TUNE = { half: 0.5, low: 1, all: 0.5 };
const LOW_BANDS = 9; // slaney bands are ~31 Hz wide below 1 kHz: bands 0–8 ≈ 0–280 Hz
/** Autocorrelation lags kept: four beats at 60 BPM, so every candidate down to 60 has 4 multiples. */
export const ACF_LAGS = Math.ceil((FPS * 60 * 4) / 60);

/**
 * Normalised autocorrelation of the onset strength (half-wave-rectified log-mel flux, low bands boosted), lags
 * 0..ACF_LAGS, ac[0] = 1. Null when the audio is too short (< 4 s) or silent. Snippets combine by
 * averaging these (combine.ts), which is steadier than voting on per-snippet BPMs.
 */
export function onsetAcf(f: FrameFeatures): Float64Array | null {
  const n = f.frames;
  if (n < FPS * 4) return null;
  // Two onset curves: the low bands (kick and bass, < ~280 Hz) and all bands. Each is
  // standardised before mixing, so hats (broadband noise, huge log-flux in quiet high bands)
  // can't drown the kick that carries the beat in club music.
  const low = new Float64Array(n), all = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    let s = 0, sl = 0;
    for (let b = 0; b < BANDS; b++) {
      const d = f.mel[i * BANDS + b] - f.mel[(i - 1) * BANDS + b];
      if (d > 0) { s += d; if (b < LOW_BANDS) sl += d; }
    }
    all[i] = s;
    low[i] = sl;
  }
  const standardise = (x: Float64Array) => {
    let m = 0;
    for (let i = 0; i < n; i++) m += x[i];
    m /= n;
    let v = 0;
    for (let i = 0; i < n; i++) { x[i] -= m; v += x[i] * x[i]; }
    const sd = Math.sqrt(v / n);
    if (sd > 0) for (let i = 0; i < n; i++) x[i] /= sd;
  };
  standardise(low);
  standardise(all);
  const onset = new Float64Array(n);
  for (let i = 0; i < n; i++) onset[i] = TUNE.low * low[i] + TUNE.all * all[i];
  const maxLag = Math.min(n - 1, ACF_LAGS);
  const ac = new Float64Array(ACF_LAGS + 1);
  for (let lag = 0; lag <= maxLag; lag++) {
    let s = 0;
    for (let i = lag; i < n; i++) s += onset[i] * onset[i - lag];
    ac[lag] = s / (n - lag);
  }
  if (!(ac[0] > 0)) return null;
  const a0 = ac[0];
  for (let lag = 0; lag <= ACF_LAGS; lag++) ac[lag] /= a0;
  return ac;
}

export type BpmEstimate = {
  bpm: number;
  confidence: number;
  /** The strongest related tempo (half, double, 3:2, 2:3) and how close it came (0–1). */
  alternative: { bpm: number; relation: TempoRelation; ratio: number } | null;
  /** True when the alternative scored ≥ 80% of the winner: show both. */
  ambiguous: boolean;
};

const NO_BPM: BpmEstimate = { bpm: 0, confidence: 0, alternative: null, ambiguous: false };

export function tempoFromAcf(ac: Float64Array | number[] | null): BpmEstimate {
  if (!ac) return NO_BPM;
  const maxLag = ac.length - 1;
  const at = (x: number) => {
    // linear interpolation of the autocorrelation at a fractional lag
    const i = Math.floor(x), t = x - i;
    if (i + 1 > maxLag) return 0;
    return ac[i] * (1 - t) + ac[i + 1] * t;
  };
  // A tempo is as good as the mean autocorrelation at its first four beat multiples. A 2:3 error
  // (150 heard as 100) puts half of 100's multiples on offbeats, so it loses to the true 150;
  // half and double share their multiples, so the prior and the `alternative` handle those.
  const score = (bpm: number) => {
    const lag = (FPS * 60) / bpm;
    let s = 0;
    for (let k = 1; k <= 4; k++) s += at(k * lag);
    return Math.max(0, s / 4 + TUNE.half * at(lag / 2));
  };
  const pick = pickTempo(score);
  if (!pick.bpm) return NO_BPM;

  // Refine on the largest beat multiple in range (finer than the grid), parabolic peak.
  const refine = (bpm: number) => {
    const k = Math.max(1, Math.min(4, Math.floor((maxLag - 2) / ((FPS * 60) / bpm))));
    const target = (FPS * 60 * k) / bpm;
    let peak = Math.round(target), peakVal = -Infinity;
    for (let l = Math.max(2, Math.floor(target - 3)); l <= Math.min(maxLag - 1, Math.ceil(target + 3)); l++) {
      if (ac[l] > peakVal) { peakVal = ac[l]; peak = l; }
    }
    const a = ac[peak - 1], b = ac[peak], c = ac[peak + 1];
    const denom = a - 2 * b + c;
    const offset = denom !== 0 ? (0.5 * (a - c)) / denom : 0;
    const refined = (FPS * 60 * k) / (peak + Math.max(-0.5, Math.min(0.5, offset)));
    return Math.abs(refined / bpm - 1) < 0.02 ? refined : bpm;
  };

  // Confidence: the winner against the average score over the search range (as before).
  let total = 0, count = 0;
  for (let b = 60; b <= 200; b += 1) { total += score(b); count++; }
  const confidence = total > 0 ? score(pick.bpm) / (total / count) : 0;
  const r1 = (x: number) => Math.round(x * 10) / 10;
  return {
    bpm: r1(refine(pick.bpm)),
    confidence: r1(confidence),
    alternative: pick.alternative
      ? { bpm: r1(refine(pick.alternative.bpm)), relation: pick.alternative.relation, ratio: Math.round(pick.alternative.ratio * 100) / 100 }
      : null,
    ambiguous: pick.ambiguous,
  };
}

export function estimateBpm(f: FrameFeatures): BpmEstimate {
  return tempoFromAcf(onsetAcf(f));
}

// ---------- Key ----------
// shortcut: key is peak chroma (4096-point STFT, 100–2000 Hz) correlated with Krumhansl–Kessler
// profiles, not Essentia's KeyExtractor ("bgate"/"edma" profiles, HPCP with harmonics); upgrade if
// key accuracy matters beyond "roughly which key the bassline sits in".

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KK_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function pearson(a: number[], b: number[]) {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

/** Peak chroma profile (12 bins, C first), summed over frames; snippets combine by adding these. */
export function chromaProfile(pcm: Float32Array): number[] {
  const size = 4096, hop = 2048, binHz = SAMPLE_RATE / size;
  const chroma = new Array(12).fill(0);
  // From 100 Hz: below that a 4096-point frame can't separate semitones and the kick smears into
  // the bass. Only spectral peaks count (a crude HPCP), placed at their interpolated frequency.
  const lo = Math.ceil(100 / binHz), hi = Math.floor(2000 / binHz);
  stft(pcm, size, hop, (mag) => {
    let frame = 0;
    for (let k = lo; k <= hi; k++) frame += mag[k];
    if (frame <= 0) return;
    for (let k = lo; k <= hi; k++) {
      const a = mag[k - 1], b = mag[k], c = mag[k + 1];
      if (b <= a || b < c) continue;
      const d = a - 2 * b + c;
      const hz = (k + (d !== 0 ? (0.5 * (a - c)) / d : 0)) * binHz;
      const pc = (((Math.round(12 * Math.log2(hz / 440)) + 9) % 12) + 12) % 12; // 0 = C
      chroma[pc] += b / frame; // each frame counts equally
    }
  });
  return chroma;
}

export type KeyEstimate = { key: string; scale: "major" | "minor"; strength: number };

export function keyFromChroma(chroma: number[]): KeyEstimate {
  let best: KeyEstimate = { key: "C", scale: "major", strength: -1 };
  for (let tonic = 0; tonic < 12; tonic++) {
    const rotated = chroma.map((_, i) => chroma[(i + tonic) % 12]);
    const maj = pearson(rotated, KK_MAJOR), min = pearson(rotated, KK_MINOR);
    if (maj > best.strength) best = { key: NOTES[tonic], scale: "major", strength: maj };
    if (min > best.strength) best = { key: NOTES[tonic], scale: "minor", strength: min };
  }
  return { ...best, strength: Math.round(best.strength * 100) / 100 };
}

/** Every key ranked by fit, best first (the Analyse strip shows the runner-up). Same scores as keyFromChroma. */
export function rankKeys(chroma: number[]): KeyEstimate[] {
  const all: KeyEstimate[] = [];
  for (let tonic = 0; tonic < 12; tonic++) {
    const rotated = chroma.map((_, i) => chroma[(i + tonic) % 12]);
    all.push({ key: NOTES[tonic], scale: "major", strength: pearson(rotated, KK_MAJOR) });
    all.push({ key: NOTES[tonic], scale: "minor", strength: pearson(rotated, KK_MINOR) });
  }
  return all
    .filter((k) => Number.isFinite(k.strength))
    .sort((a, b) => b.strength - a.strength)
    .map((k) => ({ ...k, strength: Math.round(k.strength * 100) / 100 }));
}

export function estimateKey(pcm: Float32Array): KeyEstimate {
  return keyFromChroma(chromaProfile(pcm));
}

// ---------- Model output ----------

/** Mean of per-patch sigmoid activations (one value per class). */
export function meanActivations(acts: Float32Array, nPatches: number, nClasses: number): Float64Array {
  const mean = new Float64Array(nClasses);
  for (let p = 0; p < nPatches; p++) for (let c = 0; c < nClasses; c++) mean[c] += acts[p * nClasses + c];
  for (let c = 0; c < nClasses; c++) mean[c] /= Math.max(1, nPatches);
  return mean;
}

/** The top k classes of a mean activation vector, as % with one decimal. */
export function topFromMean(mean: ArrayLike<number>, classes: string[], k = 5) {
  const finite = Array.from(mean).every((x) => Number.isFinite(x));
  const top = Array.from(mean, (v, i) => ({ style: classes[i], score: v }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => ({ style: x.style, pct: Math.round(x.score * 1000) / 10 }));
  return { top, finite, count: classes.length };
}

/** Mean of per-patch sigmoid activations, then the top k with their class names. */
export function topStyles(acts: Float32Array, nPatches: number, classes: string[], k = 5) {
  return topFromMean(meanActivations(acts, nPatches, classes.length), classes, k);
}
