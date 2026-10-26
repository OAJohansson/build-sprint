// Make's worker jobs (S3) and the Mentor's knob line: read a part and drop it, Mine at the
// original's level and length, Suggest settings, and the words under the knobs.
import { describe, expect, it } from "vitest";
import { suggestLine, movesTo, ticksMoved } from "./coach";
import { fitLoop, runMakeJob } from "./jobs";
import { rmsDb } from "./level";
import { MAKE_PRESETS, synthParams } from "./presets";
import { renderBass, type MakeNote } from "./render";

const RATE = 22050;
const fig: MakeNote[] = [2, 6, 10, 14].map((step, i) => ({ step, midi: i === 3 ? 36 : 33, dur: 2, vel: 0.9 }));
const notes = [0, 1, 2, 3].flatMap((r) => fig.map((n) => ({ ...n, step: n.step + r * 16 })));
const original = () => renderBass(notes, synthParams("rubber-pluck", { ...MAKE_PRESETS["rubber-pluck"].macros, tone: 0.6 }), { bpm: 124, steps: 64, rate: RATE });

describe("Make jobs", () => {
  it("reads the part's pattern and level, then zeroes the copy it was given", () => {
    const o = original();
    const level = rmsDb(o);
    const { res } = runMakeJob({ type: "read", id: 1, left: o.left, right: o.right, rate: RATE, bpm: 124, key: "A", scale: "minor" });
    if (res.type !== "read") throw new Error(res.type);
    expect(res.reading?.pattern.notes.length).toBeGreaterThan(0);
    expect(res.reading?.loopSteps).toBe(64);
    expect(res.levelDb).toBeCloseTo(level, 5);
    expect(o.left.every((x) => x === 0) && o.right.every((x) => x === 0)).toBe(true);
  });
  it("renders Mine exactly the loop's length, within 1 dB RMS of the original (Y9)", () => {
    const o = original();
    const level = rmsDb(o);
    const read = runMakeJob({ type: "read", id: 1, left: o.left.slice(), right: o.right.slice(), rate: RATE, bpm: 124, key: "A", scale: "minor" }).res;
    if (read.type !== "read" || !read.reading) throw new Error("no reading");
    const { res, transfer } = runMakeJob({ type: "render", id: 2, reading: read.reading, preset: "round-sub", macros: MAKE_PRESETS["round-sub"].macros, bpm: 124, rate: RATE, levelDb: read.levelDb, samples: o.left.length });
    if (res.type !== "render") throw new Error(res.type);
    expect(res.left.length).toBe(o.left.length);
    expect(transfer).toHaveLength(2);
    expect(Math.abs(rmsDb(res) - level)).toBeLessThan(1);
  });
  it("suggests settings for a preset from the reading", () => {
    const o = original();
    const read = runMakeJob({ type: "read", id: 1, left: o.left, right: o.right, rate: RATE, bpm: 124, key: "A", scale: "minor" }).res;
    if (read.type !== "read" || !read.reading) throw new Error("no reading");
    const { res } = runMakeJob({ type: "suggest", id: 3, reading: read.reading, preset: "rubber-pluck", bpm: 124 });
    if (res.type !== "suggest") throw new Error(res.type);
    expect(res.suggestion.distance).toBeLessThanOrEqual(res.suggestion.presetDistance);
    expect(res.suggestion.renders).toBeGreaterThan(20);
  });
  it("says what went wrong instead of throwing", () => {
    const { res } = runMakeJob({ type: "render", id: 4, reading: null as never, preset: "reese", macros: MAKE_PRESETS.reese.macros, bpm: 124, rate: RATE, levelDb: -20, samples: 10 });
    expect(res.type).toBe("error");
  });
});

describe("fitLoop", () => {
  it("cuts or pads to the loop and turns it by the original's offset", () => {
    const x = Float32Array.from([1, 2, 3, 4]);
    expect([...fitLoop(x, 6, 0, 1000)]).toEqual([1, 2, 3, 4, 0, 0]);
    expect([...fitLoop(x, 3, 0, 1000)]).toEqual([1, 2, 3]);
    expect([...fitLoop(x, 4, 1, 1000)]).toEqual([4, 1, 2, 3]); // 1 ms late at 1 kHz = one sample
    expect([...fitLoop(x, 4, -1, 1000)]).toEqual([2, 3, 4, 1]);
  });
});

describe("the Mentor's knob line", () => {
  const cur = { ...MAKE_PRESETS["round-sub"].macros }; // tone .3, length .55, pitchDrop .35, drive .2
  it("names the two biggest moves, with the word they land on", () => {
    const ticks = { ...cur, length: 0.25, pitchDrop: 0.6, drive: 0.25 };
    expect(movesTo(cur, ticks).map((m) => m.id)).toEqual(["length", "pitchDrop"]);
    expect(suggestLine(cur, ticks)).toBe("Length down to 1/8, Pitch drop up to deep. The original bass measures shorter notes and more pitch drop.");
  });
  it("says just the way when the word stays", () => {
    expect(suggestLine(cur, { ...cur, tone: 0.2 })).toBe("Tone down. The original bass measures a darker tone.");
  });
  it("says which ticks a new suggestion moved", () => {
    expect(ticksMoved(cur, { ...cur, tone: 0.5, wobble: 0.3 })).toBe("Ticks moved: Tone, Wobble.");
    expect(ticksMoved(cur, { ...cur, tone: cur.tone + 0.02 })).toBe("The ticks stayed where they were.");
    expect(ticksMoved(null, cur)).toBe("Gold ticks mark those.");
  });
  it("on the ticks, it hands over to the ears", () => {
    expect(suggestLine(cur, { ...cur, tone: cur.tone + 0.05 })).toMatch(/^You're on the gold ticks/);
  });
});
