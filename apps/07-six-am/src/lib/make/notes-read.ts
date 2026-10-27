// Phase 5 note reader (P4, spike for the riskiest assumption, L220): the looped "other" part in
// memory → notes with several at once (stabs, pads, leads), each with pitch, start and length.
// Method: a 186 ms spectrum every 11.6 ms at ~11 kHz; per frame, spectral peaks are tried as
// fundamentals by harmonic sum and taken greedily, each taking its harmonics with it (iterative
// estimation and cancellation, after Klapuri 2003, much simplified); per pitch, runs of frames become
// notes, split where a held pitch is struck again; starts are snapped to the nearest attack of a
// fine onset curve (2.9 ms). Only numbers come out; the audio is read and dropped (C2). Pure TS,
// no model, unit tested (notes-read.test.ts).
import { inScale, pitchClass, type Scale } from "@/lib/synths/theory";
import { decimate, fft, hann, powerSpec, toMono } from "./dsp";

export type ReadNote = { t: number; dur: number; midi: number; vel: number; step: number; offsetMs: number };
export type NotesReading = { notes: ReadNote[]; tuningCents: number };

const N = 2048; // at ~11 kHz: 186 ms, 5.4 Hz bins (a semitone at A2 is 6.5 Hz)
const HARMONICS = 8;
const MAX_POLY = 6;
// Bass bleed is read too (down to 40 Hz) so its harmonics are cancelled, then dropped under 80 Hz.
const LO_HZ = 40, HI_HZ = 1400, OUT_LO_MIDI = 40;
// shortcut: thresholds (salience share 0.12, −42 dB floor, 70 ms minimum note) picked on the synthetic bench; tune on separated real tracks once the hand check exists.
export const NOTE_OPT = { share: 0.12, floorDb: -42, minNoteSec: 0.07, snapSec: 0.04, newNoteMark: 0.15, rejoinSec: 1.5, minShare: 0.06 };

type Peak = { hz: number; amp: number };

/** Spectral peaks of one frame's magnitude (parabolic interpolation on log magnitude). */
function peaksOf(mag: Float64Array, rate: number, floor: number): Peak[] {
  const out: Peak[] = [];
  for (let k = 2; k < mag.length - 1; k++) {
    const m = mag[k];
    if (m < floor || m <= mag[k - 1] || m < mag[k + 1]) continue;
    const a = Math.log(mag[k - 1] + 1e-12), b = Math.log(m + 1e-12), c = Math.log(mag[k + 1] + 1e-12);
    const d = a - 2 * b + c;
    const off = d < 0 ? (0.5 * (a - c)) / d : 0;
    out.push({ hz: ((k + off) * rate) / N, amp: Math.exp(b - 0.25 * (a - c) * off) });
  }
  return out;
}

/** Greedy multi-pitch estimate of one frame: [midi (float), strength]. */
function pitchesOf(peaks: Peak[]): [number, number][] {
  const amp = peaks.map((p) => p.amp);
  const found: [number, number][] = [];
  let first = 0;
  for (let n = 0; n < MAX_POLY; n++) {
    let best = -1, bestS = 0, bestMatch: number[] = [];
    for (let i = 0; i < peaks.length; i++) {
      const f0 = peaks[i].hz;
      if (f0 < LO_HZ || f0 > HI_HZ || amp[i] <= 0) continue;
      let s = 0;
      const match: number[] = [];
      for (let h = 1; h <= HARMONICS; h++) {
        const target = f0 * h;
        let j = -1, dj = Infinity;
        for (let q = 0; q < peaks.length; q++) { const d = Math.abs(peaks[q].hz - target); if (d < dj) { dj = d; j = q; } }
        if (j >= 0 && dj <= target * 0.025 && amp[j] > 0) { s += amp[j] / Math.sqrt(h); match.push(j); } else match.push(-1);
      }
      if (s > bestS) { best = i; bestS = s; bestMatch = match; }
    }
    if (best < 0 || (first && bestS < NOTE_OPT.share * first)) break;
    if (!first) first = bestS;
    found.push([69 + 12 * Math.log2(peaks[best].hz / 440), bestS]);
    // Cancel its harmonics: the fundamental fully, the others down to what's left above a smooth
    // harmonic envelope (a harmonic shared with another note keeps the excess).
    const a1 = amp[best];
    bestMatch.forEach((j, h) => {
      if (j < 0) return;
      const expected = a1 / Math.pow(h + 1, 0.7) * 1.5;
      amp[j] = h === 0 ? 0 : Math.max(0, amp[j] - expected);
    });
  }
  return found;
}

