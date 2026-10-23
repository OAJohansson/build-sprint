import { afterEach, describe, expect, it, vi } from "vitest";
import { byDay, dayLabel } from "./days";

const at = (iso: string) => new Date(iso); // local time (no Z)
const save = (iso: string) => ({ createdAt: at(iso).toISOString() });

describe("dayLabel", () => {
  afterEach(() => vi.useRealTimers());

  it("names today, yesterday and older days (normal case)", () => {
    vi.setSystemTime(at("2026-10-23T09:00:00"));
    expect(dayLabel(at("2026-10-23T08:00:00"))).toBe("Today");
    expect(dayLabel(at("2026-10-22T20:00:00"))).toBe("Yesterday");
    expect(dayLabel(at("2026-10-21T12:00:00"))).toBe("Wednesday 21 Oct");
  });

  it("turns over at midnight", () => {
    const now = at("2026-10-23T00:00:01");
    expect(dayLabel(at("2026-10-22T23:59:59"), now)).toBe("Yesterday");
    expect(dayLabel(at("2026-10-23T00:00:00"), now)).toBe("Today");
  });

  it("finds yesterday across a month end and a new year, with the year when it differs", () => {
    expect(dayLabel(at("2026-10-31T18:00:00"), at("2026-11-01T09:00:00"))).toBe("Yesterday");
    expect(dayLabel(at("2026-12-31T18:00:00"), at("2027-01-01T09:00:00"))).toBe("Yesterday");
    expect(dayLabel(at("2026-12-30T18:00:00"), at("2027-01-01T09:00:00"))).toBe("Wednesday 30 Dec 2026");
  });
});

describe("byDay", () => {
  it("groups by day, newest day first, keeping order within a day", () => {
    const now = at("2026-10-23T09:00:00");
    const a = save("2026-10-23T08:00:00"), b = save("2026-10-21T10:00:00"), c = save("2026-10-23T07:00:00");
    expect(byDay([a, b, c], now)).toEqual([{ label: "Today", items: [a, c] }, { label: "Wednesday 21 Oct", items: [b] }]);
  });

  it("returns nothing for no saves", () => {
    expect(byDay([])).toEqual([]);
  });
});
