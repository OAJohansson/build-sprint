// S3-N2: Mine stays silent where the original part is silent.
import { describe, expect, it } from "vitest";
import { activeBars, barLevelsDb, gateNotes } from "./gate";
import { runMakeJob } from "./jobs";
import { MAKE_PRESETS, synthParams } from "./presets";
import { renderBass, secondsPer16th, type MakeNote } from "./render";

const RATE = 22050;
const fig = (bar: number): MakeNote[] => [2, 6, 10, 14].map((s) => ({ step: bar * 16 + s, midi: 33, dur: 2, vel: 0.9 }));

describe("gating Mine by the original's bars", () => {
  it("measures each bar and marks the quiet ones", () => {
    // 4 bars, the bass plays in bars 0, 1 and 3 (bar 2 is a gap).
    const r = renderBass([...fig(0), ...fig(1), ...fig(3)], synthParams("round-sub", MAKE_PRESETS["round-sub"].macros), { bpm: 124, steps: 64, rate: RATE });
    const lv = barLevelsDb(r.left, r.right, RATE, 124);
    expect(lv).toHaveLength(4);
    expect(activeBars(lv)).toEqual([true, true, false, true]);
  });
  it("an all-silent loop has no active bars; a soft but steady part stays active", () => {
    expect(activeBars([-200, -200])).toEqual([false, false]);
    expect(activeBars([-30, -32, -31])).toEqual([true, true, true]);
    expect(activeBars([-20, -45, -21])).toEqual([true, false, true]);
  });
  it("drops notes in silent bars and cuts one that would ring into them", () => {
    const notes: MakeNote[] = [{ step: 0, midi: 33, dur: 4, vel: 1 }, { step: 12, midi: 33, dur: 8, vel: 1 }, { step: 20, midi: 33, dur: 4, vel: 1 }, { step: 36, midi: 36, dur: 4, vel: 1 }];
    expect(gateNotes(notes, [true, false, true])).toEqual([{ step: 0, midi: 33, dur: 4, vel: 1 }, { step: 12, midi: 33, dur: 4, vel: 1 }, { step: 36, midi: 36, dur: 4, vel: 1 }]);
    expect(gateNotes(notes, null)).toBe(notes);
  });
  it("the read finds the gap and Mine is silent there", () => {
    const o = renderBass([...fig(0), ...fig(1), ...fig(3)], synthParams("round-sub", MAKE_PRESETS["round-sub"].macros), { bpm: 124, steps: 64, rate: RATE });
    const read = runMakeJob({ type: "read", id: 1, left: o.left, right: o.right, rate: RATE, bpm: 124, key: "A", scale: "minor" }).res;
    if (read.type !== "read" || !read.reading) throw new Error("no reading");
    expect(read.active).toEqual([true, true, false, true]);
    const { res } = runMakeJob({ type: "render", id: 2, reading: read.reading, active: read.active, preset: "reese", macros: MAKE_PRESETS.reese.macros, bpm: 124, rate: RATE, levelDb: read.levelDb, samples: o.left.length });
    if (res.type !== "render") throw new Error(res.type);
    const bar = Math.round(secondsPer16th(124) * 16 * RATE);
    const lv = barLevelsDb(res.left, res.right, RATE, 124);
    // Only the last note's release rings into the gap: far under the bars that play.
    expect(lv[2]).toBeLessThan(lv[1] - 15);
    expect(lv[2]).toBeLessThan(lv[3] - 15);
    expect(res.left.length).toBe(o.left.length); // the loop's own length
    expect(Math.abs(o.left.length - 4 * bar)).toBeLessThanOrEqual(4);
  });
});