/**
 * Attacks: peaks of a fine onset curve (2.9 ms hops, a 46 ms window to decide, 23 ms to time), the summed rise of log energy in 12 bands between
 * 150 Hz and 4 kHz (bands, not bins, so partials beating inside a held note don't look like
 * attacks), above a local median. Times (s) and strengths (0–1 of the loudest).
 */
export function attacks(x: Float32Array, rate: number, n = 512): { t: number; s: number }[] {
  const hop = Math.max(1, Math.round(rate * 0.0029)), LAG = n >= 512 ? 4 : 2;
  const { frames, bins, p } = powerSpec(x, n, hop);
  const NBAND = 12, lo = Math.log(150), hi = Math.log(4000);
  const band = new Int8Array(bins).fill(-1);
  for (let k = 1; k < bins; k++) { const f = (k * rate) / n; if (f >= 150 && f < 4000) band[k] = Math.floor(((Math.log(f) - lo) / (hi - lo)) * NBAND); }
  const E = new Float64Array(frames * NBAND);
  let loud = 0;
  for (let f = 0; f < frames; f++) for (let k = 1; k < bins; k++) if (band[k] >= 0) { E[f * NBAND + band[k]] += p[f * bins + k]; loud = Math.max(loud, E[f * NBAND + band[k]]); }
  const floor = loud * 1e-6;
  const flux = new Float64Array(frames);
  for (let f = LAG; f < frames; f++) {
    let s = 0;
    for (let b = 0; b < NBAND; b++) s += Math.max(0, Math.log10(E[f * NBAND + b] + floor) - Math.log10(E[(f - LAG) * NBAND + b] + floor));
    flux[f] = s;
  }
  // Minus the local median (±100 ms), so a steady wobble doesn't count.
  const W = Math.round(0.1 / (hop / rate));
  const nov = new Float64Array(frames);
  const buf: number[] = [];
  for (let f = 0; f < frames; f++) {
    buf.length = 0;
    for (let j = Math.max(0, f - W); j < Math.min(frames, f + W); j += 4) buf.push(flux[j]);
    buf.sort((u, v) => u - v);
    nov[f] = Math.max(0, flux[f] - buf[buf.length >> 1]);
  }
  let top = 0;
  for (const v of nov) top = Math.max(top, v);
  const out: { t: number; s: number }[] = [];
  if (!top) return out;
  const gap = Math.round(0.03 / (hop / rate));
  for (let f = 1; f < frames - 1; f++) {
    if (nov[f] < 0.1 * top || nov[f] < nov[f - 1] || nov[f] < nov[f + 1]) continue;
    const last = out[out.length - 1];
    const t = ((f - LAG / 2) * hop) / rate, sv = nov[f] / top;
    if (last && t - last.t < gap * (hop / rate)) { if (sv > last.s) { last.t = t; last.s = sv; } continue; }
    out.push({ t, s: sv });
  }
  return out;
}

/**
 * Reads a looped pitched part ("other"): notes with several at once. `key` (optional) drops weak
 * out-of-key pitches. Steps are 16ths from `loopStartSec`.
 */
