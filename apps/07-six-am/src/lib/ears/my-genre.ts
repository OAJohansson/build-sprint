// My genre (F12, L41): the owner's own genre for a track, free text. Suggestions are the genre
// families of kickoff-source.md Appendix A plus every genre already used (used ones first).
import type { EarsAnalysis } from "./results";

/** kickoff-source.md Appendix A, "Genre family" column, cut to a short family name each (the
 *  parenthetical and the second names dropped) so a typed genre and a picked one converge. */
export const GENRE_FAMILIES = [
  "Deep house",
  "Jazzy deep house",
  "Raw soulful queer house",
  "Emotive vocal house",
  "Tech house",
  "Minimal deep tech",
  "Jackin' house",
  "Progressive house",
  "Melodic house & techno",
  "High-tech minimal",
  "Classic house reworks",
  "Pop-club remixes",
  "Ballroom house",
  "Hard trance",
  "Breakbeat",
  "Tropical house",
  "Afro house",
] as const;

/** Trimmed, inner spaces collapsed; empty means "not set". */
export function cleanGenre(v: string | null | undefined): string | undefined {
  const t = (v ?? "").replace(/\s+/g, " ").trim();
  return t || undefined;
}

/** Two spellings of one genre share a key: case, spaces and punctuation ignored
 *  ("deep  House", "Deep-house" and "Deep house" are one). All-punctuation text keys on itself. */
export function genreKey(v: string | null | undefined): string {
  const g = cleanGenre(v)?.toLowerCase() ?? "";
  return g.replace(/[^\p{L}\p{N}]+/gu, "") || g;
}

/** What to save for a typed genre: an existing spelling with the same key (used genres first,
 *  then the families), else the typed text cleaned. */
export function canonicalGenre(typed: string, existing: readonly string[]): string | undefined {
  const g = cleanGenre(typed);
  if (!g) return undefined;
  const k = genreKey(g);
  return [...existing, ...GENRE_FAMILIES].find((e) => genreKey(e) === k) ?? g;
}

/** Every genre in use, once each (same key = same genre; the first spelling wins), A–Z. */
export function usedGenres(list: Pick<EarsAnalysis, "myGenre">[]): string[] {
  const seen = new Map<string, string>();
  for (const a of list) {
    const g = cleanGenre(a.myGenre);
    if (g && !seen.has(genreKey(g))) seen.set(genreKey(g), g);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

/** Used genres first, then the Appendix A families not used yet. */
export function genreSuggestions(list: Pick<EarsAnalysis, "myGenre">[]): string[] {
  const used = usedGenres(list);
  const have = new Set(used.map(genreKey));
  return [...used, ...GENRE_FAMILIES.filter((f) => !have.has(genreKey(f)))];
}

/** Set or clear one track's genre. */
export function withMyGenre(list: EarsAnalysis[], id: string, value: string): EarsAnalysis[] {
  const g = cleanGenre(value);
  return list.map((a) => {
    if (a.id !== id) return a;
    const { myGenre: _old, ...rest } = a;
    void _old;
    return g ? { ...rest, myGenre: g } : rest;
  });
}
