import { findMovement } from "@/lib/movements";
import { parseRounds, parseTime } from "@/lib/pb";
import type { Session, Unit } from "@/lib/types";
import { weekOf } from "@/lib/summary";

// Everything the Progress section shows, worked out from logged sessions.

export const DEFAULT_GOAL = 3;

/** A weekly goal and the Monday it applies from. Past weeks keep the goal they had. */
export type GoalChange = { from: string; days: number };

export function goalFor(goals: GoalChange[], weekStart: string) {
  let days = DEFAULT_GOAL;
  for (const g of [...goals].sort((x, y) => x.from.localeCompare(y.from))) if (g.from <= weekStart) days = g.days;
  return days;
}

/** Set the goal from this week on (replacing a change made earlier this week). */
export function setGoal(goals: GoalChange[], today: string, days: number): GoalChange[] {
  const from = weekOf(today)[0];
  return [...goals.filter((g) => g.from !== from), { from, days }];
}

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export type WeekPill = { start: string; days: number; hit: boolean; current: boolean };

/** The last `count` weeks (Monday-first), oldest first, with training days per week and the streak. */
export function weeklyGoal(sessions: Session[], today: string, goals: GoalChange[] = [], count = 8) {
  const trained = new Set(sessions.map((s) => s.date));
  const thisMonday = weekOf(today)[0];
  const weeks: WeekPill[] = Array.from({ length: count }, (_, i) => {
    const start = addDays(thisMonday, -7 * (count - 1 - i));
    const days = weekOf(start).filter((d) => trained.has(d)).length;
    return { start, days, hit: days >= goalFor(goals, start), current: i === count - 1 };
  });
  // Streak: completed weeks in a row that hit the goal, plus this week once it's hit.
  let streak = 0;
  for (let i = count - 2; i >= 0 && weeks[i].hit; i--) streak++;
  if (weeks[count - 1].hit) streak++;
  // Look further back than the pills show, so a long streak isn't capped at 8.
  if (streak >= count - 1) {
    let start = addDays(weeks[0].start, -7);
    while (weekOf(start).filter((d) => trained.has(d)).length >= goalFor(goals, start)) {
      streak++;
      start = addDays(start, -7);
    }
  }
  return { weeks, streak, thisWeek: weeks[count - 1].days, goal: goalFor(goals, thisMonday) };
}

export type Trend = {
  movement: string;
  points: { date: string; value: number }[]; // heaviest set per training day, oldest first
  first: { date: string; value: number };
  last: { date: string; value: number };
  change: number;
  unit: Unit;
};

const kg = (w: number, unit: Unit) => (unit === "lb" ? w * 0.45359237 : w);

/** Heaviest weight per training day for one lift. */
export function liftTrend(sessions: Session[], movement: string): Trend | null {
  const key = movement.toLowerCase();
  const byDate = new Map<string, number>();
  let unit: Unit = "kg";
  for (const s of sessions) {
    for (const e of s.entries) {
      if (e.movement.toLowerCase() !== key || e.weight == null) continue;
      unit = e.unit;
      const w = kg(e.weight, e.unit);
      byDate.set(s.date, Math.max(byDate.get(s.date) ?? 0, w));
    }
  }
  const points = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  return { movement: findMovement(movement).name, points, first, last, change: last.value - first.value, unit };
}

/** Lifts done on 3+ days, the ones that went up most first. */
export function movingLifts(sessions: Session[], min = 3): Trend[] {
  const names = new Set<string>();
  for (const s of sessions) for (const e of s.entries) if (e.weight != null && findMovement(e.movement).pb === "load") names.add(findMovement(e.movement).name);
  return [...names]
    .map((n) => liftTrend(sessions, n))
    .filter((t): t is Trend => !!t && t.points.length >= min)
    .sort((a, b) => b.change / b.first.value - a.change / a.first.value);
}

export type BenchmarkRepeat = { movement: string; first: string; last: string; change: string; better: boolean };

/** Benchmark WODs done at least twice: first result vs latest. */
export function benchmarkRepeats(sessions: Session[]): BenchmarkRepeat[] {
  const runs = new Map<string, { date: string; score: string; value: number; kind: "time" | "rounds" }[]>();
  for (const s of sessions) {
    for (const e of s.entries) {
      const mv = findMovement(e.movement);
      if (mv.category !== "WODs" || !e.score || (mv.pb !== "time" && mv.pb !== "rounds")) continue;
      const value = mv.pb === "time" ? parseTime(e.score) : parseRounds(e.score);
      if (value == null) continue;
      runs.set(mv.name, [...(runs.get(mv.name) ?? []), { date: s.date, score: e.score, value, kind: mv.pb }]);
    }
  }
  return [...runs.entries()]
    .filter(([, r]) => r.length >= 2)
    .map(([movement, r]) => {
      r.sort((a, b) => a.date.localeCompare(b.date));
      const a = r[0];
      const b = r[r.length - 1];
      if (a.kind === "time") {
        const diff = b.value - a.value;
        return { movement, first: a.score, last: b.score, change: `${diff <= 0 ? "−" : "+"}${Math.abs(Math.round(diff))} s`, better: diff < 0 };
      }
      const diff = Math.floor(b.value / 1000) - Math.floor(a.value / 1000);
      return { movement, first: a.score, last: b.score, change: `${diff >= 0 ? "+" : "−"}${Math.abs(diff)} rds`, better: diff > 0 };
    });
}

export const fmtKg = (v: number) => `${+v.toFixed(1)}`;
