import { describe, expect, it } from "vitest";
import { addMark, heardPosition, levelDb, positionAt, type DeckMark } from "./sync";

describe("Lab playhead sync", () => {
  const playing: DeckMark[] = [{ at: 10, posMs: 60_000, playing: true }, { at: 10.25, posMs: 60_250, playing: true }];

  it("moves on from the last mark while playing", () => {
    expect(positionAt(playing, 11)).toBeCloseTo(61_000);
  });

  it("heard position is the Deck's position one delay ago", () => {
    expect(heardPosition(playing, 15.5, 5.5)).toBeCloseTo(60_000);
  });

  it("nothing heard before the first mark (empty history, start of listening)", () => {
    expect(positionAt([], 5)).toBeNull();
    expect(heardPosition(playing, 12, 5.5)).toBeNull();
  });

  it("holds still after a pause", () => {
    const m = addMark(playing, { at: 12, posMs: 62_000, playing: false });
    expect(positionAt(m, 20)).toBe(62_000);
  });

  it("follows a seek only once the delay has passed", () => {
    const m = addMark(playing, { at: 12, posMs: 180_000, playing: true });
    expect(heardPosition(m, 16, 5.5)).toBeCloseTo(60_500); // still the old place
    expect(heardPosition(m, 18, 5.5)).toBeCloseTo(180_500);
  });

  it("drops marks older than the window it keeps", () => {
    let m: DeckMark[] = [];
    for (let t = 0; t <= 100; t++) m = addMark(m, { at: t, posMs: t * 1000, playing: true }, 30);
    expect(m[0].at).toBe(70);
  });

  it("measures silence and a full-scale sine", () => {
    expect(levelDb(new Float32Array(100))).toBe(-120);
    const s = Float32Array.from({ length: 4410 }, (_, i) => Math.sin((2 * Math.PI * 441 * i) / 44100));
    expect(levelDb(s)).toBeCloseTo(-3.01, 1);
  });
});
