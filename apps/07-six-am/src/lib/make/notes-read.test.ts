import { describe, expect, it } from "vitest";
import { CHORD_SPECS, DRUM_SPECS, renderChordPart, renderDrums, scoreNotes } from "./layers-bench";
import { readNotes } from "./notes-read";

const RATE = 44100;

describe("readNotes", () => {
  it("reads offbeat chord stabs: every pitch class, on time, nothing extra", () => {
    const spec = { ...CHORD_SPECS[0], bars: 2 };
    const { mono, truth } = renderChordPart(spec, { rate: RATE, seed: 1 });
    const r = readNotes(mono, undefined, RATE, spec.bpm, spec.key);
    const s = scoreNotes(truth, r.notes);
    expect(s.pcFound).toBeGreaterThanOrEqual(0.9);
    expect(s.wrong).toBeLessThanOrEqual(0.1);
    expect(s.p95AbsMs).toBeLessThanOrEqual(30);
    expect(r.notes[0].step).toBe(2);
  });

  it("reads a held pad as one note per pitch, not many", () => {
    const spec = { ...CHORD_SPECS[2], bars: 4 };
    const { mono, truth } = renderChordPart(spec, { rate: RATE, seed: 2 });
    const r = readNotes(mono, undefined, RATE, spec.bpm, spec.key);
    expect(r.notes.length).toBeLessThanOrEqual(truth.length + 1);
  });

  it("returns no notes for a silent or empty loop", () => {
    for (const x of [new Float32Array(RATE * 4), new Float32Array(0)]) expect(readNotes(x, x, RATE, 124).notes).toEqual([]);
  });

  it("finds (almost) no notes in a hats-only loop", () => {
    const { mono } = renderDrums(DRUM_SPECS[5], { bars: 2, rate: RATE, seed: 3 });
    expect(readNotes(mono, undefined, RATE, 124).notes.length).toBeLessThanOrEqual(2);
  });
});
