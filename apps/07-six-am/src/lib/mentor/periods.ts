// Today / this month in the owner's local time, the daily question count and the 50/day warning
// (M14, L56, unit test 2). The server runs in UTC, so the browser sends its offset: the value of
// `new Date().getTimezoneOffset()` (minutes, UTC minus local: -480 for UTC+8, 60 for UTC-1).

export const DAILY_WARNING_AT = 50;

/** Clamp a client-sent offset to real time zones (UTC-14 … UTC+12); junk → 0 (UTC). */
export function cleanTzOffset(v: unknown): number {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n)) return 0;
  return Math.max(-14 * 60, Math.min(12 * 60, Math.round(n)));
}

/** A half-open UTC range [start, end). */
export type Range = { start: Date; end: Date };

/** The local calendar day containing `now`, as UTC instants. */
export function dayRange(now: Date, tzOffset: number): Range {
  const local = new Date(now.getTime() - tzOffset * 60_000);
  const startLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const start = new Date(startLocal + tzOffset * 60_000);
  const endLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + 1);
  return { start, end: new Date(endLocal + tzOffset * 60_000) };
}

/** The local calendar month containing `now`, as UTC instants. */
export function monthRange(now: Date, tzOffset: number): Range {
  const local = new Date(now.getTime() - tzOffset * 60_000);
  const start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1);
  const end = Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1);
  return { start: new Date(start + tzOffset * 60_000), end: new Date(end + tzOffset * 60_000) };
}

/** "October" for the panel's "Today $x · October $y", in the owner's local month. */
export function monthName(now: Date, tzOffset: number): string {
  const local = new Date(now.getTime() - tzOffset * 60_000);
  return local.toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
}

const inRange = (iso: string, r: Range) => {
  const t = Date.parse(iso);
  return t >= r.start.getTime() && t < r.end.getTime();
};

/** One stored message, as much as the sums need. */
export type CostRow = { createdAt: string; costUsd: number; counted: boolean; role: "user" | "assistant" };

export type UsageSummary = {
  todayUsd: number;
  monthUsd: number;
  month: string;
  /** Questions the person started today (job buttons, chat, setup…; not background learning). */
  questionsToday: number;
  /** True from the 50th question of the day: show the warning with "Continue anyway". */
  warning: boolean;
  estimate: true;
};

export function summarise(rows: CostRow[], now: Date, tzOffset: number): UsageSummary {
  const day = dayRange(now, tzOffset), month = monthRange(now, tzOffset);
  let todayUsd = 0, monthUsd = 0, questionsToday = 0;
  for (const r of rows) {
    if (inRange(r.createdAt, month)) monthUsd += r.costUsd;
    if (!inRange(r.createdAt, day)) continue;
    todayUsd += r.costUsd;
    if (r.role === "user" && r.counted) questionsToday += 1;
  }
  return {
    todayUsd: round4(todayUsd),
    monthUsd: round4(monthUsd),
    month: monthName(now, tzOffset),
    questionsToday,
    warning: questionsToday >= DAILY_WARNING_AT,
    estimate: true,
  };
}

const round4 = (x: number) => Math.round(x * 10_000) / 10_000;
