import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanTzOffset, dayRange, monthRange, summarise, type CostRow } from "./periods";

const UTC8 = -480; // getTimezoneOffset() in Singapore / Perth
const q = (iso: string, costUsd = 0.01): CostRow[] => [
  { createdAt: iso, costUsd: 0, counted: true, role: "user" },
  { createdAt: iso, costUsd, counted: false, role: "assistant" },
];

describe("dayRange / monthRange in local time", () => {
  it("a local day in UTC+8 starts at 16:00 UTC the day before", () => {
    const r = dayRange(new Date("2026-10-24T03:00:00Z"), UTC8);
    expect(r.start.toISOString()).toBe("2026-10-23T16:00:00.000Z");
    expect(r.end.toISOString()).toBe("2026-10-24T16:00:00.000Z");
  });
  it("month end: 31 Oct 23:30 local is still October; the next local minute is November", () => {
    const oct = monthRange(new Date("2026-10-31T15:30:00Z"), UTC8);
    expect(oct.start.toISOString()).toBe("2026-09-30T16:00:00.000Z");
    expect(oct.end.toISOString()).toBe("2026-10-31T16:00:00.000Z");
    expect(monthRange(new Date("2026-10-31T16:00:00Z"), UTC8).start.toISOString()).toBe("2026-10-31T16:00:00.000Z");
  });
  it("year end rolls into January", () => {
    expect(monthRange(new Date("2026-12-31T20:00:00Z"), 0).end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
  it("junk offsets fall back to UTC; huge ones are clamped", () => {
    expect(cleanTzOffset("abc")).toBe(0);
    expect(cleanTzOffset(undefined)).toBe(0);
    expect(cleanTzOffset("-480")).toBe(-480);
    expect(cleanTzOffset(99999)).toBe(720);
  });
});

describe("summarise: daily count and the 50/day warning", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("empty history: $0, no questions, no warning", () => {
    vi.setSystemTime(new Date("2026-10-24T03:00:00Z"));
    expect(summarise([], new Date(), UTC8)).toMatchObject({ todayUsd: 0, monthUsd: 0, questionsToday: 0, warning: false, month: "October" });
  });

  it("warns from the 50th question of the local day, counting only person-started questions", () => {
    vi.setSystemTime(new Date("2026-10-24T10:00:00Z")); // 18:00 local
    const rows = Array.from({ length: 49 }, (_, i) => q(new Date(Date.UTC(2026, 9, 24, 1, i)).toISOString())).flat();
    rows.push({ createdAt: "2026-10-24T05:00:00Z", costUsd: 0.002, counted: false, role: "user" }); // background learning
    expect(summarise(rows, new Date(), UTC8)).toMatchObject({ questionsToday: 49, warning: false });
    rows.push(...q("2026-10-24T09:59:00Z"));
    const s = summarise(rows, new Date(), UTC8);
    expect(s.questionsToday).toBe(50);
    expect(s.warning).toBe(true);
    expect(s.todayUsd).toBeCloseTo(0.502, 4);
  });

  it("across local midnight: yesterday's questions stop counting, the month keeps their cost", () => {
    const rows = [...q("2026-10-23T15:59:00Z", 0.05), ...q("2026-10-23T16:01:00Z", 0.02)]; // 23:59 and 00:01 local
    vi.setSystemTime(new Date("2026-10-23T16:30:00Z")); // 00:30 local on the 24th
    expect(summarise(rows, new Date(), UTC8)).toMatchObject({ questionsToday: 1, todayUsd: 0.02, monthUsd: 0.07 });
  });

  it("a new month resets Month and Today", () => {
    const rows = q("2026-10-31T15:00:00Z", 0.3); // 31 Oct 23:00 local
    vi.setSystemTime(new Date("2026-10-31T16:05:00Z")); // 1 Nov 00:05 local
    expect(summarise(rows, new Date(), UTC8)).toMatchObject({ questionsToday: 0, todayUsd: 0, monthUsd: 0, month: "November" });
  });
});
