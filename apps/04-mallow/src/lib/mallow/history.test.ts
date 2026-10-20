import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Medicine } from "./data";
import { activeOn, amountOn, newMedicine, stopMedicine, treatmentStart, updateMedicine } from "./history";
import { migrate } from "./store";

const oil = { name: "Balanced oil", form: "Oil" as const, strength: "", amount: 0.5, when: ["Bedtime"], howTo: "", asNeeded: "" };

describe("medicine history", () => {
  it("starts with the starting amount", () => {
    const m = newMedicine(oil, "2026-09-03", "a");
    expect(m.changes).toEqual([{ date: "2026-09-03", amount: 0.5 }]);
    expect(activeOn(m, "2026-09-02")).toBe(false);
    expect(activeOn(m, "2026-09-03")).toBe(true);
  });

  it("records an amount change from that day on, and the amount on any day", () => {
    const m = updateMedicine(newMedicine(oil, "2026-09-03", "a"), { ...oil, amount: 0.7 }, "2026-10-01");
    expect(m.changes).toHaveLength(2);
    expect(amountOn(m, "2026-09-30")).toBe(0.5);
    expect(amountOn(m, "2026-10-01")).toBe(0.7);
    expect(m.amount).toBe(0.7);
  });

  it("a second change on the same day replaces the first", () => {
    let m = updateMedicine(newMedicine(oil, "2026-09-03", "a"), { ...oil, amount: 0.7 }, "2026-10-01");
    m = updateMedicine(m, { ...oil, amount: 0.6 }, "2026-10-01");
    expect(m.changes).toEqual([{ date: "2026-09-03", amount: 0.5 }, { date: "2026-10-01", amount: 0.6 }]);
  });

  it("changing the amount on the start day fixes the starting amount", () => {
    const m = updateMedicine(newMedicine(oil, "2026-09-03", "a"), { ...oil, amount: 0.6 }, "2026-09-03");
    expect(m.changes).toEqual([{ date: "2026-09-03", amount: 0.6 }]);
  });

  it("editing other fields leaves the history alone", () => {
    const m = updateMedicine(newMedicine(oil, "2026-09-03", "a"), { ...oil, howTo: "Under the tongue" }, "2026-10-01");
    expect(m.changes).toHaveLength(1);
  });

  it("moving the start date moves the starting amount with it", () => {
    const m = updateMedicine(newMedicine(oil, "2026-09-03", "a"), { ...oil, startDate: "2026-08-20" }, "2026-09-03");
    expect(m.changes).toEqual([{ date: "2026-08-20", amount: 0.5 }]);
  });

  it("stopping keeps the history; active up to the day before the stop", () => {
    const m = stopMedicine(newMedicine(oil, "2026-09-03", "a"), "2026-10-31");
    expect(activeOn(m, "2026-10-30")).toBe(true);
    expect(activeOn(m, "2026-10-31")).toBe(false);
    expect(amountOn(m, "2026-10-30")).toBe(0.5);
  });

  it("treatment starts with the earliest medicine; none when there are none", () => {
    expect(treatmentStart([newMedicine(oil, "2026-09-03", "a"), newMedicine(oil, "2026-08-01", "b")])).toBe("2026-08-01");
    expect(treatmentStart([])).toBeUndefined();
  });
});

describe("migration from v1", () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(new Date(2026, 9, 20, 12, 0)));
  afterEach(() => vi.useRealTimers());

  const v1Med = { id: "oil", name: "Balanced oil", form: "Oil" as const, strength: "", amount: 0.5, when: ["Bedtime"] };
  const v1 = (over = {}) => ({
    meds: [v1Med, { ...v1Med, id: "flower", form: "Flower" as const, amount: 0.1, when: ["When needed"] }],
    tracked: ["pain"],
    doctor: "",
    past: ["2026-09-10"],
    next: "",
    days: [
      { date: "2026-09-01", logged: false, grades: {}, doses: [{ time: "21:00", med: "oil", amount: 0.5 }], side: [] },
      { date: "2026-09-15", logged: false, grades: {}, doses: [{ time: "15:00", med: "flower", amount: 0.1 }], side: [] },
    ],
    ...over,
  });

  it("starts each medicine at the first appointment or its first dose, whichever is first", () => {
    const s = migrate(v1() as never);
    expect(s.version).toBe(2);
    expect(s.meds[0].startDate).toBe("2026-09-01"); // dose before the appointment
    expect(s.meds[1].startDate).toBe("2026-09-10"); // appointment before the dose
    expect(s.meds[0].changes).toEqual([{ date: "2026-09-01", amount: 0.5 }]);
    expect(s.baseline).toEqual({});
    expect(s.condition).toBe("");
  });

  it("falls back to today with no appointments and no doses", () => {
    const s = migrate(v1({ past: [], days: [] }) as never);
    expect(s.meds[0].startDate).toBe("2026-10-20");
  });

  it("leaves v2 data untouched", () => {
    const s = migrate(v1() as never);
    expect(migrate(s)).toBe(s);
    const m: Medicine = s.meds[0];
    expect(m.howTo).toBe("");
  });
});
