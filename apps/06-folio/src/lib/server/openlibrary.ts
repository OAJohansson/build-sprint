import "server-only";
import { mapGenres } from "@/lib/genres";
import type { Found } from "@/lib/types";

// Open Library: the free base of Folio's book data, no key needed (decision 0014). Responses are
// cached by Next's fetch cache, so browsing doesn't hit Open Library on every visit.
// shortcut: Open Library is the only source so far; Hardcover, Google Books and NYT plug in
// behind these same functions once their keys are in and the bake-off has picked what each
// field comes from.

const BASE = "https://openlibrary.org";
// Open Library asks clients to say who they are.
const HEADERS = { "User-Agent": "Folio (https://github.com/OAJohansson/build-sprint)" };
const FIELDS = "key,title,author_name,cover_i,first_publish_year,subject,isbn";

type Doc = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  subject?: string[];
  isbn?: string[];
};

export const coverById = (id: number) => `https://covers.openlibrary.org/b/id/${id}-M.jpg`;

function toFound(d: Doc): Found {
  const year = d.first_publish_year ?? null;
  return {
    workKey: d.key,
    title: d.title,
    author: d.author_name?.[0] ?? "",
    coverUrl: d.cover_i ? coverById(d.cover_i) : null,
    year,
    genres: mapGenres(d.subject ?? [], year),
    isbn: d.isbn?.find((i) => i.length === 13) ?? null,
  };
}

async function search(params: Record<string, string>, revalidate: number): Promise<Found[]> {
  const url = new URL(`${BASE}/search.json`);
  for (const [k, v] of Object.entries({ fields: FIELDS, ...params })) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: HEADERS, next: { revalidate } });
  if (!res.ok) throw new Error(`Open Library search ${res.status} for ${url.search}`);
  const data = (await res.json()) as { docs: Doc[] };
  return data.docs.map(toFound);
}

/** Title or author search. */
export const searchBooks = (q: string) => search({ q, limit: "24" }, 60 * 60);

/** A tuned genre query (subjects are messy), most-read first. */
export const browseGenre = (q: string) => search({ q: `${q} language:eng`, sort: "readinglog", limit: "24" }, 60 * 60 * 24);

/** Popular this month: Open Library's trending list, minus titles not in English. */
export async function trending(): Promise<Found[]> {
  const res = await fetch(`${BASE}/trending/monthly.json?limit=40`, { headers: HEADERS, next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) throw new Error(`Open Library trending ${res.status}`);
  const data = (await res.json()) as { works: Doc[] };
  // shortcut: drops titles with letters outside basic Latin as "not English"; misses some.
  return data.works
    .filter((w) => w.cover_i && !/[^\u0000-ɏ’'–—…]/.test(w.title) && !/^(O |L’|Le |La |El |Das |Die )/.test(w.title))
    .slice(0, 12)
    .map(toFound);
}

/** New releases: this year's English books, most-saved first. */
export async function newReleases(year: number): Promise<Found[]> {
  const found = await search({ q: `first_publish_year:${year} language:eng`, sort: "readinglog", limit: "20" }, 60 * 60 * 24);
  return found.filter((b) => b.coverUrl).slice(0, 12);
}

/**
 * Find one book for the import: by ISBN first, then by title and author. Returns null when Open
 * Library has nothing; the book is then imported with the export's own data and no cover.
 */
export async function lookup(book: { isbn: string | null; title: string; author: string }): Promise<Found | null> {
  const attempts: Record<string, string>[] = [];
  if (book.isbn) attempts.push({ isbn: book.isbn });
  attempts.push({ title: book.title, author: book.author.split(" ").at(-1) ?? book.author });
  for (const params of attempts) {
    const found = await search({ ...params, limit: "1" }, 60 * 60 * 24 * 7).catch(() => []);
    if (found[0]) return found[0];
  }
  return null;
}
