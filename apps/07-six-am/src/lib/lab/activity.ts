// What the separated parts actually play, bar by bar (LS1-N1): the level of each part per bar, read
// from the separated regions as they're heard (audio summed into a few numbers and dropped, L143),
// and the lane clips drawn from it. Heard bars replace the map's full-mix estimate; bars not heard
// yet keep the estimate, drawn faintly. The levels (numbers only) are saved onto the map like the
// chords (L181), so they're there next time. Pure, unit tested (activity.test.ts).
import type { Block } from "@/lib/map/view";
import { barToMs } from "./timing";

export const LEVEL_PARTS = 4;
/** Rows of PartLevels: the four parts, then the separated drums' low band (kick) and high band
 *  (hats), LS1-N7. Older saved maps have only the first four. */
export const LEVEL_ROWS = 6;
export const KICK_ROW = 4, HATS_ROW = 5;
/** Band edges for the drums' rows: below ~150 Hz is the kick, above ~6 kHz the hats. */
const KICK_HZ = 150, HATS_HZ = 6000;
/** A bar counts as heard once this share of it has come through. */
const HEARD_SHARE = 0.5;

/** Per row (drums, bass, other, vocals, drums low band, drums high band), per bar: RMS dB rounded,
 *  null = not heard. */
export type PartLevels = (number | null)[][];

const db = (e: number) => 10 * Math.log10(e + 1e-12);

/** Accumulates the separated parts' energy per bar; the latest pass over a bar wins. */
export class BarLevels {
  private sum: Float64Array[];
  private n: Float64Array;
  private run: Float64Array;
  private bars: number;
  private lp = 0;
  private lp2 = 0;
  readonly levels: PartLevels;

  /** `known`: levels saved on the map from earlier listens (kept until a bar is heard again). */
  constructor(bars: number, private bpm: number, private originSec: number, known?: PartLevels | null) {
    this.bars = bars;
    this.sum = Array.from({ length: LEVEL_ROWS }, () => new Float64Array(bars));
    this.n = new Float64Array(bars);
    this.run = new Float64Array(bars).fill(-1);
    this.levels = Array.from({ length: LEVEL_ROWS }, (_, p) => Array.from({ length: bars }, (_, b) => known?.[p]?.[b] ?? null));
  }

  /**
   * One region: `parts[p*2 + ch]`, of which samples [skip, skip+count) are new, the first of them at
   * track second `startSec`. `runId` tells passes apart (a bar heard again starts over). Returns the
   * bars (0-based) whose levels changed.
   */
  add(parts: Float32Array[], skip: number, count: number, startSec: number, rate: number, runId: number): number[] {
    const changed = new Set<number>();
    const aLo = 1 - Math.exp((-2 * Math.PI * KICK_HZ) / rate), aHi = 1 - Math.exp((-2 * Math.PI * HATS_HZ) / rate);
    this.lp = 0; this.lp2 = 0;
    const barLen = (barToMs(2, this.bpm, this.originSec) - barToMs(1, this.bpm, this.originSec)) / 1000;
    let i = skip;
    const end = skip + count;
    while (i < end) {
      const t = startSec + (i - skip) / rate;
      const b = Math.floor((t - this.originSec) / barLen);
      const barEndSec = this.originSec + (b + 1) * barLen;
      const j = Math.min(end, skip + Math.ceil((barEndSec - startSec) * rate));
      const stop = Math.max(j, i + 1);
      if (b >= 0 && b < this.bars) {
        if (this.run[b] !== runId) { this.run[b] = runId; this.n[b] = 0; for (const s of this.sum) s[b] = 0; }
        for (let p = 0; p < LEVEL_PARTS; p++) {
          const L = parts[p * 2], R = parts[p * 2 + 1];
          let e = 0;
          for (let k = i; k < stop; k++) { const m = (L[k] + R[k]) / 2; e += m * m; }
          this.sum[p][b] += e;
        }
        // The drums' two bands (one-pole filters; their state carries on within the region).
        const dl = parts[0], dr = parts[1];
        let lo = 0, hi = 0;
        for (let k = i; k < stop; k++) {
          const m = (dl[k] + dr[k]) / 2;
          this.lp += aLo * (m - this.lp);
          this.lp2 += aHi * (m - this.lp2);
          const h = m - this.lp2;
          lo += this.lp * this.lp; hi += h * h;
        }
        this.sum[KICK_ROW][b] += lo; this.sum[HATS_ROW][b] += hi;
        this.n[b] += stop - i;
        if (this.n[b] >= HEARD_SHARE * barLen * rate) {
          for (let p = 0; p < LEVEL_ROWS; p++) this.levels[p][b] = Math.max(-120, Math.round(db(this.sum[p][b] / this.n[b])));
          changed.add(b);
        }
      }
      i = stop;
    }
    return [...changed];
  }
}

