"use client";

import { Newsreader } from "next/font/google";
import { useState } from "react";
import { books, type Book } from "./data";
import { Cover, ShelfTabs, Stars } from "./shared";

const serif = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], weight: ["400", "500"] });

// Lines: what I thought is the hero, set like a pull quote; the book is the caption.
// Books without a line collapse into one quiet row of covers at the end.
export function Lines() {
  const [shelf, setShelf] = useState<"read" | "want">("read");
  const [open, setOpen] = useState<string | null>(null);
  const list = books.filter((b) => b.shelf === shelf);
  const counts = { read: books.filter((b) => b.shelf === "read").length, want: books.filter((b) => b.shelf === "want").length };
  const withLine = list.filter((b) => b.line);
  const without = list.filter((b) => !b.line);

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-32 pt-[max(20px,env(safe-area-inset-top))]">
      <h1 className={`${serif.className} mb-6 text-[26px] font-medium`}>Folio</h1>
      <ShelfTabs shelf={shelf} onChange={setShelf} counts={counts} />

      {withLine.length > 0 && (
        <ol className="mt-8 space-y-9">
          {withLine.map((b) => (
            <Entry key={b.id} book={b} open={open === b.id} onToggle={() => setOpen(open === b.id ? null : b.id)} />
          ))}
        </ol>
      )}

      {without.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--f-faint)]">
            {shelf === "read" ? "No line yet" : "On the list"}
          </h2>
          <ul className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
            {without.map((b) => (
              <li key={b.id} title={`${b.title}, ${b.author}`}>
                <Cover book={b} />
                <Stars rating={b.rating} className="mt-1 block text-[10px]" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Entry({ book, open, onToggle }: { book: Book; open: boolean; onToggle: () => void }) {
  return (
    <li>
      <button onClick={onToggle} aria-expanded={open} disabled={!book.review} className="block w-full text-left">
        <p className={`${serif.className} text-[22px] leading-[1.3] text-[var(--f-text)]`}>{book.line}</p>
        <span className="mt-3 flex items-center gap-2.5">
          <Cover book={book} tiny className="w-6 shrink-0" />
          <span className="min-w-0 truncate text-[13px] text-[var(--f-muted)]">
            {book.title} <span className="text-[var(--f-faint)]">· {book.author}</span>
          </span>
          <Stars rating={book.rating} className="ml-auto shrink-0 text-[12px]" />
        </span>
      </button>
      {book.review &&
        (open ? (
          <p className="mt-3 animate-in fade-in text-[15px] leading-relaxed text-[var(--f-muted)] duration-200">{book.review}</p>
        ) : (
          <button onClick={onToggle} className="mt-2 text-[13px] text-[var(--f-faint)] underline underline-offset-4">
            Full review
          </button>
        ))}
    </li>
  );
}
