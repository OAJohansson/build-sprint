"use client";

import { LocateFixed, Search, X } from "lucide-react";
import { useState } from "react";
import { PLACES, type Place } from "../_lib/sky";

// Shared by the variants. The real app searches any city through a geocoding API; the prototype
// filters a few places that show each case: landmark, no landmark, polar.
export function PlaceSearch({ onPick, onClose }: { onPick: (p: Place) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const results = PLACES.filter((p) => `${p.name} ${p.region}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b1022]/80 backdrop-blur-xl text-white animate-in fade-in duration-200">
      <div className="flex items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <label className="flex h-12 flex-1 items-center gap-2 rounded-full bg-white/12 px-4">
          <Search className="size-4 shrink-0 opacity-70" aria-hidden="true" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a city…"
            aria-label="Search a city"
            autoComplete="off"
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/50"
          />
        </label>
        <button onClick={onClose} aria-label="Close search" className="grid size-12 place-items-center rounded-full bg-white/12 transition-transform duration-150 active:scale-[0.97]">
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <ul className="mt-4 flex flex-col px-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <li>
          <button onClick={() => onPick(PLACES[0])} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors hover:bg-white/8 active:bg-white/12">
            <LocateFixed className="size-4 opacity-70" aria-hidden="true" />
            <span>My location</span>
          </button>
        </li>
        {results.map((p) => (
          <li key={p.id}>
            <button onClick={() => onPick(p)} className="flex w-full items-baseline gap-2 rounded-2xl px-4 py-3.5 text-left transition-colors hover:bg-white/8 active:bg-white/12">
              <span>{p.name}</span>
              <span className="text-sm text-white/55">{p.region}</span>
            </button>
          </li>
        ))}
        {results.length === 0 && <li className="px-4 py-3.5 text-white/55">No places match “{q}”</li>}
      </ul>
    </div>
  );
}
