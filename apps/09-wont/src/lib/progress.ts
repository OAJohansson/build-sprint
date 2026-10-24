// Progress and comeback rules for Wont (decisions L9–L14). Pure functions over a habit and its
// logs; `today` is always passed in (use todayKey()) so the rules are testable and the UI can
// re-render when the day turns without a reload (R10).
import { addDays, dayRange, type DayKey } from "./day";
import type { DayLog, Habit, Logs } from "./habits";

/** Per-day logs for one habit. */
export type HabitDays = Record<DayKey, DayLog> | undefined;

/**
 * - before-start / future: outside the habit's life, draw nothing.
 * - pending: today, nothing logged yet.
 * - kept: a build habit kept, or a stop habit's finished clean day.
 * - clean-so-far: a stop habit tapped clean today; it only becomes a clean day once over (L11).
 * - slip: a stop habit's slip (overrides a clean tap the same day).
 * - not-logged: a finished day with no log; counts as not kept, never shown as a failure (L10).
 */
export type DayStatus =
  | "before-start"
  | "future"
  | "pending"
  | "kept"
  | "clean-so-far"
  | "slip"
  | "not-logged";

/** True when the day's log is a kept (build) or clean-without-slip (stop) day. */
export function isKeptLog(habit: Habit, log: DayLog | undefined): boolean {
  if (!log) return false;
  return habit.kind === "build" ? log.kept !== undefined : log.clean !== undefined && !log.slip;
}

/** True when the day has a status-setting log (urges alone don't count as logging the day). */
export function isLogged(habit: Habit, log: DayLog | undefined): boolean {
  if (!log) return false;
  return habit.kind === "build" ? log.kept !== undefined : log.clean !== undefined || !!log.slip;
}

export function dayStatus(habit: Habit, days: HabitDays, day: DayKey, today: DayKey): DayStatus {
  if (day < habit.startDay) return "before-start";
  if (day > today) return "future";
  const log = days?.[day];
  if (habit.kind === "stop" && log?.slip) return "slip";
  if (isKeptLog(habit, log)) return habit.kind === "stop" && day === today ? "clean-so-far" : "kept";
  return day === today ? "pending" : "not-logged";
}

/**
 * A finished day that counts against the habit: not kept (not logged, or a slip). The habit's
 * first day is a grace day: if it was left unlogged (e.g. created late in the evening) it is
 * neither a miss nor counted in the rate.
 */
export function isMissDay(habit: Habit, days: HabitDays, day: DayKey, today: DayKey): boolean {
  if (day < habit.startDay || day >= today) return false;
  const log = days?.[day];
  if (isKeptLog(habit, log)) return false;
  if (day === habit.startDay && !isLogged(habit, log)) return false;
  return true;
}

/** Whether a day takes part in the rolling rate. */
function countsInRate(habit: Habit, days: HabitDays, day: DayKey, today: DayKey): boolean {
  if (day < habit.startDay || day > today) return false;
  const logged = isLogged(habit, days?.[day]);
  if (day === today) return logged;
  if (day === habit.startDay) return logged;
  return true;
}

export interface RollingRate {
  kept: number;
  of: number;
  /** The days counted, oldest first. */
  days: DayKey[];
}

/**
 * "kept of the last N" (L12): the last 7 days, today included only once it is logged (so the
 * window ends yesterday until then). A younger habit uses its age. Never resets to zero on a miss
 * (R6). For a stop habit today's clean-so-far tap counts as kept here (it is logged); the
 * clean-day total below waits until the day is over.
 */
export function rollingRate(habit: Habit, days: HabitDays, today: DayKey, size = 7): RollingRate {
  const end = isLogged(habit, days?.[today]) ? today : addDays(today, -1);
  const window = dayRange(addDays(end, -(size - 1)), end).filter((d) =>
    countsInRate(habit, days, d, today),
  );
  return {
    kept: window.filter((d) => isKeptLog(habit, days?.[d])).length,
    of: window.length,
    days: window,
  };
}

/**
 * Total finished clean (stop) or kept (build) days since the habit started. A total, never
 * consecutive (L11). Today never counts: a clean day only counts once it is over.
 */
export function cleanDayCount(habit: Habit, days: HabitDays, today: DayKey): number {
  if (!days) return 0;
  return Object.keys(days).filter(
    (d) => d >= habit.startDay && d < today && isKeptLog(habit, days[d]),
  ).length;
}

/** R8: a kept (or clean-so-far) day right after a missed day. The first day ever never is. */
export function isComebackDay(habit: Habit, days: HabitDays, day: DayKey, today: DayKey): boolean {
  const status = dayStatus(habit, days, day, today);
  if (status !== "kept" && status !== "clean-so-far") return false;
  return isMissDay(habit, days, addDays(day, -1), today);
}

/** The run of missed days ending yesterday, oldest first (empty when yesterday was kept). */
export function missedRun(habit: Habit, days: HabitDays, today: DayKey): DayKey[] {
  const run: DayKey[] = [];
  for (let d = addDays(today, -1); isMissDay(habit, days, d, today); d = addDays(d, -1)) {
    run.unshift(d);
  }
  return run;
}

export interface DueComeback {
  /** Stable id of this comeback: the first missed day of the run. Pass to markComebackSeen. */
  id: DayKey;
  /** The missed days, oldest first (one or more; one message however many). */
  missed: DayKey[];
  /** The most recent missed day: the day the message names ("Friday stayed empty"). */
  lastMissed: DayKey;
  /**
   * What the named day (lastMissed) was: a slip, or a day left unlogged. Read from that day's own
   * log, never from the rest of the run, so an unlogged day is never described as a slip (F2:
   * a Saturday slip followed by unlogged days used to make "Tuesday had a slip").
   */
  lastKind: "slip" | "unlogged";
}

/**
 * R7 / L14: the comeback message due for a habit, or null. Due when yesterday was missed and
 * today isn't kept yet; one message per run of misses (two misses in a row = one message), and
 * once marked seen (`seenId` = comebacksSeen[habit.id]) it is not shown again for that run.
 */
export function dueComeback(
  habit: Habit,
  days: HabitDays,
  today: DayKey,
  seenId?: DayKey,
): DueComeback | null {
  if (isKeptLog(habit, days?.[today])) return null;
  const missed = missedRun(habit, days, today);
  if (missed.length === 0) return null;
  const id = missed[0];
  if (seenId !== undefined && seenId >= id) return null;
  return {
    id,
    missed,
    lastMissed: missed[missed.length - 1],
    lastKind: days?.[missed[missed.length - 1]]?.slip ? "slip" : "unlogged",
  };
}

export interface WeekDay {
  day: DayKey;
  /** Habits kept that day (today: kept or clean so far). */
  kept: number;
  /** Habits that existed that day. */
  total: number;
  /** kept / total, or null when no habit existed yet. */
  share: number | null;
}

/** The week strip (T5): share of habits kept on each of the last `size` days, today last. */
export function weekStrip(habits: Habit[], logs: Logs, today: DayKey, size = 7): WeekDay[] {
  return dayRange(addDays(today, -(size - 1)), today).map((day) => {
    const active = habits.filter((h) => h.startDay <= day);
    const kept = active.filter((h) => isKeptLog(h, logs[h.id]?.[day])).length;
    return { day, kept, total: active.length, share: active.length ? kept / active.length : null };
  });
}
