// Phase 7 slice 2 (L268, R3, W5): tells open hats from closed ones among the hat hits the drum
// reader found. An open hat rings on; a closed one is gone in a few tens of milliseconds. For each
// hit, the high band's energy is measured just before it (the floor: rides, shakers, other hats'
// tails), at its attack (the peak) and over its tail (45–120 ms after, or until just before the next
// hat). A hit is open when its tail stays close to its peak, clearly above the floor (a steady shaker
// or ride wash lifts the floor, so it doesn't turn every closed hat open), and the tail is mostly
// air, not a clap's body (a clap's tail on the same step leaks into the high band; D-F2: an open
// hat's energy sits mostly above 5.6 kHz, a clap's at 1–3 kHz). Pure TS, numbers only (C2): run in
// Make's worker on the in-memory loop, and in the unit test on a synthetic loop.
import { band } from "./closeness";

/** The band an open hat rings in (Hz), as the drum reader's hats row (drums-read ROW_BANDS). */
export const HAT_BAND: [number, number] = [5600, 16000];
/** A clap's or snare's body (Hz), the reader's clap band. */
export const BODY_BAND: [number, number] = [700, 2800];

/**
 * The open-vs-closed gates (dB). `decayDb`: the tail's high-band energy against the attack's;
 * `overFloorDb`: the tail's against the energy just before the hit; `airDb`: the tail's high band
 * against its clap body band; `minTailS`: a hat followed by another this soon (s, after the tail's
 * start) can't be judged and counts as closed.
 */
// shortcut: gates set on the synthetic bench (closed tails read ≤ −25 dB, open ≥ −8 dB; a clap's
// tail under a closed hat −15 dB with its air ≤ −10 dB) and a real house kit's lengths (closed
// 30–80 ms, open 150 ms+); re-tune on data-evals' real-loop grade (W5).
export const OPEN_HAT = { decayDb: -15, overFloorDb: 6, airDb: 0, tailFromS: 0.045, tailToS: 0.12, minTailS: 0.02 };

export type HatFeature = {
  /** The hit's time in the loop (s), as given. */
  t: number;
  open: boolean;
  /** False when the next hat came too soon to hear a tail (then `open` is false). */
  judged: boolean;
  /** Tail against attack (dB): near 0 rings on, −25 or lower is a closed tick. */
  decayDb: number;
  /** Tail against the floor before the hit (dB). */
  overFloorDb: number;
  /** The tail's air against its clap-body band (dB): an open hat's tail is mostly air. */
  airDb: number;
  /** How long the hit stays within 20 dB of its attack (ms), up to the next hat. */
  lenMs: number;
  /** Time to the next hat hit (ms, round the loop). */
  gapMs: number;
};

const FRAME_S = 0.005;
const db = (x: number) => 10 * Math.log10(x + 1e-20);
const r1 = (x: number) => Math.round(x * 10) / 10;

/** Energy per 5 ms frame of a band of `mono`. */
function frameEnergy(mono: Float32Array, rate: number, lohi: [number, number]) {
  const x = band(mono, rate, ...lohi);
  const fl = Math.max(1, Math.round(FRAME_S * rate)), frames = Math.floor(x.length / fl);
  const e = new Float64Array(Math.max(0, frames));
  for (let f = 0; f < frames; f++) { let s = 0; for (let i = f * fl; i < (f + 1) * fl; i++) s += x[i] * x[i]; e[f] = s / fl; }
  return e;
}

/**
 * Open or closed for each hat hit at `times` (s from the loop's first sample; any order). The loop
 * plays round, so the floor before the first hit is read at the loop's end, and the last hit's gap
 * runs to the first one a pass later.
 */
export function classifyHats(mono: Float32Array, rate: number, times: number[]): HatFeature[] {
  if (!times.length) return [];
  const e = frameEnergy(mono, rate, HAT_BAND), frames = e.length;
  const none = (t: number, gapMs = 0): HatFeature => ({ t, open: false, judged: false, decayDb: -99, overFloorDb: 0, airDb: -99, lenMs: 0, gapMs });
  if (frames < 8) return times.map((t) => none(t));
  const body = frameEnergy(mono, rate, BODY_BAND);
  const wrap = (f: number) => ((f % frames) + frames) % frames;
  const E = (f: number) => e[wrap(f)], B = (f: number) => body[wrap(f)];
  const loopS = mono.length / rate;
  const sorted = [...times].sort((a, b) => a - b);
  const fr = (s: number) => Math.round(s / FRAME_S);
  return times.map((t) => {
    const k = sorted.indexOf(t);
    const next = k + 1 < sorted.length ? sorted[k + 1] : sorted[0] + loopS;
    const gapS = next - t > 1e-6 ? next - t : loopS;
    const a = Math.floor(t / FRAME_S);
    let peak = 0;
    for (let f = a; f <= a + 4; f++) peak = Math.max(peak, E(f));
    let floor = Infinity;
    for (let f = a - 8; f <= a - 1; f++) floor = Math.min(floor, E(f));
    let lenF = 0;
    for (let f = a; f < a + fr(Math.min(gapS, 0.4)); f++) if (E(f) >= peak * 0.01) lenF = f - a + 1;
    const lenMs = Math.round(lenF * FRAME_S * 1000), gapMs = Math.round(gapS * 1000);
    const from = t + OPEN_HAT.tailFromS, to = Math.min(t + OPEN_HAT.tailToS, t + gapS - 0.008);
    if (to - from < OPEN_HAT.minTailS || peak <= 0) return { ...none(t, gapMs), lenMs };
    let tail = 0, tailBody = 0, n = 0;
    for (let f = fr(from); f < fr(to); f++) { tail += E(f); tailBody += B(f); n++; }
    tail /= Math.max(1, n); tailBody /= Math.max(1, n);
    const decayDb = r1(db(tail / peak)), overFloorDb = r1(db(tail / (floor || 1e-20))), airDb = r1(db(tail / (tailBody || 1e-20)));
    const open = decayDb > OPEN_HAT.decayDb && overFloorDb > OPEN_HAT.overFloorDb && airDb > OPEN_HAT.airDb;
    return { t, open, judged: true, decayDb, overFloorDb, airDb, lenMs, gapMs };
  });
}
