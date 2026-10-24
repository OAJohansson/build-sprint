"use client";

// Wont's storage: one versioned JSON object in localStorage via useLocalStorage, plus a clock
// that turns the day without a reload (R10). All rules live in the pure modules; this file only
// wires them to React.
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import * as A from "./actions";
import { todayKey, type DayKey } from "./day";
import type { HabitDraft, HabitPatch, SlipSize, WontState } from "./habits";
import { emptyState, isSeedName, seed, SEED_NAMES, type SeedName } from "./seed";
import { useLocalStorage } from "./use-local-storage";

// shortcut: localStorage on one device only (no-go: backend); move to a synced store if the
// owner ever wants a second device.
export const STORAGE_KEY = "wont:v1";
export const CURRENT_VERSION = 1;

/**
 * Migration hook: turns whatever is stored into the current shape. Bump CURRENT_VERSION and add a
 * step here when the shape changes; anything unreadable becomes a fresh state.
 */
export function migrate(raw: unknown): WontState {
  if (!raw || typeof raw !== "object") return emptyState();
  const s = raw as Partial<WontState> & { version?: number };
  // Future steps go here, e.g. if (s.version === 1) s = fromV1(s);
  // shortcut: an unknown version starts fresh instead of keeping the old data aside; add a
  // backup copy before the first real migration ships.
  if (s.version !== CURRENT_VERSION) return emptyState();
  return {
    version: 1,
    habits: Array.isArray(s.habits) ? s.habits : [],
    logs: s.logs && typeof s.logs === "object" ? s.logs : {},
    comebacksSeen: s.comebacksSeen && typeof s.comebacksSeen === "object" ? s.comebacksSeen : {},
    introSeen: !!s.introSeen,
  };
}

/** The stored state right now, read straight from localStorage (for one-off checks in effects). */
export function peekState(): WontState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return migrate(raw === null ? null : JSON.parse(raw));
  } catch {
    return emptyState();
  }
}

// The clock: re-checks the day every 30 s and when the tab comes back, so a tab left open
// overnight turns the day by itself.
function subscribeClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 30_000);
  document.addEventListener("visibilitychange", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onChange);
    window.removeEventListener("focus", onChange);
  };
}

/** Today's DayKey, or null during server render (render nothing day-based until it's set). */
export function useToday(): DayKey | null {
  return useSyncExternalStore(subscribeClock, () => todayKey(), () => null);
}

declare global {
  interface Window {
    wontSeed?: (name: SeedName) => void;
  }
}

/**
 * Everything the UI needs. Day-scoped actions default to today; pass a day to change yesterday.
 * Seeding for tests: open the app with ?seed=<name>, or call window.wontSeed("<name>").
 */
export function useWont() {
  const [raw, setRaw] = useLocalStorage<unknown>(STORAGE_KEY, null);
  const state = useMemo(() => migrate(raw), [raw]);
  const today = useToday();

  const update = useCallback(
    (fn: (s: WontState) => WontState) => setRaw((prev: unknown) => fn(migrate(prev))),
    [setRaw],
  );

  // Seeding for user tests (plan.md, "Seeding").
  useEffect(() => {
    window.wontSeed = (name) => {
      if (!isSeedName(name)) throw new Error(`Unknown seed. Try: ${SEED_NAMES.join(", ")}`);
      setRaw(seed(name, Date.now()));
    };
    const url = new URL(window.location.href);
    const name = url.searchParams.get("seed");
    if (name && isSeedName(name)) {
      setRaw(seed(name, Date.now()));
      url.searchParams.delete("seed");
      window.history.replaceState(null, "", url);
    }
    return () => {
      delete window.wontSeed;
    };
  }, [setRaw]);

  const day = (d?: DayKey) => d ?? todayKey();

  return {
    state,
    /** null until mounted in the browser. */
    today,
    hydrated: today !== null,
    toggleKept: (habitId: string, d?: DayKey) =>
      update((s) => A.toggleKept(s, habitId, day(d), todayKey(), Date.now())),
    logSlip: (habitId: string, size: SlipSize, d?: DayKey) =>
      update((s) => A.logSlip(s, habitId, day(d), size, todayKey(), Date.now())),
    undoSlip: (habitId: string, d?: DayKey) =>
      update((s) => A.undoSlip(s, habitId, day(d), todayKey())),
    logUrge: (habitId: string) => update((s) => A.logUrge(s, habitId, Date.now())),
    undoUrge: (habitId: string, d?: DayKey) =>
      update((s) => A.undoUrge(s, habitId, day(d), todayKey())),
    addHabit: (draft: HabitDraft) => update((s) => A.addHabit(s, draft, Date.now())),
    updateHabit: (habitId: string, patch: HabitPatch) =>
      update((s) => A.updateHabit(s, habitId, patch)),
    deleteHabit: (habitId: string) => update((s) => A.deleteHabit(s, habitId)),
    markComebackSeen: (habitId: string, id: DayKey) =>
      update((s) => A.markComebackSeen(s, habitId, id)),
    setIntroSeen: (seen: boolean) => update((s) => A.setIntroSeen(s, seen)),
    seed: (name: SeedName) => setRaw(seed(name, Date.now())),
  };
}
