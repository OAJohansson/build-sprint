"use client";

import { useState } from "react";
import { books, type Book } from "./data";
import { Cover, ShelfTabs, Stars, monthLabel } from "./shared";

// Diary: a time-ordered list, every one-liner visible. Tap a row to open the full review in place.
export function Diary() {
  const [shelf, setShelf] = useState<"read" | "want">("read");
  const [open, setOpen] = useState<string | null>(null);
  const list = books.filter((b) => b.shelf === shelf);
  const counts = { read: books.filter((b) => b.shelf === "read").length, want: books.filter((b) => b.shelf === "want").length };

  const groups: { month: string; items: Book[] }[] = [];
  for (const b of list) {
    const month = monthLabel(b.date);
    if (groups.at(-1)?.month === month) groups.at(-1)!.items.push(b);
    else groups.push({ month, items: [b] });
  }

  return (
    <div className="mx-auto w-full max-w-xl pb-32 pt-[max(20px,env(safe-area-inset-top))]">
      <div className="px-4">
        <h1 className="mb-6 text-[22px] font-semibold tracking-tight">Folio</h1>
        <ShelfTabs shelf={shelf} onChange={setShelf} counts={counts} />
      </div>
      <div className="mt-4">
        {groups.map((g) => (
          <section key={g.month}>
            <h2 className="sticky top-0 z-10 bg-[var(--f-bg)]/90 px-4 py-2 text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--f-faint)] backdrop-blur">
              {g.month}
            </h2>
            <ul>
              {g.items.map((b) => (
                <Row key={b.id} book={b} open={open === b.id} onToggle={() => setOpen(open === b.id ? null : b.id)} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function Row({ book, open, onToggle }: { book: Book; open: boolean; onToggle: () => void }) {
  return (
    <li className="border-b border-[var(--f-line)]">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full gap-3 px-4 py-3 text-left transition-colors duration-150 active:bg-white/[0.03]"
      >
        <span className="w-6 shrink-0 pt-0.5 text-right text-[13px] tabular-nums text-[var(--f-faint)]">
          {new Date(book.date + "T12:00:00").getDate()}
        </span>
        <Cover book={book} tiny className="w-10 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-[15px] font-medium">{book.title}</span>
            <Stars rating={book.rating} className="shrink-0 text-[12px]" />
          </span>
          <span className="block truncate text-[13px] text-[var(--f-muted)]">{book.author}</span>
          {book.line && (
            <span className={`mt-1 text-[14px] leading-snug ${open ? "block" : "line-clamp-1"}`}>{book.line}</span>
          )}
          {open && book.review && (
            <span className="mt-2 block text-[14px] leading-relaxed text-[var(--f-muted)]">{book.review}</span>
          )}
          {open && !book.line && (
            <span className="mt-1 block text-[13px] text-[var(--f-faint)]">
              {book.shelf === "read" ? "No line yet." : `Added ${new Date(book.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
            </span>
          )}
        </span>
        {book.review && !open && <span className="self-center text-[12px] text-[var(--f-faint)]" aria-label="has a full review">+</span>}
      </button>
    </li>
  );
}
