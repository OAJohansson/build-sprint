"use client";

import { useState } from "react";
import { books, type Book } from "./data";
import { Cover, ShelfTabs, Stars } from "./shared";

// Wall: covers first, Letterboxd's grid. Words live one tap away, in a sheet.
export function Wall() {
  const [shelf, setShelf] = useState<"read" | "want">("read");
  const [open, setOpen] = useState<Book | null>(null);
  const list = books.filter((b) => b.shelf === shelf);
  const counts = { read: books.filter((b) => b.shelf === "read").length, want: books.filter((b) => b.shelf === "want").length };

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-32 pt-[max(20px,env(safe-area-inset-top))]">
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight">Folio</h1>
      </header>
      <ShelfTabs shelf={shelf} onChange={setShelf} counts={counts} />
      <ul className="mt-5 grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4">
        {list.map((b) => (
          <li key={b.id}>
            <button
              onClick={() => setOpen(b)}
              className="block w-full text-left transition-transform duration-150 ease-out active:scale-[0.97]"
              aria-label={`${b.title} by ${b.author}`}
            >
              <Cover book={b} />
              <div className="mt-1.5 flex h-4 items-center gap-1 text-[11px]">
                <Stars rating={b.rating} />
                {b.line && <span className="text-[var(--f-faint)]" aria-label="has a review">≡</span>}
              </div>
            </button>
          </li>
        ))}
      </ul>
      {open && <Sheet book={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Sheet({ book, onClose }: { book: Book; onClose: () => void }) {
  const [more, setMore] = useState(false);
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={book.title}>
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 animate-in fade-in bg-black/50 duration-200"
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[85dvh] max-w-xl animate-in slide-in-from-bottom overflow-y-auto rounded-t-2xl bg-[var(--f-raised)] px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-3 duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:animate-none">
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--f-line)]" />
        <div className="flex gap-4">
          <Cover book={book} className="w-20 shrink-0" />
          <div className="min-w-0 pt-1">
            <h2 className="text-[17px] font-semibold leading-snug">{book.title}</h2>
            <p className="mt-0.5 text-[14px] text-[var(--f-muted)]">
              {book.author}
              {book.year ? ` · ${book.year}` : ""}
            </p>
            <Stars rating={book.rating} className="mt-2 block text-[15px]" />
          </div>
        </div>
        {book.line ? (
          <p className="mt-5 text-[16px] leading-relaxed">{book.line}</p>
        ) : (
          <p className="mt-5 text-[15px] text-[var(--f-faint)]">
            {book.shelf === "read" ? "No line yet." : "On your list."}
          </p>
        )}
        {book.review &&
          (more ? (
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--f-muted)]">{book.review}</p>
          ) : (
            <button onClick={() => setMore(true)} className="mt-3 text-[14px] text-[var(--f-muted)] underline underline-offset-4">
              Read full review
            </button>
          ))}
      </div>
    </div>
  );
}
