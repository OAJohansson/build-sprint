// Phase 5 drum reader (P3, spike for L216): the looped drum part in memory → three step patterns
// (kick, clap/snare, hats) on the 16th grid, each hit's timing offset kept (swing). Method: a band
// spectrogram (17 log bands, 2.9 ms hops) factorised into three drum templates plus one free
// "everything else" template (semi-adaptive NMF, after Dittmar & Gärtner 2014 and Wu et al. 2018's
// review of drum transcription), onsets peak-picked per row from the activations. Only numbers
// come out; the audio is read and dropped (C2). Pure TS, unit tested (drums-read.test.ts).
import { powerSpec, toMono } from "./dsp";

export type DrumRow = "kick" | "clap" | "hats";
/** `vel`: against the row's biggest hit (0–1); `db`: the hit's size against the loop's biggest hit
 *  of any row (Make uses it to tell faint bleed from real hits, L225). */
export type DrumHit = { t: number; row: DrumRow; vel: number; db?: number };
export type StepHit = { step: number; offsetMs: number; vel: number; db?: number };
export type DrumReading = {
  hits: DrumHit[];
  rows: Record<DrumRow, StepHit[]>;
  steps: number;
  /** Where the 16th grid's step 0 sits against the given loop start (ms; + = later). */
  gridMs: number;
  /** Median delay of the odd 16ths against the even ones (ms): 0 = straight. */
  swingMs: number;
};

const EDGES = [30, 60, 90, 130, 180, 250, 350, 500, 700, 1000, 1400, 2000, 2800, 4000, 5600, 8000, 11000, 16000];
const NB = EDGES.length - 1;
const ROWS: DrumRow[] = ["kick", "clap", "hats"];

/** Time slices each NMF column stacks (s after the frame): an attack, its body, its tail. */
const SLICES = [0, 0.015, 0.05];
const D = NB * SLICES.length;

/** Prior shapes (dB per band, per slice) for each row: where and how long each kind of hit rings. */
function prior(row: DrumRow | "rest" | "flat"): Float64Array {
  const w = new Float64Array(D);
  for (let sl = 0; sl < SLICES.length; sl++) for (let b = 0; b < NB; b++) {
    const f = Math.sqrt(EDGES[b] * EDGES[b + 1]);
    const oct = (c: number) => Math.log2(f / c);
    let d: number;
    if (row === "kick") d = f < 150 ? -3 * sl : sl === 0 ? -10 - 3 * Math.abs(oct(3000)) : -12 * oct(150) - 6 - 6 * sl; // body below 150 Hz; a click up top only at the attack
    else if (row === "clap") d = -6 * Math.abs(oct(1800)) - (f < 250 ? 12 : 0) - [0, 2, 8][sl]; // a broad hump round 1–3 kHz with a tail
    else if (row === "hats") d = (f > 6000 ? 0 : -15 * Math.abs(oct(8000))) - [0, 8, 25][sl]; // all up top, short
    else if (row === "rest") d = -3 * Math.abs(oct(400)); // tonal bleed (bass, chords): low-mid, held
    else d = 0;
    w[sl * NB + b] = Math.pow(10, Math.max(-60, d) / 20);
  }
  return w;
}

/** Bands each row's timing is read from (Hz). */
// D-F1 (drums-slice evals): a kick is timed from its attack at 130–500 Hz. Its pitch sweep starts up
// there; the 30–180 Hz band only peaks 15–50 ms later on a kick that falls slowly (Mason Flint's).
// The low band still finds and labels kicks (the NMF templates); it no longer times them.
const ROW_BANDS: [number, number][] = [[130, 500], [700, 5600], [5600, 16000]];
/** How far before the activation's rise a row's attack may sit (frames): a kick's activation can rise 50 ms late. */
const BACK = [20, 8, 8];
/** The window a hit's size is read over after its attack (s): a slow kick's body peaks late. */
const SIZE_S = [0.07, 0.03, 0.03];

/** Energy-weighted geometric centre frequency of a template's attack slice (Hz). */
function centroidHz(w: Float64Array) {
  let s = 0, l = 0;
  for (let b = 0; b < NB; b++) { const e = w[b] * w[b]; s += e; l += e * Math.log(Math.sqrt(EDGES[b] * EDGES[b + 1])); }
  return Math.exp(l / (s || 1));
}

