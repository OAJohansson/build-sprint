import { describe, expect, it } from "vitest";
import { RecentParts, faded } from "./recent";

const R = 100; // samples per second, to keep numbers small
const ones = (n: number) => [new Float32Array(n).fill(1), new Float32Array(n).fill(1)];

describe("RecentParts", () => {
  it("rebuilds a stretch from crossfaded neighbours at full level", () => {
    const r = new RecentParts(R, 30, 2);
    // Regions of 3 s overlapping by 0.1 s, faded over that overlap, like live playback.
    for (let k = 0; k < 4; k++) r.add(k * 290, ones(300).map((a) => faded(a, 10)));
    const b = r.build(100, 1000)!;
    // The live crossfade sums to (n−1)/n at its joins: within 1/n of full level.
    expect(b[0].every((x) => Math.abs(x - 1) <= 0.1 + 1e-6)).toBe(true);
    expect(r.coveredUntil(500)).toBe(3 * 290 + 300);
  });
  it("says null outside what it holds, or across a gap", () => {
    const r = new RecentParts(R, 30, 2);
    r.add(0, ones(300));
    r.add(500, ones(300));
    expect(r.build(100, 400)).toBeNull(); // the gap 300–500
    expect(r.coveredUntil(350)).toBeNull();
    expect(r.build(550, 700)).not.toBeNull();
  });
  it("keeps only the last 30 s", () => {
    const r = new RecentParts(R, 30, 2);
    for (let k = 0; k < 15; k++) r.add(k * 300, ones(300));
    expect(r.seconds).toBeLessThanOrEqual(30);
    expect(r.coveredUntil(0)).toBeNull(); // the oldest went
    expect(r.coveredUntil(4400)).toBe(4500);
  });
  it("replaces a stretch heard again instead of doubling it (a jump back)", () => {
    const r = new RecentParts(R, 30, 2);
    r.add(0, ones(300));
    r.add(0, ones(300));
    expect(r.build(0, 300)![0][150]).toBe(1);
    expect(r.seconds).toBe(3);
  });
  it("forgets everything on clear", () => {
    const r = new RecentParts(R, 30, 2);
    r.add(0, ones(300));
    r.clear();
    expect(r.build(0, 100)).toBeNull();
    expect(r.seconds).toBe(0);
  });
});

describe("firstHeld (a loop filled from what was just heard)", () => {
  it("finds the first sample held near the start, or none", () => {
    const r = new RecentParts(100, 30, 1);
    r.add(30, [new Float32Array(50)]);
    expect(r.firstHeld(0, 100)).toBe(30);
    expect(r.firstHeld(40, 100)).toBe(40);
    expect(r.firstHeld(0, 20)).toBeNull();
  });
});
