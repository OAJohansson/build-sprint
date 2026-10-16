"use client";

import { useState } from "react";
import { books, type Book } from "./data";
import { Cover } from "./shared";

// Want to read: a shelf. Four smaller covers per row, each row standing on a hairline ledge,
// titles readable underneath. Tap a book for its details in a sheet.
export function Want() {
  const [open, setOpen] = useState<Book | null>(null);
  const list = books.filter((b) => b.shelf === "want");
  const rows: Book[][] = [];
  for (let i = 0; i < list.length; i += 4) rows.push(list.slice(i, i + 4));

  return (
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
            <p className="mt-3 text-[13px] text-[var(--f-faint)]">Saved {added}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
