import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Book } from "@/lib/types";

// My shelves live in Supabase (supabase/schema.sql; decision 0015). Only this server code holds
// the secret key. Without Supabase env vars in development, an in-memory store stands in so the
// app runs locally; in production that's an error instead. Pattern from Scribble (decision 0009).

export type Store = {
  list(): Promise<Book[]>;
  /** Create or update books by id. Returns them as stored. */
  save(books: Omit<Book, "updatedAt">[]): Promise<Book[]>;
  remove(id: string): Promise<void>;
};

type Row = {
  id: string;
  work_key: string | null;
  goodreads_id: string | null;
  isbn13: string | null;
  title: string;
  author: string;
  cover_url: string | null;
  published_year: number | null;
  shelf: Book["shelf"];
  rating: number | string | null;
  line: string | null;
  review: string | null;
  genres: string[] | null;
  read_on: string | null;
  read_on_estimated: boolean;
  started_on: string | null;
  added_on: string;
  updated_at: string;
};

const toBook = (r: Row): Book => ({
  id: r.id,
  workKey: r.work_key,
  goodreadsId: r.goodreads_id,
  isbn: r.isbn13,
  title: r.title,
  author: r.author,
  coverUrl: r.cover_url,
  year: r.published_year,
  shelf: r.shelf,
  // numeric comes back from Postgres as a string.
  rating: r.rating === null ? null : Number(r.rating),
  line: r.line,
  review: r.review,
  genres: r.genres ?? [],
  readOn: r.read_on,
  readOnEstimated: r.read_on_estimated,
  startedOn: r.started_on ?? null,
  addedOn: r.added_on,
  updatedAt: r.updated_at,
});

const toRow = (b: Omit<Book, "updatedAt">, now: string): Omit<Row, "updated_at"> & { updated_at: string } => ({
  id: b.id,
  work_key: b.workKey,
  goodreads_id: b.goodreadsId,
  isbn13: b.isbn,
  title: b.title,
  author: b.author,
  cover_url: b.coverUrl,
  published_year: b.year,
  shelf: b.shelf,
  rating: b.rating,
  line: b.line,
  review: b.review,
  genres: b.genres,
  read_on: b.readOn,
  read_on_estimated: b.readOnEstimated,
  started_on: b.startedOn,
  added_on: b.addedOn,
  updated_at: now,
});

/** A database error with a plain-language reason for the server logs. */
export class StoreError extends Error {}

type DbError = { message: string; code?: string };

function explain(error: DbError): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message)) {
    return "The database refused. SUPABASE_SECRET_KEY must be the secret key (sb_secret_… or service_role), not the publishable key.";
  }
  if (error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(error.message)) {
    return "The folio_books table is missing. Run apps/06-folio/supabase/schema.sql in the Supabase SQL Editor.";
  }
  if (/started_on|folio_books_shelf_check/i.test(error.message)) {
    return "The database is missing the Current read shelf. Run apps/06-folio/supabase/migrations/002-current-read.sql in the Supabase SQL Editor.";
  }
  if (error.code === "23505") return `A book is already on the shelf twice (${error.message}).`;
  if (/invalid api key|jwt|unauthorized/i.test(error.message)) {
    return "Supabase rejected the key. Check SUPABASE_SECRET_KEY (copied in full, no spaces).";
  }
  return `Database error: ${error.message}${error.code ? ` (${error.code})` : ""}`;
}

function supabaseStore(db: SupabaseClient): Store {
  const check = (error: DbError | null) => {
    if (error) throw new StoreError(explain(error));
  };
  return {
    async list() {
      const { data, error } = await db.from("folio_books").select("*");
      check(error);
      return (data as Row[]).map(toBook);
    },
    async save(books) {
      if (!books.length) return [];
      const now = new Date().toISOString();
      const { data, error } = await db
        .from("folio_books")
        .upsert(books.map((b) => toRow(b, now)))
        .select();
      check(error);
      return (data as Row[]).map(toBook);
    },
    async remove(id) {
      const { error } = await db.from("folio_books").delete().eq("id", id);
      check(error);
    },
  };
}

function memoryStore(): Store {
  const g = globalThis as unknown as { __folioMem?: Map<string, Book> };
  const mem = (g.__folioMem ??= new Map());
  return {
    async list() {
      return [...mem.values()];
    },
    async save(books) {
      const now = new Date().toISOString();
      return books.map((b) => {
        const book = { ...b, updatedAt: now };
        mem.set(b.id, book);
        return book;
      });
    },
    async remove(id) {
      mem.delete(id);
    },
  };
}

/** What kind of Supabase key this is, without trusting the variable name. */
function keyKind(key: string): "secret" | "public" | "unknown" {
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.startsWith("sb_publishable_")) return "public";
  try {
    const role = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role;
    if (role === "service_role") return "secret";
    if (role === "anon" || role === "authenticated") return "public";
  } catch {}
  return "unknown";
}

export function getStore(): { store: Store } | { problem: string } {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (url && key) {
    if (keyKind(key) === "public") {
      return { problem: "SUPABASE_SECRET_KEY is the publishable key. Use the secret key (sb_secret_…) and redeploy." };
    }
    return { store: supabaseStore(createClient(url, key, { auth: { persistSession: false } })) };
  }
  if (process.env.NODE_ENV !== "production") return { store: memoryStore() };
  return { problem: "Database is not configured (SUPABASE_URL / SUPABASE_SECRET_KEY)." };
}
