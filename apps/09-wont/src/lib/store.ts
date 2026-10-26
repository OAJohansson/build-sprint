"use client";

// Wont's storage: one versioned JSON object in localStorage via useLocalStorage, plus a clock
// that turns the day without a reload (R10). All rules live in the pure modules; this file only
// wires them to React.
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import * as A from "./actions";
import { todayKey, type DayKey } from "./day";
import type { HabitDraft, HabitPatch, SlipSize, WontState } from "./habits";
import { emptyState, isSeedName, seed, SEED_NAMES, type SeedName } from "./seed";
import { migrate } from "./migrate";
import { recordChange, syncSpace } from "./sync-client";
import { useLocalStorage } from "./use-local-storage";

export { CURRENT_VERSION, migrate } from "./migrate";

// v1.1: localStorage stays the source of truth on each device (local-first); sync-client.ts
// merges it with the other devices in the background (L27).
export const STORAGE_KEY = "wont:v1";
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

  // Every change is stamped for sync (L28) as it's saved; the save itself never waits.
  const update = useCallback(
    (fn: (s: WontState) => WontState) =>
      setRaw((prev: unknown) => {
        const before = migrate(prev);
        const next = fn(before);
        if (next !== before) recordChange(before, next);
        return next;
      }),
    [setRaw],
  );

  // A seed replaces everything, so it would replace the owner's synced board on every device:
  // only allowed on a device that isn't synced or is on the graders' sandbox (decision 0028).
  const applySeed = useCallback(
    (name: SeedName) => {
      if (syncSpace() === "owner") throw new Error("Seeding is off on a device synced to the owner's board.");
      update(() => seed(name, Date.now()));
    },
    [update],
  );

  // Seeding for user tests (plan.md, "Seeding").
  useEffect(() => {
    window.wontSeed = (name) => {
      if (!isSeedName(name)) throw new Error(`Unknown seed. Try: ${SEED_NAMES.join(", ")}`);
      applySeed(name);
    };
    const url = new URL(window.location.href);
    const name = url.searchParams.get("seed");
    if (name && isSeedName(name)) {
      try {
        applySeed(name);
      } catch (e) {
        console.warn(e);
      }
      url.searchParams.delete("seed");
      window.history.replaceState(null, "", url);
    }
    return () => {
      delete window.wontSeed;
    };
  }, [applySeed]);

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
    seed: applySeed,
  };
}
