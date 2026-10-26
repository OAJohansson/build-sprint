import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logSlip, markComebackSeen, toggleKept } from "./actions";
import { addDays, dayOf, dayRange, todayKey, type DayKey } from "./day";
import type { BuildHabit, DayLog, StopHabit, WontState } from "./habits";
import {
  cleanDayCount,
  dayStatus,
  dueComeback,
  isComebackDay,
  rollingRate,
  weekStrip,
} from "./progress";
import { seed } from "./seed";

const build = (startDay: DayKey, id = "up"): BuildHabit => ({
  id, kind: "build", name: "Up by 7:00", anchor: "alarm", action: "get up", goal: "up by 7:00",
  createdAt: 0, startDay, colour: "c0", order: 0,
});
const stop = (startDay: DayKey, id = "pouches"): StopHabit => ({
  id, kind: "stop", name: "Nicotine pouches", trigger: "coffee", friction: "car", replacement: "gum",
  createdAt: 0, startDay, colour: "c4", order: 1,
});
const kept = (...days: DayKey[]) =>
  Object.fromEntries(days.map((d) => [d, { kept: 1 } as DayLog]));
const clean = (...days: DayKey[]) =>
  Object.fromEntries(days.map((d) => [d, { clean: 1 } as DayLog]));
const at = (y: number, mo: number, d: number, h: number, mi = 0) => {
  vi.setSystemTime(new Date(y, mo - 1, d, h, mi));
  return Date.now();
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("rolling rate", () => {
  it("normal week: one unlogged day dents it to 6 of the last 7; today waits until logged", () => {
    at(2026, 10, 21, 8);
    const today = todayKey();
    const h = build("2026-10-01");
    const days = kept(...dayRange("2026-10-14", "2026-10-20").filter((d) => d !== "2026-10-17"));
    expect(rollingRate(h, days, today)).toMatchObject({ kept: 6, of: 7 });
    expect(rollingRate(h, days, today).days[6]).toBe("2026-10-20");
    // Logging today slides the window to end today.
    const withToday = { ...days, [today]: { kept: 2 } };
    const r = rollingRate(h, withToday, today);
    expect(r).toMatchObject({ kept: 6, of: 7 });
    expect(r.days[0]).toBe("2026-10-15");
  });

  it("empty history: 0 of the last 7 for an old habit, 0 of 0 on the first day", () => {
    at(2026, 10, 21, 8);
    expect(rollingRate(build("2026-10-01"), undefined, todayKey())).toMatchObject({ kept: 0, of: 7 });
    expect(rollingRate(build("2026-10-21"), undefined, todayKey())).toMatchObject({ kept: 0, of: 0 });
  });

  it("a habit younger than 7 days uses its age", () => {
    at(2026, 10, 21, 8);
    const h = build("2026-10-18");
    expect(rollingRate(h, kept("2026-10-18", "2026-10-19", "2026-10-20"), todayKey())).toMatchObject({ kept: 3, of: 3 });
  });

  it("first day left unlogged is a grace day: not counted, not a miss", () => {
    at(2026, 10, 21, 8);
    const h = build("2026-10-19");
    const days = kept("2026-10-20");
    expect(rollingRate(h, days, todayKey())).toMatchObject({ kept: 1, of: 1 });
    expect(dayStatus(h, days, "2026-10-19", todayKey())).toBe("not-logged");
    expect(isComebackDay(h, days, "2026-10-20", todayKey())).toBe(false);
  });

  it("a slip in the middle dents the stop habit's rate but never resets the clean total", () => {
    at(2026, 10, 22, 8);
    const h = stop("2026-10-15");
    const days = { ...clean(...dayRange("2026-10-15", "2026-10-21")), "2026-10-18": { slip: { size: "1" as const, at: 1 } } };
    expect(rollingRate(h, days, todayKey())).toMatchObject({ kept: 6, of: 7 });
    expect(cleanDayCount(h, days, todayKey())).toBe(6);
  });
});

describe("clean days and day status", () => {
  it("a clean day only counts once it is over", () => {
    const h = stop("2026-10-20");
    let s: WontState = { version: 1, habits: [h], logs: { pouches: clean("2026-10-20", "2026-10-21") }, comebacksSeen: {}, introSeen: true };
    const now = at(2026, 10, 22, 21);
    s = toggleKept(s, "pouches", todayKey(), todayKey(), now);
    expect(dayStatus(h, s.logs.pouches, "2026-10-22", todayKey())).toBe("clean-so-far");
    expect(cleanDayCount(h, s.logs.pouches, todayKey())).toBe(2);
    at(2026, 10, 23, 8);
    expect(dayStatus(h, s.logs.pouches, "2026-10-22", todayKey())).toBe("kept");
    expect(cleanDayCount(h, s.logs.pouches, todayKey())).toBe(3);
  });

  it("a slip after a clean tap the same day overrides it", () => {
    const h = stop("2026-10-20");
    let s: WontState = { version: 1, habits: [h], logs: {}, comebacksSeen: {}, introSeen: true };
    s = toggleKept(s, "pouches", "2026-10-23", "2026-10-23", at(2026, 10, 23, 20));
    s = logSlip(s, "pouches", todayKey(), "2", todayKey(), at(2026, 10, 23, 23));
    expect(dayStatus(h, s.logs.pouches, "2026-10-23", todayKey())).toBe("slip");
    at(2026, 10, 24, 8);
    expect(cleanDayCount(h, s.logs.pouches, todayKey())).toBe(0);
    expect(dayStatus(h, s.logs.pouches, "2026-10-23", todayKey())).toBe("slip");
    expect(s.logs.pouches["2026-10-23"].slip?.size).toBe("2");
  });

  it("statuses: pending today, not logged once over, nothing before the start", () => {
    at(2026, 10, 22, 8);
    const h = build("2026-10-20");
    expect(dayStatus(h, undefined, "2026-10-22", todayKey())).toBe("pending");
    expect(dayStatus(h, undefined, "2026-10-21", todayKey())).toBe("not-logged");
    expect(dayStatus(h, undefined, "2026-10-19", todayKey())).toBe("before-start");
    expect(dayStatus(h, undefined, "2026-10-23", todayKey())).toBe("future");
  });
});

describe("comeback", () => {
  it("a kept day right after a missed day is a comeback; the message is due until then", () => {
    at(2026, 10, 22, 8);
    const h = build("2026-10-15");
    const days = kept("2026-10-19", "2026-10-20");
    expect(dueComeback(h, days, todayKey())).toMatchObject({ id: "2026-10-21", missed: ["2026-10-21"], lastKind: "unlogged" });
    const after = { ...days, "2026-10-22": { kept: 1 } };
    expect(isComebackDay(h, after, "2026-10-22", todayKey())).toBe(true);
    expect(isComebackDay(h, after, "2026-10-20", todayKey())).toBe(false);
    expect(dueComeback(h, after, todayKey())).toBeNull();
  });

  it("two misses, no visit in between: one message for the whole run; the first kept day is the comeback", () => {
    const h = build("2026-10-15");
    const days = kept(...dayRange("2026-10-15", "2026-10-23"));
    at(2026, 10, 26, 7, 5); // Monday: Saturday and Sunday missed, app not opened since Friday
    expect(dueComeback(h, days, todayKey())).toMatchObject({ id: "2026-10-25", missed: ["2026-10-24", "2026-10-25"] });
    const mon = { ...days, "2026-10-26": { kept: 1 } };
    expect(dueComeback(h, mon, todayKey())).toBeNull();
    expect(isComebackDay(h, mon, "2026-10-26", todayKey())).toBe(true);
    expect(isComebackDay(h, mon, "2026-10-25", todayKey())).toBe(false);
  });

  it("N1: seen mid-run, then the run grows while away: due again on the return", () => {
    const h = build("2026-10-15");
    const days = kept(...dayRange("2026-10-15", "2026-10-23"));
    const s0: WontState = { version: 1, habits: [h], logs: { up: days }, comebacksSeen: {}, introSeen: true };
    at(2026, 10, 25, 9); // Sunday: opened, Saturday missed, message seen, nothing logged
    const sun = dueComeback(h, days, todayKey());
    const s1 = markComebackSeen(s0, h.id, sun!.id);
    at(2026, 10, 28, 8); // Wednesday, back after staying away: run is Sat to Tue
    const wed = dueComeback(h, days, todayKey(), s1.comebacksSeen[h.id]);
    expect(wed).toMatchObject({ id: "2026-10-27", lastMissed: "2026-10-27" });
    expect(wed?.missed).toHaveLength(4);
    // Month end: seen on 31 Oct, away, back on 2 Nov at 02:00 (still 1 Nov): due again.
    const s2 = markComebackSeen(s1, h.id, "2026-10-30");
    at(2026, 11, 2, 2);
    expect(dueComeback(h, days, todayKey(), s2.comebacksSeen[h.id])).toMatchObject({ id: "2026-10-31" });
  });

  it("N1: once seen, not shown again the same day (also across midnight before 04:00)", () => {
    const h = build("2026-10-15");
    const days = kept(...dayRange("2026-10-15", "2026-10-23"));
    at(2026, 10, 25, 9);
    const due = dueComeback(h, days, todayKey());
    const seen = markComebackSeen({ version: 1, habits: [h], logs: {}, comebacksSeen: {}, introSeen: true }, h.id, due!.id).comebacksSeen[h.id];
    at(2026, 10, 25, 22);
    expect(dueComeback(h, days, todayKey(), seen)).toBeNull();
    at(2026, 10, 26, 3, 30); // 03:30 still belongs to Sunday
    expect(dueComeback(h, days, todayKey(), seen)).toBeNull();
  });

  it("a slip yesterday makes a comeback due, and today's clean tap is the comeback", () => {
    at(2026, 10, 24, 8);
    const h = stop("2026-10-20");
    const days = { ...clean("2026-10-20", "2026-10-21", "2026-10-22"), "2026-10-23": { clean: 1, slip: { size: "1" as const, at: 2 } } };
    expect(dueComeback(h, days, todayKey())).toMatchObject({ id: "2026-10-23", lastKind: "slip" });
    const today = { ...days, "2026-10-24": { clean: 3 } };
    expect(isComebackDay(h, today, "2026-10-24", todayKey())).toBe(true);
  });

  it("F2: resumed without a reload over several days, unlogged days are never called slips", () => {
    const h = stop("2026-10-15");
    // Clean to Friday, a slip on Saturday 24 Oct, then nothing logged (the tab stays open).
    const days = {
      ...clean(...dayRange("2026-10-15", "2026-10-23")),
      "2026-10-24": { slip: { size: "1" as const, at: 1 } },
    };
    at(2026, 10, 25, 9); // Sunday: the named day is Saturday, a real slip
    expect(dueComeback(h, days, todayKey())).toMatchObject({ lastMissed: "2026-10-24", lastKind: "slip" });
    // Monday to Wednesday, same open tab (the clock moves, nothing is marked seen): the run grows
    // and the named day is the latest unlogged one, so the message must not say "slip".
    for (const [d, last] of [[26, "2026-10-25"], [27, "2026-10-26"], [28, "2026-10-27"]] as const) {
      at(2026, 10, d, 8);
      const due = dueComeback(h, days, todayKey());
      expect(due).toMatchObject({ id: last, lastMissed: last, lastKind: "unlogged" });
      expect(days[due!.lastMissed as keyof typeof days]).toBeUndefined();
    }
    // Month end: a slip on 31 Oct still named as a slip on 1 Nov, after midnight but before 04:00.
    const oct = { ...clean(...dayRange("2026-10-15", "2026-10-30")), "2026-10-31": { slip: { size: "2" as const, at: 1 } } };
    at(2026, 11, 2, 2); // 02:00 on 2 Nov still belongs to 1 Nov
    expect(dueComeback(h, oct, todayKey())).toMatchObject({ lastMissed: "2026-10-31", lastKind: "slip" });
  });

  it("first day ever: no comeback and no message", () => {
    at(2026, 10, 22, 21);
    const h = build("2026-10-22");
    const days = kept("2026-10-22");
    expect(isComebackDay(h, days, "2026-10-22", todayKey())).toBe(false);
    expect(dueComeback(h, undefined, todayKey())).toBeNull();
    at(2026, 10, 23, 8); // created yesterday and never logged: grace, no message
    expect(dueComeback(h, undefined, todayKey())).toBeNull();
  });
});

describe("plan S4: a week with two misses, across the 25 Oct clock change", () => {
  it("bedtime after midnight, 5 of 7 after Monday's comeback, 4 of 7 after an unlogged Tuesday", () => {
    const up = build("2026-10-12");
    const read = build("2026-10-12", "read");
    let s: WontState = {
      version: 1, habits: [up, read], logs: { up: kept(...dayRange("2026-10-12", "2026-10-21")) },
      comebacksSeen: {}, introSeen: true,
    };
    // Thu 22 Oct 00:30: the read log lands on Wednesday 21.
    let now = at(2026, 10, 22, 0, 30);
    s = toggleKept(s, "read", dayOf(now), todayKey(), now);
    expect(Object.keys(s.logs.read)).toEqual(["2026-10-21"]);
    // Wake-up kept Thu and Fri; Sat 24 and Sun 25 missed.
    now = at(2026, 10, 22, 7);
    s = toggleKept(s, "up", todayKey(), todayKey(), now);
    now = at(2026, 10, 23, 7);
    s = toggleKept(s, "up", todayKey(), todayKey(), now);
    // Mon 26 Oct 07:05.
    now = at(2026, 10, 26, 7, 5);
    const due = dueComeback(up, s.logs.up, todayKey());
    expect(due?.missed).toEqual(["2026-10-24", "2026-10-25"]);
    s = markComebackSeen(s, "up", due!.id);
    s = toggleKept(s, "up", todayKey(), todayKey(), now);
    expect(rollingRate(up, s.logs.up, todayKey())).toMatchObject({ kept: 5, of: 7 });
    expect(isComebackDay(up, s.logs.up, "2026-10-26", todayKey())).toBe(true);
    expect(isComebackDay(up, s.logs.up, "2026-10-25", todayKey())).toBe(false);
    // Tuesday skipped entirely; Wed 28 08:00.
    at(2026, 10, 28, 8);
    expect(rollingRate(up, s.logs.up, todayKey())).toMatchObject({ kept: 4, of: 7 });
    expect(dayStatus(up, s.logs.up, "2026-10-27", todayKey())).toBe("not-logged");
    expect(dueComeback(up, s.logs.up, todayKey(), s.comebacksSeen.up)?.id).toBe("2026-10-27");
    // Sun 1 Nov 00:30: lands on Saturday 31 Oct.
    now = at(2026, 11, 1, 0, 30);
    s = toggleKept(s, "read", dayOf(now), todayKey(), now);
    expect(s.logs.read["2026-10-31"]).toBeDefined();
  });
});

describe("week strip", () => {
  it("share kept per day; today counts what is logged so far; days before any habit are null", () => {
    at(2026, 10, 24, 12);
    const habits = [build("2026-10-20"), stop("2026-10-22")];
    const logs = {
      up: kept("2026-10-20", "2026-10-22", "2026-10-24"),
      pouches: { ...clean("2026-10-22"), "2026-10-23": { slip: { size: "1" as const, at: 1 } } },
    };
    const strip = weekStrip(habits, logs, todayKey());
    expect(strip.map((d) => d.day)).toEqual(dayRange(addDays("2026-10-24", -6), "2026-10-24"));
    expect(strip.map((d) => d.share)).toEqual([null, null, 1, 0, 1, 0, 0.5]);
  });
});

describe("seeds", () => {
  it("owner-today matches the prototype numbers", () => {
    at(2026, 10, 24, 9);
    const s = seed("owner-today", Date.now());
    const [up, write, , , pouches] = s.habits;
    const today = todayKey();
    expect(rollingRate(up, s.logs.up, today)).toMatchObject({ kept: 5, of: 7 });
    expect(rollingRate(write, s.logs.write, today)).toMatchObject({ kept: 3, of: 5 });
    expect(dueComeback(write, s.logs.write, today)).not.toBeNull();
    expect(cleanDayCount(pouches, s.logs.pouches, today)).toBe(2);
  });

  it("week-two-misses has exactly one comeback message", () => {
    at(2026, 10, 26, 7, 5);
    const s = seed("week-two-misses", Date.now());
    const due = s.habits.map((h) => dueComeback(h, s.logs[h.id], todayKey())).filter(Boolean);
    expect(due).toHaveLength(1);
    expect(due[0]?.missed).toEqual(["2026-10-24", "2026-10-25"]);
  });
});
