import { describe, expect, it } from "vitest";
import { planMs, snippetPlan } from "./snippets";

const ends = (p: { startMs: number; lengthMs: number }[]) => p.map((s) => s.startMs + s.lengthMs);
const noOverlap = (p: { startMs: number; lengthMs: number }[]) =>
  p.every((s, i) => i === 0 || p[i - 1].startMs + p[i - 1].lengthMs <= s.startMs);

describe("snippetPlan", () => {
  it("a 6 min track: 4 × 30 s at 20/40/60/80%", () => {
    const p = snippetPlan(360_000, "ALLOW");
    expect(p).toEqual([
      { startMs: 72_000, lengthMs: 30_000 },
      { startMs: 144_000, lengthMs: 30_000 },
      { startMs: 216_000, lengthMs: 30_000 },
      { startMs: 288_000, lengthMs: 30_000 },
    ]);
    expect(planMs(p)).toBe(120_000);
  });
  it("a 3 min track: still 30 s each, inside the track", () => {
    const p = snippetPlan(180_000);
    expect(p.map((s) => s.startMs)).toEqual([36_000, 72_000, 108_000, 144_000]);
    expect(p.every((s) => s.lengthMs === 30_000)).toBe(true);
    expect(Math.max(...ends(p))).toBeLessThanOrEqual(180_000);
    expect(noOverlap(p)).toBe(true);
  });
  it("exactly 2:30: the last snippet ends at the end", () => {
    const p = snippetPlan(150_000);
    expect(ends(p).at(-1)).toBe(150_000);
    expect(noOverlap(p)).toBe(true);
  });
  it("a 2 min track: snippets shrink to 24 s and don't overlap", () => {
    const p = snippetPlan(120_000);
    expect(p).toHaveLength(4);
    expect(p.every((s) => s.lengthMs === 24_000)).toBe(true);
    expect(noOverlap(p)).toBe(true);
    expect(Math.max(...ends(p))).toBeLessThanOrEqual(120_000);
  });
  it("a 30 s clip: one snippet over the whole thing", () => {
    expect(snippetPlan(30_000)).toEqual([{ startMs: 0, lengthMs: 30_000 }]);
  });
  it("a preview (SNIP): just what plays, from the start", () => {
    expect(snippetPlan(30_000, "SNIP")).toEqual([{ startMs: 0, lengthMs: 30_000 }]);
    expect(snippetPlan(29_500, "SNIP")).toEqual([{ startMs: 0, lengthMs: 29_500 }]);
    expect(snippetPlan(0, "SNIP")).toEqual([{ startMs: 0, lengthMs: 30_000 }]);
  });
  it("0 or unknown duration: one 30 s snippet from the start", () => {
    for (const d of [0, null, undefined, NaN, -1]) expect(snippetPlan(d)).toEqual([{ startMs: 0, lengthMs: 30_000 }]);
  });
});
