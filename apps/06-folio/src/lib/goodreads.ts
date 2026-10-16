import type { Book, Shelf } from "@/lib/types";

// Goodreads export → Folio. Plain functions so the date and rating rules have unit tests
// (decision 0011). What the export taught us (journal, 15–16 Oct): "date read" is often empty
// (Goodreads only fills it when set by hand), ratings are written "4.0" and can be halves, 0 means
// unrated, and the same book can sit on both shelves as two editions.

/** One book from the export, before matching it to Open Library. */
export type ImportRow = {
  goodreadsId: string;
  isbn: string | null;
  title: string;
  author: string;
  year: number | null;
  shelf: Shelf;
  rating: number | null;
  readOn: string | null;
  readOnEstimated: boolean;
  addedOn: string;
  /** "My Review", as plain text (becomes the longer review). */
  review: string | null;
};

/** RFC 4180 CSV: quoted fields may hold commas, doubled quotes and line breaks. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

/** Goodreads writes dates as "2023/05/14"; Folio keeps "2023-05-14". Anything else → null. */
export function toIsoDate(value: string): string | null {
  const m = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const month = Number(mo);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "4.0" → 4, "3.5" → 3.5, "0" or "" → null (unrated). Rounded to half stars. */
export function toRating(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(5, Math.max(0.5, Math.round(n * 2) / 2));
}

/** Today in the device's own time zone, as YYYY-MM-DD. */
export function today(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Drop the series marker and subtitle: "Mindset: Changing the Way…" → "Mindset". */
export function cleanTitle(title: string): string {
  return title.replace(/\s*\([^)]*#[\d.]+\)\s*$/, "").split(":")[0].trim() || title.trim();
}

const ISBN = (v: string) => v.replace(/[="\s]/g, "") || null;

/** Goodreads reviews are HTML-ish ("<br/>", "<i>", "&amp;"): keep the words and line breaks. */
export function cleanReview(value: string): string | null {
  const text = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || null;
}

/** A row the import can't place (a custom exclusive shelf, e.g. did-not-finish). */
export type SkippedRow = { title: string; author: string; shelf: string };

/**
 * Turn the export's text into books. read, to-read and currently-reading map to Folio's Read,
 * Want to read and Current read; rows on a custom exclusive shelf (e.g. did-not-finish) are
 * returned as skipped, never dropped silently (owner's "no book lost" rule, 16 Oct).
 */
export function readGoodreads(csv: string, now = new Date()): { rows: ImportRow[]; skipped: SkippedRow[] } {
  const skipped: SkippedRow[] = [];
  const rows = parseGoodreads(csv, now, skipped);
  return { rows, skipped };
}

/** The rows Folio has a shelf for (see readGoodreads for the skipped ones). */
export function fromGoodreads(csv: string, now = new Date()): ImportRow[] {
  return parseGoodreads(csv, now, []);
}

function parseGoodreads(csv: string, now: Date, skipped: SkippedRow[]): ImportRow[] {
  const [header, ...rows] = parseCsv(csv);
  if (!header) return [];
  const col = (name: string) => header.indexOf(name);
  const need = ["Book Id", "Title", "Author", "Exclusive Shelf"];
  if (need.some((n) => col(n) < 0)) throw new Error("This doesn't look like a Goodreads export.");
  const get = (r: string[], name: string) => (col(name) >= 0 ? (r[col(name)] ?? "").trim() : "");
  const out: ImportRow[] = [];
  for (const r of rows) {
    const exclusive = get(r, "Exclusive Shelf");
    // Custom shelves (e.g. did-not-finish) have no place in Folio and are reported as skipped.
    const shelf: Shelf | null = exclusive === "read" ? "read" : exclusive === "to-read" ? "want" : exclusive === "currently-reading" ? "reading" : null;
    if (!shelf) {
      if (get(r, "Title")) skipped.push({ title: cleanTitle(get(r, "Title")), author: get(r, "Author").replace(/\s+/g, " "), shelf: exclusive || "no shelf" });
      continue;
    }
    const added = toIsoDate(get(r, "Date Added")) ?? today(now);
    const read = toIsoDate(get(r, "Date Read"));
    const year = Number(get(r, "Original Publication Year") || get(r, "Year Published")) || null;
    out.push({
      goodreadsId: get(r, "Book Id"),
      isbn: ISBN(get(r, "ISBN13")) ?? ISBN(get(r, "ISBN")),
      title: cleanTitle(get(r, "Title")),
      author: get(r, "Author").replace(/\s+/g, " "),
      year,
      shelf,
      rating: toRating(get(r, "My Rating")),
      readOn: shelf === "read" ? (read ?? added) : null,
      readOnEstimated: shelf === "read" && !read,
      addedOn: added,
      review: cleanReview(get(r, "My Review")),
    });
  }
  return out;
}

/** When two rows are the same book, the furthest along wins: read, then reading, then want. */
const SHELF_RANK: Record<Shelf, number> = { want: 0, reading: 1, read: 2 };

/**
 * Two rows for the same book (same Open Library work): the furthest shelf wins, a rating on
 * either row is kept, my own words are never overwritten, and a real "date read" beats an
 * estimated one. `kept` keeps its id.
 */
export function mergeBooks<T extends Omit<Book, "updatedAt">>(kept: T, other: Omit<Book, "id" | "updatedAt">): T {
  const shelf: Shelf = SHELF_RANK[other.shelf] > SHELF_RANK[kept.shelf] ? other.shelf : kept.shelf;
  const read = shelf === "read";
  const readOnFrom =
    kept.readOn && (!kept.readOnEstimated || !other.readOn || other.readOnEstimated) ? kept : other.readOn ? other : kept;
  return {
    ...kept,
    workKey: kept.workKey ?? other.workKey,
    goodreadsId: kept.goodreadsId ?? other.goodreadsId,
    isbn: kept.isbn ?? other.isbn,
    coverUrl: kept.coverUrl ?? other.coverUrl,
    year: kept.year ?? other.year,
    shelf,
    rating: kept.rating ?? other.rating,
    line: kept.line ?? other.line,
    review: kept.review ?? other.review,
    genres: [...new Set([...kept.genres, ...other.genres])],
    readOn: read ? readOnFrom.readOn : null,
    readOnEstimated: read ? readOnFrom.readOnEstimated : false,
    startedOn: shelf === "want" ? null : (kept.startedOn ?? other.startedOn),
    addedOn: kept.addedOn < other.addedOn ? kept.addedOn : other.addedOn,
  };
}