/** KL-NMF multiplicative updates, X ≈ W·H (X: D × cols, flat by row), in place. */
function nmf(X: Float64Array, W: Float64Array[], H: Float64Array, cols: number, iters: number, adaptW: boolean) {
  const K = W.length, R = new Float64Array(D * cols);
  const ratio = () => {
    for (let d = 0; d < D; d++) for (let c = 0; c < cols; c++) {
      let s = 1e-12;
      for (let k = 0; k < K; k++) s += W[k][d] * H[k * cols + c];
      R[d * cols + c] = X[d * cols + c] / s;
    }
  };
  for (let it = 0; it < iters; it++) {
    ratio();
    for (let k = 0; k < K; k++) {
      let ws = 0;
      for (let d = 0; d < D; d++) ws += W[k][d];
      for (let c = 0; c < cols; c++) {
        let s = 0;
        for (let d = 0; d < D; d++) s += W[k][d] * R[d * cols + c];
        H[k * cols + c] *= s / ws;
      }
    }
    if (!adaptW) continue;
    ratio();
    for (let k = 0; k < K; k++) {
      let hs = 0;
      for (let c = 0; c < cols; c++) hs += H[k * cols + c];
      let tot = 0;
      for (let d = 0; d < D; d++) {
        let s = 0;
        for (let c = 0; c < cols; c++) s += H[k * cols + c] * R[d * cols + c];
        W[k][d] *= s / (hs || 1);
        tot += W[k][d];
      }
      // Keep W at unit sum and move the scale into H.
      for (let d = 0; d < D; d++) W[k][d] /= tot || 1;
      for (let c = 0; c < cols; c++) H[k * cols + c] *= tot;
    }
  }
}

/** Normalise a template to unit sum. */
const norm = (w: Float64Array) => { let s = 0; for (const x of w) s += x; for (let i = 0; i < w.length; i++) w[i] /= s || 1; return w; };

export const OPT = { fixed: 30, adapt: 40, stride: 2 };

/**
 * Reads a looped drum part. `loopStartSec`: where the bar line was meant to be in the buffer (the
 * grid's phase is then found from the hits within half a 16th of it). Empty rows on silence.
 */
