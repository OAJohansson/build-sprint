// Slice 1: the times of Mine's chords once the owner picks a name (withPicks cuts a held chord where the
// next cell now differs). Time logic only (decision 0011); the names and cards aren't unit tested.
import { describe, expect, it } from "vitest";
import type { ChordCell, ChordsReading } from "./chords-read";
import { foldChordNames, picksFromSaved, withPicks } from "./chords-mine";

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
