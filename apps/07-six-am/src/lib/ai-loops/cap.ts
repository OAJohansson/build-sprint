import { dayRange, monthRange } from "@/lib/mentor/periods";

// The AI loops' per-day cap (S4). Unlike the Mentor's 50/day warning this is a hard stop: each
// loop costs real money ($0.04–$0.08), so a stuck button or a loop in code can't run up a bill.
// Every paid draw counts (L126: up to 3 draws per loop), so `today` is draws, not loops.
// Days are the owner's local days (tzOffset = the browser's getTimezoneOffset()).

export const DEFAULT_DAILY_LOOP_CAP = 20;

/** LOOPS_DAILY_CAP from env, clamped to 0…200; junk or missing → the default. */
export function dailyLoopCap(raw: string | undefined): number {
  const n = raw === undefined || raw.trim() === "" ? NaN : Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.min(200, Math.floor(n))) : DEFAULT_DAILY_LOOP_CAP;
}

/** One stored loop: when, its total cost and how many paid draws made it (missing = 1). */
export type LoopCostRow = { createdAt: string; costUsd: number; draws?: number };

export type LoopUsage = { today: number; cap: number; left: number; todayUsd: number; monthUsd: number; estimate: true };

const sumIn = (rows: LoopCostRow[], start: Date, end: Date) =>
  rows.filter((r) => {
    const t = Date.parse(r.createdAt);
    return t >= start.getTime() && t < end.getTime();
  });

/** Paid draws today, cost today and this month in the owner's local time, and how many are left today. */
export function loopUsage(rows: LoopCostRow[], now: Date, tzOffset: number, cap: number): LoopUsage {
  const d = dayRange(now, tzOffset), m = monthRange(now, tzOffset);
  const today = sumIn(rows, d.start, d.end);
  const month = sumIn(rows, m.start, m.end);
  const usd = (rs: LoopCostRow[]) => Math.round(rs.reduce((s, r) => s + r.costUsd, 0) * 1e6) / 1e6;
  const draws = today.reduce((n, r) => n + Math.max(1, r.draws ?? 1), 0);
  return { today: draws, cap, left: Math.max(0, cap - draws), todayUsd: usd(today), monthUsd: usd(month), estimate: true };
}