export function readDrums(left: Float32Array, right: Float32Array | undefined, rate: number, bpm: number, loopStartSec = 0, debug?: (c: Cand[]) => void): DrumReading {
  const x = toMono(left, right);
  const sps = 60 / bpm / 4;
  const steps = Math.floor((x.length / rate - loopStartSec) / sps + 0.01);
  const empty: DrumReading = { hits: [], rows: { kick: [], clap: [], hats: [] }, steps: Math.max(0, steps), gridMs: 0, swingMs: 0 };
  const n = rate >= 32000 ? 1024 : 512, hop = Math.max(1, Math.round(rate * 0.0029));
  const { frames, bins, p } = powerSpec(x, n, hop);
  if (frames < 32) return empty;
  const fr = hop / rate;

  // Band magnitudes V (NB × frames).
  const bandOf = new Int16Array(bins).fill(-1);
  for (let k = 1; k < bins; k++) {
    const f = (k * rate) / n;
    for (let b = 0; b < NB; b++) if (f >= EDGES[b] && f < EDGES[b + 1]) { bandOf[k] = b; break; }
  }
  const V = new Float64Array(NB * frames);
  let peak = 0;
  for (let f = 0; f < frames; f++) {
    for (let k = 1; k < bins; k++) { const b = bandOf[k]; if (b >= 0) V[b * frames + f] += p[f * bins + k]; }
    for (let b = 0; b < NB; b++) { const v = Math.sqrt(V[b * frames + f]); V[b * frames + f] = v; peak = Math.max(peak, v); }
  }
  if (peak < 1e-4) return empty; // silence (−80 dB-ish)

  // Stacked columns (attack, body, tail slices) every `stride` frames: a template then knows how
  // long its hit rings, which is what tells a kick's click from a clap and a clap from a hat.
  const S = OPT.stride, cols = Math.floor(frames / S);
  const lag = SLICES.map((t) => Math.round(t / fr));
  const X = new Float64Array(D * cols);
  for (let c = 0; c < cols; c++) for (let sl = 0; sl < SLICES.length; sl++) {
    const f = Math.min(frames - 1, c * S + lag[sl]);
    for (let b = 0; b < NB; b++) X[(sl * NB + b) * cols + c] = V[b * frames + f];
  }

  // Semi-adaptive NMF (KL): W starts at the priors (three drum rows, a held "tonal bleed" template
  // and a flat one), H is fitted first with W fixed, then both adapt; a drum template whose attack
  // drifts out of its row's range (a missing row taking over another sound) is reset to its prior.
  const W0 = [...ROWS, "rest" as const, "flat" as const].map((r) => norm(prior(r)));
  const K = W0.length;
  const W = W0.map((w) => Float64Array.from(w));
  const H = new Float64Array(K * cols);
  for (let c = 0; c < cols; c++) {
    let s = 0;
    for (let d = 0; d < D; d++) s += X[d * cols + c];
    for (let k = 0; k < K; k++) H[k * cols + c] = s / K + 1e-9;
  }
  nmf(X, W, H, cols, OPT.fixed, false);
  nmf(X, W, H, cols, OPT.adapt, true);
  let reset = false;
  for (let k = 0; k < 3; k++) {
    const c = centroidHz(W[k]);
    const ok = k === 0 ? c < 600 : k === 1 ? c > 350 && c < 6000 : c > 3500;
    if (!ok) { W[k] = Float64Array.from(W0[k]); reset = true; }
  }
  if (reset) nmf(X, W, H, cols, OPT.fixed, false);

  // Onsets per row: peaks of the activation's rise, one per row within a 32nd-ish gap; each timed
  // from the raw energy of the row's own bands (activations are coarser and can lag an attack):
  // its steepest rise (lag 2: the window's centre crosses the attack one hop before).
  const rowEnergy = ROW_BANDS.map(([lo, hi]) => {
    const e = new Float64Array(frames);
    for (let f = 0; f < frames; f++) { let s = 0; for (let b = 0; b < NB; b++) if (EDGES[b] >= lo && EDGES[b + 1] <= hi) s += V[b * frames + f] ** 2; e[f] = s; }
    return e;
  });
  const gapF = Math.round(Math.min(0.055, 0.45 * sps) / fr);
  const LAG = 2;
  const cands: Cand[] = [];
  for (let k = 0; k < 3; k++) {
    const h = H.subarray(k * cols, (k + 1) * cols);
    const rise = new Float64Array(cols);
    for (let c = 1; c < cols; c++) rise[c] = Math.max(0, h[c] - h[c - 1]);
    let top = 0;
    for (const r of rise) top = Math.max(top, r);
    if (top <= 0) continue;
    const e = rowEnergy[k];
    const mine: Cand[] = [];
    for (let c = 1; c < cols - 1; c++) {
      if (rise[c] < 0.05 * top || rise[c] < rise[c - 1] || rise[c] < rise[c + 1]) continue;
      const f = c * S;
      const lo = Math.max(LAG, f - BACK[k]), hi = Math.min(frames - 1, f + 10);
      // Rise of the row's energy, smoothed over 3 frames; the first local peak at least 0.35 of the
      // steepest one (and at most 35 ms before it) is the attack: a clap's first burst, not its tail.
      const r = (j: number) => (j - 1 - LAG >= 0 && j + 1 < frames ? (e[j - 1] - e[j - 1 - LAG] + e[j] - e[j - LAG] + e[j + 1] - e[j + 1 - LAG]) / 3 : 0);
      let br = 0, bf = f;
      for (let j = lo; j <= hi; j++) if (r(j) > br) { br = r(j); bf = j; }
      for (let j = Math.max(LAG + 2, bf - 12); j < bf; j++) if (r(j) >= 0.35 * br && r(j) >= r(j - 1) && r(j) >= r(j + 1)) { bf = j; break; }
      // The hit's size: the row's activation over 30 ms; its jump: against the quietest point of
      // the 40 ms before (a click, a flicker or a ringing tail jumps little).
      const c0 = Math.round(bf / S);
      let size = 0, pre = Infinity;
      for (let j = c0; j < Math.min(cols, c0 + Math.round(SIZE_S[k] / fr / S)); j++) size = Math.max(size, h[j]);
      for (let j = Math.max(0, c0 - Math.round(0.04 / fr / S)); j < c0 - 1; j++) pre = Math.min(pre, h[j]);
      if (!isFinite(pre)) pre = 0;
      // The raw energy of the row's bands must jump too (an activation can shift between
      // templates without anything new sounding).
      let ePost = 0, ePre = Infinity;
      for (let j = bf; j < Math.min(frames, bf + 5); j++) ePost = Math.max(ePost, e[j]);
      for (let j = Math.max(0, bf - 12); j < bf - 2; j++) ePre = Math.min(ePre, e[j]);
      if (!isFinite(ePre)) ePre = 0;
      mine.push({ row: k, f: bf, t: ((bf - 1) * hop) / rate, size, jump: size / (pre + 1e-6 * size + 1e-12), raw: ePost / (ePre + 1e-9 * ePost + 1e-20) });
    }
    // One per row within the gap: the biggest.
    mine.sort((a, b) => b.size - a.size);
    for (const c of mine) if (cands.every((o) => o.row !== k || Math.abs(o.f - c.f) >= gapF)) cands.push(c);
  }
  // Clap/snare flatness (noise is flat, a chord's bleed is peaky) over the 15 ms after the attack.
  const k0 = Math.ceil((700 * n) / rate), k1 = Math.floor((5600 * n) / rate);
  for (const c of cands) {
    if (c.row !== 1) continue;
    let fl = 0, m = 0;
    for (let f = c.f; f < Math.min(frames, c.f + 6); f++) {
      let lg = 0, ar = 0;
      for (let k = k0; k <= k1; k++) { const v = p[f * bins + k] + 1e-20; lg += Math.log(v); ar += v; }
      fl += Math.exp(lg / (k1 - k0 + 1)) / (ar / (k1 - k0 + 1)); m++;
    }
    c.flat = m ? fl / m : 0;
    // D-F2: an open hat has real 1–3 kHz energy, but most of it sits above 5.6 kHz; a clap's body is
    // at 1–3 kHz. The air over the body (dB) over the first 30 ms.
    let mid = 0, air = 0;
    for (let f = c.f; f < Math.min(frames, c.f + 10); f++) for (let b = 0; b < NB; b++) {
      const v = V[b * frames + f] ** 2;
      if (EDGES[b] >= 1000 && EDGES[b + 1] <= 2800) mid += v; else if (EDGES[b] >= 5600) air += v;
    }
    c.air = 10 * Math.log10((air + 1e-20) / (mid + 1e-20));
  }
  // What each row's hits leak into the other rows' activations (the smallest ratio seen),
  // so a hit on top of another row's hit only counts if it stands clear of that leak.
  const win = Math.round(0.03 / fr / S);
  const act = (row: number, f: number) => { let m = 0; const c0 = Math.round(f / S); for (let j = c0; j < Math.min(cols, c0 + win); j++) m = Math.max(m, H[row * cols + j]); return m; };
  const leak = [0, 1, 2].map((a) => [0, 1, 2].map((b) => {
    if (a === b) return 0;
    const rs = cands.filter((c) => c.row === a && c.size > 0).map((c) => act(b, c.f) / c.size).sort((x, y) => x - y);
    // Only the leaks that fool a reader: a kick's click into claps and hats, a snare's noise into
    // hats. The smallest ratio seen is the leak (a hit with a real one on top only raises it).
    if (b === 0 || (a === 1 && b !== 2) || a === 2) return 0;
    return rs.length >= 4 ? rs[0] : 0;
  }));
  const hits = gate(cands, leak, Math.round(0.015 / fr));
  debug?.(cands);
  hits.sort((a, b) => a.t - b.t);
  return { ...quantise(hits, sps, loopStartSec, steps), hits };
}

