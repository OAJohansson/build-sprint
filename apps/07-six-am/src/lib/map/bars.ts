// Frame features on the bar grid: per-bar loudness and the five layer ESTIMATES (types.ts says
// how each is read). Pure: takes the frame series and the grid, returns numbers.
import { CH, CHANNELS } from "./frames";
import { BEATS_PER_BAR, LAYERS, type BarFeatures, type LayerEstimates, type LayerName } from "./types";

/** Frame features on a uniform track-time axis: frame i is at t0 + i / fps seconds. */
export type FrameSeries = { fps: number; t0: number; n: number; data: Float32Array };

/** What one bar measured, before it's turned into 0–1 values (kept for the debug page). */
export type BarRaw = {
  totalDb: number;
  /** Sub-band peak at the beats over the bar's median, dB (kick). */
  kickPulseDb: number;
  /** Mean sub-band peak at the beats, dB (is anything loud there at all?). */
  kickPeakDb: number;
  /** Broadband onset peak at the beats, and the bar's 90th percentile away from them (a kick's
   *  click still stands out on all four beats when a rolling sub bass hides its thump). */
  beatFlux: number;
  offFlux: number;
  /** Median low-band level away from the beats, dB (bass). */
  lowSustainDb: number;
  lowPeakDb: number;
  midDb: number;
  highDb: number;
  highFlux: number;
  tonal: number;
  vocDb: number;
  vocFlux: number;
};

const clamp01 = (x: number) => (Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0);
const r3 = (x: number) => Math.round(x * 1000) / 1000;

function quantile(values: number[], q: number): number {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return Number.NaN;
  const i = Math.min(v.length - 1, Math.max(0, Math.round(q * (v.length - 1))));
  return v[i];
}

const frameAt = (s: FrameSeries, t: number) => Math.round((t - s.t0) * s.fps);
const val = (s: FrameSeries, i: number, ch: number) => s.data[i * CHANNELS + ch];

/** Mean of each channel between two times (the downbeat search's rows). */
export function meanRow(s: FrameSeries, t0: number, t1: number, channels: number[]): number[] {
  const a = Math.max(0, frameAt(s, t0)), b = Math.min(s.n, frameAt(s, t1));
  const out = channels.map(() => 0);
  if (b <= a) return out;
  for (let i = a; i < b; i++) for (let k = 0; k < channels.length; k++) out[k] += val(s, i, channels[k]);
  return out.map((x) => x / (b - a));
}

/** Raw numbers for each bar of the grid. */
export function barRaws(s: FrameSeries, bpm: number, originSec: number, bars: number): BarRaw[] {
  const beat = 60 / bpm, bar = beat * BEATS_PER_BAR;
  const out: BarRaw[] = [];
  for (let j = 0; j < bars; j++) {
    const start = originSec + j * bar;
    const a = Math.max(0, frameAt(s, start)), b = Math.min(s.n, frameAt(s, start + bar));
    const nearBeat = new Uint8Array(Math.max(0, b - a));
    const pulses: number[] = [], peaks: number[] = [], fluxPeaks: number[] = [];
    const sub: number[] = [];
    for (let i = a; i < b; i++) sub.push(val(s, i, CH.sub));
    const subMedian = quantile(sub, 0.5);
    for (let k = 0; k < BEATS_PER_BAR; k++) {
      const tb = start + k * beat;
      const w0 = Math.max(a, frameAt(s, tb - 0.03)), w1 = Math.min(b, frameAt(s, tb + 0.07));
      let peak = -Infinity;
      let fp = 0;
      for (let i = w0; i <= w1 && i < b; i++) { peak = Math.max(peak, val(s, i, CH.sub)); fp = Math.max(fp, val(s, i, CH.flux)); }
      fluxPeaks.push(fp);
      if (Number.isFinite(peak)) { pulses.push(peak - subMedian); peaks.push(peak); }
      // Frames the kick rings into: left out of the bass reading.
      const m0 = Math.max(a, frameAt(s, tb - 0.02)), m1 = Math.min(b - 1, frameAt(s, tb + 0.14));
      for (let i = m0; i <= m1; i++) nearBeat[i - a] = 1;
    }
    const lowAway: number[] = [], low: number[] = [], fluxAway: number[] = [];
    let total = 0, mid = 0, high = 0, hf = 0, tonal = 0, voc = 0, vf = 0;
    for (let i = a; i < b; i++) {
      const l = val(s, i, CH.low);
      low.push(l);
      if (!nearBeat[i - a]) { lowAway.push(l); fluxAway.push(val(s, i, CH.flux)); }
      total += val(s, i, CH.total); mid += val(s, i, CH.mid); high += val(s, i, CH.high);
      hf += val(s, i, CH.highFlux); tonal += val(s, i, CH.tonal); voc += val(s, i, CH.voc); vf += val(s, i, CH.vocFlux);
    }
    const n = Math.max(1, b - a);
    out.push({
      totalDb: total / n,
      kickPulseDb: pulses.length ? pulses.reduce((x, y) => x + y, 0) / pulses.length : 0,
      kickPeakDb: peaks.length ? peaks.reduce((x, y) => x + y, 0) / peaks.length : -120,
      beatFlux: fluxPeaks.length ? fluxPeaks.reduce((x, y) => x + y, 0) / fluxPeaks.length : 0,
      offFlux: fluxAway.length ? quantile(fluxAway, 0.9) : 0,
      lowSustainDb: quantile(lowAway.length ? lowAway : low, 0.5),
      lowPeakDb: quantile(low, 0.9),
      midDb: mid / n, highDb: high / n, highFlux: hf / n, tonal: tonal / n, vocDb: voc / n, vocFlux: vf / n,
    });
  }
  return out;
}

