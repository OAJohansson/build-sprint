// Lab playhead sync (L144): what position of the track you are hearing right now. The Deck reports
// its position a few times a second; the parts play `delay` seconds after the capture heard them,
// so the heard position is the Deck's position `delay` seconds ago. Times are AudioContext seconds.

export type DeckMark = { at: number; posMs: number; playing: boolean };

/** Adds a mark, keeping only the last `keepS` seconds (the delay plus some slack). */
export function addMark(marks: DeckMark[], m: DeckMark, keepS = 30): DeckMark[] {
  const kept = marks.filter((x) => x.at >= m.at - keepS && x.at <= m.at);
  kept.push(m);
  return kept;
}

/**
 * The Deck's position at time `t`: from the last mark at or before `t`, moved on by the time
 * since if it was playing. Null before the first mark (nothing heard yet).
 */
export function positionAt(marks: DeckMark[], t: number): number | null {
  let last: DeckMark | null = null;
  for (const m of marks) if (m.at <= t && (!last || m.at >= last.at)) last = m;
  if (!last) return null;
  return last.playing ? last.posMs + (t - last.at) * 1000 : last.posMs;
}

/** Position you hear at `now`, with the parts playing `delayS` behind the capture. */
export function heardPosition(marks: DeckMark[], now: number, delayS: number) {
  return positionAt(marks, now - delayS);
}

/** RMS level in dB of a stretch of samples (−120 for silence). */
export function levelDb(a: Float32Array, from = 0, to = a.length) {
  let e = 0;
  for (let i = from; i < to; i++) e += a[i] * a[i];
  return Math.max(-120, 10 * Math.log10(e / Math.max(1, to - from) + 1e-12));
}
