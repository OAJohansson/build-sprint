import { describe, expect, it } from "vitest";
import { foldIntoRange, pickTempo, relatedTempos, relationBetween, tempoPrior } from "./bpm";

describe("foldIntoRange", () => {
  it("doubles slow and halves fast tempi into 70–180", () => {
    expect(foldIntoRange(61)).toBe(122);
    expect(foldIntoRange(74)).toBe(74);
    expect(foldIntoRange(148)).toBe(148);
    expect(foldIntoRange(200)).toBe(100);
    expect(foldIntoRange(35)).toBe(70);
  });
  it("keeps the edges of the range", () => {
    expect(foldIntoRange(70)).toBe(70);
    expect(foldIntoRange(180)).toBe(180);
    expect(foldIntoRange(69.9)).toBeCloseTo(139.8);
  });
  it("returns 0 for nothing", () => {
    expect(foldIntoRange(0)).toBe(0);
    expect(foldIntoRange(NaN)).toBe(0);
    expect(foldIntoRange(-5)).toBe(0);
  });
});

describe("relationBetween", () => {
  it("names half, double, 2:3 and 3:2", () => {
    expect(relationBetween(61, 122)).toBe("1:2");
    expect(relationBetween(148, 74)).toBe("2:1");
    expect(relationBetween(101.3, 152)).toBe("2:3"); // the FOVOS miss
    expect(relationBetween(150, 100)).toBe("3:2");
    expect(relationBetween(124.4, 124)).toBe("1:1");
  });
  it("returns null for unrelated or missing tempi", () => {
    expect(relationBetween(124, 140)).toBeNull();
    expect(relationBetween(0, 120)).toBeNull();
  });
});

describe("relatedTempos", () => {
  it("lists only related tempi inside the search range", () => {
    expect(relatedTempos(150).map((t) => t.relation)).toEqual(["1:2", "2:3"]); // 225 and 300 are out of range
    expect(relatedTempos(124).map((t) => Math.round(t.bpm))).toEqual([62, 186, 83]);
  });
});

describe("tempoPrior", () => {
  it("is broad: 150 keeps most of its weight and beats 100 only slightly", () => {
    expect(tempoPrior(128)).toBe(1);
    expect(tempoPrior(150)).toBeGreaterThan(0.95);
    expect(tempoPrior(100)).toBeGreaterThan(0.9);
    expect(tempoPrior(64)).toBeLessThan(tempoPrior(128));
  });
});

// A score with Gaussian peaks at given tempi, for pickTempo.
const peaks = (list: [number, number][]) => (bpm: number) =>
  list.reduce((s, [at, h]) => s + h * Math.exp(-0.5 * ((bpm - at) / 0.8) ** 2), 0);

describe("pickTempo", () => {
  it("prefers the true tempo over its 2:3 when the score says so", () => {
    const p = pickTempo(peaks([[150, 1], [100, 0.7]]));
    expect(p.bpm).toBe(150);
    expect(p.alternative?.relation).toBe("2:3");
    expect(p.alternative?.bpm).toBeCloseTo(100, 0);
    expect(p.ambiguous).toBe(false);
  });
  it("flags a half/double tie as ambiguous and names the other", () => {
    const p = pickTempo(peaks([[87, 1], [174, 1]]));
    expect([87, 174]).toContain(p.bpm);
    expect(p.ambiguous).toBe(true);
    expect(p.alternative?.relation).toBe(p.bpm === 87 ? "2:1" : "1:2");
  });
  it("lets the prior break an exact 61 vs 122 tie towards 122", () => {
    const p = pickTempo(peaks([[61, 1], [122, 1]]));
    expect(p.bpm).toBe(122);
    expect(p.alternative?.relation).toBe("1:2");
  });
  it("returns 0 and no alternative for silence", () => {
    expect(pickTempo(() => 0)).toEqual({ bpm: 0, score: 0, alternative: null, ambiguous: false });
  });
});
