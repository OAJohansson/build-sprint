// Small DSP helpers for the Phase 5 readers (drums, notes): an in-place radix-2 FFT, a cached Hann
// window and a magnitude spectrogram. Pure TS, no Web Audio, so readers run in a worker and in Node.

/** In-place radix-2 FFT (length a power of two). */
export function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { const tr = re[i]; re[i] = re[j]; re[j] = tr; const ti = im[i]; im[i] = im[j]; im[j] = ti; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1, ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < half; k++) {
        const a = i + k, b = a + half;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}

const hanns = new Map<number, Float64Array>();
export function hann(n: number): Float64Array {
  let w = hanns.get(n);
  if (!w) { w = new Float64Array(n); for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n); hanns.set(n, w); }
  return w;
}

/**
 * Power spectrogram: frame f is centred on sample f·hop (zero-padded at the edges), bins 0…n/2.
 * Returns a flat array frames × (n/2 + 1).
 */
export function powerSpec(x: Float32Array, n: number, hop: number): { frames: number; bins: number; p: Float32Array } {
  const frames = Math.max(0, Math.floor(x.length / hop));
  const bins = n / 2 + 1;
  const p = new Float32Array(frames * bins);
  const w = hann(n), re = new Float64Array(n), im = new Float64Array(n);
  for (let f = 0; f < frames; f++) {
    const at = f * hop - n / 2;
    for (let i = 0; i < n; i++) { const j = at + i; re[i] = j >= 0 && j < x.length ? x[j] * w[i] : 0; im[i] = 0; }
    fft(re, im);
    const o = f * bins;
    for (let k = 0; k < bins; k++) p[o + k] = re[k] * re[k] + im[k] * im[k];
  }
  return { frames, bins, p };
}

export const dB = (pow: number) => 10 * Math.log10(pow + 1e-20);

/** Mono mix of one or two channels. */
export function toMono(left: Float32Array, right?: Float32Array): Float32Array {
  if (!right) return left;
  const n = Math.min(left.length, right.length), m = new Float32Array(n);
  for (let i = 0; i < n; i++) m[i] = (left[i] + right[i]) / 2;
  return m;
}

/** Every `k`th sample after a windowed-sinc low-pass at 0.45 of the new rate (so hats and noise above it don't fold into the note range). */
export function decimate(x: Float32Array, k: number): Float32Array {
  if (k <= 1) return x;
  const taps = 16 * k + 1, mid = (taps - 1) / 2, fc = 0.45 / k;
  const h = new Float64Array(taps);
  let sum = 0;
  for (let i = 0; i < taps; i++) {
    const t = i - mid;
    const sinc = t === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * t) / (Math.PI * t);
    h[i] = sinc * (0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (taps - 1)) + 0.08 * Math.cos((4 * Math.PI * i) / (taps - 1)));
    sum += h[i];
  }
  const out = new Float32Array(Math.floor(x.length / k));
  for (let o = 0; o < out.length; o++) {
    const c = o * k;
    let s = 0;
    for (let i = 0; i < taps; i++) { const j = c + i - mid; if (j >= 0 && j < x.length) s += x[j] * h[i]; }
    out[o] = s / sum;
  }
  return out;
}
