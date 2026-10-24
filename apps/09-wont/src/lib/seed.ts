// Named demo states for user tests (docs/products/09-wont/user-testing/plan.md, "Seeding").
// Every state is built relative to `now`, so "yesterday" is always yesterday.
import { addDays, atLocal, dayOf, type DayKey } from "./day";
import type { DayLog, Habit, Logs, WontState } from "./habits";

export const SEED_NAMES = [
  "fresh",
  "returning",
  "owner-today",
  "after-miss",
  "after-slip",
  "week-two-misses",
] as const;
export type SeedName = (typeof SEED_NAMES)[number];

export function isSeedName(name: string): name is SeedName {
  return (SEED_NAMES as readonly string[]).includes(name);
}

export function emptyState(): WontState {
  return { version: 1, habits: [], logs: {}, comebacksSeen: {}, introSeen: false };
}

type SeedHabit = Habit extends infer H ? (H extends Habit ? Omit<H, "createdAt" | "startDay" | "order"> : never) : never;

type Spec = SeedHabit & {
  /**
   * History from the start day to yesterday, one character per day, oldest first:
   * k = kept / clean, . = not logged, s = slip of 1, S = clean tap then a slip of 2 later that day.
   * The length sets the start day (today - length).
   */
  history: string;
};

const UP: SeedHabit = {
  id: "up", kind: "build", colour: "c0", name: "Up by 7:00",
  anchor: "the alarm goes off", action: "get straight out of bed", goal: "up by 7:00",
  why: "Mornings are when I do my best work",
};
const WRITE: SeedHabit = {
  id: "write", kind: "build", colour: "c1", name: "Write",
  anchor: "my morning coffee", action: "write a journal entry or a short story", goal: "one page",
};
const READ: SeedHabit = {
  id: "read", kind: "build", colour: "c2", name: "Read 10 pages",
  anchor: "dinner", action: "read", goal: "10 pages",
};
const BED: SeedHabit = {
  id: "bed", kind: "build", colour: "c3", name: "In bed by 23:00",
  anchor: "I brush my teeth", action: "go to bed", goal: "in bed by 23:00",
};
const POUCHES: SeedHabit = {
  id: "pouches", kind: "stop", colour: "c4", name: "Nicotine pouches",
  trigger: "after coffee", friction: "pouches stay in the car", replacement: "chew gum",
  why: "Days without nicotine",
};

function build(specs: Spec[], now: number, introSeen = true): WontState {
  const today = dayOf(now);
  const habits: Habit[] = [];
  const logs: Logs = {};
  specs.forEach(({ history, ...h }, order) => {
    const startDay: DayKey = addDays(today, -history.length);
    habits.push({ ...h, order, startDay, createdAt: atLocal(startDay, 9) } as Habit);
    const days: Record<DayKey, DayLog> = {};
    [...history].forEach((c, i) => {
      const day = addDays(startDay, i);
      const at = atLocal(day, h.kind === "build" ? 21 : 20);
      const field = h.kind === "build" ? "kept" : "clean";
      if (c === "k") days[day] = { [field]: at };
      if (c === "s") days[day] = { slip: { size: "1", at: atLocal(day, 22) } };
      if (c === "S") days[day] = { clean: at, slip: { size: "2", at: atLocal(day, 23) } };
    });
    logs[h.id] = days;
  });
  return { version: 1, habits, logs, comebacksSeen: {}, introSeen };
}

/** A demo state as of `now`. */
export function seed(name: SeedName, now: number = Date.now()): WontState {
  switch (name) {
    case "fresh":
      return emptyState();
    // Plan's "returning user": wake-up and pouches, six kept / clean days, today open.
    case "returning":
      return build([{ ...UP, history: "kkkkkk" }, { ...POUCHES, history: "kkkkkk" }], now);
    // The owner's five habits with the prototypes' history (board2.tsx): Up 5 of 7, Write's
    // comeback due (yesterday not logged), pouches 2 clean days.
    case "owner-today":
      return build(
        [
          { ...UP, history: "kk.kk.kkk" },
          { ...WRITE, history: "kk.k." },
          { ...READ, history: "kk.kk.kkk" },
          { ...BED, history: "kk..kk.kk" },
          { ...POUCHES, history: "kk" },
        ],
        now,
      );
    // Yesterday: wake-up not logged, a pouch slip of 1. Both cards owe a comeback message.
    case "after-miss":
      return build([{ ...UP, history: "kkkkkk." }, { ...POUCHES, history: "kkkkkks" }], now);
    // Yesterday: clean tap, then a slip of 2 that evening (slip wins). Wake-up kept.
    case "after-slip":
      return build([{ ...UP, history: "kkkkkkk" }, { ...POUCHES, history: "kkkkkkS" }], now);
    // Wake-up missed the last two days: one comeback message, not two.
    case "week-two-misses":
      return build(
        [
          { ...UP, history: "kkkkkkk.." },
          { ...READ, history: "kkkk.kkkk" },
          { ...POUCHES, history: "kkkkkkkkk" },
        ],
        now,
      );
  }
}
