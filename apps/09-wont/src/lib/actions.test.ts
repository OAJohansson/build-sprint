import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addHabit,
  canEditDay,
  deleteHabit,
  logSlip,
  logUrge,
  toggleKept,
  undoSlip,
  updateHabit,
} from "./actions";
import { todayKey } from "./day";
import type { WontState } from "./habits";
import { emptyState } from "./seed";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const at = (y: number, mo: number, d: number, h: number, mi = 0) => {
  vi.setSystemTime(new Date(y, mo - 1, d, h, mi));
  return Date.now();
};

function withHabits(now: number): WontState {
  let s = addHabit(emptyState(), { kind: "build", name: "Up by 7:00", anchor: "alarm", action: "get up", goal: "up by 7:00" }, now);
  s = addHabit(s, { kind: "stop", name: "Nicotine pouches", trigger: "coffee", friction: "car", replacement: "gum" }, now);
  return s;
}

describe("undo and re-log (today and yesterday only)", () => {
  it("normal case: tap keeps, tap again undoes", () => {
    const now = at(2026, 10, 20, 9);
    let s = withHabits(now);
    const up = s.habits[0].id;
    at(2026, 10, 24, 7);
    s = toggleKept(s, up, todayKey(), todayKey(), Date.now());
    expect(s.logs[up]["2026-10-24"].kept).toBeDefined();
    s = toggleKept(s, up, todayKey(), todayKey(), Date.now());
    expect(s.logs[up]["2026-10-24"]).toBeUndefined();
  });

  it("yesterday can be logged; the day before cannot, nor days before the start", () => {
    const s0 = withHabits(at(2026, 10, 20, 9));
    const up = s0.habits[0];
    at(2026, 10, 24, 8);
    expect(canEditDay(up, "2026-10-24", todayKey())).toBe(true);
    expect(canEditDay(up, "2026-10-23", todayKey())).toBe(true);
    expect(canEditDay(up, "2026-10-22", todayKey())).toBe(false);
    expect(toggleKept(s0, up.id, "2026-10-22", todayKey(), Date.now())).toBe(s0);
    expect(canEditDay(up, "2026-10-19", "2026-10-20")).toBe(false);
  });

  it("at 03:59 'today' is still the evening before, so yesterday means two dates back", () => {
    const s0 = withHabits(at(2026, 10, 20, 9));
    at(2026, 10, 25, 3, 59);
    expect(todayKey()).toBe("2026-10-24");
    expect(canEditDay(s0.habits[0], "2026-10-23", todayKey())).toBe(true);
    expect(canEditDay(s0.habits[0], "2026-10-25", todayKey())).toBe(false);
  });

  it("a slip can be undone and the earlier clean tap counts again", () => {
    let s = withHabits(at(2026, 10, 20, 9));
    const p = s.habits[1].id;
    at(2026, 10, 24, 20);
    s = toggleKept(s, p, todayKey(), todayKey(), Date.now());
    s = logSlip(s, p, todayKey(), "1", todayKey(), Date.now());
    s = logSlip(s, p, todayKey(), "3+", todayKey(), Date.now());
    expect(s.logs[p]["2026-10-24"].slip?.size).toBe("3+");
    s = undoSlip(s, p, todayKey(), todayKey());
    expect(s.logs[p]["2026-10-24"]).toEqual({ clean: expect.any(Number) });
  });

  it("urges are counted on the day they happen (00:30 counts for the evening before)", () => {
    let s = withHabits(at(2026, 10, 20, 9));
    const p = s.habits[1].id;
    s = logUrge(s, p, at(2026, 10, 24, 15));
    s = logUrge(s, p, at(2026, 10, 25, 0, 30));
    expect(s.logs[p]["2026-10-24"].urges).toHaveLength(2);
    expect(logUrge(s, s.habits[0].id, Date.now())).toBe(s); // build habits have no urges
  });
});

describe("habit lifecycle", () => {
  it("first day is the creation day, wording edits keep history, delete removes it", () => {
    let s = addHabit(emptyState(), { kind: "build", name: "Read", anchor: "dinner", action: "read", goal: "10 pages" }, at(2026, 10, 22, 0, 30));
    const id = s.habits[0].id;
    expect(s.habits[0].startDay).toBe("2026-10-21");
    s = toggleKept(s, id, todayKey(), todayKey(), Date.now());
    s = updateHabit(s, id, { goal: "12 pages", startDay: "2020-01-01" } as never);
    expect(s.habits[0]).toMatchObject({ goal: "12 pages", startDay: "2026-10-21", id });
    expect(s.logs[id]["2026-10-21"]).toBeDefined();
    s = deleteHabit(s, id);
    expect(s.habits).toHaveLength(0);
    expect(s.logs[id]).toBeUndefined();
  });
});
