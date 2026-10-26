import { describe, expect, it } from "vitest";
import { LoopBuffer } from "./loop-buffer";
import { barToMs, gateResume, isCatching, loopBars, loopPositionMs, msToBar, msToSamples, playTimeOf, runOffset } from "./timing";

describe("bars and time", () => {
  it("bar 1 is the first downbeat; 124 BPM bars are 1.935 s", () => {
    expect(barToMs(1, 124, 0.4)).toBeCloseTo(400);
    expect(barToMs(97, 124, 0.4)).toBeCloseTo(400 + 96 * 1935.48, 0);
    expect(msToBar(barToMs(65.5, 124, 0.4), 124, 0.4)).toBeCloseTo(65.5);
    expect(msToBar(0, 124, 0.4)).toBeLessThan(1); // before the first downbeat
  });
  it("loop bars → samples: 16 bars at 120 BPM is 32 s", () => {
    expect(msToSamples(barToMs(17, 120, 0) - barToMs(1, 120, 0), 44100)).toBe(32 * 44100);
  });
});

describe("loopBars", () => {
  it("loops a short section whole", () => {
    expect(loopBars({ from: 33, to: 41 }, null)).toEqual({ from: 33, to: 41 });
    expect(loopBars({ from: 33, to: 49 }, 40)).toEqual({ from: 33, to: 49 }); // exactly the cap
  });
  it("caps a longer section at 16 bars: the phrase holding the heard bar", () => {
    expect(loopBars({ from: 65, to: 129 }, 97.4)).toEqual({ from: 97, to: 113 });
    expect(loopBars({ from: 65, to: 129 }, 128.9)).toEqual({ from: 113, to: 129 });
  });
  it("caps at the first phrase when the playhead is elsewhere", () => {
    expect(loopBars({ from: 65, to: 129 }, 12)).toEqual({ from: 65, to: 81 });
    expect(loopBars({ from: 65, to: 129 }, null)).toEqual({ from: 65, to: 81 });
  });
  it("never runs past the section's end", () => {
    expect(loopBars({ from: 1, to: 21 }, 19)).toEqual({ from: 17, to: 21 });
  });
});

describe("loopPositionMs (wrap-around)", () => {
  it("plays through and wraps back to the start", () => {
    expect(loopPositionMs(10_000, 20_000, 5, 5)).toBe(10_000);
    expect(loopPositionMs(10_000, 20_000, 5, 9)).toBeCloseTo(14_000);
    expect(loopPositionMs(10_000, 20_000, 5, 15)).toBeCloseTo(10_000); // exactly one lap
    expect(loopPositionMs(10_000, 20_000, 5, 27.5)).toBeCloseTo(12_500); // third lap
  });
  it("sits at the start before it begins", () => {
    expect(loopPositionMs(10_000, 20_000, 5, 3)).toBe(10_000);
  });
  it("the switch to memory happens when the loop's end plays", () => {
    // offset 100 s (track − capture), delay 5.5 s: track 130 s is captured at 30 s, heard at 35.5.
    expect(playTimeOf(130_000, 100, 5.5)).toBeCloseTo(35.5);
  });
});

describe("seek → catching up", () => {
  const delayS = 5.5;
  it("stays muted until the Deck reports the new position", () => {
    expect(gateResume({ cs: 10, ce: 13, captureFrom: null, offsetS: null, fromMs: 60_000, delayS })).toBeNull();
    expect(isCatching(true, null, 11)).toBe(true);
  });
  it("skips a region that is all old audio", () => {
    expect(gateResume({ cs: 10, ce: 13, captureFrom: 13.2, offsetS: 47, fromMs: 60_000, delayS })).toBeNull();
  });
  it("unmutes at the first new sample of a region that spans the jump", () => {
    expect(gateResume({ cs: 13, ce: 16, captureFrom: 13.2, offsetS: 47, fromMs: 60_000, delayS })).toBeCloseTo(13.2 + 5.5);
  });
  it("waits out a pre-roll before a loop's start", () => {
    // Deck seeked to 59 s for a loop starting at 60 s: track 60 s is captured at 13 s (offset 47).
    expect(gateResume({ cs: 10, ce: 12.9, captureFrom: 12, offsetS: 47, fromMs: 60_000, delayS })).toBeNull();
    expect(gateResume({ cs: 12.9, ce: 15.9, captureFrom: 12, offsetS: 47, fromMs: 60_000, delayS })).toBeCloseTo(13 + 5.5);
  });
  it("is caught up once the new audio plays", () => {
    expect(isCatching(false, 18.5, 18)).toBe(true);
    expect(isCatching(false, 18.5, 18.6)).toBe(false);
    expect(isCatching(false, null, 3)).toBe(false);
  });
  it("reads the run's offset from settled Deck reports only", () => {
    const marks = [
      { at: 12.0, posMs: 60_000, playing: true }, // the seek target, reported before playing
      { at: 12.6, posMs: 59_650, playing: true },
      { at: 12.7, posMs: 59_750, playing: true },
      { at: 12.8, posMs: 59_850, playing: true },
    ];
    expect(runOffset(marks, 12)).toBeCloseTo(47.05);
    expect(runOffset([], 12)).toBeNull();
  });
});

describe("LoopBuffer", () => {
  const ramp = (from: number, n: number) => Float32Array.from({ length: n }, (_, i) => from + i);
  const region = (from: number, n: number) => [ramp(from, n), ramp(from, n)];

  it("is complete once overlapping regions cover the loop and its tail", () => {
    const b = new LoopBuffer(100, 10, 2);
    b.write(region(0, 60), 0, 0, 5);
    expect(b.complete).toBe(false);
    b.write(region(55, 60), 55, 0, 5); // overlaps the first by 5 samples
    expect(b.complete).toBe(true);
    const [l] = b.build();
    expect(l.length).toBe(100);
    expect(l[70]).toBe(70);
  });
  it("wraps seamlessly: after the last sample comes the audio that followed the loop", () => {
    const b = new LoopBuffer(100, 10, 2);
    b.write(region(0, 110), 0);
    const [l] = b.build();
    expect(l[99]).toBe(99);
    expect(l[0]).toBe(100); // continues from 99
    expect(l[5]).toBeCloseTo(5 * 0.5 + 105 * 0.5);
    expect(l[10]).toBe(10);
  });
  it("skips audio from before the run and samples past the end", () => {
    const b = new LoopBuffer(100, 10, 2);
    b.write(region(-20, 50), -20, 25); // the first 25 samples are old audio
    expect(b.progress).toBeCloseTo(25 / 110);
    b.write(region(90, 200), 90);
    expect(b.progress).toBeCloseTo((25 + 20) / 110);
  });
  it("zeroes on drop and ignores writes after", () => {
    const b = new LoopBuffer(10, 2, 2);
    b.write(region(0, 12), 0);
    b.drop();
    b.write(region(0, 12), 0);
    expect(b.complete).toBe(false);
    expect(b.build()).toEqual([]);
  });
});
