// Lab transport timing (L155, L161): bars ↔ track time, which bars a section loop covers, where a
// looping playhead is, and when audio comes back after a seek ("catching up…"). Pure numbers so it
// can be unit-tested (timing.test.ts). Times: track ms, or AudioContext seconds ("ctx s").

/** Longest section loop held in memory (L161). */
export const LOOP_CAP_BARS = 16;

export const barSeconds = (bpm: number, beatsPerBar = 4) => (60 / bpm) * beatsPerBar;

/** 1-based bar (fractional) → track ms; bar 1 starts at the first downbeat `originSec`. */
export function barToMs(bar: number, bpm: number, originSec: number) {
  return (originSec + (bar - 1) * barSeconds(bpm)) * 1000;
}

/** Track ms → 1-based bar (fractional; below 1 before the first downbeat). */
export function msToBar(ms: number, bpm: number, originSec: number) {
  return (ms / 1000 - originSec) / barSeconds(bpm) + 1;
}

/** Samples between two track positions at a sample rate. */
export const msToSamples = (ms: number, rate: number) => Math.round((ms / 1000) * rate);

export type BarRange = { from: number; to: number }; // 1-based, `to` exclusive

/**
 * The bars a click on a section loops: the whole section when it is at most `cap` bars; otherwise
 * the `cap`-bar phrase of it (counted from the section's start) that holds the heard bar, or its
 * first phrase when the heard bar is elsewhere. Never past the section's end.
 */
export function loopBars(section: BarRange, heardBar: number | null, cap = LOOP_CAP_BARS): BarRange {
  const len = section.to - section.from;
  if (len <= cap) return { from: section.from, to: section.to };
  const inside = heardBar !== null && heardBar >= section.from && heardBar < section.to;
  const k = inside ? Math.floor((Math.floor(heardBar) - section.from) / cap) : 0;
  const from = section.from + k * cap;
  return { from, to: Math.min(section.to, from + cap) };
}

/**
 * Where a memory loop is at ctx time `now`: it started playing `startMs` at ctx time `t0`, and wraps
 * from `endMs` back to `startMs`. Before `t0` it is at `startMs`.
 */
export function loopPositionMs(startMs: number, endMs: number, t0: number, now: number) {
  const len = endMs - startMs;
  if (len <= 0) return startMs;
  const into = Math.max(0, (now - t0) * 1000);
  return startMs + (into % len);
}

/** ctx time at which a run plays track position `ms`: capture time of `ms` plus the delay. */
export const playTimeOf = (ms: number, offsetS: number, delayS: number) => ms / 1000 - offsetS + delayS;

/**
 * A run's offset (track seconds − capture ctx seconds) from the Deck's reports: the median over the
 * playing marks that arrived at least `settleS` after the run's audio started (the widget can report
 * the seek target before it really plays). Null until there is one.
 */
export function runOffset(marks: { at: number; posMs: number; playing: boolean }[], captureFrom: number, settleS = 0.5): number | null {
  const d = marks.filter((m) => m.playing && m.at >= captureFrom + settleS).map((m) => m.posMs / 1000 - m.at).sort((a, b) => a - b);
  return d.length ? d[Math.floor(d.length / 2)] : null;
}

/**
 * After a seek the Lab mutes the old audio and waits for new audio. Given one separated region
 * (capture ctx seconds [cs, ce)), whether it brings the new audio back, and when to unmute:
 * - null while the Deck hasn't reported the new position (`captureFrom` null), or the region is all
 *   before it (old audio), or all before `fromMs` (a pre-roll before a loop's start);
 * - else the ctx time the first new sample at or after `fromMs` plays.
 */
export function gateResume(o: { cs: number; ce: number; captureFrom: number | null; offsetS: number | null; fromMs: number; delayS: number }): number | null {
  if (o.captureFrom === null || o.offsetS === null || o.ce <= o.captureFrom) return null;
  const fromCap = Math.max(o.cs, o.captureFrom, o.fromMs / 1000 - o.offsetS);
  if (fromCap >= o.ce) return null;
  return fromCap + o.delayS;
}

/** "catching up…": a seek is waiting for new audio, or the new audio hasn't started playing yet. */
export function isCatching(gatePending: boolean, unmuteAt: number | null, now: number) {
  return gatePending || (unmuteAt !== null && now < unmuteAt);
}
