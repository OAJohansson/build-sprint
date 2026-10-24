import { describe, expect, it } from "vitest";
import { barsToSeconds, firstDownbeat, gridTempo, refineTempo, secondsToBars, snapToPhrase, wholeBars } from "./grid";

describe("seconds ↔ bars", () => {
  it("converts at a tempo (124 BPM: a bar is 60/124·4 s)", () => {
    const bar = (60 / 124) * 4;
    expect(secondsToBars(bar * 16, 124)).toBeCloseTo(16, 9);
    expect(barsToSeconds(16, 124)).toBeCloseTo(bar * 16, 9);
  });
  it("counts from the first downbeat", () => {
    expect(secondsToBars(0.5, 120, 0.5)).toBe(0);
    expect(secondsToBars(0, 120, 0.5)).toBeCloseTo(-0.25, 9);
    expect(barsToSeconds(secondsToBars(93.7, 126.3, 0.42), 126.3, 0.42)).toBeCloseTo(93.7, 9);
  });
  it("folds a half-time reading up, so 62 and 124 give the same bars", () => {
    expect(gridTempo(62)).toBe(124);
    expect(gridTempo(31)).toBe(124);
    expect(gridTempo(128)).toBe(128);
    expect(gridTempo(0)).toBe(0);
    expect(secondsToBars(60, gridTempo(62))).toBeCloseTo(secondsToBars(60, 124), 9);
  });
  it("whole bars round a last half bar up", () => {
    const bar = 2; // 120 BPM
    expect(wholeBars(bar * 100 + 0.9, 120)).toBe(100);
    expect(wholeBars(bar * 100 + 1.1, 120)).toBe(101);
    expect(wholeBars(10, 120, 20)).toBe(0);
  });
});

describe("snapToPhrase", () => {
  it("snaps to the nearest 8-bar line within 2 bars", () => {
    expect(snapToPhrase(31, 100)).toBe(32);
    expect(snapToPhrase(34, 100)).toBe(32);
  });
  it("otherwise to the nearest 4-bar line", () => {
    expect(snapToPhrase(37, 100)).toBe(36);
    expect(snapToPhrase(42.6, 100)).toBe(44);
  });
  it("keeps a boundary at 0 at 0 and clamps before the start", () => {
    expect(snapToPhrase(0, 100)).toBe(0);
    expect(snapToPhrase(-3, 100)).toBe(0);
    expect(snapToPhrase(1, 100)).toBe(0);
  });
  it("never goes past the end", () => {
    expect(snapToPhrase(130, 100)).toBe(100);
    expect(snapToPhrase(99, 98)).toBe(98);
    expect(snapToPhrase(97, 98)).toBe(96);
  });
  it("gives the same bar for a boundary at a half-time reading once folded", () => {
    const t = 77.5; // seconds
    expect(snapToPhrase(secondsToBars(t, gridTempo(63)), 200)).toBe(snapToPhrase(secondsToBars(t, 126), 200));
  });
});

describe("refineTempo and the first downbeat", () => {
  it("finds the exact tempo and beat phase of a long pulse train", () => {
    const fps = 46.875, bpm = 125.4, first = 0.37, secs = 300;
    const onset = new Float32Array(Math.round(secs * fps));
    for (let t = first; t < secs; t += 60 / bpm) onset[Math.round(t * fps)] = 1;
    const r = refineTempo(onset, fps, 125);
    expect(Math.abs(r.bpm - bpm)).toBeLessThan(0.02);
    expect(Math.abs(r.beatSec - first)).toBeLessThan(0.03);
  });
  it("places bar 1 at the first downbeat after the music starts", () => {
    // 120 BPM: beats every 0.5 s from 0.1; downbeats are phase 1 → 0.6, 2.6, …
    expect(firstDownbeat(0.1, 1, 120, 0)).toBeCloseTo(0.6, 6);
    expect(firstDownbeat(0.1, 1, 120, 2.5)).toBeCloseTo(2.6, 6);
  });
});
