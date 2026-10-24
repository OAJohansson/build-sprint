// Section detection: where the track changes (novelty over the per-bar features), snapped to 4/8-bar
// phrases, then labelled intro / build / drop / breakdown / outro by plain rules. Pure, unit tested.
import { barsToSeconds, snapToPhrase } from "./grid";
import type { BarFeatures, Section, SectionLabel } from "./types";

/** How much each feature counts when comparing bars: the kick and bass define a club section. */
const WEIGHTS: Record<keyof BarFeatures, number> = { energy: 1, kick: 1.5, bass: 1, hats: 0.8, chords: 0.8, vocals: 0.5 };
const KEYS = Object.keys(WEIGHTS) as (keyof BarFeatures)[];
/** Bars compared on each side of a candidate boundary. */
const WINDOW = 8;
/** Shortest section kept, in bars. */
export const MIN_SECTION = 8;

const vec = (b: BarFeatures) => KEYS.map((k) => b[k] * WEIGHTS[k]);

function meanVec(bars: BarFeatures[], a: number, b: number): number[] {
  const out = KEYS.map(() => 0);
  for (let i = a; i < b; i++) vec(bars[i]).forEach((v, k) => (out[k] += v));
  return out.map((x) => x / Math.max(1, b - a));
}

/** How different the bars before and after each bar line are (0 at the edges). */
export function novelty(bars: BarFeatures[]): number[] {
  const n = bars.length;
  return bars.map((_, b) => {
    const w = Math.min(WINDOW, b, n - b);
    if (w < 2) return 0;
    const before = meanVec(bars, b - w, b), after = meanVec(bars, b, b + w);
    return Math.hypot(...before.map((x, k) => x - after[k]));
  });
}

/** Section boundaries in bars (0 and the end included), snapped to phrases, at least MIN_SECTION apart. */
export function boundaries(bars: BarFeatures[]): number[] {
  const n = bars.length;
  if (n < MIN_SECTION * 2) return n ? [0, n] : [0];
  const nov = novelty(bars);
  const max = Math.max(...nov);
  const threshold = Math.max(0.15, 0.3 * max);
  // Local peaks (highest within ±2 bars), snapped to the phrase grid, strongest kept first.
  const peaks: { bar: number; score: number }[] = [];
  for (let b = 1; b < n; b++) {
    if (nov[b] < threshold) continue;
    let top = true;
    for (let d = -2; d <= 2 && top; d++) if (d && nov[b + d] > nov[b]) top = false;
    if (top) peaks.push({ bar: snapToPhrase(b, n), score: nov[b] });
  }
  peaks.sort((a, b) => b.score - a.score);
  const kept: number[] = [];
  for (const p of peaks) {
    if (p.bar < MIN_SECTION / 2 || n - p.bar < MIN_SECTION / 2) continue;
    if (kept.some((k) => Math.abs(k - p.bar) < MIN_SECTION)) continue;
    kept.push(p.bar);
  }
  return [0, ...kept.sort((a, b) => a - b), n];
}

type Stats = { energy: number; kick: number; bass: number; hats: number; chords: number; rise: number; fullness: number };

function stats(bars: BarFeatures[], a: number, b: number): Stats {
  const m = (k: keyof BarFeatures, x = a, y = b) => { let s = 0; for (let i = x; i < y; i++) s += bars[i][k]; return s / Math.max(1, y - x); };
  const q = Math.max(1, Math.floor((b - a) / 4));
  // Rise: energy and hats in the last quarter against the first.
  const rise = (m("energy", b - q, b) + m("hats", b - q, b)) / 2 - (m("energy", a, a + q) + m("hats", a, a + q)) / 2;
  const s = { energy: m("energy"), kick: m("kick"), bass: m("bass"), hats: m("hats"), chords: m("chords"), rise, fullness: 0 };
  s.fullness = 0.5 * s.energy + 0.5 * ((s.kick + s.bass + s.hats + s.chords) / 4);
  return s;
}

