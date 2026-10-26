// What one habit card shows, derived from the rules in progress.ts. Pure: no React, no copy.
import { addDays, dayRange, weekdayOf, type DayKey } from "./day";
import type { Habit } from "./habits";
import {
  cleanDayCount,
  dayStatus,
  dueComeback,
  isComebackDay,
  isKeptLog,
  rollingRate,
  type DayStatus,
  type DueComeback,
  type HabitDays,
} from "./progress";
import type { Mark } from "@/components/wonton";

export interface CardModel {
  /** Steamer contents: one mark per kept day in the rolling window, oldest first. */
  marks: Mark[];
  rate: { kept: number; of: number };
  cleanDays: number;
  today: DayStatus;
  /** Today is kept (build) or clean so far (stop): the card wears the kept wash. */
  keptToday: boolean;
  comebackToday: boolean;
  slipSize?: string;
  urgesToday: number;
  comeback: DueComeback | null;
}

export function cardModel(habit: Habit, days: HabitDays, today: DayKey, seenId?: DayKey): CardModel {
  const rate = rollingRate(habit, days, today);
  const status = dayStatus(habit, days, today, today);
  return {
    marks: rate.days
      .filter((d) => isKeptLog(habit, days?.[d]))
      .map((d) => (isComebackDay(habit, days, d, today) ? "c" : "k")),
    rate: { kept: rate.kept, of: rate.of },
    cleanDays: cleanDayCount(habit, days, today),
    today: status,
    keptToday: status === "kept" || status === "clean-so-far",
    comebackToday: isComebackDay(habit, days, today, today),
    slipSize: days?.[today]?.slip?.size,
    urgesToday: days?.[today]?.urges?.length ?? 0,
    comeback: dueComeback(habit, days, today, seenId),
  };
}

export interface HistoryRow {
  day: DayKey;
  status: DayStatus;
  comeback: boolean;
  slipSize?: string;
  urges: number;
}

/** The last `size` days of a habit's life, newest first (history is never wiped, R6). */
export function history(habit: Habit, days: HabitDays, today: DayKey, size = 14): HistoryRow[] {
  const from = addDays(today, -(size - 1));
  return dayRange(from < habit.startDay ? habit.startDay : from, today)
    .reverse()
    .map((day) => ({
      day,
      status: dayStatus(habit, days, day, today),
      comeback: isComebackDay(habit, days, day, today),
      slipSize: days?.[day]?.slip?.size,
      urges: days?.[day]?.urges?.length ?? 0,
    }));
}

/** Weekday (0 = Sunday), date and month index of a DayKey, for labels. */
export function dayParts(day: DayKey): { weekday: number; date: number; month: number } {
  const [, m, d] = day.split("-").map(Number);
  return { weekday: weekdayOf(day), date: d, month: m - 1 };
}
