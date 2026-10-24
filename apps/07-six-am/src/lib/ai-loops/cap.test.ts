import { afterEach, describe, expect, it, vi } from "vitest";
import { dailyLoopCap, DEFAULT_DAILY_LOOP_CAP, loopUsage } from "./cap";

afterEach(() => vi.useRealTimers());

describe("loopUsage", () => {
  it("counts today's loops and sums cost (normal case)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-25T15:00:00Z"));
    const rows = [
      { createdAt: "2026-10-25T09:00:00Z", costUsd: 0.08 },
      { createdAt: "2026-10-25T14:59:00Z", costUsd: 0.04 },
      { createdAt: "2026-10-24T20:00:00Z", costUsd: 0.08 },
    ];
    const u = loopUsage(rows, new Date(), 0, 20);
    expect(u.today).toBe(2);
    expect(u.left).toBe(18);
    expect(u.todayUsd).toBeCloseTo(0.12, 6);
    expect(u.monthUsd).toBeCloseTo(0.2, 6);
  });

  it("splits days at the owner's local midnight, not UTC", () => {
    vi.useFakeTimers();
    // 00:30 on 26 Oct in UTC+2 (offset -120) is 22:30 UTC on 25 Oct.
    vi.setSystemTime(new Date("2026-10-25T22:30:00Z"));
    const rows = [
      { createdAt: "2026-10-25T21:59:00Z", costUsd: 0.08 }, // 23:59 local, yesterday
      { createdAt: "2026-10-25T22:01:00Z", costUsd: 0.08 }, // 00:01 local, today
    ];
    expect(loopUsage(rows, new Date(), -120, 20).today).toBe(1);
    expect(loopUsage(rows, new Date(), 0, 20).today).toBe(2);
  });

  it("resets the month at month end", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-01T00:10:00Z"));
    const rows = [{ createdAt: "2026-10-31T23:50:00Z", costUsd: 0.08 }];
    const u = loopUsage(rows, new Date(), 0, 20);
    expect(u.today).toBe(0);
    expect(u.monthUsd).toBe(0);
  });

  it("handles an empty history and a spent cap", () => {
    expect(loopUsage([], new Date("2026-10-25T12:00:00Z"), 0, 20)).toMatchObject({ today: 0, left: 20, todayUsd: 0 });
    const full = Array.from({ length: 3 }, () => ({ createdAt: "2026-10-25T10:00:00Z", costUsd: 0.04 }));
    expect(loopUsage(full, new Date("2026-10-25T12:00:00Z"), 0, 2).left).toBe(0);
  });
});

describe("dailyLoopCap", () => {
  it("reads env, clamps it and falls back on junk", () => {
    expect(dailyLoopCap(undefined)).toBe(DEFAULT_DAILY_LOOP_CAP);
    expect(dailyLoopCap("abc")).toBe(DEFAULT_DAILY_LOOP_CAP);
    expect(dailyLoopCap("5")).toBe(5);
    expect(dailyLoopCap("0")).toBe(0);
    expect(dailyLoopCap("9999")).toBe(200);
  });
});
