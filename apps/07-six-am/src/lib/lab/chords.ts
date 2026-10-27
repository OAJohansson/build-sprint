// Chord estimates for the Lab's chord lane (L154, "Chords est."): one chord per 8 bars, read from
// the chroma (energy per pitch class) of the separated bass + other parts while they play. Audio is
// read into 12 numbers per frame and dropped; only chord NAMES are kept or saved (L143: words and
// measurements, never audio). Pure, no DOM.

export const PITCHES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;
export const BARS_PER_CHORD = 8;
const FFT = 8192;
// shortcut: triads only, contrast 1.6 picked on one track (Mason Flint remix, read as Gm); tune on the
// validation set with data-evals once the chord lane is on screen, add 7ths/sus if they mislead.
/** How much louder a chord's notes must be than the rest, on average. */
const CONTRAST = 1.6;
const LO_HZ = 65; // C2
const HI_HZ = 1000; // above this, overtones blur the chord

function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}

const binPc = new Map<number, Int8Array>();
/** Pitch class of each FFT bin at a rate (−1 outside 65 Hz–2 kHz). */
function pcOfBins(rate: number) {
  let t = binPc.get(rate);
  if (t) return t;
  t = new Int8Array(FFT / 2 + 1).fill(-1);
  for (let k = 1; k <= FFT / 2; k++) {
    const f = (k * rate) / FFT;
    if (f < LO_HZ || f > HI_HZ) continue;
    const midi = 69 + 12 * Math.log2(f / 440);
    t[k] = ((Math.round(midi) % 12) + 12) % 12;
  }
  binPc.set(rate, t);
  return t;
}

/**
 * Chroma frames of mono audio: one 12-vector per hop (FFT 8192, half overlap), each frame's centre
 * time in seconds from the first sample. Only spectral peaks count (so the many bins of a noisy
 * upper range don't flatten it), and each frame is scaled to its loudest pitch class (so loud
 * frames don't outvote the rest). Silent frames are all zero.
 */
export function chromaFrames(mono: Float32Array, rate: number): { t: number; chroma: number[] }[] {
  const out: { t: number; chroma: number[] }[] = [];
  const pc = pcOfBins(rate);
  const re = new Float64Array(FFT), im = new Float64Array(FFT);
  for (let at = 0; at + FFT <= mono.length; at += FFT / 2) {
    for (let i = 0; i < FFT; i++) { re[i] = mono[at + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / FFT)); im[i] = 0; }
    fft(re, im);
    const c = new Array(12).fill(0);
    const mag = (k: number) => Math.hypot(re[k], im[k]);
    for (let k = 2; k < FFT / 2; k++) {
      if (pc[k] < 0) continue;
      const m = mag(k);
      if (m > mag(k - 1) && m >= mag(k + 1)) c[pc[k]] += m;
    }
    const top = Math.max(...c);
    if (top > 1e-6) for (let i = 0; i < 12; i++) c[i] /= top;
    out.push({ t: (at + FFT / 2) / rate, chroma: c });
  }
  return out;
}

/**
 * The chord a chroma vector most looks like: the major or minor triad whose three notes hold the
 * most energy over the rest ("Am", "F", "C#"). "" when nothing stands out (no harmony, or noise).
 */
export function chordFromChroma(chroma: number[]): string {
  const sum = chroma.reduce((a, b) => a + b, 0);
  if (!(sum > 0)) return "";
  const v = chroma.map((x) => x / sum);
  let best = "", bestScore = -Infinity;
  for (let root = 0; root < 12; root++) {
    for (const [third, suffix] of [[4, ""], [3, "m"]] as const) {
      const tones = [root, (root + third) % 12, (root + 7) % 12];
      const inside = tones.reduce((a, t) => a + v[t], 0);
      // Root weighted a little more: a bass note on the root settles major-vs-relative-minor ties.
      const score = inside + 0.25 * v[root] - (1 - inside) * 0.5;
      if (score > bestScore) { bestScore = score; best = PITCHES[root] + suffix; }
    }
  }
  // A chord's three notes stand out from the other nine; a flat chroma (noise, drums) doesn't.
  const root = PITCHES.indexOf(best.replace("m", "") as (typeof PITCHES)[number]);
  const tones = [root, (root + (best.endsWith("m") ? 3 : 4)) % 12, (root + 7) % 12];
  const inMean = tones.reduce((a, t) => a + v[t], 0) / 3;
  const outMean = (1 - tones.reduce((a, t) => a + v[t], 0)) / 9;
  return inMean >= CONTRAST * outMean ? best : "";
}

/** Index of the 8-bar chord cell a track time falls in (null before the first downbeat). */
export function chordCell(sec: number, bpm: number, originSec: number) {
  const bar = (sec - originSec) / ((60 / bpm) * 4);
  return bar < 0 ? null : Math.floor(bar / BARS_PER_CHORD);
}

/**
 * Collects chroma per 8-bar cell as the Lab plays and names a cell's chord once at least half of
 * the cell has been heard. `cells[i]`: null (not heard yet), "" (heard, no clear chord) or a name.
 */
export class ChordCells {
  readonly cells: (string | null)[];
  private sums: number[][];
  private heard: number[];

  constructor(readonly bars: number, private bpm: number, private originSec: number, known?: (string | null)[]) {
    const n = Math.ceil(bars / BARS_PER_CHORD);
    this.cells = Array.from({ length: n }, (_, i) => known?.[i] ?? null);
    this.sums = Array.from({ length: n }, () => new Array(12).fill(0));
    this.heard = new Array(n).fill(0);
  }

  private get cellSec() { return (60 / this.bpm) * 4 * BARS_PER_CHORD; }

  /** Adds mono audio that starts at track time `startSec`. Returns the cells that got a (new) name. */
  add(mono: Float32Array, rate: number, startSec: number): number[] {
    const changed: number[] = [];
    const hopS = FFT / 2 / rate;
    const touched = new Set<number>();
    for (const f of chromaFrames(mono, rate)) {
      const i = chordCell(startSec + f.t, this.bpm, this.originSec);
      if (i === null || i >= this.cells.length) continue;
      f.chroma.forEach((x, k) => (this.sums[i][k] += x));
      this.heard[i] += hopS;
      touched.add(i);
    }
    for (const i of touched) {
      if (this.heard[i] < this.cellSec / 2) continue;
      const name = chordFromChroma(this.sums[i]);
      if (name !== this.cells[i]) { this.cells[i] = name; changed.push(i); }
    }
    return changed;
  }
}
