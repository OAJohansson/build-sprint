"use client";

import { UNSORTED } from "@/lib/genres";
import type { Book } from "@/lib/types";
import { ChoiceSheet, Cover } from "./shared";

/** Genres on the want-to-read shelf with counts: most common first, the unsorted pile last. */
export function genreFilters(books: Book[]) {
  const counts = new Map<string, number>();
  for (const b of books) for (const g of b.genres.length ? b.genres : [UNSORTED]) counts.set(g, (counts.get(g) ?? 0) + 1);
  return [...counts.entries()]
    .sort(([a, x], [b, y]) => (a === UNSORTED ? 1 : b === UNSORTED ? -1 : y - x))
    .map(([name, count]) => ({ name, count }));
}

// Want to read: a shelf. Newest saves first, four smaller covers per row, each row standing on a
// hairline ledge, titles readable underneath. Filtered by one genre at a time from a sheet.
export function Want({ books, genre, onOpen }: { books: Book[]; genre: string | null; onOpen: (b: Book) => void }) {
  const list = (genre ? books.filter((b) => (b.genres.length ? b.genres.includes(genre) : genre === UNSORTED)) : books).sort((a, b) =>
    b.addedOn.localeCompare(a.addedOn),
  );
  const rows: Book[][] = [];
  for (let i = 0; i < list.length; i += 4) rows.push(list.slice(i, i + 4));
  return (
    <div className="px-4">
      {rows.map((row, i) => (
        <ul key={i} className="grid grid-cols-4 gap-3 border-b border-[var(--f-line)] pb-3 pt-5 first:pt-2">
          {row.map((b) => (
            <li key={b.id}>
              <button onClick={() => onOpen(b)} className="block w-full text-left transition-transform duration-150 ease-out active:scale-[0.97]">
                <Cover book={b} />
                <span className="mt-1.5 line-clamp-2 text-[11.5px] leading-tight">{b.title}</span>
              </button>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

export function GenreSheet({
  books,
  value,
  onChange,
  onClose,
}: {
  books: Book[];
  value: string | null;
  onChange: (genre: string | null) => void;
  onClose: () => void;
}) {
  return (
    <ChoiceSheet<string | null>
      label="Filter by genre"
      value={value}
      onChange={onChange}
      onClose={onClose}
      options={[{ value: null, label: "All books", count: books.length }, ...genreFilters(books).map((f) => ({ value: f.name, label: f.name, count: f.count }))]}
    />
  );
}
