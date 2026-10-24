// "Generate a bass loop like this track" (S4, A9): the prompt is built from Ears' numbers only
// (styles, BPM, key, scale), never from audio. Pure and secret-free, so the route, the bake-off
// script (scripts/loops-bakeoff.mjs, via Node's type stripping) and a future UI share it.
// Keep this file free of value imports: Node runs it directly without the "@/" alias.

export type LoopProviderId = "stability" | "lyria";

/** What a provider adapter is asked for. bars are 4/4 bars. */
export type LoopRequest = { prompt: string; bpm: number; key: string; scale: string; bars: number; seed?: number };

/** The slice of an Ears result the prompt needs (EarsAnalysis fits). */
export type LoopSource = {
  bpm: number;
  key: string;
  scale: string;
  genres?: { style: string; p: number }[];
  myGenre?: string;
};

export const LOOP_BARS = [4, 8] as const;
export type LoopBars = (typeof LOOP_BARS)[number];

/** Seconds of `bars` 4/4 bars at `bpm`: 8 bars at 120 BPM = 16 s. */
export function loopSeconds(bpm: number, bars: number): number {
  return Math.round(((bars * 4 * 60) / bpm) * 1000) / 1000;
}

/** "Electronic---Deep House" → "Deep House" (Discogs style display name). */
const styleName = (style: string) => style.split("---").pop()?.trim() || style;

/** Up to two style words: the owner's genre first, then Ears' top styles above 10 %. */
export function styleWords(src: LoopSource): string[] {
  const words: string[] = [];
  const add = (w: string | undefined) => {
    const t = w?.trim();
    if (t && !words.some((x) => x.toLowerCase() === t.toLowerCase())) words.push(t);
  };
  add(src.myGenre);
  for (const g of [...(src.genres ?? [])].sort((a, b) => b.p - a.p)) if (g.p >= 0.1) add(styleName(g.style));
  return words.slice(0, 2);
}

/** "D#" + "minor" → "D# minor"; junk scale → "minor". */
export const keyLabel = (key: string, scale: string) => `${key.trim()} ${/^maj/i.test(scale) ? "major" : "minor"}`;

/**
 * A bass-loop prompt from a track's analysis. Genre first, then instrument, tempo, key and the
 * loop length, which is the order both providers' prompt guides recommend (Stable Audio prompt
 * guide; Lyria prompt guide: genre, instruments, BPM, key). Instrumental and bass-only, so it
 * sits under the owner's own drums.
 */
export function bassLoopRequest(src: LoopSource, bars: number, seed?: number): LoopRequest {
  const bpm = Math.round(src.bpm);
  const scale = /^maj/i.test(src.scale) ? "major" : "minor";
  const styles = styleWords(src);
  const genre = styles.length ? `${styles.join(", ")} ` : "House ";
  const prompt =
    `${genre}bass loop. Solo bassline only: no drums, no percussion, no chords, no vocals. ` +
    `${bpm} BPM, in ${keyLabel(src.key, scale)}, ${bars} bars of 4/4, a seamless loop that repeats cleanly. ` +
    `Tight, groovy, clean studio mix.`;
  return { prompt, bpm, key: src.key.trim(), scale, bars, ...(seed !== undefined ? { seed } : {}) };
}
