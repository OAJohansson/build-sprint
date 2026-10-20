import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { roughDate, roughOf } from "./rough-date";

describe("rough dates", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts back from today", () => {
    vi.setSystemTime(new Date(2026, 9, 20, 12, 0));
    expect(roughDate("week")).toBe("2026-10-17");
    expect(roughDate("month")).toBe("2026-09-20");
    expect(roughDate("2months")).toBe("2026-08-20");
    expect(roughDate("3months")).toBe("2026-07-21");
  });
  it("crosses month and year ends, just after midnight", () => {
    vi.setSystemTime(new Date(2026, 2, 1, 0, 5)); // 1 Mar, 00:05
    expect(roughDate("week")).toBe("2026-02-26");
    expect(roughDate("month")).toBe("2026-01-30");
    expect(roughDate("3months", "2026-01-15")).toBe("2025-10-16");
  });
  it("knows which pick a date came from, and none for an empty or exact date", () => {
    vi.setSystemTime(new Date(2026, 9, 20, 12, 0));
    expect(roughOf("2026-09-20")).toBe("month");
    expect(roughOf("2026-09-21")).toBeUndefined();
    expect(roughOf(undefined)).toBeUndefined();
  });
});
