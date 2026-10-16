"use client";

import { ArrowUpDown, BookOpen, Home as HomeIcon, ListFilter, Search as SearchIcon, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookSheet, fromFound, type SheetTarget } from "@/components/book-sheet";
import { Home } from "@/components/home";
import { ImportSheet } from "@/components/import-sheet";
import { Mascot } from "@/components/mascot";
import { Read, type ReadSort } from "@/components/read";
import { Search } from "@/components/search";
import { ChoiceSheet, SegmentTabs } from "@/components/shared";
import { Unlock } from "@/components/unlock";
import { GenreSheet, genreFilters, Want } from "@/components/want";
import { api as makeApi, ApiError } from "@/lib/api";
import { samplePicks } from "@/lib/data/picks";
import type { Book, BookInput, Found, Shelf } from "@/lib/types";
import { useLocalStorage } from "@/lib/use-local-storage";

type Tab = "home" | "search" | "shelf";

const surname = (author: string) => author.trim().split(/\s+/).at(-1)?.toLowerCase() ?? "";
const titleKey = (b: { title: string; author: string }) => `${b.title.toLowerCase()}|${surname(b.author)}`;

export default function Folio() {
  const [code, setCode] = useLocalStorage("06-folio:access-code", "");
  const api = useMemo(() => makeApi(code), [code]);
  const [books, setBooks] = useState<Book[] | null>(null);
  const [lists, setLists] = useState<{ popular: Found[]; newReleases: Found[] } | "loading" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("home");
  const [shelf, setShelf] = useState<Shelf>("read");
  const [sort, setSort] = useState<ReadSort>("date");
  const [genre, setGenre] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetTarget | "sort" | "genre" | "import" | null>(null);

  const load = useCallback(async () => {
    try {
      setBooks(await api.books());
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setCode("");
        setError("That code didn't work. Check it and try again.");
      } else setError(err instanceof Error ? err.message : "Something went wrong. Please try again later.");
    }
  }, [api, setCode]);

  useEffect(() => {
    if (!code) return;
    // Loading the shelves and Home's lists once the code is known is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    api.home().then(setLists, () => setLists("error"));
  }, [code, api, load]);

  // Which shelf a found book is on: by Open Library work, else by title and author surname.
  const shelfIndex = useMemo(() => {
    const byWork = new Map<string, Shelf>();
    const byTitle = new Map<string, Shelf>();
    for (const b of books ?? []) {
      if (b.workKey) byWork.set(b.workKey, b.shelf);
      byTitle.set(titleKey(b), b.shelf);
    }
    return { byWork, byTitle };
  }, [books]);
  const shelfOf = useCallback(
    (f: Found) => (f.workKey ? shelfIndex.byWork.get(f.workKey) : undefined) ?? shelfIndex.byTitle.get(titleKey(f)) ?? null,
    [shelfIndex],
  );
  const bookFor = (f: Found) => books?.find((b) => (f.workKey && b.workKey === f.workKey) || titleKey(b) === titleKey(f)) ?? null;

  const save = async (input: BookInput, id?: string) => {
    const saved = await api.save(id ?? crypto.randomUUID(), input);
    setBooks((list) => [saved, ...(list ?? []).filter((b) => b.id !== saved.id && b.id !== id)]);
  };
  const remove = async (book: Book) => {
    await api.remove(book.id);
    setBooks((list) => (list ?? []).filter((b) => b.id !== book.id));
  };
  const open = (f: Found) => {
    const existing = bookFor(f);
    setSheet(existing ? { book: existing } : { found: f });
  };

  if (!code) return <Unlock error={error} onUnlock={setCode} />;
  if (!books) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <Mascot size={40} />
        {error ? (
          <>
            <p className="text-[15px] text-[var(--f-muted)]">{error}</p>
            <button onClick={load} className="rounded-full px-4 py-2.5 text-[15px] shadow-[0_0_0_1px_var(--f-line)]">
              Try again
            </button>
          </>
        ) : (
          <p className="text-[15px] text-[var(--f-faint)]">Opening your shelves…</p>
        )}
      </main>
    );
  }

  const read = books.filter((b) => b.shelf === "read");
  const want = books.filter((b) => b.shelf === "want");
  const picks = samplePicks.filter((p) => !shelfOf(p));
  const genreCount = genre ? genreFilters(want).find((f) => f.name === genre)?.count ?? 0 : 0;

  return (
    <div className="min-h-dvh">
      <div className="mx-auto w-full max-w-xl pb-[calc(88px+env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]">
        <header className="flex items-center gap-2 px-4 pb-5">
          <Mascot size={34} />
          <h1 className="text-[22px] font-semibold tracking-tight">Folio</h1>
        </header>

        {tab === "home" ? (
          <Home picks={picks} lists={lists} onOpen={open} />
        ) : tab === "search" ? (
          <Search api={api} shelfOf={shelfOf} onOpen={open} onWant={(f) => save(fromFound(f, "want")).catch(() => setSheet({ found: f }))} />
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 px-4 pb-1">
              <SegmentTabs
                value={shelf}
                onChange={setShelf}
                options={[
                  { value: "read", label: "Read", count: read.length },
                  { value: "want", label: "Want to read", count: want.length },
                ]}
              />
              {(shelf === "read" ? read : want).length > 0 && (
                <button
                  onClick={() => setSheet(shelf === "read" ? "sort" : "genre")}
                  aria-label={shelf === "read" ? "Sort" : "Filter by genre"}
                  className={`-mr-2 shrink-0 p-2 transition-colors duration-150 ${
                    (shelf === "read" ? sort !== "date" : genre) ? "text-[var(--f-text)]" : "text-[var(--f-muted)]"
                  }`}
                >
                  {shelf === "read" ? <ArrowUpDown size={20} /> : <ListFilter size={20} />}
                </button>
              )}
            </div>
            {shelf === "want" && genre && (
              <div className="flex items-center gap-2 px-4 pt-2 text-[14px]">
                <span className="text-[var(--f-muted)]">{genre}</span>
                <span className="text-[var(--f-faint)] tabular-nums">{genreCount}</span>
                <button onClick={() => setGenre(null)} aria-label={`Clear filter: ${genre}`} className="-m-1.5 p-1.5 text-[var(--f-faint)]">
                  <X size={16} />
                </button>
              </div>
            )}

            {(shelf === "read" ? read : want).length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-[15px] text-[var(--f-muted)]">
                  {books.length ? (shelf === "read" ? "No books read yet." : "Nothing saved yet. Find books in Search.") : "Your shelves are empty."}
                </p>
                {!books.length && (
                  <button onClick={() => setSheet("import")} className="mt-4 rounded-full bg-[var(--f-text)] px-4 py-2.5 text-[15px] text-[var(--f-bg)]">
                    Import from Goodreads
                  </button>
                )}
              </div>
            ) : shelf === "read" ? (
              <Read books={read} sort={sort} onOpen={(book) => setSheet({ book })} />
            ) : (
              <Want books={want} genre={genre} onOpen={(book) => setSheet({ book })} />
            )}

            {books.length > 0 && (
              <p className="px-4 pt-8 text-center">
                <button onClick={() => setSheet("import")} className="text-[13px] text-[var(--f-faint)] underline underline-offset-4">
                  Import or back up
                </button>
              </p>
            )}
          </>
        )}
      </div>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--f-line)] bg-[var(--f-bg)]/92 pb-[env(safe-area-inset-bottom)] backdrop-blur">
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
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors duration-150 ${tab === id ? "text-[var(--f-text)]" : "text-[var(--f-faint)]"}`}
            >
              <Icon size={22} strokeWidth={tab === id ? 2 : 1.6} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {sheet === "sort" ? (
        <ChoiceSheet<ReadSort>
          label="Sort"
          value={sort}
          onChange={setSort}
          onClose={() => setSheet(null)}
          options={[
            { value: "date", label: "Date read" },
            { value: "rating", label: "Highest rated" },
          ]}
        />
      ) : sheet === "genre" ? (
        <GenreSheet books={want} value={genre} onChange={setGenre} onClose={() => setSheet(null)} />
      ) : sheet === "import" ? (
        <ImportSheet api={api} books={books} onDone={load} onClose={() => setSheet(null)} />
      ) : sheet ? (
        <BookSheet target={sheet} onSave={save} onRemove={remove} onClose={() => setSheet(null)} />
      ) : null}
    </div>
  );
}
