import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addDays, type Day } from "./data";
import { newMedicine, stopMedicine, updateMedicine } from "./history";
import type { Store } from "./store";
import { average7, compare, medicineBars, plainLine, rangeStart, series } from "./trend";

const base = { strength: "", howTo: "", asNeeded: "", when: ["Bedtime"] };
const oil = newMedicine({ ...base, name: "Balanced oil", form: "Oil", amount: 0.5 }, "2026-09-03", "oil");
const day = (date: string, sleep?: number): Day => ({ date, logged: sleep !== undefined, grades: sleep !== undefined ? { sleep } : {}, doses: [], side: [] });
const store = (days: Day[], over: Partial<Store> = {}): Store => ({
  version: 2, condition: "", baseline: {}, meds: [oil], tracked: ["sleep"], doctor: "", past: [], next: "", days, ...over,
});
// n consecutive days from `from`, each with grade g (or a gap where g is undefined)
const run = (from: string, grades: (number | undefined)[]) => grades.map((g, i) => day(addDays(from, i), g)).filter((d) => d.logged);

describe("7-day average", () => {
  it("averages the logged days in the window", () => {
    expect(average7([2, 2, 1, 1, undefined, 1, 0])).toBeCloseTo(7 / 6);
  });
  it("is a gap with fewer than 3 check-ins, never a zero", () => {
    expect(average7([undefined, 2, undefined, undefined, undefined, 1, undefined])).toBeUndefined();
    expect(average7([])).toBeUndefined();
  });
  it("leaves missed days as gaps in the series and uses days before the range for the first averages", () => {
    const s = store(run("2026-10-01", [2, 2, 2, 2, 2, 2, 2, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 1]));
    const pts = series(s, "sleep", "2026-10-07", "2026-10-15");
    expect(pts[0]).toEqual({ date: "2026-10-07", grade: 2, avg: 2 }); // window 1–7 Oct
    expect(pts[1].grade).toBeUndefined();
    expect(pts[1].avg).toBe(2); // 2–8 Oct still has six check-ins
    expect(pts.at(-1)!.avg).toBeUndefined(); // 9–15 Oct has one
  });
  it("crosses a month end without losing days", () => {
    const s = store(run("2026-09-28", [3, 3, 3, 1, 1, 1, 1]));
    const pts = series(s, "sleep", "2026-09-28", "2026-10-04");
    expect(pts).toHaveLength(7);
    expect(pts.at(-1)!.avg).toBeCloseTo(13 / 7);
  });
  it("empty history: every day a gap", () => {
    expect(series(store([]), "sleep", "2026-10-01", "2026-10-03").every((p) => p.grade === undefined && p.avg === undefined)).toBe(true);
  });
});

describe("comparisons", () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(new Date(2026, 9, 20, 12, 0)));
  afterEach(() => vi.useRealTimers());

  it("compares a range with the same number of days before it, and with before treatment", () => {
    const s = store([...run("2026-09-22", Array(14).fill(2)), ...run("2026-10-06", Array(14).fill(1))], { baseline: { sleep: 3 } });
    const c = compare(s, "sleep", "2026-10-06", "2026-10-19");
    expect(c).toMatchObject({ now: 1, before: 2, baseline: 3, vsBefore: "Better", vsBaseline: "Better" });
  });
  it("says 'Not enough yet' without a baseline or an earlier period", () => {
    const c = compare(store(run("2026-10-06", [1, 1])), "sleep", "2026-10-06", "2026-10-19");
    expect(c.vsBefore).toBe("Not enough yet");
    expect(c.vsBaseline).toBe("Not enough yet");
  });
  it("ranges: fixed day counts, and 'since starting' begins at the first medicine", () => {
    const s = store([]);
    expect(rangeStart(s, "4w", "2026-10-31")).toBe("2026-10-04");
    expect(rangeStart(s, "3m", "2026-10-31")).toBe("2026-08-02"); // 91 days including today
    expect(rangeStart(s, "all", "2026-10-31")).toBe("2026-09-03");
    expect(rangeStart(store([], { meds: [] }), "all", "2026-10-31")).toBe("2026-10-31");
  });
});

describe("plain line", () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(new Date(2026, 9, 20, 12, 0)));
  afterEach(() => vi.useRealTimers());

  it("names the first medicine, the usual word and the baseline, without claims", () => {
    const s = store(run("2026-09-03", Array(30).fill(1)), { baseline: { sleep: 2 } });
    const line = plainLine(s, "sleep")!;
    expect(line).toBe("Since starting Balanced oil (3 Sep): sleep mostly a bit broken. Before treatment: poorly.");
    expect(line).not.toMatch(/work|effective|because/i);
  });
  it("says 'treatment' when two medicines started together, and nothing with no check-ins", () => {
    const vape = newMedicine({ ...base, name: "Vape", form: "Vape", amount: 2 }, "2026-09-03", "vape");
    expect(plainLine(store(run("2026-09-03", [1, 1, 1]), { meds: [oil, vape] }), "sleep")).toMatch(/^Since starting treatment/);
    expect(plainLine(store([]), "sleep")).toBeUndefined();
    expect(plainLine(store(run("2026-09-03", [1, 1])), "sleep")).toBeUndefined(); // no verdict from two days
  });
});

describe("medicine strip", () => {
  it("clips bars to the range and keeps amount changes inside it", () => {
    const changed = updateMedicine(oil, { ...base, name: "Balanced oil", form: "Oil", amount: 0.7 }, "2026-10-10");
    const vape = stopMedicine(newMedicine({ ...base, name: "Vape", form: "Vape", amount: 2 }, "2026-10-01", "vape"), "2026-10-15");
    const later = newMedicine({ ...base, name: "Later", form: "Capsule", amount: 1 }, "2026-11-01", "later");
    const bars = medicineBars([changed, vape, later], "2026-09-23", "2026-10-20");
    expect(bars.map((b) => [b.med.id, b.from, b.to, b.changes.length])).toEqual([
      ["oil", "2026-09-23", "2026-10-20", 1],
      ["vape", "2026-10-01", "2026-10-14", 0],
    ]);
  });
});
