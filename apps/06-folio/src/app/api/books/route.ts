import { guard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";
import type { Book, BookInput } from "@/lib/types";

// My shelves are small enough (hundreds of books) to load whole.
export async function GET(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  try {
    return Response.json({ books: await g.store.list() });
  } catch (error) {
    return serverError(error);
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function parse(body: unknown): BookInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const date = (v: unknown) => (typeof v === "string" && DATE.test(v) ? v : null);
  const title = text(b.title, 300);
  const author = text(b.author, 200) ?? "";
  if (!title || (b.shelf !== "read" && b.shelf !== "want") || !date(b.addedOn)) return null;
  const rating = typeof b.rating === "number" && b.rating >= 0.5 && b.rating <= 5 ? Math.round(b.rating * 2) / 2 : null;
  return {
    workKey: text(b.workKey, 100),
    goodreadsId: text(b.goodreadsId, 40),
    isbn: text(b.isbn, 20),
    title,
    author,
    coverUrl: text(b.coverUrl, 500),
    year: typeof b.year === "number" && Number.isInteger(b.year) ? b.year : null,
    shelf: b.shelf,
    rating: b.shelf === "read" ? rating : null,
    line: text(b.line, 280),
    review: text(b.review, 20_000),
    genres: Array.isArray(b.genres) ? b.genres.filter((g): g is string => typeof g === "string").slice(0, 12) : [],
    readOn: b.shelf === "read" ? date(b.readOn) : null,
    readOnEstimated: b.shelf === "read" && b.readOnEstimated === true,
    addedOn: date(b.addedOn)!,
  };
}

// Create or update one book (add from search, log as read, edit). The id comes from the device.
export async function PUT(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const input = parse(await request.json().catch(() => null));
  if (!UUID.test(id) || !input) return Response.json({ error: "That book couldn't be saved." }, { status: 400 });
  try {
    // One book per work: adding a book that's already on a shelf updates that one instead.
    const existing = input.workKey ? (await g.store.list()).find((b) => b.workKey === input.workKey && b.id !== id) : undefined;
    const target: Omit<Book, "updatedAt"> = { id: existing?.id ?? id, ...input };
    const [book] = await g.store.save([target]);
    return Response.json({ book });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return Response.json({ error: "That book couldn't be removed." }, { status: 400 });
  try {
    await g.store.remove(id);
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
