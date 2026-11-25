// Visit history: what was opened and when (R5), and the counts the "Your thread" panel shows (L10).
// Days are local calendar days, so a visit at 23:59 and one at 00:01 are two days.

export type Visit = {
  kind: "school" | "thinker";
  /** School id or thinker id. */
  id: string;
  /** ISO timestamp of when it was opened. */
  at: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** The local calendar day of a timestamp, as "YYYY-MM-DD". */
export function localDay(at: string | Date): string {
  const d = typeof at === "string" ? new Date(at) : at;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "12 Nov" for a "YYYY-MM-DD" day key; the year is added when it isn't the current one. */
export function formatDay(day: string, now: Date = new Date()): string {
  const [y, m, d] = day.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}${y !== now.getFullYear() ? ` ${y}` : ""}`;
}

/** Append a visit unless the same thing was already opened today (a record, not a click log). */
export function addVisit(visits: Visit[], kind: Visit["kind"], id: string, now: Date = new Date()): Visit[] {
  const today = localDay(now);
  if (visits.some((v) => v.kind === kind && v.id === id && localDay(v.at) === today)) return visits;
  return [...visits, { kind, id, at: now.toISOString() }];
}

export type DayRow = {
  day: string;
  isToday: boolean;
  /** Distinct items opened that day, in the order first opened. */
  items: { kind: Visit["kind"]; id: string }[];
};

export type ThreadSummary = {
  /** Distinct schools visited. */
  schools: number;
  /** Distinct local days with at least one visit. */
  days: number;
  /** First day with a visit, or null for an empty history. */
  since: string | null;
  /** One row per day, newest first. */
  rows: DayRow[];
};

export function summarise(visits: Visit[], now: Date = new Date()): ThreadSummary {
  const today = localDay(now);
  const byDay = new Map<string, DayRow>();
  const schools = new Set<string>();
  for (const v of visits) {
    const day = localDay(v.at);
    if (v.kind === "school") schools.add(v.id);
    let row = byDay.get(day);
    if (!row) byDay.set(day, (row = { day, isToday: day === today, items: [] }));
    if (!row.items.some((i) => i.kind === v.kind && i.id === v.id)) row.items.push({ kind: v.kind, id: v.id });
  }
  const rows = [...byDay.values()].sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
  return { schools: schools.size, days: rows.length, since: rows.length ? rows[rows.length - 1].day : null, rows };
}

/** Ids of schools visited at least once (for the brass rings). */
export function visitedSchools(visits: Visit[]): Set<string> {
  return new Set(visits.filter((v) => v.kind === "school").map((v) => v.id));
}

/** "4 schools on 4 days", singular where it should be. */
export function countLine(s: Pick<ThreadSummary, "schools" | "days">): string {
  return `${s.schools} ${s.schools === 1 ? "school" : "schools"} on ${s.days} ${s.days === 1 ? "day" : "days"}`;
}
