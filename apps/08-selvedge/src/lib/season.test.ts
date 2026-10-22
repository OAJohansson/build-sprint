import { afterEach, describe, expect, it, vi } from "vitest";
import { newBoardName, seasonOf } from "./season";

const at = (iso: string) => new Date(iso); // local time (no Z)

describe("seasonOf", () => {
  afterEach(() => vi.useRealTimers());

  it("names today's season (normal case)", () => {
    vi.setSystemTime(at("2026-10-22T09:00:00"));
    expect(seasonOf(new Date())).toBe("Autumn 2026");
  });

  it("changes season at midnight on the first of the month", () => {
    expect(seasonOf(at("2026-05-31T23:59:59"))).toBe("Spring 2026");
    expect(seasonOf(at("2026-06-01T00:00:00"))).toBe("Summer 2026");
  });

  it("keeps winter in the year it started, across New Year", () => {
    expect(seasonOf(at("2026-12-31T23:59:59"))).toBe("Winter 2026");
    expect(seasonOf(at("2027-01-01T00:00:00"))).toBe("Winter 2026");
    expect(seasonOf(at("2027-02-28T23:59:59"))).toBe("Winter 2026");
    expect(seasonOf(at("2027-03-01T00:00:00"))).toBe("Spring 2027");
  });

  it("handles a leap-year February end", () => {
    expect(seasonOf(at("2028-02-29T12:00:00"))).toBe("Winter 2027");
  });
});

describe("newBoardName", () => {
  const now = at("2026-07-10T12:00:00");
  it("uses the season when there are no boards yet", () => {
    expect(newBoardName(now, [])).toBe("Summer 2026");
  });
  it("numbers a second board in the same season", () => {
    expect(newBoardName(now, ["Summer 2026"])).toBe("Summer 2026 (2)");
    expect(newBoardName(now, ["Summer 2026", "Summer 2026 (2)"])).toBe("Summer 2026 (3)");
  });
});
