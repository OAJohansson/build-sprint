"use client";

import { ChevronLeft, Search as SearchIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { bookerWinners } from "./booker";
import { books } from "./data";
import { Cover } from "./shared";

type Result = { id: string; title: string; author: string; year?: number; coverId?: number };

// Genre chips are tuned Open Library queries: subjects are reader-tagged and messy, so each chip
// was checked by hand (16 Oct). "Queer stories" is a suggestion from the owner's shelf.
const genres = [
  { label: "Literary fiction", q: 'subject:"literary fiction" first_publish_year:[1990 TO 2026]' },
  { label: "Memoir", q: "subject:autobiography subject:memoir" },
  { label: "Psychology & self", q: 'subject:psychology subject:"self-help"' },
  { label: "Business & product", q: "subject:business subject:management" },
  { label: "Queer stories", q: "subject:lgbtq" },
];

// shortcut: matches the shelf on title + author surname; the real app matches Open Library work ids.
const shelfKey = (title: string, author: string) => `${title.toLowerCase()}|${author.split(" ").at(-1)?.toLowerCase()}`;
const onShelf = new Map(books.map((b) => [shelfKey(b.title, b.author), b.shelf]));

async function searchOpenLibrary(params: Record<string, string>): Promise<Result[]> {
  const url = new URL("https://openlibrary.org/search.json");
  for (const [k, v] of Object.entries({ ...params, limit: "24", fields: "key,title,author_name,cover_i,first_publish_year" }))
    url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  const data = (await res.json()) as {
    docs: { key: string; title: string; author_name?: string[]; cover_i?: number; first_publish_year?: number }[];
  };
  return data.docs.map((d) => ({
    id: d.key,
    title: d.title,
    author: d.author_name?.[0] ?? "",
    year: d.first_publish_year,
    coverId: d.cover_i,
  }));
}

type View = { kind: "browse" } | { kind: "genre"; label: string; q: string } | { kind: "booker" };

export function Search() {
  const [text, setText] = useState("");
  const [view, setView] = useState<View>({ kind: "browse" });
  const [results, setResults] = useState<Result[] | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const query = text.trim();
  const params: Record<string, string> | null = query
    ? { q: query }
    : view.kind === "genre"
      ? { q: `${view.q} language:eng`, sort: "readinglog" }
      : null;
  const key = params ? JSON.stringify(params) : "";

  useEffect(() => {
    if (!key) return;
    let live = true;
    const t = setTimeout(
      () => {
        setState("loading");
        searchOpenLibrary(JSON.parse(key))
          .then((r) => live && (setResults(r), setState("idle")))
          .catch(() => live && setState("error"));
      },
      query ? 300 : 0,
    );
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [key, query, attempt]);

  const toggleSave = (id: string) =>
    setSaved((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const showResults = Boolean(params);

  return (
    <div>
      <div className="px-4">
        <label className="flex items-center gap-2.5 rounded-xl bg-[var(--f-raised)] px-3.5 py-2.5 shadow-[0_0_0_1px_var(--f-line)] focus-within:shadow-[0_0_0_1.5px_var(--f-muted)]">
          <SearchIcon size={18} className="shrink-0 text-[var(--f-faint)]" aria-hidden />
          <input
            type="search"
            enterKeyHint="search"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder="Title or author"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[var(--f-text)] outline-none placeholder:text-[var(--f-faint)] [&::-webkit-search-cancel-button]:hidden"
          />
          {text && (
            <button onClick={() => setText("")} aria-label="Clear search" className="text-[var(--f-faint)]">
              <X size={18} />
            </button>
          )}
        </label>
      </div>

      {!query && view.kind !== "browse" && (
        <button
          onClick={() => setView({ kind: "browse" })}
          className="mt-4 flex items-center gap-1 px-3 text-[15px] font-semibold tracking-tight"
        >
          <ChevronLeft size={20} className="text-[var(--f-faint)]" />
          {view.kind === "genre" ? view.label : "Booker Prize winners"}
        </button>
      )}

      {showResults ? (
        <div className="mt-2">
          {state === "error" ? (
            <p className="px-4 py-8 text-[15px] text-[var(--f-muted)]">
              Couldn&apos;t reach Open Library.{" "}
              <button onClick={() => setAttempt((a) => a + 1)} className="underline underline-offset-4">
                Try again
              </button>
            </p>
          ) : state === "loading" && !results ? (
            <p className="px-4 py-8 text-[15px] text-[var(--f-faint)]">Searching…</p>
          ) : results && results.length === 0 ? (
            <p className="px-4 py-8 text-[15px] text-[var(--f-muted)]">No books found for “{query}”.</p>
          ) : (
            <ul className={state === "loading" ? "opacity-60 transition-opacity duration-150" : ""}>
              {results?.map((r) => (
                <ResultRow key={r.id} r={r} saved={saved.has(r.id)} onToggle={() => toggleSave(r.id)} />
              ))}
            </ul>
          )}
        </div>
      ) : view.kind === "booker" ? (
        <ul className="mt-2">
          {bookerWinners.map((w) => (
            <ResultRow key={w.id} r={w} label={String(w.year)} saved={saved.has(w.id)} onToggle={() => toggleSave(w.id)} />
          ))}
        </ul>
      ) : (
        <Browse
          onGenre={(g) => {
            setResults(null);
            setView({ kind: "genre", ...g });
          }}
          onBooker={() => setView({ kind: "booker" })}
        />
      )}
    </div>
  );
}

function Browse({ onGenre, onBooker }: { onGenre: (g: { label: string; q: string }) => void; onBooker: () => void }) {
  return (
    <div className="mt-7 space-y-9">
      <section className="px-4">
        <h2 className="text-[17px] font-semibold tracking-tight">Genres</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {genres.map((g) => (
            <li key={g.label}>
              <button
                onClick={() => onGenre(g)}
                className="rounded-full px-3.5 py-2 text-[14px] shadow-[0_0_0_1px_var(--f-line)] transition-colors duration-150 active:bg-white/[0.06]"
              >
                {g.label}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <div className="flex items-baseline justify-between px-4">
          <h2 className="text-[17px] font-semibold tracking-tight">Booker Prize winners</h2>
          <button onClick={onBooker} className="text-[14px] text-[var(--f-muted)]">
            All {bookerWinners.length}
          </button>
        </div>
        <ul className="mt-3 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none]">
          {bookerWinners.slice(0, 12).map((w) => (
            <li key={w.id} className="w-[96px] shrink-0 snap-start">
              <Cover book={w} />
              <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug">{w.title}</p>
              <p className="truncate text-[11px] text-[var(--f-faint)] tabular-nums">{w.year}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ResultRow({ r, label, saved, onToggle }: { r: Result; label?: string; saved: boolean; onToggle: () => void }) {
  const shelf = onShelf.get(shelfKey(r.title, r.author));
  return (
    <li className="flex items-center gap-3 border-b border-[var(--f-line)] px-4 py-3 last:border-b-0">
      <Cover book={r} tiny className="w-11 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[15px] font-medium leading-snug">{r.title}</p>
        <p className="truncate text-[13px] text-[var(--f-muted)]">
          {r.author}
          {label ? ` · ${label}` : r.year ? ` · ${r.year}` : ""}
        </p>
      </div>
      {shelf ? (
        <span className="shrink-0 text-[13px] text-[var(--f-faint)]">{shelf === "read" ? "Read" : "On your list"}</span>
      ) : (
        <button
          onClick={onToggle}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] transition-colors duration-150 ${
            saved ? "text-[var(--f-muted)]" : "bg-[var(--f-text)] text-[var(--f-bg)] active:opacity-80"
          }`}
        >
          {saved ? "Saved" : "Want to read"}
        </button>
      )}
    </li>
  );
}
