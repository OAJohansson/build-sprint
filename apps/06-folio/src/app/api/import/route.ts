import { mergeBooks, type ImportRow } from "@/lib/goodreads";
import { guard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";
import { lookup } from "@/lib/server/openlibrary";
import type { Book } from "@/lib/types";

// The Goodreads import, a batch at a time (the page sends ~25 rows per call and shows progress).
// Each row is matched to Open Library (ISBN first, then title and author) for its work id, cover
// and genres, then merged into the shelves: a row whose Goodreads id or work is already there
// updates that book instead of adding a second one, so importing twice adds nothing.

export const maxDuration = 60;

const MAX_ROWS = 40;
const CONCURRENCY = 5;

function isRow(r: unknown): r is ImportRow {
  if (!r || typeof r !== "object") return false;
  const o = r as Record<string, unknown>;
  return typeof o.goodreadsId === "string" && typeof o.title === "string" && (o.shelf === "read" || o.shelf === "want") && typeof o.addedOn === "string";
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

export async function POST(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const body = (await request.json().catch(() => null)) as { rows?: unknown } | null;
  const rows = Array.isArray(body?.rows) ? body.rows.filter(isRow).slice(0, MAX_ROWS) : [];
  if (!rows.length) return Response.json({ error: "Nothing to import." }, { status: 400 });
  try {
    const found = await mapLimit(rows, CONCURRENCY, (r) => lookup(r));
    const shelf = await g.store.list();
    const byGoodreads = new Map(shelf.filter((b) => b.goodreadsId).map((b) => [b.goodreadsId!, b]));
    const byWork = new Map(shelf.filter((b) => b.workKey).map((b) => [b.workKey!, b]));
    const changed = new Map<string, Omit<Book, "updatedAt">>();
    let added = 0;

    rows.forEach((r, i) => {
      const f = found[i];
      const incoming: Omit<Book, "id" | "updatedAt"> = {
        workKey: f?.workKey ?? null,
        goodreadsId: r.goodreadsId,
        isbn: r.isbn ?? f?.isbn ?? null,
        title: r.title,
        author: r.author,
        coverUrl: f?.coverUrl ?? null,
        year: r.year ?? f?.year ?? null,
        shelf: r.shelf,
        // Kept on want-to-read rows too (the app doesn't show it there): another edition of the
        // same book may be on the read shelf, and its rating should land there (Mindset).
        rating: r.rating,
        line: null,
        review: r.review ?? null,
        genres: f?.genres ?? [],
        readOn: r.readOn,
        readOnEstimated: r.readOnEstimated,
        addedOn: r.addedOn,
      };
      const existing = byGoodreads.get(r.goodreadsId) ?? (incoming.workKey ? byWork.get(incoming.workKey) : undefined);
      const book = existing ? mergeBooks(changed.get(existing.id) ?? existing, incoming) : { id: crypto.randomUUID(), ...incoming };
      if (!existing) added++;
      changed.set(book.id, book);
      byGoodreads.set(r.goodreadsId, { ...book, updatedAt: "" });
      if (book.workKey) byWork.set(book.workKey, { ...book, updatedAt: "" });
    });

    await g.store.save([...changed.values()]);
    // Every row is accounted for: added as a new book, or merged into one already there. Books
    // Open Library didn't recognise are still added (no cover or genre) and named, so nothing
    // goes missing silently (owner, 16 Oct).
    const unmatched = rows.filter((_, i) => !found[i]).map((r) => ({ title: r.title, author: r.author }));
    return Response.json({ added, merged: rows.length - added, total: rows.length, unmatched });
  } catch (error) {
    return serverError(error);
  }
}
