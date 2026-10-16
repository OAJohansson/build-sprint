"use client";

import { ChevronLeft, Search as SearchIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Api } from "@/lib/api";
import { browseGenres } from "@/lib/browse";
import { bookerWinners } from "@/lib/data/booker";
import type { Found, Shelf } from "@/lib/types";
import { Cover, CoverRow } from "./shared";

type View = { kind: "browse" } | { kind: "genre"; label: string } | { kind: "booker" };

// Search: title or author, or browse five genre chips and the Booker winners.
export function Search({
  api,
  shelfOf,
  onOpen,
  onWant,
}: {
  api: Api;
  shelfOf: (b: Found) => Shelf | null;
  onOpen: (b: Found) => void;
  onWant: (b: Found) => void;
}) {
  const [text, setText] = useState("");
  const [view, setView] = useState<View>({ kind: "browse" });
  const [results, setResults] = useState<Found[] | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [attempt, setAttempt] = useState(0);

  const query = text.trim();
  const genre = !query && view.kind === "genre" ? view.label : null;

  useEffect(() => {
    if (!query && !genre) return;
    let live = true;
    const t = setTimeout(
      () => {
        setState("loading");
        (query ? api.search(query) : api.genre(genre!))
          .then((r) => {
            if (live) {
              setResults(r);
              setState("idle");
            }
          })
          .catch(() => live && setState("error"));
      },
      query ? 300 : 0,
    );
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [api, query, genre, attempt]);

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
            aria-label="Search by title or author"
            placeholder="Title or author"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--f-faint)] [&::-webkit-search-cancel-button]:hidden"
          />
          {text && (
            <button onClick={() => setText("")} aria-label="Clear search" className="text-[var(--f-faint)]">
              <X size={18} />
            </button>
          )}
        </label>
      </div>

      {!query && view.kind !== "browse" && (
        <button onClick={() => setView({ kind: "browse" })} className="mt-4 flex items-center gap-1 px-3 text-[15px] font-semibold tracking-tight">
          <ChevronLeft size={20} className="text-[var(--f-faint)]" />
          {view.kind === "genre" ? view.label : "Booker Prize winners"}
        </button>
      )}

      {query || genre ? (
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
            <p className="px-4 py-8 text-[15px] text-[var(--f-muted)]">No books found{query ? ` for “${query}”` : ""}.</p>
          ) : (
            <ResultList items={results ?? []} dim={state === "loading"} shelfOf={shelfOf} onOpen={onOpen} onWant={onWant} />
          )}
        </div>
      ) : view.kind === "booker" ? (
        <ResultList items={bookerWinners} label={(b) => b.note?.replace("Booker Prize ", "")} shelfOf={shelfOf} onOpen={onOpen} onWant={onWant} />
      ) : (
        <div className="mt-7 space-y-9">
          <section className="px-4">
            <h2 className="text-[17px] font-semibold tracking-tight">Genres</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {browseGenres.map((g) => (
                <li key={g.label}>
                  <button
                    onClick={() => {
                      setResults(null);
                      setView({ kind: "genre", label: g.label });
                    }}
                    className="rounded-full px-3.5 py-2 text-[14px] shadow-[0_0_0_1px_var(--f-line)] transition-colors duration-150 active:bg-white/[0.06]"
                  >
                    {g.label}
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <CoverRow
            title="Booker Prize winners"
            items={bookerWinners.slice(0, 12)}
            caption={(b) => b.note?.replace("Booker Prize ", "")}
            onOpen={onOpen}
            action={
              <button onClick={() => setView({ kind: "booker" })} className="text-[14px] text-[var(--f-muted)]">
                All {bookerWinners.length}
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}

function ResultList({
  items,
  dim = false,
  label,
  shelfOf,
  onOpen,
  onWant,
}: {
  items: Found[];
  dim?: boolean;
  label?: (b: Found) => string | undefined;
  shelfOf: (b: Found) => Shelf | null;
  onOpen: (b: Found) => void;
  onWant: (b: Found) => void;
}) {
  return (
    <ul className={dim ? "opacity-60 transition-opacity duration-150" : ""}>
      {items.map((r, i) => {
        const shelf = shelfOf(r);
        const extra = label?.(r) ?? (r.year ? String(r.year) : "");
        return (
          <li key={(r.workKey ?? r.title) + i} className="flex items-center gap-3 border-b border-[var(--f-line)] px-4 py-3 last:border-b-0">
            <button onClick={() => onOpen(r)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <Cover book={r} tiny className="w-11 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-[15px] font-medium leading-snug">{r.title}</span>
                <span className="block truncate text-[13px] text-[var(--f-muted)]">
                  {r.author}
                  {extra ? ` · ${extra}` : ""}
                </span>
              </span>
            </button>
            {shelf ? (
              <span className="shrink-0 text-[13px] text-[var(--f-faint)]">{shelf === "read" ? "Read" : "On your list"}</span>
            ) : (
              <button
                onClick={() => onWant(r)}
                className="shrink-0 rounded-full bg-[var(--f-text)] px-3 py-1.5 text-[13px] text-[var(--f-bg)] transition-opacity duration-150 active:opacity-80"
              >
                Want to read
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
