import { afterEach, describe, expect, it, vi } from "vitest";
import { ago } from "./ago";

const at = (s: string) => new Date(s);
afterEach(() => vi.useRealTimers());

describe("ago", () => {
  it("says minutes and hours on the same day", () => {
    vi.setSystemTime(at("2026-10-19T15:00:00"));
    expect(ago("2026-10-19T14:55:00")).toBe("5 min ago");
    expect(ago("2026-10-19T12:10:00")).toBe("2 h ago");
    expect(ago("2026-10-19T14:59:40")).toBe("just now");
  });
  it("counts minutes, not days, across midnight", () => {
    vi.setSystemTime(at("2026-10-20T00:10:00"));
    expect(ago("2026-10-19T23:50:00")).toBe("20 min ago");
    expect(ago("2026-10-19T22:00:00")).toBe("yesterday");
  });
  it("handles a month end and an older date", () => {
    vi.setSystemTime(at("2026-11-01T09:00:00"));
    expect(ago("2026-10-31T23:00:00")).toBe("yesterday");
    expect(ago("2026-10-18T10:00:00")).toBe("18 Oct");
    expect(ago("2025-12-30T10:00:00")).toBe("30 Dec 2025");
  });
  it("is empty for a missing date", () => {
    expect(ago("")).toBe("");
  });
});