// shortcut: thresholds picked on one track (Mason Flint remix: vocals −16 to −26 dB where they sing,
// bleed around −45 to −60): a bar is "likely" within 15 dB of the part's own loud bars (90th
// percentile), "maybe" within 21 dB, never below −55 / −50 dB. Tune with data-evals on more tracks.
const LIKELY_DB = 15, MAYBE_DB = 21, FLOOR_LIKELY = -50, FLOOR_MAYBE = -55;

/** The part's reference level: its 90th-percentile heard bar (bars above −80 dB), or null. */
export function referenceDb(levels: (number | null)[]): number | null {
  const xs = levels.filter((x): x is number => x !== null && x > -80).sort((a, b) => a - b);
  return xs.length ? xs[Math.min(xs.length - 1, Math.floor(0.9 * xs.length))] : null;
}

/** Per bar: 2 likely, 1 maybe, 0 quiet, null not heard. */
export function barActivity(levels: (number | null)[], refDb?: number | null): (0 | 1 | 2 | null)[] {
  const ref = refDb === undefined ? referenceDb(levels) : refDb;
  return levels.map((x) => {
    if (x === null) return null;
    if (ref === null) return 0;
    if (x >= Math.max(FLOOR_LIKELY, ref - LIKELY_DB)) return 2;
    if (x >= Math.max(FLOOR_MAYBE, ref - MAYBE_DB)) return 1;
    return 0;
  });
}

/** Touching bars of one kind as blocks (1-based bars, `to` exclusive). */
function runs(flags: boolean[], level: (i: number) => Block["level"]): Block[] {
  const out: Block[] = [];
  flags.forEach((on, i) => {
    if (!on) return;
    const last = out.at(-1), lv = level(i);
    if (last && last.to === i + 1 && last.level === lv) last.to = i + 2;
    else out.push({ from: i + 1, to: i + 2, level: lv });
  });
  return out;
}

/**
 * A lane's clips: `heard` from the separated part's levels; `estimate` is the map's estimate cut to
 * the bars not heard yet (drawn faintly). Blocks touching across a likely/maybe change stay apart.
 */
export function laneBlocks(levels: (number | null)[], estimate: Block[]): { heard: Block[]; estimate: Block[]; heardBars: boolean[] } {
  return blocksFromActivity(barActivity(levels), estimate);
}

/**
 * LS2-N8: a drums band row where it was heard, else the drums part as a whole (older saved maps
 * have only the four part rows), so bars heard before the bands existed stay heard.
 */
export function bandActivity(band: (number | null)[] | undefined, part: (number | null)[]): (0 | 1 | 2 | null)[] {
  const b = band ? barActivity(band) : [];
  const whole = barActivity(part);
  return whole.map((a, i) => b[i] ?? a);
}

/** Lane clips from per-bar activity (2 likely, 1 maybe, 0 quiet, null not heard). */
export function blocksFromActivity(act: (0 | 1 | 2 | null)[], estimate: Block[]): { heard: Block[]; estimate: Block[]; heardBars: boolean[] } {
  const heardBars = act.map((a) => a !== null);
  const heard = runs(act.map((a) => !!a), (i) => (act[i] === 2 ? "likely" : "maybe"));
  const est: Block[] = [];
  for (const b of estimate) {
    let from: number | null = null;
    for (let bar = b.from; bar <= b.to; bar++) {
      const free = bar < b.to && !heardBars[bar - 1];
      if (free && from === null) from = bar;
      if (!free && from !== null) { est.push({ from, to: bar, level: b.level }); from = null; }
    }
  }
  return { heard, estimate: est, heardBars };
}

/** Whitelist for levels arriving on a map: four (or six, with the drums' bands) arrays of `bars`
 *  entries, each null or a dB integer. */
export function parseLevels(raw: unknown, bars: number): PartLevels | null {
  if (!Array.isArray(raw) || (raw.length !== LEVEL_PARTS && raw.length !== LEVEL_ROWS)) return null;
  const ok = raw.every((a) => Array.isArray(a) && a.length === bars && a.every((x) => x === null || (typeof x === "number" && Number.isFinite(x) && x >= -140 && x <= 20)));
  return ok ? (raw as (number | null)[][]).map((a) => a.map((x) => (x === null ? null : Math.round(x)))) : null;
}
