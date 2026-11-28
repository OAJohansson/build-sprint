// Years for the music timeline, read from a genre's sourced date range ("Early 1980s–present", "Mid-1970s – late
// 1980s", "c. 1920–1940", "Early 20th century"). Used by scripts/import-music.mjs (Node runs this file as plain
// TypeScript, so it has no imports). Philosophy's years are read by hand (scripts/import-places.mjs).
// shortcut: a decade is read as a fixed year (early 1980s = 1980, mid = 1984, late = 1987 as a start); a genre whose range doesn't
// parse, or parses wrong, gets a hand entry in import-music.mjs's SPAN_BY_HAND; replace with sourced start and end years if the timeline needs to be exact.

export type ParsedSpan = { from: number; to: number | "present" };

type Mod = "early" | "mid" | "late" | "";
// Into the decade (or tenths of a century) a modifier puts the start and the end.
const START: Record<Mod, number> = { early: 0, mid: 4, late: 7, "": 0 };
const END: Record<Mod, number> = { early: 3, mid: 6, late: 9, "": 9 };

/** Every year-like token in order: a year (1977), a decade (1970s) or a century (20th century), each with its modifier. */
function tokens(text: string): { year: number; decade: boolean; century: boolean; mod: Mod }[] {
  const out: { year: number; decade: boolean; century: boolean; mod: Mod }[] = [];
  const re = /(early|mid|late)?[\s-]*(?:(\d{4})(s)?|(\d{1,2})(?:st|nd|rd|th)[\s-]+century)/gi;
  for (const m of text.matchAll(re)) {
    const mod = (m[1]?.toLowerCase() ?? "") as Mod;
    if (m[2]) out.push({ year: Number(m[2]), decade: !!m[3], century: false, mod });
    else out.push({ year: (Number(m[4]) - 1) * 100, decade: false, century: true, mod });
  }
  return out;
}

const startOf = (t: ReturnType<typeof tokens>[number]) =>
  t.century ? t.year + START[t.mod] * 10 : t.decade ? t.year + START[t.mod] : t.year;
const endOf = (t: ReturnType<typeof tokens>[number]) =>
  t.century ? t.year + (t.mod === "early" ? 33 : t.mod === "mid" ? 66 : 99) : t.decade ? t.year + END[t.mod] : t.year;

/** The first year-like token is the start; the last one (or "present"/"today") is the end. A range with one token and
 * no end ("Mid-1980s") runs to the present. Null when the text has no year at all. */
export function parseSpan(text: string | null | undefined): ParsedSpan | null {
  if (!text) return null;
  const ts = tokens(text);
  if (!ts.length) return null;
  const from = startOf(ts[0]);
  const present = /present|today|ongoing/i.test(text);
  if (present || ts.length === 1) return { from, to: "present" };
  const to = endOf(ts[ts.length - 1]);
  return to >= from ? { from, to } : { from, to: "present" };
}
