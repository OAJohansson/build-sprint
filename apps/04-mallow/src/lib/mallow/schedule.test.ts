import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Day } from "./data";
import { newMedicine, stopMedicine } from "./history";
import { duePlan, planDate, tickDose } from "./schedule";
import { withDay, type Store } from "./store";

const base = { strength: "", howTo: "", asNeeded: "" };
const oil = newMedicine({ ...base, name: "Oil", form: "Oil", amount: 0.5, when: ["Morning", "Bedtime"] }, "2026-09-01", "oil");
const vape = newMedicine({ ...base, name: "Vape", form: "Vape", amount: 2, when: ["When needed"] }, "2026-09-01", "vape");
const store = (days: Day[] = [], meds = [oil, vape]): Store => ({
  version: 2, condition: "", baseline: {}, meds, tracked: ["sleep"], doctor: "", past: [], next: "", days,
});
const at = (date: string, time: string) => ({ date, time });
const statuses = (s: Store, now: { date: string; time: string }) => duePlan(s, now).map((d) => `${d.slot}:${d.status}`);

describe("what's due now", () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(new Date(2026, 9, 20, 12, 0)));
  afterEach(() => vi.useRealTimers());

  it("a normal morning: morning due now, bedtime later, as-needed never scheduled", () => {
    expect(statuses(store(), at("2026-10-20", "08:00"))).toEqual(["Morning:now", "Bedtime:later"]);
  });

  it("an unticked slot becomes 'not taken' once its window passes", () => {
    expect(statuses(store(), at("2026-10-20", "13:00"))).toEqual(["Morning:not taken", "Bedtime:later"]);
  });

  it("a ticked dose shows as taken", () => {
    const now = at("2026-10-20", "08:10");
    const t = tickDose(duePlan(store(), now)[0], now);
    const s = withDay(store(), t.date, (d) => ({ ...d, doses: [t.dose] }));
    expect(statuses(s, at("2026-10-20", "13:00"))).toEqual(["Morning:taken", "Bedtime:later"]);
  });

  it("just before midnight bedtime is due; just after midnight it is still last night's", () => {
    expect(statuses(store(), at("2026-10-20", "23:59"))).toEqual(["Morning:not taken", "Bedtime:now"]);
    expect(planDate(at("2026-10-21", "00:30"))).toBe("2026-10-20");
    expect(statuses(store(), at("2026-10-21", "00:30"))).toEqual(["Morning:not taken", "Bedtime:now"]);
  });

  it("a bedtime dose ticked at 00:30 is stored on the real date and counts for last night", () => {
    const now = at("2026-10-21", "00:30");
    const bedtime = duePlan(store(), now)[1];
    const t = tickDose(bedtime, now);
    expect(t.date).toBe("2026-10-21");
    const s = withDay(store(), t.date, (d) => ({ ...d, doses: [t.dose] }));
    expect(statuses(s, at("2026-10-21", "01:00"))).toEqual(["Morning:not taken", "Bedtime:taken"]);
    // At 04:00 a new plan day starts, and last night's dose doesn't count for it.
    expect(statuses(s, at("2026-10-21", "04:00"))).toEqual(["Morning:now", "Bedtime:later"]);
  });

  it("a stopped medicine and one not started yet aren't due", () => {
    const later = newMedicine({ ...base, name: "New", form: "Capsule", amount: 1, when: ["Evening"] }, "2026-10-25", "new");
    expect(statuses(store([], [stopMedicine(oil, "2026-10-20"), later]), at("2026-10-20", "18:00"))).toEqual([]);
  });

  it("the amount due follows the prescription on that day", () => {
    expect(duePlan(store(), at("2026-10-20", "08:00"))[0].amount).toBe(0.5);
  });

  it("no medicines: nothing due", () => {
    expect(duePlan(store([], []), at("2026-10-20", "08:00"))).toEqual([]);
  });
});
