import { describe, expect, it } from "vitest";
import { BARS, place, snapBar, snapLength, type Region, moveStart } from "./timeline";

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

import { silentLanes } from "./timeline";
import { parseDoc } from "./tracks";

describe("solo (L140)", () => {
  const muted = [false, true, false, false];
  it("without a solo, the muted lanes are silent", () => {
    expect(silentLanes({ muted })).toEqual([false, true, false, false]);
    expect(silentLanes({ muted, soloed: [false, false, false, false] })).toEqual([false, true, false, false]);
  });
  it("any solo silences the others and beats mute", () => {
    expect(silentLanes({ muted, soloed: [false, true, true, false] })).toEqual([true, false, false, true]);
  });
  it("is saved with the track; old docs parse unchanged", () => {
    const old = { regions: [], muted };
    expect(parseDoc(old)).toEqual(old);
    expect(parseDoc({ ...old, soloed: [true, false, false, false] })).toEqual({ ...old, soloed: [true, false, false, false] });
    expect(parseDoc({ ...old, soloed: [false, false, false, false] })).toEqual(old);
    expect(parseDoc({ ...old, soloed: [true] })).toBeNull();
  });
});

describe("moving a block by dragging (S5-9)", () => {
  // 1,220 px of lanes for 64 bars, as at 1440 px wide.
  const ppb = 1220 / 64;
  it("moves by the pointer's delta in whole bars", () => {
    expect(moveStart(9, ppb * 1, ppb, 16, 64)).toBe(10);
    expect(moveStart(9, ppb * 4, ppb, 16, 64)).toBe(13);
    expect(moveStart(9, ppb * 8, ppb, 16, 64)).toBe(17);
    expect(moveStart(9, -ppb * 4, ppb, 16, 64)).toBe(5);
  });
  it("doesn't move when released where it was pressed, or within half a bar", () => {
    expect(moveStart(9, 0, ppb, 16, 64)).toBe(9);
    expect(moveStart(9, ppb * 0.49, ppb, 16, 64)).toBe(9);
    expect(moveStart(9, -ppb * 0.49, ppb, 16, 64)).toBe(9);
  });
  it("20 px is one bar at this width, never 20 bars", () => {
    expect(moveStart(9, 20, ppb, 16, 64)).toBe(10);
  });
  it("stays inside the track", () => {
    expect(moveStart(9, -ppb * 40, ppb, 16, 64)).toBe(1);
    expect(moveStart(9, ppb * 80, ppb, 16, 64)).toBe(49);
  });
});
