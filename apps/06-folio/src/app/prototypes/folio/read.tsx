"use client";

import { useState } from "react";
import { books, type Book } from "./data";
import { Cover, Stars } from "./shared";

export type ReadSort = "date" | "rating";

const starLabel = (r: number) => `${Math.floor(r)}${r % 1 ? "½" : ""} ${r === 1 ? "star" : "stars"}`;

// Read: the Diary. By default grouped by month; sorted by rating it groups by stars, highest
// first, newest first within each. Each row shows the title in full, author and stars, and up to
// two lines of the one-liner. Tap a row to open the full review in place.
export function Read({ sort }: { sort: ReadSort }) {
  const [open, setOpen] = useState<string | null>(null);
  const list = books.filter((b) => b.shelf === "read");
  const groups: { key: string; title: string; sub?: string; items: Book[] }[] = [];
  const sorted = sort === "rating" ? [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.date.localeCompare(a.date)) : list;
  for (const b of sorted) {
    let key: string, title: string, sub: string | undefined;
    if (sort === "rating") {
      key = String(b.rating ?? 0);
      title = b.rating ? starLabel(b.rating) : "Not rated";
    } else {
      const d = new Date(b.date + "T12:00:00");
      title = d.toLocaleDateString("en-GB", { month: "long" });
      sub = String(d.getFullYear());
      key = title + sub;
    }
    const last = groups.at(-1);
    if (last && last.key === key) last.items.push(b);
    else groups.push({ key, title, sub, items: [b] });
  }

  return (
    <div>
      {groups.map((g) => (
        <section key={g.key} className="mt-2 first:mt-0">
          <h2 className="sticky top-0 z-10 flex items-baseline gap-2 border-b border-[var(--f-line)] bg-[var(--f-bg)] px-4 pb-2.5 pt-5">
            <span className="text-[19px] font-semibold tracking-tight">{g.title}</span>
            {g.sub && <span className="text-[15px] text-[var(--f-faint)] tabular-nums">{g.sub}</span>}
          </h2>
          <ul>
            {g.items.map((b) => (
              <Row key={b.id} book={b} byRating={sort === "rating"} open={open === b.id} onToggle={() => setOpen(open === b.id ? null : b.id)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Row({ book, byRating, open, onToggle }: { book: Book; byRating: boolean; open: boolean; onToggle: () => void }) {
  const d = new Date(book.date + "T12:00:00");
  return (
    <li className="border-b border-[var(--f-line)] last:border-b-0">
      <button
        onClick={onToggle}
        aria-expanded={book.review ? open : undefined}
        className="flex w-full gap-3 px-4 py-3.5 text-left transition-colors duration-150 active:bg-white/[0.03]"
      >
        {/* Grouped by month, the day is enough; grouped by stars, show when it was read. */}
        <span className={`shrink-0 pt-[3px] text-right text-[13px] tabular-nums leading-tight text-[var(--f-muted)] ${byRating ? "w-8" : "w-6"}`}>
          {byRating ? (
            <>
              {d.toLocaleDateString("en-GB", { month: "short" })}
              <br />
              ’{String(d.getFullYear()).slice(2)}
            </>
          ) : (
            d.getDate()
          )}
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
