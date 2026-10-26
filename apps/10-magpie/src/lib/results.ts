import type { Filters } from "@/lib/shelves";
import { SUB_KINDS } from "@/lib/yum";

// Maggie's line over results (design J): "4 wines you loved in London!", and the removable chips
// for the active filters.

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
const SINGULAR: Record<string, string> = { wine: "wine", cocktail: "cocktail", beer: "beer", "coffee-tea": "coffee or tea", dishes: "dish" };

export function noun(f: Filters, n: number): string {
  const one = n === 1;
  if (f.kind === "drink" && f.sub) return one ? SINGULAR[f.sub] ?? "drink" : SUB_KINDS.drink.find((s) => s.id === f.sub)?.plural ?? "drinks";
  if (f.kind === "drink") return one ? "drink" : "drinks";
  if (f.kind === "food") return one ? "dish" : "dishes";
  if (f.kind === "dessert") return one ? "dessert" : "desserts";
  return one ? "yum" : "yums";
}

export function resultsLine(f: Filters, n: number, home: string | null): string {
  if (n === 0) return f.kind || f.hearts || f.where !== "any" || f.place.trim() ? "Nothing here yet. Try fewer filters?" : "Nothing matches that. Try another word?";
  let line = `${n < WORDS.length ? WORDS[n] : n} ${noun(f, n)}`;
  if (f.hearts) line += " you loved";
  if (f.place.trim()) line += ` at ${f.place.trim()}`;
  if (f.where === "home" && home) line += ` in ${home}`;
  if (f.where === "away") line += home ? ` away from ${home}` : " away";
  if (f.q.trim()) line += ` for “${f.q.trim()}”`;
  return line + "!";
}

export type ChipSpec = { label: string; aria: string; without: Filters };

export function activeChips(f: Filters, home: string | null): ChipSpec[] {
  const chips: ChipSpec[] = [];
  const kindLabel = { food: "Food", drink: "Drinks", dessert: "Desserts" } as const;
  if (f.kind) {
    const sub = f.kind === "drink" && f.sub ? SUB_KINDS.drink.find((s) => s.id === f.sub)?.label : null;
    const label = sub ?? kindLabel[f.kind];
    chips.push({ label, aria: `Remove filter ${label}`, without: { ...f, kind: sub ? f.kind : "", sub: "" } });
  }
  if (f.hearts) chips.push({ label: f.hearts === 5 ? "♥♥♥♥♥" : "♥♥♥♥+", aria: f.hearts === 5 ? "Remove filter five hearts" : "Remove filter four hearts and up", without: { ...f, hearts: 0 } });
  if (f.where === "home") chips.push({ label: home ?? "Home", aria: `Remove filter ${home ?? "home"}`, without: { ...f, where: "any" } });
  if (f.where === "away") chips.push({ label: "Away", aria: "Remove filter away", without: { ...f, where: "any" } });
  if (f.place.trim()) chips.push({ label: f.place.trim(), aria: `Remove filter ${f.place.trim()}`, without: { ...f, place: "" } });
  return chips;
}

/** The filter sheet's button: "Show 4 wines". */
export const showLabel = (f: Filters, n: number) => (n === 0 ? "Nothing matches yet" : `Show ${n} ${noun(f, n)}`);
