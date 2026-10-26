"use client";

import type { Filters } from "@/lib/shelves";
import { KINDS, SUB_KINDS, type Kind } from "@/lib/yum";

// The filter choices (design I, and the laptop's always-open panel in L): kind and sub-kind,
// how much I loved it, and where (home city, away, a restaurant or bar) (R9).

const SUB_LABELS: Record<string, string> = { wine: "Wine", cocktail: "Cocktails", beer: "Beer", "coffee-tea": "Coffee and tea" };

export function FilterControls({ f, set, home, compact }: { f: Filters; set: (f: Filters) => void; home: string | null; compact?: boolean }) {
  const chip = compact ? "chip h-9 px-3 text-[14px]" : "chip";
  const pickKind = (k: Kind) => set({ ...f, kind: f.kind === k ? "" : k, sub: "" });
  return (
    <>
      <fieldset className="flex flex-col gap-2">
        <legend className="label mb-2">Kind</legend>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button key={k.id} type="button" className={chip} aria-pressed={f.kind === k.id} onClick={() => pickKind(k.id)}>{k.plural}</button>
          ))}
        </div>
        {f.kind === "drink" && (
          <div className="sub-row">
            {SUB_KINDS.drink.map((s) => (
              <button key={s.id} type="button" className="chip chip-small" aria-pressed={f.sub === s.id} onClick={() => set({ ...f, sub: f.sub === s.id ? "" : s.id })}>{SUB_LABELS[s.id]}</button>
            ))}
          </div>
        )}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="label mb-2">How much I loved it</legend>
        <div className="flex flex-wrap gap-2">
          {([[0, "Any"], [4, compact ? "♥♥♥♥+" : "♥♥♥♥ and up"], [5, compact ? "♥♥♥♥♥" : "♥♥♥♥♥ only"]] as const).map(([n, label]) => (
            <button key={n} type="button" className={chip} aria-pressed={f.hearts === n} aria-label={n === 0 ? "Any" : n === 4 ? "Four hearts and up" : "Five hearts only"} onClick={() => set({ ...f, hearts: n })}>{label}</button>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="label mb-2">Where</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip} aria-pressed={f.where === "any"} onClick={() => set({ ...f, where: "any" })}>Anywhere</button>
          {home && <button type="button" className={`${chip} max-w-full`} aria-pressed={f.where === "home"} onClick={() => set({ ...f, where: "home" })}><span className="truncate">{home}</span></button>}
          <button type="button" className={chip} aria-pressed={f.where === "away"} onClick={() => set({ ...f, where: "away" })}>Away</button>
        </div>
        <label className={`flex items-center gap-2.5 rounded-[14px] border-[2.5px] border-cocoa bg-white px-3.5 focus-within:outline-3 focus-within:outline-offset-1 focus-within:outline-teal ${compact ? "h-11" : "h-[46px]"}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B1F1A" strokeWidth="2.4" aria-hidden="true" className="flex-none"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
          <input aria-label="Restaurant or bar" placeholder="A restaurant or bar" value={f.place} onChange={(e) => set({ ...f, place: e.target.value })} className="min-w-0 flex-1 bg-transparent text-[16px] placeholder:text-dusk focus-visible:outline-none" />
        </label>
      </fieldset>
    </>
  );
}
