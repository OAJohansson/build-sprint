// Frame features for the arrangement map: mono PCM at the capture rate in, a few numbers per
// ~21 ms frame out. Streaming (push chunks as they arrive, nothing kept but a one-frame tail), plain
// TS with no DOM so it runs in the map worker. PCM is never stored: each chunk is read and dropped.

/** Feature channels per frame (energies in dB, fluxes in dB/frame, tonal 0–1). */
export const CH = {
  /** 40–250 Hz energy: kick and bass together. */
  low: 0,
  /** 40–120 Hz energy: where the kick's thump sits. */
  sub: 1,
  /** 250–2000 Hz energy: chords, vocals' body, claps. */
  mid: 2,
  /** 1–4 kHz energy: vocal presence range. */
  voc: 3,
  /** 6–16 kHz energy (capped at Nyquist): hats, shakers, cymbals. */
  high: 4,
  /** 40 Hz–16 kHz energy. */
  total: 5,
  /** Rise of the sub band over the previous frame (kick onsets). */
  subFlux: 6,
  /** Summed per-bin rises in the high band (hat onsets). */
  highFlux: 7,
  /** Summed per-bin rises up to 8 kHz (any onset). */
  flux: 8,
  /** 1 − spectral flatness over 250–4000 Hz: tonal (chords, voice) vs noisy (hats, claps). */
  tonal: 9,
  /** Summed per-bin rises over 1–4 kHz in tonal bins (moving pitched content). */
  vocFlux: 10,
} as const;
export const CHANNELS = 11;

const db = (e: number) => 10 * Math.log10(e + 1e-12);

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

/** Frame size for a sample rate: ~43–46 ms at 44.1/48 kHz, half-overlapped. */
export const frameSize = (rate: number) => (rate >= 32000 ? 2048 : 1024);

export class FrameAnalyser {
  readonly size: number;
  readonly hop: number;
  readonly fps: number;
  private win: Float64Array;
  private re: Float64Array;
  private im: Float64Array;
  private logMag: Float64Array;
  private prevLog: Float64Array | null = null;
  private prevSub = 0;
  private tail = new Float32Array(0);
  private bins: { lo: number; hi: number }[];
  /** Frames emitted so far; frame i is centred on sample i·hop + size/2 of the stream. */
  count = 0;

  constructor(readonly rate: number) {
    this.size = frameSize(rate);
    this.hop = this.size / 2;
    this.fps = rate / this.hop;
    this.win = new Float64Array(this.size);
    for (let i = 0; i < this.size; i++) this.win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / this.size);
    this.re = new Float64Array(this.size);
    this.im = new Float64Array(this.size);
    this.logMag = new Float64Array(this.size / 2 + 1);
    const binHz = rate / this.size, nyq = this.size / 2;
    const b = (lo: number, hi: number) => ({ lo: Math.max(1, Math.round(lo / binHz)), hi: Math.min(nyq, Math.round(hi / binHz)) });
    // low, sub, mid, voc, high, total, flux range (≤ 8 kHz), tonal range
    this.bins = [b(40, 250), b(40, 120), b(250, 2000), b(1000, 4000), b(6000, 16000), b(40, 16000), b(40, 8000), b(250, 4000)];
  }

  /** Time of frame i's centre in seconds from the stream's first sample. */
  frameTime(i: number) {
    return (i * this.hop + this.size / 2) / this.rate;
  }

  /** Feed the next chunk; returns the features of every frame it completed (CHANNELS per frame). */
  push(chunk: Float32Array): Float32Array {
    const buf = new Float32Array(this.tail.length + chunk.length);
    buf.set(this.tail);
    buf.set(chunk, this.tail.length);
    const n = buf.length >= this.size ? Math.floor((buf.length - this.size) / this.hop) + 1 : 0;
    const out = new Float32Array(n * CHANNELS);
    for (let f = 0; f < n; f++) this.frame(buf, f * this.hop, out, f * CHANNELS);
    this.tail = buf.slice(n * this.hop); // under one frame of samples, carried to the next chunk
    this.count += n;
    return out;
  }

  private frame(buf: Float32Array, at: number, out: Float32Array, o: number) {
    const { re, im, win, size, logMag } = this;
    for (let k = 0; k < size; k++) { re[k] = buf[at + k] * win[k]; im[k] = 0; }
    fftInPlace(re, im);
    const [low, sub, mid, voc, high, total, fluxR, tonalR] = this.bins;
    const power = (k: number) => re[k] * re[k] + im[k] * im[k];
    const band = (r: { lo: number; hi: number }) => { let s = 0; for (let k = r.lo; k <= r.hi; k++) s += power(k); return s; };
    for (let k = 0; k <= size / 2; k++) logMag[k] = 10 * Math.log10(power(k) + 1e-12);

    const subDb = db(band(sub));
    out[o + CH.low] = db(band(low));
    out[o + CH.sub] = subDb;
    out[o + CH.mid] = db(band(mid));
    out[o + CH.voc] = db(band(voc));
    out[o + CH.high] = high.hi > high.lo ? db(band(high)) : -120;
    out[o + CH.total] = db(band(total));
    out[o + CH.subFlux] = this.prevLog ? Math.max(0, subDb - this.prevSub) : 0;

    // Flatness over the tonal range: geometric over arithmetic mean of power.
    let logSum = 0, lin = 0;
    for (let k = tonalR.lo; k <= tonalR.hi; k++) { const p = power(k) + 1e-12; logSum += Math.log(p); lin += p; }
    const nT = tonalR.hi - tonalR.lo + 1;
    const flat = Math.exp(logSum / nT) / (lin / nT);
    out[o + CH.tonal] = 1 - Math.min(1, flat * 4); // ×4: music's flatness rarely exceeds 0.25

    let flux = 0, hf = 0, vf = 0;
    const prev = this.prevLog;
    if (prev) {
      for (let k = fluxR.lo; k <= fluxR.hi; k++) { const d = logMag[k] - prev[k]; if (d > 0) flux += Math.min(d, 30); }
      for (let k = high.lo; k <= high.hi; k++) { const d = logMag[k] - prev[k]; if (d > 0) hf += Math.min(d, 30); }
      // Pitched movement: rises in bins that stand out from their neighbours (spectral peaks).
      for (let k = Math.max(voc.lo, 2); k <= Math.min(voc.hi, size / 2 - 2); k++) {
        const peak = logMag[k] > logMag[k - 2] + 6 && logMag[k] > logMag[k + 2] + 6;
        const d = logMag[k] - prev[k];
        if (peak && d > 0) vf += Math.min(d, 30);
      }
      const norm = (r: { lo: number; hi: number }) => Math.max(1, r.hi - r.lo + 1);
      flux /= norm(fluxR); hf /= norm(high); vf /= norm(voc);
    }
    out[o + CH.flux] = flux;
    out[o + CH.highFlux] = hf;
    out[o + CH.vocFlux] = vf;
    this.prevSub = subDb;
    // Swap buffers: this frame's spectrum becomes the previous one.
    const spare = this.prevLog ?? new Float64Array(logMag.length);
    this.prevLog = logMag;
    this.logMag = spare;
  }
}
