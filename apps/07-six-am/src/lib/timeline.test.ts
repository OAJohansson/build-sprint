import { describe, expect, it } from "vitest";
import { BARS, place, snapBar, snapLength, type Region } from "./timeline";

const PPB = 10; // pixels per bar

describe("snapBar", () => {
  it("drops on the nearest bar line", () => {
    expect(snapBar(36 * PPB + 3, PPB, 4)).toBe(37); // just after a line
    expect(snapBar(36 * PPB - 3, PPB, 4)).toBe(37); // just before it
  });
  it("lands exactly on a bar line", () => {
    expect(snapBar(8 * PPB, PPB, 4)).toBe(9);
  });
  it("never goes before bar 1 or past the end", () => {
    expect(snapBar(-50, PPB, 4)).toBe(1);
    expect(snapBar(BARS * PPB + 50, PPB, 4)).toBe(BARS - 4 + 1);
  });
});

describe("snapLength", () => {
  it("repeats in whole loop lengths", () => {
    expect(snapLength(16 * PPB, PPB, 4, 1)).toBe(16);
    expect(snapLength(13 * PPB, PPB, 4, 1)).toBe(12);
  });
  it("keeps at least one loop and stops at the end of the timeline", () => {
    expect(snapLength(1, PPB, 4, 1)).toBe(4);
    expect(snapLength(40 * PPB, PPB, 4, 57)).toBe(8);
  });
});

describe("place", () => {
  const r = (id: string, start: number, length: number): Region => ({ id, loopId: "acid-line", track: 1, start, length });

  it("trims what it overlaps, in whole loops", () => {
    const out = place([r("a", 41, 24)], r("b", 39, 8));
    expect(out.find((x) => x.id === "a")).toMatchObject({ start: 49, length: 16 });
  });
  it("splits a region it lands inside", () => {
    const out = place([r("a", 1, 32)], r("b", 13, 4));
    expect(out.map((x) => [x.start, x.length]).sort((p, q) => p[0] - q[0])).toEqual([[1, 12], [13, 4], [17, 16]]);
  });
  it("leaves other tracks and an empty timeline alone", () => {
    expect(place([], r("b", 1, 4))).toHaveLength(1);
    const other = { ...r("a", 1, 32), track: 0 };
    expect(place([other], r("b", 1, 4))).toContainEqual(other);
  });
});
