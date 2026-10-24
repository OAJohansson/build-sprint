// State changes for Wont as pure functions (state in, new state out). The store hook wraps them;
// tests call them directly. A change that breaks a rule returns the same state object unchanged.
import { addDays, dayOf, type DayKey } from "./day";
import type { DayLog, Habit, HabitDraft, HabitPatch, SlipSize, WontState } from "./habits";

/** R9 / L15: only today and yesterday can be logged or changed, and never before the start. */
export function canEditDay(habit: Habit, day: DayKey, today: DayKey): boolean {
  if (day < habit.startDay) return false;
  return day === today || day === addDays(today, -1);
}

function findHabit(state: WontState, habitId: string) {
  return state.habits.find((h) => h.id === habitId);
}

function writeLog(
  state: WontState,
  habitId: string,
  day: DayKey,
  change: (log: DayLog) => DayLog,
): WontState {
  const days = state.logs[habitId] ?? {};
  const next = change({ ...days[day] });
  const nextDays = { ...days };
  if (Object.keys(next).length === 0) delete nextDays[day];
  else nextDays[day] = next;
  return { ...state, logs: { ...state.logs, [habitId]: nextDays } };
}

function editable(state: WontState, habitId: string, day: DayKey, today: DayKey) {
  const habit = findHabit(state, habitId);
  return habit && canEditDay(habit, day, today) ? habit : null;
}

/**
 * The card tap (R4): marks a build habit kept, or a stop habit clean (so far); tapping again
 * undoes it (T8). Works on today or yesterday.
 */
export function toggleKept(
  state: WontState,
  habitId: string,
  day: DayKey,
  today: DayKey,
  now: number,
): WontState {
  const habit = editable(state, habitId, day, today);
  if (!habit) return state;
  const field = habit.kind === "build" ? "kept" : "clean";
  return writeLog(state, habitId, day, (log) => {
    if (log[field] !== undefined) delete log[field];
    else log[field] = now;
    return log;
  });
}

/** R5: a slip with its size; logging again changes the size. Overrides a clean tap (L11). */
export function logSlip(
  state: WontState,
  habitId: string,
  day: DayKey,
  size: SlipSize,
  today: DayKey,
  now: number,
): WontState {
  const habit = editable(state, habitId, day, today);
  if (!habit || habit.kind !== "stop") return state;
  return writeLog(state, habitId, day, (log) => ({ ...log, slip: { size, at: now } }));
}

/** Undo a slip (a mis-tap must not become a slip); an earlier clean tap counts again. */
export function undoSlip(state: WontState, habitId: string, day: DayKey, today: DayKey): WontState {
  if (!editable(state, habitId, day, today)) return state;
  return writeLog(state, habitId, day, (log) => {
    delete log.slip;
    return log;
  });
}

/** R5: an urge, logged on the day it happens (now). */
export function logUrge(state: WontState, habitId: string, now: number): WontState {
  const habit = findHabit(state, habitId);
  const day = dayOf(now);
  if (!habit || habit.kind !== "stop" || !canEditDay(habit, day, day)) return state;
  return writeLog(state, habitId, day, (log) => ({ ...log, urges: [...(log.urges ?? []), now] }));
}

/** Undo the last urge on a day (today or yesterday). */
export function undoUrge(state: WontState, habitId: string, day: DayKey, today: DayKey): WontState {
  if (!editable(state, habitId, day, today)) return state;
  return writeLog(state, habitId, day, (log) => {
    const urges = (log.urges ?? []).slice(0, -1);
    if (urges.length) log.urges = urges;
    else delete log.urges;
    return log;
  });
}

function newId(): string {
  // shortcut: random id without a collision check, fine for a handful of habits on one device;
  // upgrade if habits ever sync between devices.
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `h${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** R2 / R3: a new habit; its first day is the day it was created (04:00 boundary). */
export function addHabit(state: WontState, draft: HabitDraft, now: number): WontState {
  const order = state.habits.reduce((m, h) => Math.max(m, h.order), -1) + 1;
  const habit = {
    ...draft,
    id: newId(),
    createdAt: now,
    startDay: dayOf(now),
    colour: draft.colour ?? `c${order % 5}`,
    order,
  } as Habit;
  return { ...state, habits: [...state.habits, habit] };
}

/** R9: wording edits; id, kind and start day stay, so the history stays attached. */
export function updateHabit(state: WontState, habitId: string, patch: HabitPatch): WontState {
  if (!findHabit(state, habitId)) return state;
  const safe = { ...patch } as Record<string, unknown>;
  for (const k of ["id", "kind", "createdAt", "startDay"]) delete safe[k];
  return {
    ...state,
    habits: state.habits.map((h) => (h.id === habitId ? ({ ...h, ...safe } as Habit) : h)),
  };
}

/** R9: removes a habit and its history (the UI asks first). */
export function deleteHabit(state: WontState, habitId: string): WontState {
  const logs = { ...state.logs };
  const comebacksSeen = { ...state.comebacksSeen };
  delete logs[habitId];
  delete comebacksSeen[habitId];
  return { ...state, habits: state.habits.filter((h) => h.id !== habitId), logs, comebacksSeen };
}

/** L14: remember that this comeback message (id from dueComeback) has been shown. */
export function markComebackSeen(state: WontState, habitId: string, id: DayKey): WontState {
  const prev = state.comebacksSeen[habitId];
  if (prev !== undefined && prev >= id) return state;
  return { ...state, comebacksSeen: { ...state.comebacksSeen, [habitId]: id } };
}

export function setIntroSeen(state: WontState, seen: boolean): WontState {
  return state.introSeen === seen ? state : { ...state, introSeen: seen };
}
