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

const quantile = (v: number[], q: number) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.round(q * (s.length - 1)))] : 0; };
const mean = (bars: BarFeatures[], k: keyof BarFeatures, a: number, b: number) => {
  let t = 0; const lo = Math.max(0, a), hi = Math.min(bars.length, b);
  for (let i = lo; i < hi; i++) t += bars[i][k];
  return hi > lo ? t / (hi - lo) : 0;
};
/** Novelty below this is never a boundary (a steady track has none). */
const MIN_NOVELTY = 0.1;
/** Sections longer than this get split at their strongest phrase-aligned change (L137). */
const LONG_SECTION = 32;

/**
 * Section boundaries in bars (0 and the end included), at least MIN_SECTION apart (L137: one method
 * for more boundaries). Candidates, strongest first:
 * 1. Rule changes on the phrase grid (every 4 bars): the kick returning or leaving (8 bars each side;
 *    a build ends where the kick comes back, so build and drop stay apart), and, in the last third,
 *    the energy stepping down (drop → cooldown → outro).
 * 2. Novelty peaks above a threshold set by the track's own novelty (its median plus half the spread
 *    to its 90th percentile), not by its single biggest change, snapped to phrases.
 * 3. Any section still longer than 32 bars is split at its strongest change on an 8-bar line.
 */
