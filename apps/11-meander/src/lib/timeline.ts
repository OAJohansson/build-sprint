// The timeline (#41): every school as a span of years on one axis, earliest first, so "where did it start?" has an
// answer. Time is uneven (2,600 years, crowded at the modern end), so the axis is cut into five eras and each era
// gets a fixed share of the width; inside an era, years are spread evenly.
import erasFile from "@/content/eras.json";

export type Era = { name: string; short: string; from: number; share: number };

/** Eras in order. Each runs from its `from` to the next era's `from` (the last one to the present). The axis starts at
 * 700 BCE, the earliest sourced start (Vedānta's early Upaniṣads, #42). */
export const ERAS: Era[] = [
  { name: "Ancient", short: "Ancient", from: -700, share: 0.26 },
  { name: "Medieval", short: "Medieval", from: 500, share: 0.14 },
  { name: "Renaissance and early modern", short: "Early modern", from: 1350, share: 0.2 },
  { name: "Modern", short: "Modern", from: 1780, share: 0.18 },
  { name: "Contemporary", short: "Contemporary", from: 1900, share: 0.22 },
];

export type RawSpan = { from: number; to: number | "present"; roots?: number; open?: boolean; living?: boolean };
/** `to` is where the solid bar ends; a living tradition (`tail`) carries on faintly to the present. */
export type Span = { from: number; to: number; roots?: number; open: boolean; present: boolean; tail?: number };

export const RAW = (erasFile as { eras: Record<string, RawSpan> }).eras;

/** A school's years, with "present" as the current year; null when the table has no entry (it is left off). */
export function spanOf(id: string, now: Date = new Date(), table: Record<string, RawSpan> = RAW): Span | null {
  const r = table[id];
  if (!r || typeof r.from !== "number") return null;
  const year = now.getFullYear();
  const present = r.to === "present";
  const to = present ? year : (r.to as number);
  if (typeof to !== "number" || to < r.from) return null;
  const span: Span = { from: r.from, to: Math.min(to, year), roots: r.roots, open: !!r.open, present };
  if (r.living && !present) span.tail = year;
  return span;
}

/** The era a year falls in (a boundary year belongs to the later era); years before the first era count as the first. */
export function eraOf(year: number): number {
  let i = 0;
  while (i + 1 < ERAS.length && year >= ERAS[i + 1].from) i++;
  return i;
}

/** Year -> x between x0 and x1. Each era fills its share; years outside the axis are held at its ends. */
export function makeScale(x0: number, x1: number, now: Date = new Date()) {
  const end = now.getFullYear();
  const w = x1 - x0;
  const starts: number[] = [];
  let acc = x0;
  for (const e of ERAS) { starts.push(acc); acc += e.share * w; }
  const scale = (year: number) => {
    const y = Math.max(ERAS[0].from, Math.min(end, year));
    const i = eraOf(y);
    const a = ERAS[i].from, b = i + 1 < ERAS.length ? ERAS[i + 1].from : end;
    const t = b > a ? (y - a) / (b - a) : 0;
    return starts[i] + t * ERAS[i].share * w;
  };
  /** Where each era starts and ends on the axis. */
  const bands = ERAS.map((e, i) => ({ ...e, x: starts[i], w: e.share * w }));
  return { scale, bands, end };
}

/** "500 BCE", "1 CE", "1500". There is no year 0. */
export const yearLabel = (y: number) => (y < 0 ? `${-y} BCE` : y < 1000 ? `${Math.max(1, y)} CE` : String(y));

export type TimelineRow<T> = { item: T; span: Span; era: number };

/** The schools the table knows, earliest first (then the shorter span, then the content's order), with their era. */
export function timelineRows<T extends { id: string }>(items: T[], now: Date = new Date(), table: Record<string, RawSpan> = RAW): TimelineRow<T>[] {
  const rows: TimelineRow<T>[] = [];
  for (const item of items) {
    const span = spanOf(item.id, now, table);
    if (span) rows.push({ item, span, era: eraOf(span.from) });
  }
  // sort is stable, so ties keep the content's order
  return rows.sort((a, b) => a.span.from - b.span.from || a.span.to - b.span.to);
}
