// Make for FX (Phase 5 slice 3, P5–P9, T120): what Make plays, measures and the A/B level. Pure TS,
// in Make's worker and the tests. Only numbers come out of the original (C2).
//
// - Suggest (P6) is a plain measure, not a search: the original's "other" and "vocals" parts (where a
//   separated mix leaves FX) are read at the moments the rows sit:
//   * Riser: a rising 3–12 kHz level into the riser's end → Rise (how long it climbs), Tone (how
//     bright its top is), Width (side against mid);
//   * Impact: a jump at the drop's first beat → Tail (how long it rings), Tone (how bright);
//   * Downlifter: a falling brightness after the hit → Drop (how far, in octaves), Length, Tone.
//   When nothing clear is there, the row gets no ticks and says so; Size is never ticked (nothing
//   fair to measure it by). No closeness score for FX (T120).
// - A/B (P7): A is the drop as is (its parts, the drums when "Drums under both" is on); B is the same
//   with Mine's FX on top, both turned down together so B is as loud as A (LUFS).
import { fft, hann, toMono } from "./dsp";
import { kBlocks, lufsOfBlocks } from "./level";
import { FX_ROWS, clampFxMacros, fxBars, renderFxEvent, type FxMacros, type FxPlan, type FxPresetId, type FxRow } from "./fx-synth";
import { secondsPer16th } from "./render";

const db = (x: number) => 10 * Math.log10(x + 1e-20);

/** Energy (dB) of a band of `x` in windows of `winS` from `a` to `b` seconds, plus each window's centroid (Hz). */
function bandTrack(x: Float32Array, rate: number, a: number, b: number, winS: number, lo: number, hi: number) {
  const n = 2048, w = hann(n), re = new Float64Array(n), im = new Float64Array(n);
  const out: { t: number; db: number; centroid: number }[] = [];
  for (let t = Math.max(0, a); t + winS <= b + 1e-9; t += winS) {
    const c = Math.round((t + winS / 2) * rate) - n / 2;
    for (let i = 0; i < n; i++) { const j = c + i; re[i] = j >= 0 && j < x.length ? x[j] * w[i] : 0; im[i] = 0; }
    fft(re, im);
    let e = 0, ce = 0;
    for (let k = 1; k <= n / 2; k++) { const f = (k * rate) / n; if (f < lo || f > hi) continue; const p = re[k] * re[k] + im[k] * im[k]; e += p; ce += p * Math.log2(f); }
    out.push({ t, db: db(e), centroid: e > 0 ? Math.pow(2, ce / e) : 0 });
  }
  return out;
}
const corr = (xs: number[], ys: number[]) => {
  const n = xs.length; if (n < 3) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
};
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Knob value for a number of bars (the inverse of fxBars). */
const barsKnob = (bars: number) => clamp01((Math.log2(Math.max(0.5, bars)) + 1) / 4);
/** Knob value for a brightness (Hz) between `lo` and `hi`, on a log scale. */
const toneKnob = (hz: number, lo: number, hi: number) => clamp01(Math.log(hz / lo) / Math.log(hi / lo));

export type FxMeasure = { ticks: FxMacros | null; heard: string };
// shortcut: the riser's margins (9 dB, a 0.7 time correlation, at least a bar) picked so a borderline climb reads "none" both times; check on real builds.
export const RISER_MIN = { db: 9, corr: 0.7, bars: 1 };