export function boundaries(bars: BarFeatures[]): number[] {
  const n = bars.length;
  if (n < MIN_SECTION * 2) return n ? [0, n] : [0];
  const nov = novelty(bars);
  const kept: number[] = [];
  const fits = (b: number) => b >= MIN_SECTION / 2 && n - b >= MIN_SECTION / 2 && !kept.some((k) => Math.abs(k - b) < MIN_SECTION);

  const rules: { bar: number; score: number }[] = [];
  for (let b = 8; b <= n - 8; b += 4) {
    const before = mean(bars, "kick", b - 8, b), after = mean(bars, "kick", b, b + 8);
    if ((before < KICK_OFF && after >= KICK_ON) || (before >= KICK_ON && after < KICK_OFF)) rules.push({ bar: b, score: 2 + Math.abs(after - before) });
    if (b >= (2 * n) / 3) {
      const step = mean(bars, "energy", b - 8, b) - mean(bars, "energy", b, b + 8);
      if (step >= 0.2 && nov[b] >= MIN_NOVELTY) rules.push({ bar: b, score: 1 + step });
    }
  }
  // Of neighbouring rule hits (4 bars apart), the strongest wins.
  rules.sort((a, b) => b.score - a.score);
  for (const r of rules) if (fits(r.bar)) kept.push(r.bar);

  const threshold = Math.max(MIN_NOVELTY, quantile(nov, 0.5) + 0.5 * (quantile(nov, 0.9) - quantile(nov, 0.5)));
  const peaks: { bar: number; score: number }[] = [];
  for (let b = 1; b < n; b++) {
    if (nov[b] < threshold) continue;
    let top = true;
    for (let d = -2; d <= 2 && top; d++) if (d && nov[b + d] > nov[b]) top = false;
    if (top) peaks.push({ bar: snapToPhrase(b, n), score: nov[b] });
  }
  peaks.sort((a, b) => b.score - a.score);
  for (const p of peaks) if (fits(p.bar)) kept.push(p.bar);

  for (let guard = 0; guard < 32; guard++) {
    const cuts = [0, ...kept.sort((a, b) => a - b), n];
    let added = false;
    for (let i = 0; i + 1 < cuts.length; i++) {
      const [a, b] = [cuts[i], cuts[i + 1]];
      if (b - a <= LONG_SECTION) continue;
      let best = -1, score = MIN_NOVELTY;
      for (let c = Math.ceil((a + MIN_SECTION) / 8) * 8; c <= b - MIN_SECTION; c += 8) if (nov[c] > score) { score = nov[c]; best = c; }
      if (best > 0) { kept.push(best); added = true; }
    }
    if (!added) break;
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

/** Outro and intro are only called near the track's ends (N1): the last quarter, the start. */
const OUTRO_FROM = 0.75;

/**
 * Labels by rules, per section (N1: every label has to earn its place; when none does, "section"):
 * - drop: the kick plays and the section is among the fullest (≥ 85 % of the fullest section).
 * - before the first drop: intro (it runs from the start); the last one before the drop is a build
 *   if it rises or the kick is out.
 * - outro: only a section starting in the last quarter of the track, after the last drop.
 * - elsewhere, not full: kick out or clearly quieter than the drop → breakdown; rising straight into
 *   a drop → build; nearly as loud as the drop with the kick in → drop; anything else → section.
 * - no drop at all: intro at the start, outro in the last quarter, breakdown without kick, else section.
 */
export function labelSections(stat: (Stats & { start: number })[], total: number): SectionLabel[] {
  const n = stat.length;
  if (!n) return [];
  const late = (i: number) => n > 1 && i > 0 && stat[i].start >= OUTRO_FROM * total;
  const maxFull = Math.max(...stat.map((s) => s.fullness));
  const full = stat.map((s) => s.kick >= KICK_ON && s.fullness >= 0.85 * maxFull);
  const first = full.indexOf(true), last = full.lastIndexOf(true);
  if (first < 0) {
    return stat.map((s, i) => (i === 0 && n > 1 ? "intro" : late(i) ? "outro" : s.kick < KICK_OFF ? "breakdown" : "section"));
  }
  const dropEnergy = Math.max(...stat.filter((_, i) => full[i]).map((s) => s.energy));
  const between = (s: Stats, i: number): SectionLabel => {
    const intoDrop = full[i + 1] === true;
    if (intoDrop && s.rise >= RISING) return "build";
    if (s.kick < KICK_OFF || s.energy < 0.6 * dropEnergy) return "breakdown";
    if (s.kick >= KICK_ON && s.energy >= 0.8 * dropEnergy) return "drop";
    return "section";
  };
  // The build before the first drop reaches back over the kick-less sections right before it.
  let buildFrom = first;
  const pre = stat[first - 1];
  if (first - 1 > 0 && pre && (pre.rise >= RISING || pre.kick < KICK_OFF)) {
    buildFrom = first - 1;
    while (buildFrom - 1 > 0 && stat[buildFrom - 1].kick < KICK_OFF && stat[buildFrom].kick < KICK_OFF) buildFrom--;
  }
  return stat.map((s, i): SectionLabel => {
    if (full[i]) return "drop";
    if (i < first) return i >= buildFrom ? "build" : "intro";
    if (i > last && late(i)) return "outro";
    return between(s, i);
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

/** Sections of a track: boundaries, labels (same labels merged) and their times. */
export function detectSections(bars: BarFeatures[], bpm: number, originSec: number): Section[] {
  const cuts = boundaries(bars);
  if (cuts.length < 2) return [];
  const spans = splitBuilds(bars, cuts.slice(0, -1).map((a, i) => [a, cuts[i + 1]] as const));
  const labels = labelSections(spans.map(([a, b]) => ({ ...stats(bars, a, b), start: a })), bars.length);
  // N1: neighbouring sections with the same label are one section (the boundary between them was a
  // phrase change inside it); the map, the Mentor and the template markers all read these.
  const merged: { label: SectionLabel; startBar: number; endBar: number }[] = [];
  spans.forEach(([a, b], i) => {
    const prev = merged.at(-1);
    if (prev && prev.label === labels[i]) prev.endBar = b;
    else merged.push({ label: labels[i], startBar: a, endBar: b });
  });
  const sec = (bar: number) => Math.round(barsToSeconds(bar, bpm, originSec) * 100) / 100;
  return merged.map((m) => ({ ...m, startSec: sec(m.startBar), endSec: sec(m.endBar) }));
}
