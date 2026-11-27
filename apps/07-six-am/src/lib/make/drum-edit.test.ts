import { describe, expect, it } from "vitest";
import { NO_EDITS, copyBar, editsFor, heardRows, playedHits, restoreRow, savedOnLoop, stepKinds, toggleStep, unfoldSteps } from "./drum-edit";
import { foldRow, type RowHit } from "./drums-make";

const sps = 60 / 124 / 4;
const hit = (step: number, vel = 1, off = 0): RowHit => ({ step, off, vel, t: step * sps, db: -3, faint: false });
/** Four-on-the-floor over 8 bars (128 16ths), as the reader returns it. */
const kicks = Array.from({ length: 32 }, (_, i) => hit(i * 4, 0.8));
/** What a saved pattern plays over the loop: its notes repeated to `steps`. */
const unfold = (f: { bars: number; notes: { step: number }[] }, steps: number) => {
  const out: number[] = [];
  for (let a = 0; a < steps; a += f.bars * 16) for (const n of f.notes) if (a + n.step < steps) out.push(a + n.step);
  return out.sort((x, y) => x - y);
};

describe("fix by ear: a tap adds or takes out a hit, a second tap undoes it (R4, L272)", () => {
  it("taps on a read hit and on an empty step, then undoes both", () => {
    let e = toggleStep(NO_EDITS, kicks, 4, 128); // take out a read kick
    e = toggleStep(e, kicks, 6, 128); // add one
    expect(e).toEqual({ added: [6], removed: [4] });
    const k = stepKinds(kicks, e);
    expect([k.get(0), k.get(4), k.get(6), k.get(5)]).toEqual(["read", "removed", "added", undefined]);
    const played = playedHits(kicks, e, { gridMs: 10, sps });
    expect(played.map((h) => h.step).slice(0, 4)).toEqual([0, 6, 8, 12]);
    // The added hit is on its step, at the row's usual loudness.
    expect(played[1]).toMatchObject({ step: 6, off: 0, vel: 0.8 });
    expect(played[1].t).toBeCloseTo(0.01 + 6 * sps, 4);
    e = toggleStep(toggleStep(e, kicks, 4, 128), kicks, 6, 128);
    expect(e).toEqual(NO_EDITS);
  });

  it("edges: a step outside the loop does nothing; an empty row (shaker, ride) fills by ear", () => {
    expect(toggleStep(NO_EDITS, kicks, 128, 128)).toBe(NO_EDITS);
    expect(toggleStep(NO_EDITS, kicks, -1, 128)).toBe(NO_EDITS);
    const shaker = toggleStep(toggleStep(NO_EDITS, [], 2, 64), [], 3, 64);
    expect(playedHits([], shaker, { gridMs: 0, sps }).map((h) => [h.step, h.vel])).toEqual([[2, 0.9], [3, 0.9]]);
  });

  it("mute and solo only choose which rows are heard", () => {
    const rows = ["kick", "clap", "hat"] as const;
    expect(heardRows(rows, { clap: true }, {})).toEqual({ kick: true, clap: false, hat: true });
    expect(heardRows(rows, { clap: true }, { hat: true })).toEqual({ kick: false, clap: false, hat: true });
    expect(heardRows(rows, {}, {})).toEqual({ kick: true, clap: true, hat: true });
  });
});

describe("what plays is what is saved (W6)", () => {
  it("an unedited four-on-the-floor still saves as one bar", () => {
    const f = foldRow("kick", playedHits(kicks, NO_EDITS, { gridMs: 0, sps }), 128);
    expect(f.bars).toBe(1);
    expect(unfold(f, 128)).toEqual(kicks.map((h) => h.step));
  });

  it("a hit taken out of every bar saves as one bar without it", () => {
    let e = NO_EDITS;
    for (let b = 0; b < 8; b++) e = toggleStep(e, kicks, b * 16 + 12, 128);
    const played = playedHits(kicks, e, { gridMs: 0, sps });
    const f = foldRow("kick", played, 128);
    expect(f).toMatchObject({ bars: 1 });
    expect(unfold(f, 128)).toEqual(played.map((h) => h.step));
  });

  it("a hit added in bar 7 only keeps the whole 8 bars, so nothing played is lost", () => {
    const e = toggleStep(NO_EDITS, kicks, 6 * 16 + 14, 128);
    const played = playedHits(kicks, e, { gridMs: 0, sps });
    const f = foldRow("kick", played, 128);
    expect(f.bars).toBe(8);
    expect(unfold(f, 128)).toEqual(played.map((h) => h.step));
  });

  it("a 2-bar pattern by ear on an empty shaker row saves as 2 bars", () => {
    let e = NO_EDITS;
    for (let b = 0; b < 4; b++) for (const s of [2, 6, 10, 14, ...(b % 2 ? [15] : [])]) e = toggleStep(e, [], b * 16 + s, 64);
    const played = playedHits([], e, { gridMs: 0, sps });
    const f = foldRow("perc", played, 64);
    expect(f.bars).toBe(2);
    expect(f.notes[0].midi).toBe(70);
    expect(unfold(f, 64)).toEqual(played.map((h) => h.step));
  });

  it("an empty row saves nothing; an odd 3-bar loop falls back to the closest repeat", () => {
    expect(foldRow("ride", [], 64)).toEqual({ bars: 1, notes: [] });
    const three = Array.from({ length: 12 }, (_, i) => hit(i * 4));
    expect(foldRow("kick", [...three, hit(41)], 48).bars).toBe(1);
  });
});

