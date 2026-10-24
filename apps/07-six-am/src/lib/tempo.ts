// The Studio's project tempo (F10, US6). The loops are synthesised from notes on a 16th-note grid
// (recipes.ts), so playing them at another tempo only changes how long a 16th lasts. Pure, tested.

/** The tempo the Studio was built at and starts at. */
export const DEFAULT_BPM = 124;
/** Stored per device in localStorage (L-decision: not per saved track yet). */
export const TEMPO_KEY = "07-six-am:bpm";
/** The Studio's playable range: wide enough for downtempo to drum & bass. */
export const MIN_BPM = 60;
export const MAX_BPM = 200;

/** Any value → a tempo the Studio can play: one decimal, inside the range; junk → the default. */
export function clampBpm(bpm: unknown): number {
  const n = typeof bpm === "number" ? bpm : Number.NaN;
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_BPM;
  return Math.round(Math.min(MAX_BPM, Math.max(MIN_BPM, n)) * 10) / 10;
}

/** Length of one 16th note in seconds: 4 sixteenths per beat. */
export function secondsPerStep(bpm: number): number {
  return 60 / clampBpm(bpm) / 4;
}

/** "124" for whole tempi, "122.4" otherwise. */
export function formatBpm(bpm: number): string {
  const b = clampBpm(bpm);
  return Number.isInteger(b) ? String(b) : b.toFixed(1);
}
