"use client";

import { LocateFixed, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { searchPlaces } from "@/lib/places";
import type { Place } from "@/lib/sun";

type State = { status: "idle" | "loading" | "done" | "error"; results: Place[] };

export function PlaceSearch({ onPick, onLocate, onClose, note }: { onPick: (p: Place) => void; onLocate: () => void; onClose?: () => void; note?: string }) {
  const [q, setQ] = useState("");
  const [state, setState] = useState<State>({ status: "idle", results: [] });
  const query = q.trim();

  // Search as you type, after a short pause; a newer query cancels the older one.
  useEffect(() => {
    if (query.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setState((s) => ({ ...s, status: "loading" }));
      searchPlaces(query, ctrl.signal)
        .then((results) => setState({ status: "done", results }))
        .catch((e) => {
          if (e.name === "AbortError") return;
          console.error("[horizon] search failed", e);
          setState({ status: "error", results: [] });
        });
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const showing = query.length >= 2 ? state : { status: "idle" as const, results: [] };

  return (
    <div role="dialog" aria-label="Search a place" className="fixed inset-0 z-50 flex flex-col overflow-y-auto overscroll-contain bg-[#0b1022]/85 text-white backdrop-blur-xl animate-in fade-in duration-200">
      <div className="flex items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <label className="flex h-12 flex-1 items-center gap-2 rounded-full bg-white/12 px-4 focus-within:bg-white/16">
          <Search className="size-4 shrink-0 opacity-70" aria-hidden="true" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a city…"
            aria-label="Search a city"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/50"
          />
        </label>
        {onClose && (
          <button onClick={onClose} aria-label="Close search" className="grid size-12 place-items-center rounded-full bg-white/12 transition-transform duration-150 ease-out active:scale-[0.97]">
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {note && <p className="px-6 pt-4 text-sm text-white/70">{note}</p>}

      <ul className="mt-3 flex flex-col px-2 pb-8" aria-live="polite">
        <li>
          <button onClick={onLocate} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors active:bg-white/12 [@media(hover:hover)]:hover:bg-white/8">
            <LocateFixed className="size-4 opacity-70" aria-hidden="true" />
            <span>My location</span>
          </button>
        </li>
        {showing.results.map((p) => (
          <li key={p.id}>
            <button onClick={() => onPick(p)} className="flex w-full min-w-0 items-baseline gap-2 rounded-2xl px-4 py-3.5 text-left transition-colors active:bg-white/12 [@media(hover:hover)]:hover:bg-white/8">
              <span className="shrink-0">{p.name}</span>
              <span className="truncate text-sm text-white/55">{p.region}</span>
            </button>
          </li>
        ))}
        {showing.status === "loading" && showing.results.length === 0 && <li className="px-4 py-3.5 text-white/55">Searching…</li>}
        {showing.status === "done" && showing.results.length === 0 && <li className="px-4 py-3.5 text-white/55">No places called “{query}”</li>}
        {showing.status === "error" && <li className="px-4 py-3.5 text-white/70">Couldn’t search right now. Check your connection and try again.</li>}
      </ul>
    </div>
  );
}
