"use client";

import { useState } from "react";
import { books, type Book } from "./data";
import { Cover } from "./shared";

// Want to read: a shelf. Genre chips filter it (one at a time, tap again for all). Four smaller
// covers per row, each row standing on a hairline ledge, titles readable underneath. Tap a book
// for its details in a sheet.
const UNSORTED = "No genre yet";
const shelfBooks = books.filter((b) => b.shelf === "want");
const genreCounts = new Map<string, number>();
for (const b of shelfBooks)
  for (const g of b.genres?.length ? b.genres : [UNSORTED]) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
// Most common first; the unsorted pile always last, so the gap stays visible.
const filters = [...genreCounts.entries()]
  .sort(([a, x], [b, y]) => (a === UNSORTED ? 1 : b === UNSORTED ? -1 : y - x))
  .map(([name, count]) => ({ name, count }));

export function Want() {
  const [open, setOpen] = useState<Book | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const list = genre
    ? shelfBooks.filter((b) => (b.genres?.length ? b.genres.includes(genre) : genre === UNSORTED))
    : shelfBooks;
  const rows: Book[][] = [];
  for (let i = 0; i < list.length; i += 4) rows.push(list.slice(i, i + 4));

  return (
    <div>
      <ul className="mt-3 flex gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none]" aria-label="Filter by genre">
        {filters.map((f) => (
          <li key={f.name} className="shrink-0">
            <button
              onClick={() => setGenre(genre === f.name ? null : f.name)}
              aria-pressed={genre === f.name}
              className={`rounded-full px-3 py-1.5 text-[13px] transition-colors duration-150 ${
                genre === f.name
                  ? "bg-[var(--f-text)] text-[var(--f-bg)]"
                  : "text-[var(--f-muted)] shadow-[0_0_0_1px_var(--f-line)] active:bg-white/[0.06]"
              }`}
            >
              {f.name}
              <span className={`ml-1.5 tabular-nums ${genre === f.name ? "opacity-60" : "text-[var(--f-faint)]"}`}>{f.count}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="px-4">
      {rows.map((row, i) => (
        <ul key={i} className="grid grid-cols-4 gap-3 border-b border-[var(--f-line)] pb-3 pt-5 first:pt-2">
          {row.map((b) => (
            <li key={b.id}>
              <button
                onClick={() => setOpen(b)}
                className="block w-full text-left transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                <Cover book={b} />
                <span className="mt-1.5 line-clamp-2 text-[11.5px] leading-tight">{b.title}</span>
              </button>
            </li>
          ))}
        </ul>
      ))}
      </div>
      {open && <Sheet book={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Sheet({ book, onClose }: { book: Book; onClose: () => void }) {
  const added = new Date(book.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={book.title}>
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 animate-in fade-in bg-black/50 duration-200" />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-xl animate-in slide-in-from-bottom rounded-t-2xl bg-[var(--f-raised)] px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-3 duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:animate-none">
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--f-line)]" />
        <div className="flex gap-4">
          <Cover book={book} className="w-20 shrink-0" />
          <div className="min-w-0 pt-1">
            <h2 className="text-[17px] font-semibold leading-snug">{book.title}</h2>
            <p className="mt-0.5 text-[14px] text-[var(--f-muted)]">
              {book.author}
              {book.year ? ` · ${book.year}` : ""}
            </p>
            {book.genres && book.genres.length > 0 && (
              <p className="mt-2 text-[13px] text-[var(--f-muted)]">{book.genres.join(" · ")}</p>
            )}
            <p className="mt-2 text-[13px] text-[var(--f-faint)]">Saved {added}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
