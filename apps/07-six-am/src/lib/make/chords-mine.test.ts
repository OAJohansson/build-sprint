// Slice 1: the times of Mine's chords once the owner picks a name (withPicks cuts a held chord where the
// next cell now differs). Time logic only (decision 0011); the names and cards aren't unit tested.
import { describe, expect, it } from "vitest";
import type { ChordCell, ChordsReading } from "./chords-read";
import { moveHitTo, timingMatch, addHit, editsFromSaved, foldChordNames, hitsOf, moveHit, picksFromSaved, shortHits, withEdits, withPicks } from "./chords-mine";

const cell = (bar: number, name: string, root: number): ChordCell => ({ bar, startStep: bar * 16, steps: 16, name, root, type: "maj", score: 1, alternatives: [] });
// 120 BPM: a 16th is 0.125 s, a bar 2 s. Two bars of G held as one pad from 0 s to 4 s.
const pad = (): ChordsReading => ({
  reader: "dsp", bpm: 120, steps: 32, bars: 2, register: 60, tuningCents: 0,
  cells: [cell(0, "G", 7), cell(1, "G", 7)],
  events: [{ t: 0, dur: 4, step: 0, off: 0, cell: 0, struck: false, held: true, vel: 0.8 }],
});

describe("withPicks", () => {
  it("leaves the events alone with no picks", () => {
    expect(withPicks(pad(), {}).events).toEqual(pad().events);
  });
  it("cuts a held chord at the bar line when the next bar's chord is changed", () => {
    const r = withPicks(pad(), { 1: "C" });
    expect(r.cells[1].name).toBe("C");
    expect(r.events.map((e) => [e.t, e.dur, e.cell, e.step, e.held])).toEqual([[0, 2, 0, 0, true], [2, 2, 1, 16, true]]);
  });
  it("keeps a stab just before the bar line in its own cell, on time", () => {
    const c = pad();
    c.events = [{ t: 1.9, dur: 0.2, step: 15, off: 0.2, cell: 0, struck: true, held: false, vel: 1 }];
    const r = withPicks(c, { 1: "C" });
    expect(r.events.map((e) => [e.t, e.dur, e.cell])).toEqual([[1.9, 0.1, 0], [2, 0.1, 1]]);
    expect(r.events[0].struck).toBe(true);
  });
  it("handles an empty loop", () => {
    const c = { ...pad(), cells: [], events: [] };
    expect(withPicks(c, { 0: "C" }).events).toEqual([]);
  });
});

describe("saved names", () => {
  it("fold to the repeat and come back onto the cells", () => {
    const cells = [cell(0, "G", 7), cell(1, "C", 0), cell(2, "G", 7), cell(3, "C", 0)];
    const marks = foldChordNames(cells, 2);
    expect(marks).toEqual([{ step: 0, steps: 16, name: "G" }, { step: 16, steps: 16, name: "C" }]);
    const read = [cell(0, "G", 7), cell(1, "G", 7), cell(2, "G", 7), cell(3, "G", 7)];
    expect(picksFromSaved(read, marks, 2)).toEqual({ 1: "C", 3: "C" });
  });
});

// Slice 2 (K6): the owner's own hits in a cell, on the 16th grid (120 BPM: a 16th is 0.125 s).
describe("withEdits: own hits", () => {
  it("plays exactly the cell's own hits and stops a chord held into it at its line", () => {
    const r = withEdits(pad(), { 1: { hits: [{ at: 0, len: 1 }, { at: 6, len: 2, off: -0.2 }] } });
    expect(r.events.map((e) => [e.t, e.dur, e.cell, e.struck, e.held])).toEqual([[0, 2, 0, false, true], [2, 0.125, 1, true, false], [2.725, 0.25, 1, true, false]]);
    expect(r.events[2].step).toBe(22);
    expect(r.events[2].off).toBe(-0.2);
  });
  it("a hit 1.5 beats or longer is held; a hit at the loop's start before the line is clamped to 0", () => {
    const r = withEdits(pad(), { 0: { hits: [{ at: 0, len: 6, off: -0.3 }] } });
    expect(r.events[0]).toMatchObject({ t: 0, held: true, struck: false, cell: 0 });
  });
  it("own notes on the next cell cut a held chord like a new name does", () => {
    const r = withEdits(pad(), { 1: { notes: [55, 59, 62, 65] } });
    expect(r.events.map((e) => [e.t, e.dur, e.cell])).toEqual([[0, 2, 0], [2, 2, 1]]);
  });
  it("shows a cell's hits on the grid, offsets kept, and falls back to four on the beats", () => {
    const c = pad();
    c.events = [{ t: 1.9, dur: 0.25, step: 15, off: 0.2, cell: 0, struck: true, held: false, vel: 1 }, { t: 0.5, dur: 0.25, step: 4, off: 0, cell: 0, struck: true, held: false, vel: 1 }];
    expect(hitsOf(c, 0)).toEqual([{ at: 4, len: 2 }, { at: 15, len: 1, off: 0.2 }]);
    expect(shortHits(c, 1)).toEqual([{ at: 4, len: 2 }, { at: 15, len: 1, off: 0.2 }]);
    expect(shortHits({ ...pad(), events: [] }, 0)).toEqual([0, 4, 8, 12].map((at) => ({ at, len: 1 })));
  });
});

