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

/**
 * The numbers the Studio sends win (a template's refined tempo, e.g. 126.04, and its key), so the
 * prompt and the loop check match the track it lands in; the stored analysis, when there is one,
 * only adds its style words. No stored analysis → the sent numbers alone.
 */
export function mergeSource(sent: LoopSource | null, stored: LoopSource | null): LoopSource | null {
  if (!sent) return stored;
  if (!stored) return sent;
  return {
    bpm: sent.bpm, key: sent.key, scale: sent.scale,
    genres: stored.genres ?? [],
    ...(stored.myGenre ? { myGenre: stored.myGenre } : {}),
  };
}

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

const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLATS: Record<string, string> = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#", Cb: "B", Fb: "E", "E#": "F", "B#": "C" };
const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];

/** The seven notes of the key, in sharps: "A" minor → A B C D E F G. null for an unknown root. */
export function scaleNotes(key: string, scale: string): string[] | null {
  const k = key.trim();
  const root = SHARPS.indexOf(FLATS[k] ?? k);
  if (root < 0) return null;
  return (/^maj/i.test(scale) ? MAJOR_STEPS : MINOR_STEPS).map((s) => SHARPS[(root + s) % 12]);
}

/**
 * The key, spelled out so the model can't drift into the parallel major (L124: Stable Audio 2.5
 * kept the tonic on 5/5 but used the major third on 3 of 4 minor prompts). Names the root, the
 * notes and the third, and rules out the other third. Fix pass wording ("B"); the first run's
 * wording ("A") was just "in F minor".
 */
export function keyPhrase(key: string, scale: string): string {
  const major = /^maj/i.test(scale);
  const label = keyLabel(key, scale);
  const notes = scaleNotes(key, scale);
  if (!notes) return `in ${label}`;
  const root = notes[0];
  if (major) return `in ${label}: a bright major-key bassline rooted on ${root}, using only the notes ${notes.join(" ")} (major third ${notes[2]}, no minor third)`;
  return `in ${label}: a dark natural-minor bassline rooted on ${root}, using only the notes ${notes.join(" ")} (minor third ${notes[2]}, no major third)`;
}

/**
 * A bass-loop prompt from a track's analysis. Genre first, then instrument, tempo, key and the
 * loop length, which is the order both providers' prompt guides recommend (Stable Audio prompt
 * guide; Lyria prompt guide: genre, instruments, BPM, key). Instrumental and bass-only, so it
 * sits under the owner's own drums.
 */
export function bassLoopRequest(src: LoopSource, bars: number, seed?: number, words?: string): LoopRequest {
  const bpm = Math.round(src.bpm);
  const scale = /^maj/i.test(src.scale) ? "major" : "minor";
  const styles = styleWords(src);
  const genre = styles.length ? `${styles.join(", ")} ` : "House ";
  const own = words ? cleanWords(words) : "";
  const prompt =
    `${genre}bass loop.${own ? ` The bass: ${own}.` : ""} Solo bassline only: no drums, no percussion, no chords, no vocals. ` +
    `${bpm} BPM, ${keyPhrase(src.key, scale)}. ${bars} bars of 4/4, a seamless loop that repeats cleanly. ` +
    `Tight, groovy, clean studio mix.`;
  return { prompt, bpm, key: src.key.trim(), scale, bars, ...(seed !== undefined ? { seed } : {}) };
}

/**
 * Make's "Describe a bass in words…" (S3, L157): the owner's own words go into the prompt with the
 * track's numbers, nothing else. One line, at most 160 characters, letters, digits and plain
 * punctuation only, no trailing full stop.
 */
export function cleanWords(words: string): string {
  return words.normalize("NFC").replace(/[^\p{L}\p{N} ,;:'’()/&+-]+/gu, " ").replace(/\s+/g, " ").trim().slice(0, 160).replace(/[\s,;:]+$/, "");
}
