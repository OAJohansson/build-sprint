"use client";

import type { Book } from "@/lib/types";
import { Cover, Stars } from "./shared";

export type ReadSort = "date" | "rating";

const starLabel = (r: number) => `${Math.floor(r)}${r % 1 ? "½" : ""} ${r === 1 ? "star" : "stars"}`;
const at = (iso: string) => new Date(iso + "T12:00:00");

// Read: the diary. Grouped by month by default; sorted by rating, grouped by stars (highest
// first, newest first within each). Each row: the day, cover, title, author and stars, and up to
// two lines of the one-liner. Tap a row for the book: full review, edit, remove.
export function Read({ books, sort, onOpen }: { books: Book[]; sort: ReadSort; onOpen: (b: Book) => void }) {
  const byDate = (a: Book, b: Book) => (b.readOn ?? b.addedOn).localeCompare(a.readOn ?? a.addedOn);
  const sorted = [...books].sort(sort === "rating" ? (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || byDate(a, b) : byDate);
  const groups: { key: string; title: string; sub?: string; items: Book[] }[] = [];
  for (const b of sorted) {
    let key: string, title: string, sub: string | undefined;
    if (sort === "rating") {
      key = String(b.rating ?? 0);
      title = b.rating ? starLabel(b.rating) : "Not rated";
    } else {
      const d = at(b.readOn ?? b.addedOn);
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
              <Row key={b.id} book={b} byRating={sort === "rating"} onOpen={() => onOpen(b)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Row({ book, byRating, onOpen }: { book: Book; byRating: boolean; onOpen: () => void }) {
  const d = at(book.readOn ?? book.addedOn);
  return (
    <li className="border-b border-[var(--f-line)] last:border-b-0">
      <button onClick={onOpen} className="flex w-full gap-3 px-4 py-3.5 text-left transition-colors duration-150 active:bg-white/[0.03]">
        {/* Grouped by month, the day is enough; grouped by stars, show when it was read. An
            estimated date (only "date added" in the Goodreads export) shows no day. */}
        <span
          className={`shrink-0 pt-[3px] text-right text-[13px] leading-tight tabular-nums text-[var(--f-muted)] ${byRating ? "w-8" : "w-6"}`}
          title={book.readOnEstimated ? "Date read unknown; this is when it was added" : undefined}
        >
          {byRating ? (
            <>
              {d.toLocaleDateString("en-GB", { month: "short" })}
              <br />’{String(d.getFullYear()).slice(2)}
            </>
          ) : book.readOnEstimated ? (
            <span className="text-[var(--f-faint)]">·</span>
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
          {book.line && <span className="mt-1.5 line-clamp-2 text-[14px] leading-snug">{book.line}</span>}
        </span>
      </button>
    </li>
  );
}