const KICK_ON = 0.5, KICK_OFF = 0.3, RISING = 0.1;

/**
 * Labels by rules, per section:
 * - drop: the kick plays and the section is among the fullest (≥ 85 % of the fullest section).
 * - before the first drop: intro; the last one before the drop is a build if it rises or the kick
 *   is out (a breakdown-style lead-in).
 * - after the last drop: outro.
 * - between drops: kick out → breakdown (or build, if it rises straight into a drop); kick in but
 *   not full → build if a drop follows and it rises, else breakdown when clearly quieter, else drop.
 * - no drop at all: first intro, last outro, middle by the kick (breakdown without, drop with).
 */
export function labelSections(stat: Stats[]): SectionLabel[] {
  const n = stat.length;
  if (!n) return [];
  const maxFull = Math.max(...stat.map((s) => s.fullness));
  const full = stat.map((s) => s.kick >= KICK_ON && s.fullness >= 0.85 * maxFull);
  const first = full.indexOf(true), last = full.lastIndexOf(true);
  if (first < 0) {
    return stat.map((s, i) => (i === 0 && n > 1 ? "intro" : i === n - 1 && n > 1 ? "outro" : s.kick < KICK_OFF ? "breakdown" : "drop"));
  }
  return stat.map((s, i): SectionLabel => {
    if (full[i]) return "drop";
    if (i < first) return i === first - 1 && i > 0 && (s.rise >= RISING || s.kick < KICK_OFF) ? "build" : "intro";
    if (i > last) return "outro";
    const intoDrop = full[i + 1] === true;
    if (s.kick < KICK_OFF) return intoDrop && s.rise >= RISING && stat[i - 1]?.kick < KICK_OFF ? "build" : "breakdown";
    if (intoDrop && s.rise >= RISING) return "build";
    return s.energy < 0.6 * stat[first].energy ? "breakdown" : "drop";
  });
}

/**
 * A build often hides at the end of a breakdown: the kick stays out, so the novelty barely moves,
 * but energy and hats climb. A kick-less span of 16+ bars whose last 8 bars rise and sit clearly
 * above the rest of it gets those 8 bars split off (labelled by the rules afterwards).
 */
function splitBuilds(bars: BarFeatures[], spans: (readonly [number, number])[]): (readonly [number, number])[] {
  const out: (readonly [number, number])[] = [];
  for (const [a, b] of spans) {
    const all = stats(bars, a, b);
    if (b - a >= 16 && all.kick < KICK_OFF) {
      const tail = stats(bars, b - 8, b), head = stats(bars, a, b - 8);
      const lift = (tail.energy + tail.hats) / 2 - (head.energy + head.hats) / 2;
      if (tail.rise >= RISING && lift >= RISING) { out.push([a, b - 8], [b - 8, b]); continue; }
    }
    out.push([a, b]);
  }
  return out;
}

/** Sections of a track: boundaries, labels, adjacent equal labels merged, and their times. */
export function detectSections(bars: BarFeatures[], bpm: number, originSec: number): Section[] {
  const cuts = boundaries(bars);
  if (cuts.length < 2) return [];
  const spans = splitBuilds(bars, cuts.slice(0, -1).map((a, i) => [a, cuts[i + 1]] as const));
  const labels = labelSections(spans.map(([a, b]) => stats(bars, a, b)));
  const merged: { label: SectionLabel; startBar: number; endBar: number }[] = [];
  spans.forEach(([a, b], i) => {
    const prev = merged.at(-1);
    if (prev && prev.label === labels[i]) prev.endBar = b;
    else merged.push({ label: labels[i], startBar: a, endBar: b });
  });
  const sec = (bar: number) => Math.round(barsToSeconds(bar, bpm, originSec) * 100) / 100;
  return merged.map((m) => ({ ...m, startSec: sec(m.startBar), endSec: sec(m.endBar) }));
}