/** What the original's FX-carrying parts do where each row sits (numbers only). `plan` in loop bars. */
// shortcut: thresholds (a 6 dB rise with a 0.6 time correlation, a 6 dB hit over the drop's steady level, a ½-octave fall) picked on our own synthetic loops; chords or vocals moving there can read as FX. Check against data-evals' real drops.
export function measureFx(L: Float32Array, R: Float32Array, rate: number, bpm: number, plan: FxPlan, loopBars: number, fromBar = 1): Record<FxRow, FxMeasure> {
  const mono = toMono(L, R), barS = 16 * secondsPer16th(bpm), loopS = loopBars * barS;
  const out = {} as Record<FxRow, FxMeasure>;
  // Riser: the 3–12 kHz level over the bars before its end, in half-beats.
  {
    const end = Math.min(loopS, (plan.riser.atBar + plan.riser.bars) * barS), from = Math.max(0, end - 4 * barS);
    const tr = bandTrack(mono, rate, from, end, barS / 8, 3000, 12000);
    const dbs = tr.map((x) => x.db), top = dbs.slice(-2).reduce((a, b) => Math.max(a, b), -Infinity), lo = Math.min(...dbs);
    let start = 0;
    for (let i = tr.length - 1; i >= 0; i--) if (dbs[i] <= lo + 3) { start = i; break; }
    const span = tr.slice(start), rising = corr(span.map((x) => x.t), span.map((x) => x.db));
    const bars = span.length ? (end - tr[start].t) / barS : 0;
    // FX-F3: a riser climbs for at least a bar, clearly (9 dB, steadily); a half-bar jump is a fill or a
    // crash, and a borderline climb flipped between reads. Margins keep the verdict the same read to read.
    if (tr.length >= 8 && top - lo >= RISER_MIN.db && rising >= RISER_MIN.corr && bars >= RISER_MIN.bars) {
      let m = 0, s = 0;
      const a = Math.round((end - barS / 2) * rate), b = Math.round(end * rate);
      for (let i = Math.max(0, a); i < Math.min(L.length, b); i++) { const x = (L[i] + R[i]) / 2, y = (L[i] - R[i]) / 2; m += x * x; s += y * y; }
      const side = db(s) - db(m);
      out.riser = { ticks: { rise: Math.round(barsKnob(bars) * 100) / 100, tone: Math.round(toneKnob(tr[tr.length - 1].centroid, 3500, 9000) * 100) / 100, width: Math.round(clamp01((side + 20) / 17) * 100) / 100 }, heard: `a rise over about ${Math.round(bars * 2) / 2} bars, ${Math.round(top - lo)} dB, into bar ${fromBar + Math.round(end / barS)}` };
    } else out.riser = { ticks: null, heard: "no clear riser in the original here" };
  }
  // Impact: a jump at the hit, and how long it rings (broadband, 50 ms windows).
  {
    const hit = plan.impact.atBar * barS;
    const tr = bandTrack(mono, rate, Math.max(0, hit - 0.2), Math.min(loopS, hit + 4 * barS), 0.05, 100, 12000);
    // Before the hit: the loop plays round, so a hit on its first beat follows the loop's end.
    const pre = hit >= 0.2 ? tr.filter((x) => x.t < hit - 0.05).map((x) => x.db) : bandTrack(mono, rate, loopS - 0.2, loopS, 0.05, 100, 12000).map((x) => x.db);
    const after = tr.filter((x) => x.t >= hit - 0.025 && x.t < hit + 0.1);
    const peak = after.reduce((a, x) => (x.db > a.db ? x : a), { t: hit, db: -Infinity, centroid: 0 });
    // …and above the drop's own steady level after it (a hit stands out from the section it opens).
    const steady = tr.filter((x) => x.t >= hit + barS && x.t < hit + 2 * barS).map((x) => x.db).sort((a, b) => a - b);
    const base = Math.max(pre.length ? Math.max(...pre) : -Infinity, steady.length ? steady[Math.floor(steady.length / 2)] : -Infinity);
    if (peak.db - base >= 6) {
      const fall = tr.find((x) => x.t > peak.t && x.db < peak.db - 20);
      const bars = ((fall?.t ?? hit + 4 * barS) - hit) / barS;
      out.impact = { ticks: { tail: Math.round(barsKnob(bars) * 100) / 100, tone: Math.round(toneKnob(peak.centroid, 300, 6000) * 100) / 100 }, heard: `a hit on the first beat (${Math.round(peak.db - base)} dB jump) ringing about ${Math.round(bars * 2) / 2} bars` };
    } else out.impact = { ticks: null, heard: "no clear hit on the first beat in the original" };
  }
  // Downlifter: brightness falling after the hit while the level fades (200 Hz–8 kHz, quarter-bars).
  {
    const hit = plan.down.atBar * barS;
    const tr = bandTrack(mono, rate, hit, Math.min(loopS, hit + 4 * barS), barS / 4, 200, 8000).filter((x) => x.centroid > 0);
    const fallOct = tr.length >= 4 ? Math.log2(tr[0].centroid / Math.min(...tr.map((x) => x.centroid))) : 0;
    const falling = corr(tr.map((x) => x.t), tr.map((x) => Math.log2(x.centroid))), fading = corr(tr.map((x) => x.t), tr.map((x) => x.db));
    if (tr.length >= 4 && fallOct >= 0.5 && falling <= -0.6 && fading <= -0.3) {
      const lowAt = tr.reduce((a, x) => (x.centroid < a.centroid ? x : a));
      const bars = Math.max(0.5, (lowAt.t + barS / 4 - hit) / barS);
      out.down = { ticks: { drop: Math.round(clamp01((fallOct - 0.5) / 2.5) * 100) / 100, length: Math.round(barsKnob(bars) * 100) / 100, tone: Math.round(toneKnob(tr[0].centroid, 400, 8000) * 100) / 100 }, heard: `the brightness falls about ${Math.round(fallOct * 10) / 10} octaves over ${Math.round(bars * 2) / 2} bars after the hit` };
    } else out.down = { ticks: null, heard: "no clear fall after the hit in the original" };
  }
  return out;
}

