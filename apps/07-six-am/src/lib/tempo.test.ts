import { describe, expect, it } from "vitest";
import { clampBpm, DEFAULT_BPM, formatBpm, MAX_BPM, MIN_BPM, secondsPerStep } from "./tempo";

describe("clampBpm", () => {
  it("keeps a normal tempo to one decimal", () => {
    expect(clampBpm(122.44)).toBe(122.4);
    expect(clampBpm(128)).toBe(128);
  });
  it("clamps to the playable range", () => {
    expect(clampBpm(40)).toBe(MIN_BPM);
    expect(clampBpm(260)).toBe(MAX_BPM);
  });
  it("falls back to the default for junk", () => {
    expect(clampBpm(undefined)).toBe(DEFAULT_BPM);
    expect(clampBpm(Number.NaN)).toBe(DEFAULT_BPM);
    expect(clampBpm(0)).toBe(DEFAULT_BPM);
    expect(clampBpm("128")).toBe(DEFAULT_BPM);
  });
});

describe("secondsPerStep", () => {
  it("is a quarter of a beat", () => {
    expect(secondsPerStep(120)).toBeCloseTo(0.125);
    expect(secondsPerStep(124)).toBeCloseTo(60 / 124 / 4);
  });
  it("a bar (16 steps) at 150 BPM lasts 1.6 s", () => {
    expect(secondsPerStep(150) * 16).toBeCloseTo(1.6);
  });
});

describe("formatBpm", () => {
  it("drops .0 for whole tempi", () => {
    expect(formatBpm(124)).toBe("124");
    expect(formatBpm(122.4)).toBe("122.4");
  });
});
