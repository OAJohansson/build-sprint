// Table filters (F13, L41): a BPM range and the owner's genre. Pure, so it's tested on its own.
// A track whose half/double time is unclear matches on either reading (bpm-choice.ts).
import { bpmChoice, type BpmInput } from "./bpm-choice";
import { cleanGenre } from "./my-genre";

/** "" = all genres; NO_GENRE = tracks without one; else the genre (case-insensitive). */
export const NO_GENRE = "__no_genre__";

export type Filters = { bpmMin: number | null; bpmMax: number | null; genre: string };
export const NO_FILTERS: Filters = { bpmMin: null, bpmMax: null, genre: "" };

export const bpmRangeSet = (f: Filters) => f.bpmMin != null || f.bpmMax != null;
export const filtersActive = (f: Filters) => bpmRangeSet(f) || f.genre !== "";

/** A typed BPM bound: empty or not a positive number = open-ended. */
export function parseBound(v: string): number | null {
  const n = Number(v.replace(",", ".").trim());
  return v.trim() && Number.isFinite(n) && n > 0 ? n : null;
}

/** The readings a track can match on: the lead and, when half/double is unclear, the other one. */
export function bpmReadings(a: BpmInput): number[] {
  const c = bpmChoice(a);
  const out = c.lead > 0 ? [c.lead] : [];
  if (c.unclear && c.other != null && c.other > 0) out.push(c.other);
  return out;
}

type Filterable = BpmInput & { myGenre?: string };

/** Does a row pass? `a` is the track's result; rows not analysed yet have none, so any BPM range
 *  or genre filter hides them. Bounds are inclusive; min > max is read as the range between them. */
export function matchesFilters(a: Filterable | undefined, f: Filters): boolean {
  if (bpmRangeSet(f)) {
    if (!a) return false;
    let lo = f.bpmMin ?? -Infinity, hi = f.bpmMax ?? Infinity;
    if (lo > hi) [lo, hi] = [hi, lo];
    // Readings are shown to one decimal: compare what the owner sees.
    if (!bpmReadings(a).some((b) => { const r = Math.round(b * 10) / 10; return r >= lo && r <= hi; })) return false;
  }
  if (f.genre) {
    // Only analysed tracks carry a genre, so a genre filter (even "No genre yet") shows only those.
    if (!a) return false;
    const g = cleanGenre(a?.myGenre);
    if (f.genre === NO_GENRE) { if (g) return false; }
    else if (!g || g.toLowerCase() !== f.genre.toLowerCase()) return false;
  }
  return true;
}

/** Stored filters from localStorage, made safe. */
export function sanitiseFilters(raw: unknown): Filters {
  if (!raw || typeof raw !== "object") return NO_FILTERS;
  const r = raw as Partial<Filters>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);
  return { bpmMin: num(r.bpmMin), bpmMax: num(r.bpmMax), genre: typeof r.genre === "string" ? r.genre : "" };
}