export type FxRowSound = { preset: FxPresetId; macros: FxMacros; on: boolean };

/** How far under the mix's level (RMS) an FX row plays over its own span. */
// shortcut: FX sit 4 dB under the mix's RMS over their own span, a level picked by reasoning about house mixes (FX audible, not on top); the owner's ear sets it later.
export const FX_UNDER_DB = 4;

/**
 * Mine's FX over the loop (`samples` long): each row's event at its place, at FX_UNDER_DB under the mix,
 * then everything turned down by `partsDb` so the drop with the FX (B) is as loud as without (A):
 * B's loudness from the drop's and the FX's 400 ms block energies added (FX and the mix are mostly
 * uncorrelated, so their energies add), with the LUFS gates.
 */
export function renderFxMine(plan: FxPlan, sounds: Record<FxRow, FxRowSound>, o: { rootMidi: number; bpm: number; rate: number; samples: number; mixRmsDb: number; blocksA: number[] }) {
  const { rate, samples } = o, barS = 16 * secondsPer16th(o.bpm);
  const left = new Float32Array(samples), right = new Float32Array(samples);
  for (const row of FX_ROWS) {
    const s = sounds[row];
    if (!s.on) continue;
    const at = Math.round(plan[row].atBar * barS * rate), lenS = Math.min(plan[row].bars * barS, samples / rate - plan[row].atBar * barS);
    if (lenS <= 0.01) continue;
    const [l, r] = renderFxEvent(s.preset, clampFxMacros(s.preset, s.macros), lenS, o.rootMidi, rate);
    let e = 0;
    for (let i = 0; i < l.length; i++) e += l[i] * l[i] + r[i] * r[i];
    const rowDb = db(e / (2 * Math.max(1, l.length)));
    const g = rowDb > -120 && o.mixRmsDb > -120 ? Math.pow(10, Math.max(-30, Math.min(30, o.mixRmsDb - FX_UNDER_DB - rowDb)) / 20) : 1;
    for (let i = 0; i < l.length && at + i < samples; i++) { left[at + i] += l[i] * g; right[at + i] += r[i] * g; }
  }
  // B's loudness: the drop's block energies (kept as numbers at the read) plus the FX's, block by block.
  const A = lufsOfBlocks(o.blocksA), fb = kBlocks({ left, right, rate });
  const B = lufsOfBlocks(o.blocksA.map((e, i) => e + (fb[i] ?? 0)));
  const partsDb = A > -70 && B > -70 ? Math.round((A - B) * 100) / 100 : 0, g = Math.pow(10, partsDb / 20);
  for (let i = 0; i < samples; i++) { left[i] *= g; right[i] *= g; }
  return { left, right, rate, partsDb };
}

/** The knob each row's length comes from (for the plan). */
export const lengthKnob = (row: FxRow) => (row === "impact" ? "tail" : row === "down" ? "length" : "rise");
export { fxBars };
