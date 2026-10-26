// The smart shelves (design H): which rows Maggie fills, the home city, her line, and search and
// filters. Plain functions so they can be unit tested (shelves.test.ts).

import { groupOf, groupPlural, type Kind, type Yum } from "@/lib/yum";

type Dated = Pick<Yum, "savedAt" | "number">;

/** Newest first; two yums saved at the same moment go by yum number. Edits never move a yum. */
export function latestFirst<T extends Dated>(yums: T[]): T[] {
  return [...yums].sort((a, b) => b.savedAt.localeCompare(a.savedAt) || b.number - a.number);
}

const key = (s: string) => s.trim().toLocaleLowerCase();

/**
 * The city with the most yums (most use is at home, kickoff). A tie goes to the city of the more
 * recent yum. Null with no cities at all.
 */
export function homeCity(yums: Pick<Yum, "city" | "savedAt" | "number">[]): string | null {
  const counts = new Map<string, { name: string; n: number; last: string }>();
  for (const y of latestFirst(yums)) {
    if (!y.city?.trim()) continue;
    const c = counts.get(key(y.city));
    if (c) {
      c.n++;
      // Show a capitalised spelling if any yum has one ("London", not "london").
      if (c.name[0] === c.name[0].toLocaleLowerCase() && /^\p{Lu}/u.test(y.city.trim())) c.name = y.city.trim();
    } else counts.set(key(y.city), { name: y.city.trim(), n: 1, last: y.savedAt });
  }
  let best: { name: string; n: number; last: string } | null = null;
  for (const c of counts.values()) if (!best || c.n > best.n || (c.n === best.n && c.last > best.last)) best = c;
  return best?.name ?? null;
}

export const inCity = (y: Pick<Yum, "city">, city: string | null) => !!city && !!y.city && key(y.city) === key(city);

export type Shelf = { id: string; title: string; aside: string; yums: Yum[]; seeAll: Filters };

/** Latest, Your top [group] (5 hearts, up to two rows), Around [home city]. Empty rows are left out. */
export function smartShelves(yums: Yum[]): Shelf[] {
  const all = latestFirst(yums);
  const shelves: Shelf[] = [];
  if (all.length) shelves.push({ id: "latest", title: "Latest", aside: "See all", yums: all.slice(0, 12), seeAll: { ...NO_FILTERS } });

  const loved = new Map<string, Yum[]>();
  for (const y of all) if (y.hearts === 5) loved.set(groupOf(y), [...(loved.get(groupOf(y)) ?? []), y]);
  const top = [...loved.values()].sort((a, b) => b.length - a.length || b[0].savedAt.localeCompare(a[0].savedAt)).slice(0, 2);
  for (const group of top) {
    const { kind, subKind } = group[0];
    shelves.push({
      id: `top-${groupOf(group[0])}`,
      title: `Your top ${groupPlural(kind, subKind)}`,
      aside: "♥♥♥♥♥ only",
      yums: group.slice(0, 12),
      seeAll: { ...NO_FILTERS, kind, sub: kind === "dessert" ? "" : subKind ?? "", hearts: 5 },
    });
  }

  const home = homeCity(all);
  const around = all.filter((y) => inCity(y, home));
  if (home && around.length) shelves.push({ id: "home", title: `Around ${home}`, aside: String(around.length), yums: around.slice(0, 12), seeAll: { ...NO_FILTERS, where: "home" } });
  return shelves;
}

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
const count = (n: number) => WORDS[n] ?? String(n);

/** Yums saved in the same calendar month as `now`, in local time. */
export function newThisMonth<T extends Pick<Yum, "savedAt">>(yums: T[], now = new Date()): T[] {
  return yums.filter((y) => {
    const d = new Date(y.savedAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
}

/** Maggie's one line on the shelf: what's new this month, named by its biggest group. */
export function maggieLine(yums: Pick<Yum, "savedAt" | "kind" | "subKind">[], now = new Date()): string {
  const fresh = newThisMonth(yums, now);
  if (!fresh.length) return "Nothing new this month yet. I'm getting peckish!";
  const groups = new Map<string, { n: number; kind: Kind; sub: string | null }>();
  for (const y of fresh) {
    const g = groups.get(groupOf(y)) ?? { n: 0, kind: y.kind, sub: y.subKind };
    g.n++;
    groups.set(groupOf(y), g);
  }
  const big = [...groups.values()].sort((a, b) => b.n - a.n)[0];
  if (big.n >= 2) return `I sorted your shelves. ${count(big.n)} new ${groupPlural(big.kind, big.sub)} this month!`;
  return `I sorted your shelves. ${count(fresh.length)} new ${fresh.length === 1 ? "yum" : "yums"} this month!`;
}

// --- Search and filters (designs I and J) ---

export type Filters = {
  q: string;
  kind: Kind | "";
  /** A sub-kind id; only with a kind. */
  sub: string;
  /** 0 any, 4 four and up, 5 five only. */
  hearts: 0 | 4 | 5;
  where: "any" | "home" | "away";
  /** Part of a restaurant or bar name. */
  place: string;
  /** "See all": every yum as results, with nothing narrowed. */
  all: boolean;
};

export const NO_FILTERS: Filters = { q: "", kind: "", sub: "", hearts: 0, where: "any", place: "", all: false };

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();

/** Search covers name, restaurant, note, city and country, ignoring case and accents. */
export function matchesQuery(y: Pick<Yum, "name" | "place" | "note" | "city" | "country">, q: string): boolean {
  const words = fold(q).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = fold([y.name, y.place, y.note, y.city, y.country].filter(Boolean).join(" \n "));
  return words.every((w) => hay.includes(w));
}

export function applyFilters(yums: Yum[], f: Filters): Yum[] {
  const home = homeCity(yums);
  return latestFirst(yums).filter((y) => {
    if (!matchesQuery(y, f.q)) return false;
    if (f.kind && y.kind !== f.kind) return false;
    if (f.kind && f.sub && y.subKind !== f.sub) return false;
    if (f.hearts && y.hearts < f.hearts) return false;
    if (f.where === "home" && !inCity(y, home)) return false;
    if (f.where === "away" && (!y.city || inCity(y, home))) return false;
    if (f.place.trim() && !(y.place && fold(y.place).includes(fold(f.place.trim())))) return false;
    return true;
  });
}

export const isFiltered = (f: Filters) => f.all || f.q.trim() !== "" || f.kind !== "" || f.hearts !== 0 || f.where !== "any" || f.place.trim() !== "";

export function filtersFromParams(p: URLSearchParams): Filters {
  const kind = p.get("kind");
  const h = Number(p.get("hearts"));
  const where = p.get("where");
  return {
    q: p.get("q") ?? "",
    kind: kind === "food" || kind === "drink" || kind === "dessert" ? kind : "",
    sub: p.get("sub") ?? "",
    hearts: h === 4 || h === 5 ? h : 0,
    where: where === "home" || where === "away" ? where : "any",
    place: p.get("place") ?? "",
    all: p.get("all") === "1",
  };
}

export function filtersToParams(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.kind) p.set("kind", f.kind);
  if (f.kind && f.sub) p.set("sub", f.sub);
  if (f.hearts) p.set("hearts", String(f.hearts));
  if (f.where !== "any") p.set("where", f.where);
  if (f.place.trim()) p.set("place", f.place.trim());
  if (f.all && !p.size) p.set("all", "1");
  return p.toString();
}
