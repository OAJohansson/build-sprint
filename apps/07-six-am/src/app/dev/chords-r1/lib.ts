// Round 1 helpers (dev only): plain words for chords, for a user with no music theory (L260).
import type { Song } from "../chords-directions/data";

export type St = "main" | "fix" | "notes" | "worst";

const QUALS = ["", "m", "7", "m7", "maj7", "sus2", "sus4"];
/** How a chord's flavour sounds, in plain words (draft copy). */
export const FLAVOUR: Record<string, string> = {
  "": "bright, plain", m: "darker, softer", "7": "bluesy, restless", m7: "soft, smooth", maj7: "dreamy, warm",
  sus2: "open, floating", sus4: "open, waiting", dim: "tense",
};
export const rootOf = (n: string) => /^[A-G][♯♭]?/.exec(n)![0];
export const qualOf = (n: string) => n.slice(rootOf(n).length);
export const flavour = (n: string) => FLAVOUR[qualOf(n)] ?? "";

/**
 * The reader gets the root right far more often than the flavour (spike: roots 85–92 %), so the first
 * choices are the same root in other flavours: Make's own alternatives on that root first, then the
 * common ones, three at most.
 */
export function versions(song: Song, i: number, current: string): string[] {
  const b = song.bars[i], r = rootOf(b.read);
  const fromMake = [b.read, ...b.alts.map((a) => a.name)].filter((n) => rootOf(n) === r);
  const rest = QUALS.map((q) => r + q);
  return [...new Set([...fromMake, ...rest])].filter((n) => n !== current).slice(0, 3);
}

/** The key's chords with a feel word each, in place of I–vii (draft copy). */
const FEEL = ["home", "soft", "sad", "lifts", "pulls home", "dark", "tense"];
export const fits = (song: Song) => song.keyChords.map((n, k) => ({ name: n, feel: FEEL[k] }));

/** Make's other guesses for a bar (its alternatives), to mark them in a list. */
export const guessed = (song: Song, i: number) => [song.bars[i].read, ...song.bars[i].alts.map((a) => a.name)];

import { pcName, voicing } from "../chords-directions/data";
const pc = (m: number) => ((m % 12) + 12) % 12;
/** One plain sentence about a bar's chord on the keys: its notes, and what is extra or missing. */
export function teach(name: string, notes: number[], custom: boolean, flats: boolean): string {
  const tpl = voicing(name).map(pc), have = [...new Set(notes.map(pc))];
  const list = (xs: number[]) => xs.map((p) => pcName(p, flats)).join(", ");
  const extra = have.filter((p) => !tpl.includes(p)), missing = tpl.filter((p) => !have.includes(p));
  if (!custom) return `${name} is ${list(tpl)}: ${flavour(name)}.`;
  return `Your notes: ${list(have)}. Closest name ${name}${extra.length ? `, with ${list(extra)} added` : ""}${missing.length ? `, without ${list(missing)}` : ""}.`;
}