describe("slice 2 fix round", () => {
  it("rebuilds a row's edits from its steps, against a reading that differs a little (L288)", () => {
    const steps = [0, 6, 8, 12];
    const e = editsFor(kicks.slice(0, 4), steps, 128);
    expect(e).toEqual({ added: [6], removed: [4] });
    expect(playedHits(kicks.slice(0, 4), e, { gridMs: 0, sps }).map((h) => h.step)).toEqual(steps);
    // A step outside the loop is dropped.
    expect(editsFor([], [3, 200], 64)).toEqual({ added: [3], removed: [] });
  });

  it("a saved 1-bar row unfolds over an 8-bar loop", () => {
    expect(unfoldSteps({ bars: 1, notes: [{ step: 0 }, { step: 8 }] }, 48)).toEqual([0, 8, 16, 24, 32, 40]);
    expect(unfoldSteps({ bars: 4, notes: [] }, 128)).toEqual([]);
  });

  it("copies one bar to every bar (U7-14), and a bar outside the loop does nothing", () => {
    const shaker = toggleStep(toggleStep(NO_EDITS, [], 2, 64), [], 7, 64);
    const all = copyBar([], shaker, 0, 64, { gridMs: 0, sps });
    expect(playedHits([], all, { gridMs: 0, sps }).map((h) => h.step)).toEqual([2, 7, 18, 23, 34, 39, 50, 55]);
    expect(copyBar([], shaker, 9, 64, { gridMs: 0, sps })).toBe(shaker);
    // A read row: bar 1's missing kick is filled in every bar.
    const e = toggleStep(NO_EDITS, kicks, 4, 128);
    const c = copyBar(kicks, e, 0, 128, { gridMs: 0, sps });
    expect(playedHits(kicks, c, { gridMs: 0, sps }).filter((h) => h.step % 16 === 4)).toHaveLength(0);
  });

  it("a save on one loop is not this loop's (D7-11): Save on a new loop adds, never renames", () => {
    const rec = { id: "a", sound: "kick-x|1", name: "Kick from A", steps: "0.4", loopKey: "100-200" };
    expect(savedOnLoop(rec, "100-200")).toBe(rec);
    expect(savedOnLoop(rec, "300-400")).toBeNull();
    expect(savedOnLoop(null, "100-200")).toBeNull();
  });
});

describe("L294: an edited row comes back exactly as left (restoreRow)", () => {
  const o = { gridMs: 10, sps };
  // The owner took out the kick on 4 and added one on 6; the row played these steps.
  const taps = { added: [6], removed: [4] };
  const stepsLeft = playedHits(kicks, taps, o).map((h) => h.step);
  it("plays the stored steps exactly on a new reading that hears more, marks only the owner's taps", () => {
    const reread = [...kicks, hit(2, 0.5), hit(10, 0.5)]; // the new capture hears two extra kicks
    const r = restoreRow(reread, { edits: taps, played: stepsLeft }, 128, o);
    expect(playedHits(r.base!, r.edits, o).map((h) => h.step)).toEqual(stepsLeft);
    expect(r.edits).toEqual(taps);
    const k = stepKinds(r.base!, r.edits);
    expect([k.get(2), k.get(4), k.get(6), k.get(10)]).toEqual([undefined, "removed", "added", undefined]);
  });
  it("and on one that hears less: a missing baseline hit is placed on its step at the row's loudness", () => {
    const reread = kicks.filter((h) => h.step !== 8);
    const r = restoreRow(reread, { edits: taps, played: stepsLeft }, 128, o);
    expect(playedHits(r.base!, r.edits, o).map((h) => h.step)).toEqual(stepsLeft);
    expect(r.base!.find((h) => h.step === 8)).toMatchObject({ off: 0, vel: 0.8 });
    expect(r.base!.find((h) => h.step === 0)).toBe(reread[0]); // a hit still heard keeps the reading's timing
  });
  it("a row left as read (taps undone) still plays its stored steps", () => {
    const reread = [...kicks, hit(2)];
    const r = restoreRow(reread, { edits: NO_EDITS, played: kicks.map((h) => h.step) }, 128, o);
    expect(playedHits(r.base!, r.edits, o).map((h) => h.step)).toEqual(kicks.map((h) => h.step));
    expect(r.edits).toEqual(NO_EDITS);
  });
  it("reads the older shapes: taps only follow the new reading; played only becomes the difference", () => {
    const reread = [...kicks, hit(6)];
    expect(restoreRow(reread, { edits: taps }, 128, o)).toEqual({ base: null, edits: { added: [], removed: [4] } });
    const v1 = restoreRow(reread, { played: stepsLeft }, 128, o);
    expect(v1.base).toBeNull();
    expect(playedHits(reread, v1.edits, o).map((h) => h.step)).toEqual(stepsLeft);
  });
  it("a row never touched, and steps outside the loop, are ignored", () => {
    expect(restoreRow(kicks, undefined, 128, o)).toEqual({ base: null, edits: NO_EDITS });
    const r = restoreRow(kicks, { edits: { added: [6, 999] }, played: [...stepsLeft, -1, 500] }, 128, o);
    expect(playedHits(r.base!, r.edits, o).map((h) => h.step)).toEqual(stepsLeft);
  });
});
