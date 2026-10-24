// My genre (F12, L41): the owner's own genre for a track, free text. Suggestions are the genres
// already used plus the accepted genre groups' names (L55: no built-in family list).
import type { EarsAnalysis } from "./results";


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

/** What to save for a typed genre: an existing spelling with the same key (used genres, then
 *  accepted group names), else the typed text cleaned. */
export function canonicalGenre(typed: string, existing: readonly string[]): string | undefined {
  const g = cleanGenre(typed);
  if (!g) return undefined;
  const k = genreKey(g);
  return existing.find((e) => genreKey(e) === k) ?? g;
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

/** Used genres first, then accepted genre-group names not used yet (L55). */
export function genreSuggestions(list: Pick<EarsAnalysis, "myGenre">[], groupNames: readonly string[] = []): string[] {
  const used = usedGenres(list);
  const have = new Set(used.map(genreKey));
  const extra: string[] = [];
  for (const g of groupNames) {
    const c = cleanGenre(g);
    if (c && !have.has(genreKey(c))) { have.add(genreKey(c)); extra.push(c); }
  }
  return [...used, ...extra];
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