// shortcut: the dB thresholds below are first guesses from how mastered club tracks sit (kick peaks
// 6–20 dB over the bar's median, bass within ~10–25 dB of the kick); calibrate them on the
// validation tracks' debug numbers (the /map page shows them) once reference layers exist.
/** Raw bars → per-bar loudness (0–1 within the track) and the five layer estimates. */
export function barFeatures(raws: BarRaw[]): { energy: number[]; layers: LayerEstimates; bars: BarFeatures[] } {
  const col = (f: (r: BarRaw) => number) => raws.map(f);
  const totals = col((r) => r.totalDb);
  const lo = quantile(totals, 0.05), hi = quantile(totals, 0.95);
  const energy = totals.map((t) => clamp01(hi > lo ? (t - lo) / (hi - lo) : 1));
  const refLow = quantile(col((r) => r.lowPeakDb), 0.9);
  const refKick = quantile(col((r) => r.kickPeakDb), 0.9);
  const refMid = quantile(col((r) => r.midDb), 0.9);
  const refHigh = quantile(col((r) => r.highDb), 0.9);
  const refVoc = quantile(col((r) => r.vocDb), 0.9);
  const vf = col((r) => r.vocFlux);
  const vLo = quantile(vf, 0.3), vHi = quantile(vf, 0.95);
  // A track whose vocal-range movement barely varies has nothing that stands out as a voice.
  const vSpread = vHi > 0 ? (vHi - vLo) / vHi : 0;

  const values: Record<LayerName, number[]> = { kick: [], bass: [], chords: [], hats: [], vocals: [] };
  raws.forEach((r, j) => {
    const quiet = energy[j] < 0.02 && r.totalDb < lo - 20; // silence: nothing plays
    // A pulse on the beats only counts as a kick when the sub band is loud there (a click in a quiet
    // breakdown makes a big pulse over a near-silent median).
    // Either reading can show the kick: its thump over the bar (no bass in the way) or its click on
    // all four beats over everything else (a rolling sub bass hides the thump).
    const thump = clamp01((r.kickPulseDb - 2) / 6), click = clamp01((r.beatFlux - r.offFlux - 1) / 5);
    values.kick.push(quiet ? 0 : Math.max(thump, click) * clamp01((r.kickPeakDb - (refKick - 24)) / 12));
    values.bass.push(quiet ? 0 : clamp01((r.lowSustainDb - (refLow - 28)) / 18));
    values.hats.push(quiet ? 0 : clamp01((r.highDb - (refHigh - 15)) / 12));
    values.chords.push(quiet ? 0 : clamp01((r.midDb - (refMid - 15)) / 12) * clamp01((r.tonal - 0.3) / 0.4));
    const presence = clamp01((r.vocDb - (refVoc - 15)) / 12);
    values.vocals.push(quiet ? 0 : clamp01(vHi > vLo ? (r.vocFlux - vLo) / (vHi - vLo) : 0) * presence * clamp01(vSpread * 2));
  });
  for (const k of LAYERS) values[k] = values[k].map(r3);
  const layers: LayerEstimates = {
    kind: "estimate",
    method: "frequency bands of the full mix, not separated parts",
    ...values,
  };
  const bars = raws.map((_, j) => ({ energy: r3(energy[j]), kick: values.kick[j], bass: values.bass[j], chords: values.chords[j], hats: values.hats[j], vocals: values.vocals[j] }));
  return { energy: energy.map(r3), layers, bars };
}
