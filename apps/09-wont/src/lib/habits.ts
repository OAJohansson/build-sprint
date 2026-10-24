// Data shapes for Wont. Stored as one JSON object under STORAGE_KEY (see store.ts).
import type { DayKey } from "./day";

export type HabitKind = "build" | "stop";

interface HabitBase {
  id: string;
  /** Short card title, e.g. "Up by 7:00" or "Nicotine pouches". */
  name: string;
  /** Optional "why this matters to me". */
  why?: string;
  createdAt: number;
  /** The habit's first day (dayOf(createdAt) at creation). Day logic reads this, not createdAt. */
  startDay: DayKey;
  /** A colour token the UI maps to a palette entry. */
  colour: string;
  /** Position on the board, ascending. */
  order: number;
}

/** "After I <anchor>, I will <action>." with a goal that is clearly met or not. */
export interface BuildHabit extends HabitBase {
  kind: "build";
  anchor: string;
  action: string;
  goal: string;
}

/** A habit to stop: what sets it off, one step that makes it harder, what to do instead. */
export interface StopHabit extends HabitBase {
  kind: "stop";
  trigger: string;
  friction: string;
  replacement: string;
}

export type Habit = BuildHabit | StopHabit;

export type SlipSize = "1" | "2" | "3+";

/**
 * Everything logged for one habit on one day. Values are the timestamps of the taps.
 * Build habits use `kept`; stop habits use `clean`, `slip` and `urges`.
 * A slip overrides a clean tap on the same day (L11); both are kept so undoing the slip
 * brings the clean tap back.
 */
export interface DayLog {
  kept?: number;
  clean?: number;
  slip?: { size: SlipSize; at: number };
  urges?: number[];
}

/** habitId → day → log. */
export type Logs = Record<string, Record<DayKey, DayLog>>;

export interface WontState {
  version: 1;
  habits: Habit[];
  logs: Logs;
  /** habitId → id (last missed day of the run) of the latest comeback message already shown (L14,
   * feedback 37). Older stored ids (first missed day) are earlier, so at worst one extra showing. */
  comebacksSeen: Record<string, DayKey>;
  introSeen: boolean;
}

/** Fields a user can write when creating a habit. */
export type BuildDraft = Pick<BuildHabit, "kind" | "name" | "anchor" | "action" | "goal" | "why"> & { colour?: string };
export type StopDraft = Pick<StopHabit, "kind" | "name" | "trigger" | "friction" | "replacement" | "why"> & { colour?: string };
export type HabitDraft = BuildDraft | StopDraft;

/** Wording edits only; kind, id and start day never change, so history is kept (L15). */
export type HabitPatch = Partial<
  Omit<BuildHabit, "id" | "kind" | "createdAt" | "startDay"> &
    Omit<StopHabit, "id" | "kind" | "createdAt" | "startDay">
>;
