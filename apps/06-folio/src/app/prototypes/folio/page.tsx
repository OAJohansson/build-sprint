"use client";

import { BookOpen, Home as HomeIcon, ListFilter, Search as SearchIcon, X } from "lucide-react";
import { useState } from "react";
import { books } from "./data";
import { Home } from "./home";
import { Mascot } from "./mascot";
import { Read } from "./read";
import { Search } from "./search";
import { folio, SegmentTabs } from "./shared";
import { genreFilters, GenreSheet, Want } from "./want";

// Prototype round 2 (16 Oct): the owner's picks combined. Home with three browse rows, Search
// (title or author, genres, Booker winners), and a Shelf with Read as the Diary and Want to read
// as a shelf of covers. A mascot by the name. Nothing outside /prototypes imports from here.
export default function FolioPrototype() {
  const [tab, setTab] = useState<"home" | "search" | "shelf">("home");
  const [shelf, setShelf] = useState<"read" | "want">("read");
  const [genre, setGenre] = useState<string | null>(null);
  const [filtering, setFiltering] = useState(false);
  const counts = { read: books.filter((b) => b.shelf === "read").length, want: books.filter((b) => b.shelf === "want").length };

  return (
    <div style={folio} className="min-h-dvh bg-[var(--f-bg)] text-[var(--f-text)]">
      <div className="mx-auto w-full max-w-xl pb-[calc(88px+env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]">
        <header className="flex items-center gap-2 px-4 pb-5">
          <Mascot size={34} />
          <h1 className="text-[22px] font-semibold tracking-tight">Folio</h1>
        </header>

        {tab === "home" ? (
          <Home />
        ) : tab === "search" ? (
          <Search />
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 px-4 pb-1">
              <SegmentTabs
                value={shelf}
                onChange={setShelf}
                options={[
                  { value: "read", label: "Read", count: counts.read },
                  { value: "want", label: "Want to read", count: counts.want },
                ]}
              />
              {shelf === "want" && (
                <button
                  onClick={() => setFiltering(true)}
                  aria-label="Filter by genre"
                  className={`-mr-2 shrink-0 p-2 transition-colors duration-150 ${genre ? "text-[var(--f-text)]" : "text-[var(--f-muted)]"}`}
                >
                  <ListFilter size={20} strokeWidth={genre ? 2.2 : 1.8} />
                </button>
              )}
            </div>
            {shelf === "want" && genre && (
              <div className="flex items-center gap-2 px-4 pt-2 text-[14px]">
                <span className="text-[var(--f-muted)]">{genre}</span>
                <span className="text-[var(--f-faint)] tabular-nums">{genreFilters.find((f) => f.name === genre)?.count}</span>
                <button onClick={() => setGenre(null)} aria-label={`Clear filter: ${genre}`} className="-m-1.5 p-1.5 text-[var(--f-faint)]">
                  <X size={16} />
                </button>
              </div>
            )}
            {shelf === "read" ? <Read /> : <Want genre={genre} />}
            {filtering && <GenreSheet value={genre} onChange={setGenre} onClose={() => setFiltering(false)} />}
          </>
        )}
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--f-line)] bg-[var(--f-bg)]/92 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <div className="mx-auto flex max-w-xl">
          {(
            [
              { id: "home", label: "Home", Icon: HomeIcon },
              { id: "search", label: "Search", Icon: SearchIcon },
              { id: "shelf", label: "Shelf", Icon: BookOpen },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                window.scrollTo({ top: 0 });
              }}
              aria-current={tab === id ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors duration-150 ${
                tab === id ? "text-[var(--f-text)]" : "text-[var(--f-faint)]"
              }`}
            >
              <Icon size={22} strokeWidth={tab === id ? 2 : 1.6} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