describe("timing moves", () => {
  const hs = [{ at: 0, len: 2 }, { at: 4, len: 1 }];
  it("moves, stretches and removes within the cell and around other hits", () => {
    expect(moveHit(hs, 1, "later", 16)).toEqual([{ at: 0, len: 2 }, { at: 5, len: 1 }]);
    expect(moveHit(hs, 1, "earlier", 16)).toEqual([{ at: 0, len: 2 }, { at: 3, len: 1 }]);
    expect(moveHit(hs, 0, "longer", 16)).toEqual([{ at: 0, len: 3 }, { at: 4, len: 1 }]);
    expect(moveHit(hs, 0, "remove", 16)).toEqual([{ at: 4, len: 1 }]);
  });
  it("refuses at the edges: before the bar, past its end, into a neighbour, under one 16th", () => {
    expect(moveHit(hs, 0, "earlier", 16)).toBeNull();
    expect(moveHit([{ at: 15, len: 1 }], 0, "later", 16)).toBeNull();
    expect(moveHit([{ at: 0, len: 4 }, { at: 4, len: 1 }], 0, "longer", 16)).toEqual([{ at: 0, len: 5 }, { at: 5, len: 1 }]); // S2-5: pushes the next later
    expect(moveHit([{ at: 0, len: 15 }, { at: 15, len: 1 }], 0, "longer", 16)).toBeNull(); // no room left in the bar
    expect(moveHit(hs, 1, "shorter", 16)).toBeNull();
    expect(addHit(hs, 1, 16)).toBeNull();
    expect(addHit(hs, 8, 16)).toEqual([...hs, { at: 8, len: 1 }]);
  });
});

describe("saved edits", () => {
  it("fold notes and hits with the names and come back onto the cells", () => {
    const cells = [cell(0, "G", 7), cell(1, "C", 0)];
    const edits = { 1: { name: "C", notes: [60, 64, 67, 71], hits: [{ at: 0, len: 16 }] } };
    const marks = foldChordNames(cells, 2, edits);
    expect(marks).toEqual([{ step: 0, steps: 16, name: "G" }, { step: 16, steps: 16, name: "C", notes: [60, 64, 67, 71], hits: [{ at: 0, len: 16 }] }]);
    const back = editsFromSaved([cell(0, "G", 7), cell(1, "G", 7)], marks, 2);
    expect(back).toEqual({ 1: { name: "C", notes: [60, 64, 67, 71], hits: [{ at: 0, len: 16 }] } });
  });
});

describe("S2: drag and timing score", () => {
  it("drags a hit to another 16th when there is room", () => {
    expect(moveHitTo([{ at: 0, len: 1 }, { at: 4, len: 1 }], 0, 8, 16)).toEqual([{ at: 4, len: 1 }, { at: 8, len: 1 }]);
    expect(moveHitTo([{ at: 0, len: 1 }, { at: 4, len: 1 }], 0, 4, 16)).toBeNull();
  });
  it("scores onsets: all on time 100, one moved off, one missing, held for four", () => {
    const read = [0, 0.5, 1, 1.5].map((t) => ({ t }));
    expect(timingMatch(read, read, 0.04)).toBe(100);
    expect(timingMatch(read, [0, 0.5, 1, 1.625].map((t) => ({ t })), 0.04)).toBe(75);
    expect(timingMatch(read, [0, 0.5, 1].map((t) => ({ t })), 0.04)).toBe(85.7);
    expect(timingMatch(read, [{ t: 0 }], 0.04)).toBe(40);
    expect(timingMatch([], [], 0.04)).toBeNull();
  });
});
