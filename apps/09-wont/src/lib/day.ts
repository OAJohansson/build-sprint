// Calendar-day maths for Wont (decisions L9, T2). Pure functions, no React.
//
// A "day" is a calendar date string "YYYY-MM-DD" (a DayKey). A log belongs to the previous day
// until 04:00 local time, so a 00:30 bedtime log counts for the evening before. Day arithmetic
// runs on calendar dates in UTC (which has no clock changes), never on 24 h of milliseconds, so
// the 25 Oct 2026 EU clock change (a 25-hour day) cannot shift a day.

export type DayKey = string;

/** Local hour at which a new day starts. One constant to change (L9). */
export const DAY_START_HOUR = 4;

const MS_PER_DAY = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");

function parse(key: DayKey): [number, number, number] {
  const [y, m, d] = key.split("-").map(Number);
  return [y, m, d];
}

function utcMs(key: DayKey): number {
  const [y, m, d] = parse(key);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): DayKey {
  const t = new Date(ms);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** The day a moment belongs to, in the phone's local time, with the 04:00 boundary. */
export function dayOf(moment: number | Date): DayKey {
  const t = new Date(moment);
  // Before 04:00: step back one calendar date. Built at local noon so a missing or doubled
  // hour on a clock-change day can never move the date.
  const d =
    t.getHours() < DAY_START_HOUR
      ? new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1, 12)
      : t;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's DayKey (respects vi.setSystemTime in tests). */
export function todayKey(now: number = Date.now()): DayKey {
  return dayOf(now);
}

/** The date n calendar days after (or before, if negative) a day. */
export function addDays(key: DayKey, n: number): DayKey {
  return fromUtc(utcMs(key) + n * MS_PER_DAY);
}

/** Whole calendar days from a to b (positive when b is later). */
export function diffDays(a: DayKey, b: DayKey): number {
  return Math.round((utcMs(b) - utcMs(a)) / MS_PER_DAY);
}

/** Every day from `from` to `to`, both included; empty when to is before from. */
export function dayRange(from: DayKey, to: DayKey): DayKey[] {
  const out: DayKey[] = [];
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k);
  return out;
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(key: DayKey): number {
  return new Date(utcMs(key)).getUTCDay();
}

/** A local timestamp on a given day at a given hour (for seeds and tests). */
export function atLocal(key: DayKey, hour = 12, minute = 0): number {
  const [y, m, d] = parse(key);
  return new Date(y, m - 1, d, hour, minute).getTime();
}