export type Cand = { row: number; f: number; t: number; size: number; jump: number; raw: number; flat?: number; air?: number; db?: number; keep?: boolean; why?: string };

// shortcut: fixed gates (dB under the loop's biggest hit per row, a minimum jump, a clap's minimum
// flatness, 6 dB clear of another row's leak) picked on the synthetic bench; tune on separated
// real tracks once the hand check exists.
// D-F2: `air` = the clap's energy above 5.6 kHz over its 1–2.8 kHz body (dB): real claps read ≤ 0 on the
// bench and the real-loop fixture, open hats read as claps ≥ +3.
export const GATE = { db: [-12, -22, -34], jump: 2, flat: 0.24, overLeak: 2, raw: 2, air: 2 };

/** Keeps candidates big enough against the loop's biggest hit, sharp, noisy (claps) and clear of other rows' leak. */
function gate(cands: Cand[], leak: number[][], near: number): DrumHit[] {
  let big = 0;
  for (const c of cands) big = Math.max(big, c.size);
  for (const c of cands) {
    c.db = 20 * Math.log10(c.size / (big || 1));
    c.why = c.db < GATE.db[c.row] ? "small" : c.jump < GATE.jump ? "flat jump" : c.raw < GATE.raw ? "no raw rise" : c.row === 1 && (c.flat ?? 1) < GATE.flat ? "tonal" : c.row === 1 && (c.air ?? -99) > GATE.air ? "open hat" : "";
  }
  // Leak: against a bigger hit of another row at the same moment.
  for (const c of cands) {
    if (c.why) continue;
    for (const o of cands) {
      if (o.row === c.row || o.why || Math.abs(o.f - c.f) > near || o.size <= c.size) continue;
      if (c.size / o.size < GATE.overLeak * leak[o.row][c.row]) { c.why = `leak from ${ROWS[o.row]}`; break; }
    }
  }
  const rowBig = [0, 0, 0];
  for (const c of cands) if (!c.why) rowBig[c.row] = Math.max(rowBig[c.row], c.size);
  const hits: DrumHit[] = [];
  for (const c of cands) {
    c.keep = !c.why;
    if (c.keep) hits.push({ t: c.t, row: ROWS[c.row], vel: Math.round(Math.min(1, c.size / (rowBig[c.row] || 1)) * 100) / 100, db: Math.round((c.db ?? 0) * 10) / 10 });
  }
  return hits;
}

