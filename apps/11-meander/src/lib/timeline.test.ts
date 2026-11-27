import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ERAS, eraOf, makeScale, spanOf, timelineRows, yearLabel, type RawSpan } from "./timeline";

const TABLE: Record<string, RawSpan> = {
  pre: { from: -600, to: -400 },
  sto: { from: -300, to: 200 },
  uti: { from: 1789, to: "present" },
  exi: { from: 1940, to: 1970, roots: 1840 },
  bad: { from: 1900, to: 1800 },
};

describe("timeline years", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 27, 12, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("maps each era onto its share of the axis (normal case)", () => {
    const { scale, bands } = makeScale(0, 1000);
    expect(scale(-600)).toBe(0);
    expect(scale(500)).toBeCloseTo(260);
    expect(scale(1350)).toBeCloseTo(400);
    expect(scale(2026)).toBeCloseTo(1000);
    expect(bands.map((b) => Math.round(b.w))).toEqual([260, 140, 200, 180, 220]);
    expect(ERAS.reduce((s, e) => s + e.share, 0)).toBeCloseTo(1);
  });

  it("crosses from BCE to CE without a jump, and keeps going up", () => {
    const { scale } = makeScale(0, 1000);
    expect(scale(-1)).toBeLessThan(scale(1));
    expect(scale(1) - scale(-1)).toBeLessThan(1);
    const years = [-600, -300, -1, 1, 300, 499, 500, 1349, 1350, 1779, 1780, 1899, 1900, 2026];
    const xs = years.map(scale);
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThanOrEqual(xs[i - 1]);
    expect(yearLabel(-500)).toBe("500 BCE");
    expect(yearLabel(1)).toBe("1 CE");
    expect(yearLabel(0)).toBe("1 CE");
    expect(yearLabel(1500)).toBe("1500");
  });

  it("holds years outside the axis at its ends", () => {
    const { scale } = makeScale(0, 1000);
    expect(scale(-2000)).toBe(0);
    expect(scale(3000)).toBeCloseTo(1000);
  });

  it("buckets by era; a boundary year belongs to the later era", () => {
    expect(eraOf(-2000)).toBe(0);
    expect(eraOf(-1)).toBe(0);
    expect(eraOf(499)).toBe(0);
    expect(eraOf(500)).toBe(1);
    expect(eraOf(1350)).toBe(2);
    expect(eraOf(1779)).toBe(2);
    expect(eraOf(1780)).toBe(3);
    expect(eraOf(1900)).toBe(4);
    expect(eraOf(2026)).toBe(4);
  });

  it('"present" is the current year, and moves with it', () => {
    expect(spanOf("uti", undefined, TABLE)).toEqual({ from: 1789, to: 2026, roots: undefined, open: false, present: true });
    vi.setSystemTime(new Date(2027, 0, 1, 0, 0, 1)); // just past midnight on New Year
    expect(spanOf("uti", undefined, TABLE)?.to).toBe(2027);
    expect(makeScale(0, 1000).scale(2027)).toBeCloseTo(1000);
  });

  it("missing or broken entries are left off, not crashed on", () => {
    expect(spanOf("buddhist-philosophy", undefined, TABLE)).toBeNull();
    expect(spanOf("bad", undefined, TABLE)).toBeNull();
    const rows = timelineRows([{ id: "uti" }, { id: "missing" }, { id: "exi" }, { id: "pre" }, { id: "sto" }, { id: "bad" }], undefined, TABLE);
    expect(rows.map((r) => [r.item.id, r.era])).toEqual([["pre", 0], ["sto", 0], ["uti", 3], ["exi", 4]]);
    expect(rows[3].span.roots).toBe(1840);
    expect(timelineRows([], undefined, TABLE)).toEqual([]);
  });
});
