import { afterEach, describe, expect, it, vi } from "vitest";
import { addDays, dayOf, dayRange, diffDays, todayKey, weekdayOf } from "./day";

const local = (y: number, mo: number, d: number, h: number, mi = 0) =>
  new Date(y, mo - 1, d, h, mi).getTime();

afterEach(() => vi.useRealTimers());

describe("time zone", () => {
  it("runs in Europe/Stockholm, which changes clocks on 25 Oct 2026", () => {
    expect(new Date(2026, 9, 24, 12).getTimezoneOffset()).toBe(-120);
    expect(new Date(2026, 9, 26, 12).getTimezoneOffset()).toBe(-60);
  });
});

describe("dayOf (04:00 boundary)", () => {
  it("normal case: an afternoon log is that day", () => {
    expect(dayOf(local(2026, 10, 22, 14))).toBe("2026-10-22");
  });

  it("a 00:30 bedtime log belongs to the evening before", () => {
    expect(dayOf(local(2026, 10, 22, 0, 30))).toBe("2026-10-21");
  });

  it("03:59 is still yesterday, 04:00 is today", () => {
    expect(dayOf(local(2026, 10, 22, 3, 59))).toBe("2026-10-21");
    expect(dayOf(local(2026, 10, 22, 4, 0))).toBe("2026-10-22");
  });

  it("month end: 1 Nov 00:30 is 31 Oct; 1 Jan 00:30 is 31 Dec", () => {
    expect(dayOf(local(2026, 11, 1, 0, 30))).toBe("2026-10-31");
    expect(dayOf(local(2027, 1, 1, 0, 30))).toBe("2026-12-31");
  });

  it("25 Oct 2026 clock change: the repeated hour and the long day stay on the right date", () => {
    // 02:30 happens twice that night; both belong to Saturday 24 Oct.
    const first0230 = Date.UTC(2026, 9, 25, 0, 30); // 02:30 CEST
    const second0230 = Date.UTC(2026, 9, 25, 1, 30); // 02:30 CET
    expect(dayOf(first0230)).toBe("2026-10-24");
    expect(dayOf(second0230)).toBe("2026-10-24");
    expect(dayOf(local(2026, 10, 25, 4, 0))).toBe("2026-10-25");
    expect(dayOf(local(2026, 10, 25, 23, 30))).toBe("2026-10-25");
    expect(dayOf(local(2026, 10, 26, 3, 59))).toBe("2026-10-25");
    expect(dayOf(local(2026, 10, 26, 4, 0))).toBe("2026-10-26");
    // Saturday 24 Oct is 25 hours long: 24 h after Sat 04:00 is only Sun 03:00, still Saturday.
    expect(dayOf(local(2026, 10, 24, 4, 0) + 24 * 3600_000)).toBe("2026-10-24");
  });
});

describe("todayKey with a fixed clock", () => {
  it("follows vi.setSystemTime", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 26, 7, 5));
    expect(todayKey()).toBe("2026-10-26");
    vi.setSystemTime(new Date(2026, 9, 27, 1, 0));
    expect(todayKey()).toBe("2026-10-26");
  });
});

describe("calendar arithmetic", () => {
  it("adds and diffs days across the clock change, month end and year end", () => {
    expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
    expect(diffDays("2026-10-24", "2026-10-26")).toBe(2);
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(diffDays("2026-11-01", "2026-10-25")).toBe(-7);
  });

  it("ranges and weekdays", () => {
    expect(dayRange("2026-10-30", "2026-11-02")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
    expect(dayRange("2026-10-02", "2026-10-01")).toEqual([]);
    expect(weekdayOf("2026-10-25")).toBe(0); // Sunday
    expect(weekdayOf("2026-10-24")).toBe(6); // Saturday
  });
});