/** The circular mean of `ts` against `per` (s): the phase in (−per/2, per/2] and how tight they sit (0–1). */
function phaseOf(ts: { t: number; w: number }[], per: number, from: number) {
  let c = 0, s = 0, W = 0;
  for (const x of ts) { const a = (2 * Math.PI * (x.t - from)) / per; c += x.w * Math.cos(a); s += x.w * Math.sin(a); W += x.w; }
  return { ph: (Math.atan2(s, c) / (2 * Math.PI)) * per, tight: W ? Math.hypot(c, s) / W : 0 };
}

/** Kicks this tight on the beat (0–1) anchor the grid on the beat. */
export const BEAT_TIGHT = 0.6;

/**
 * Snaps hits to the 16th grid. D-F3 (drums-slice evals): the grid is anchored on the beat the kicks
 * play, so step 0 is the kick on (or nearest after) the loop's bar line: a circular mean of the kicks
 * against the beat (4 sixteenths), kept within ±2 sixteenths of the loop start. Kicks on every beat
 * give the same grid on every read; a phase folded at ±half a 16th flipped between reads when the
 * map's bar line sat near the fold (by 0.4–0.6 of a 16th on both real tracks), moving every row by
 * a 16th. Without a beat in the kicks (no kicks, a broken beat) the old estimate stands: the hits
 * against the 8th, within half a 16th of the loop start. Each hit keeps its offset from its step.
 */
export function quantise(hits: DrumHit[], sps: number, loopStartSec: number, steps: number): Omit<DrumReading, "hits"> {
  const rows: Record<DrumRow, StepHit[]> = { kick: [], clap: [], hats: [] };
  let gridSec = loopStartSec;
  const kicks = hits.filter((h) => h.row === "kick").map((h) => ({ t: h.t, w: h.vel }));
  const beat = kicks.length >= 4 ? phaseOf(kicks, 4 * sps, loopStartSec) : null;
  if (beat && beat.tight >= BEAT_TIGHT) {
    // Again on the kicks within half a 16th of that beat only: off-beat kicks (a 15th-step pickup) pull the mean.
    const on = kicks.filter((k) => { const d = ((((k.t - loopStartSec - beat.ph) % (4 * sps)) + 6 * sps) % (4 * sps)) - 2 * sps; return Math.abs(d) <= sps / 2; });
    const fine = on.length >= 4 ? phaseOf(on, 4 * sps, loopStartSec) : beat;
    gridSec = loopStartSec + fine.ph;
  }
  else if (hits.length) {
    let c = 0, s = 0;
    const per = 2 * sps;
    for (const h of hits) {
      const w = (h.row === "hats" ? 0.5 : 1) * h.vel;
      const a = (2 * Math.PI * (h.t - loopStartSec)) / per;
      c += w * Math.cos(a); s += w * Math.sin(a);
    }
    let ph = (Math.atan2(s, c) / (2 * Math.PI)) * per;
    // Hits cluster on the 8ths' phase; keep the shift inside ±half a 16th.
    while (ph > sps / 2) ph -= sps;
    while (ph < -sps / 2) ph += sps;
    gridSec = loopStartSec + ph;
  }
  const odd: number[] = [], even: number[] = [];
  for (const h of hits) {
    const step = Math.round((h.t - gridSec) / sps);
    if (step < 0 || step >= steps) continue;
    const offsetMs = Math.round((h.t - gridSec - step * sps) * 10000) / 10;
    const row = rows[h.row];
    if (row.some((x) => x.step === step)) continue; // one hit per step and row
    row.push(h.db === undefined ? { step, offsetMs, vel: h.vel } : { step, offsetMs, vel: h.vel, db: h.db });
    (step % 2 ? odd : even).push(offsetMs);
  }
  for (const r of ROWS) rows[r].sort((a, b) => a.step - b.step);
  const med = (xs: number[]) => { const v = [...xs].sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : 0; };
  return { rows, steps: Math.max(0, steps), gridMs: Math.round((gridSec - loopStartSec) * 10000) / 10, swingMs: odd.length >= 4 && even.length >= 4 ? Math.round((med(odd) - med(even)) * 10) / 10 : 0 };
}
