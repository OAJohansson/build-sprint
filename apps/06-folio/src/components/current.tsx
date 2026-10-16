"use client";

import type { Book } from "@/lib/types";
import { Cover } from "./shared";

const since = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

// Current read: the books in my hands now, larger than on the other shelves because there are only
// a few and they're the ones I open most. v2 builds on this shelf: words and notes while reading.
export function Current({ books, onOpen }: { books: Book[]; onOpen: (b: Book) => void }) {
  const list = [...books].sort((a, b) => (b.startedOn ?? b.addedOn).localeCompare(a.startedOn ?? a.addedOn));
  return (
    <ul className="px-4 pt-2">
      {list.map((b) => (
        <li key={b.id} className="border-b border-[var(--f-line)] last:border-b-0">
          <button onClick={() => onOpen(b)} className="flex w-full gap-4 py-4 text-left transition-colors duration-150 active:bg-white/[0.03]">
            <Cover book={b} className="w-20 shrink-0" />
            <span className="min-w-0 flex-1 pt-1">
              <span className="line-clamp-3 text-[17px] font-medium leading-snug">{b.title}</span>
              <span className="mt-1 block truncate text-[14px] text-[var(--f-muted)]">{b.author}</span>
              <span className="mt-2 block text-[13px] text-[var(--f-faint)]">{b.startedOn ? `Since ${since(b.startedOn)}` : "Reading now"}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