export function readNotes(left: Float32Array, right: Float32Array | undefined, rate: number, bpm: number, key?: { key: string; scale: Scale }, loopStartSec = 0): NotesReading {
  const mono = toMono(left, right);
  const dec = Math.max(1, Math.round(rate / 11025));
  const x = decimate(mono, dec), r = rate / dec;
  const hop = Math.round(r * 0.0116);
  const frames = Math.floor(x.length / hop);
  if (frames < 8) return { notes: [], tuningCents: 0 };
  // Magnitude frames and the loop's loudest bin (for the floor).
  const w = hann(N), re = new Float64Array(N), im = new Float64Array(N);
  const mags: Float64Array[] = [];
  let loud = 0;
  for (let f = 0; f < frames; f++) {
    const at = f * hop - N / 2;
    for (let i = 0; i < N; i++) { const j = at + i; re[i] = j >= 0 && j < x.length ? x[j] * w[i] : 0; im[i] = 0; }
    fft(re, im);
    const m = new Float64Array(N / 2 + 1);
    for (let k = 0; k <= N / 2; k++) { m[k] = Math.hypot(re[k], im[k]); if (m[k] > loud) loud = m[k]; }
    mags.push(m);
  }
  if (loud < 1e-3) return { notes: [], tuningCents: 0 };
  const floor = loud * Math.pow(10, NOTE_OPT.floorDb / 20);
  const perFrame = mags.map((m) => pitchesOf(peaksOf(m, r, floor)));

  // Tuning: the median offset from equal temperament (a slightly sharp or flat track).
  const devs: number[] = [];
  for (const fr of perFrame) for (const [m] of fr) devs.push(m - Math.round(m));
  devs.sort((a, b) => a - b);
  const tune = devs.length ? devs[Math.floor(devs.length / 2)] : 0;

  // Per pitch, its strength per frame.
  const act = new Map<number, Float64Array>();
  perFrame.forEach((fr, f) => {
    for (const [m, s] of fr) {
      const midi = Math.round(m - tune);
      let a = act.get(midi);
      if (!a) { a = new Float64Array(frames); act.set(midi, a); }
      a[f] = Math.max(a[f], s);
    }
  });
  const tonic = key ? pitchClass(key.key) : null;
  const hopSec = hop / r, half = N / 2 / r;
  const marks = attacks(x, r), fine = attacks(x, r, 256);
  /** Is there an attack within the snap window of a (window-centred) time? A pitch that comes back without one is the same note. */
  const nearMark = (t: number) => marks.some((m) => m.s >= NOTE_OPT.newNoteMark && Math.abs(m.t - t) <= NOTE_OPT.snapSec + half * 0.5);
  const sps = 60 / bpm / 4;
  const notes: ReadNote[] = [];
  let strongest = 0;
  for (const a of act.values()) for (const v of a) strongest = Math.max(strongest, v);
  for (const [midi, a] of act) {
    // Bridge 2-frame gaps.
    for (let f = 1; f < frames - 2; f++) if (!a[f] && a[f - 1] && (a[f + 1] || a[f + 2])) a[f] = Math.min(a[f - 1], a[f + 1] || a[f + 2]);
    let f = 0;
    while (f < frames) {
      if (!a[f]) { f++; continue; }
      let end = f;
      while (end + 1 < frames && a[end + 1]) end++;
      // Split where a held pitch is struck again: a dip then a rise of 6 dB or more.
      const cuts = [f];
      let lo = f;
      for (let j = f + 1; j <= end; j++) {
        if (a[j] < a[lo]) lo = j;
        let peakBefore = 0;
        for (let q = cuts[cuts.length - 1]; q <= lo; q++) peakBefore = Math.max(peakBefore, a[q]);
        if (a[j] > 2 * a[lo] && a[lo] < 0.7 * peakBefore && lo > cuts[cuts.length - 1] + 3 && nearMark(lo * hopSec)) { cuts.push(lo); lo = j; }
      }
      cuts.push(end + 1);
      for (let c = 0; c + 1 < cuts.length; c++) {
        const s0 = cuts[c], s1 = cuts[c + 1] - 1;
        let peak = 0, pf = s0;
        for (let q = s0; q <= Math.min(s1, s0 + 14); q++) if (a[q] > peak) { peak = a[q]; pf = q; }
        // The window's centre crosses a step onset where the level is half its peak.
        let on = s0;
        while (on < pf && a[on] < 0.5 * peak) on++;
        let t = on * hopSec;
        const endT = Math.max(t, (s1 + 1) * hopSec - half * 0.5);
        if (endT - t < NOTE_OPT.minNoteSec && s1 - s0 < 6) continue;
        if (tonic !== null && !inScale(midi, tonic, key!.scale) && peak < 0.3 * strongest) continue;
        if (midi < OUT_LO_MIDI || peak < NOTE_OPT.minShare * strongest) continue;
        // A pitch that comes back with no attack near (a held pad's beating, a dropout) extends
        // the note before it; one that appears with no attack is dropped.
        const prev = notes.findLast((q) => q.midi === midi);
        if (!nearMark(t)) {
          if (prev && t - (prev.t + prev.dur) < NOTE_OPT.rejoinSec) prev.dur = Math.max(prev.dur, endT - prev.t);
          // A pitch that appears with no attack at all is a leftover harmonic of a held note.
          continue;
        }
        // Snap to the nearest attack, timed by the finer curve's strongest peak within 20 ms of it.
        let best: { t: number; s: number } | null = null;
        for (const m of marks) if (m.s >= NOTE_OPT.newNoteMark && Math.abs(m.t - t) <= NOTE_OPT.snapSec + half * 0.5 && (!best || Math.abs(m.t - t) < Math.abs(best.t - t))) best = m;
        if (best) {
          let fb: { t: number; s: number } | null = null;
          for (const m of fine) if (Math.abs(m.t - best.t) <= 0.02 && (!fb || m.s > fb.s)) fb = m;
          t = fb ? fb.t : best.t;
        }
        const step = Math.round((t - loopStartSec) / sps);
        notes.push({ t, dur: Math.max(0.03, endT - t), midi, vel: Math.round(Math.min(1, peak / strongest) * 100) / 100, step, offsetMs: Math.round((t - loopStartSec - step * sps) * 10000) / 10 });
      }
      f = end + 1;
    }
  }
  notes.sort((p, q) => p.t - q.t || p.midi - q.midi);
  return { notes, tuningCents: Math.round(tune * 100) };
}
