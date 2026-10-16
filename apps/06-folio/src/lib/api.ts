"use client";

import type { ImportRow } from "@/lib/goodreads";
import type { Book, BookInput, Found } from "@/lib/types";

// Client-side calls to the app's own API. Every call carries the access code.

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function call<T>(code: string, path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", "x-access-code": code, ...init.headers },
    });
  } catch {
    throw new ApiError("No connection. Check your internet and try again.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "Something went wrong.", res.status);
  return data as T;
}

export const api = (code: string) => ({
  books: () => call<{ books: Book[] }>(code, "/api/books").then((r) => r.books),
  save: (id: string, input: BookInput) =>
    call<{ book: Book }>(code, `/api/books?id=${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(input) }).then((r) => r.book),
  remove: (id: string) => call<{ ok: true }>(code, `/api/books?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
  importRows: (rows: ImportRow[]) =>
    call<{ added: number; matched: number; total: number }>(code, "/api/import", { method: "POST", body: JSON.stringify({ rows }) }),
  search: (q: string) => call<{ results: Found[] }>(code, `/api/search?q=${encodeURIComponent(q)}`).then((r) => r.results),
  genre: (label: string) => call<{ results: Found[] }>(code, `/api/search?genre=${encodeURIComponent(label)}`).then((r) => r.results),
  home: () => call<{ popular: Found[]; newReleases: Found[] }>(code, "/api/home"),
});
export type Api = ReturnType<typeof api>;
