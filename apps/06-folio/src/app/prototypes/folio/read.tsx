"use client";

import { useState } from "react";
import { books, type Book } from "./data";
import { Cover, Stars } from "./shared";

// Read: the Diary. Months as clear section headings; each row shows the title in full, author and
// stars, and up to two lines of the one-liner. Tap a row to open the full review in place.
export function Read() {
  const [open, setOpen] = useState<string | null>(null);
  const groups: { month: string; year: string; items: Book[] }[] = [];
  for (const b of books.filter((b) => b.shelf === "read")) {
    const d = new Date(b.date + "T12:00:00");
    const month = d.toLocaleDateString("en-GB", { month: "long" });
    const year = String(d.getFullYear());
    const last = groups.at(-1);
    if (last && last.month === month && last.year === year) last.items.push(b);
    else groups.push({ month, year, items: [b] });
  }

  return (
    <div>
      {groups.map((g) => (
        <section key={g.month + g.year} className="mt-2 first:mt-0">
          <h2 className="sticky top-0 z-10 flex items-baseline gap-2 border-b border-[var(--f-line)] bg-[var(--f-bg)] px-4 pb-2.5 pt-5">
            <span className="text-[19px] font-semibold tracking-tight">{g.month}</span>
            <span className="text-[15px] text-[var(--f-faint)] tabular-nums">{g.year}</span>
            <span className="ml-auto text-[13px] text-[var(--f-faint)] tabular-nums">{g.items.length}</span>
          </h2>
          <ul>
            {g.items.map((b) => (
              <Row key={b.id} book={b} open={open === b.id} onToggle={() => setOpen(open === b.id ? null : b.id)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Row({ book, open, onToggle }: { book: Book; open: boolean; onToggle: () => void }) {
  return (
    <li className="border-b border-[var(--f-line)] last:border-b-0">
      <button
        onClick={onToggle}
        aria-expanded={book.review ? open : undefined}
        className="flex w-full gap-3 px-4 py-3.5 text-left transition-colors duration-150 active:bg-white/[0.03]"
      >
        <span className="w-6 shrink-0 pt-0.5 text-right text-[13px] tabular-nums text-[var(--f-faint)]">
          {new Date(book.date + "T12:00:00").getDate()}
        </span>
        <Cover book={book} tiny className="w-11 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-[15px] font-medium leading-snug">{book.title}</span>
          <span className="mt-0.5 flex items-baseline gap-2 text-[13px] text-[var(--f-muted)]">
            <span className="truncate">{book.author}</span>
            <Stars rating={book.rating} className="ml-auto shrink-0 text-[12px]" />
          </span>
          {book.line && (
            <span className={`mt-1.5 text-[14px] leading-snug ${open ? "block" : "line-clamp-2"}`}>{book.line}</span>
          )}
          {open && book.review && (
            <span className="mt-2 block text-[14px] leading-relaxed text-[var(--f-muted)]">{book.review}</span>
          )}
        </span>
      </button>
    </li>
  );
}
