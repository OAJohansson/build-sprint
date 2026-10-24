// My genre (F12, L41): the owner's own genre for a track, free text. Suggestions are the genre
// families of kickoff-source.md Appendix A plus every genre already used (used ones first).
import type { EarsAnalysis } from "./results";

/** kickoff-source.md Appendix A, "Genre family" column. */
export const GENRE_FAMILIES = [
  "Deep house (Chicago/NY roots)",
  "Jazzy / piano deep house, lo-fi house",
  "Raw / soulful queer house (Adonis, Gideön world)",
  "Emotive vocal house",
  "Tech house",
  "Minimal / deep tech",
  "Jackin' house",
  "Progressive house",
  "Melodic house & techno",
  "High-tech minimal / melodic techno",
  "Classic house reworks",
  "Pop-club / camp remixes",
  "Ballroom / vogue house",
  "Hard trance / hard bounce / hard groove",
  "Breakbeat / UK electronica",
  "Tropical house",
  "Afro house",
] as const;

/** Trimmed, inner spaces collapsed; empty means "not set". */
export function cleanGenre(v: string | null | undefined): string | undefined {
  const t = (v ?? "").replace(/\s+/g, " ").trim();
  return t || undefined;
}

/** Every genre in use, once each (case-insensitive; the first spelling wins), A–Z. */
export function usedGenres(list: Pick<EarsAnalysis, "myGenre">[]): string[] {
  const seen = new Map<string, string>();
  for (const a of list) {
    const g = cleanGenre(a.myGenre);
    if (g && !seen.has(g.toLowerCase())) seen.set(g.toLowerCase(), g);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

/** Used genres first, then the Appendix A families not used yet. */
export function genreSuggestions(list: Pick<EarsAnalysis, "myGenre">[]): string[] {
  const used = usedGenres(list);
  const have = new Set(used.map((g) => g.toLowerCase()));
  return [...used, ...GENRE_FAMILIES.filter((f) => !have.has(f.toLowerCase()))];
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
