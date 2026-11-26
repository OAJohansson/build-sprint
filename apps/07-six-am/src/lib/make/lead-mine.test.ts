// Slice 4 (K7): the lead's times on the grid (decision 0011: time logic gets a test).
import { describe, expect, it } from "vitest";
import type { MelNote } from "./melody-make";
import { gridOf, gridsFromSaved, leadNoteMatch, leadNotesOf, leadRows, placeNote, stretchNote } from "./lead-mine";

// 120 BPM: a 16th is 0.125 s.
const n = (step: number, off: number, durSteps: number, midi: number): MelNote => ({ t: (step + off) * 0.125, dur: durSteps * 0.125, midi, vel: 1, step, off, durSteps });

describe("gridOf", () => {
  it("puts each note on its nearest 16th of its bar, cut where the next starts, one per 16th (the highest)", () => {
    const read = [n(16, 0.4, 3, 67), n(18, -0.1, 1, 65), n(18, 0, 1, 72), n(31, 0.2, 4, 70)];
    expect(gridOf(read, 1)).toEqual([{ at: 0, len: 2, midi: 67 }, { at: 2, len: 1, midi: 72 }, { at: 15, len: 1, midi: 70 }]);
    expect(gridOf(read, 0)).toEqual([]);
  });
  it("a note just before a bar line belongs to the next bar", () => {
    expect(gridOf([n(15, 0.6, 1, 60)], 1)).toEqual([{ at: 0, len: 1, midi: 60 }]);
  });
});

describe("editing a bar", () => {
  it("a new note replaces what sounds on its 16th and stops a longer one before it", () => {
    const r = placeNote([{ at: 0, len: 4, midi: 60 }], 62, 2);
    expect(r.notes).toEqual([{ at: 0, len: 2, midi: 60 }, { at: 2, len: 1, midi: 62 }]);
    expect(r.sel).toBe(1);
    expect(placeNote(r.notes, 62, 2)).toMatchObject({ sel: 1, placed: false });
  });
  it("stretches within the bar and up to the next note", () => {
    const ns = [{ at: 0, len: 1, midi: 60 }, { at: 2, len: 1, midi: 62 }];
    expect(stretchNote(ns, 0, 1)).toEqual([{ at: 0, len: 2, midi: 60 }, ns[1]]);
    expect(stretchNote([{ at: 0, len: 2, midi: 60 }, ns[1]], 0, 1)).toBeNull();
    expect(stretchNote(ns, 0, -1)).toBeNull();
    expect(stretchNote([{ at: 15, len: 1, midi: 60 }], 0, 1)).toBeNull();
  });
});

describe("leadNotesOf", () => {
  it("plays an edited bar's grid on the 16ths and the other bars as read", () => {
    const read = [n(1, 0.2, 2, 67), n(17, -0.3, 2, 65)];
    const out = leadNotesOf(read, { 1: [{ at: 4, len: 2, midi: 70 }] }, 120, 32);
    expect(out.map((x) => [x.t, x.dur, x.midi, x.step])).toEqual([[0.15, 0.25, 67, 1], [2.5, 0.25, 70, 20]]);
  });
  it("handles an empty line and an empty bar grid", () => {
    expect(leadNotesOf([], {}, 120, 32)).toEqual([]);
    expect(leadNotesOf([n(17, 0, 1, 60)], { 1: [] }, 120, 32)).toEqual([]);
  });
});

describe("saved lead", () => {
  it("comes back on every bar by its place in the repeat", () => {
    const g = gridsFromSaved([{ step: 2, midi: 67, dur: 2 }, { step: 20, midi: 65, dur: 1 }], 2, 4);
    expect(g[2]).toEqual([{ at: 2, len: 2, midi: 67 }]);
    expect(g[3]).toEqual([{ at: 4, len: 1, midi: 65 }]);
  });
});

describe("leadRows", () => {
  it("shows the key's notes over the line (7 at least), or every note with the switch", () => {
    const cMajor = [0, 2, 4, 5, 7, 9, 11];
    expect(leadRows([67, 72], cMajor, false)).toEqual([74, 72, 71, 69, 67, 65, 64]);
    expect(leadRows([67, 72], cMajor, false).length).toBeGreaterThanOrEqual(7);
    expect(leadRows([67, 72], cMajor, false).every((m) => cMajor.includes(m % 12))).toBe(true);
    expect(leadRows([67, 68], cMajor, false)).toContain(68); // an outside note in the line keeps its row
    expect(leadRows([67, 72], cMajor, true).length).toBeGreaterThanOrEqual(12);
  });
});

describe("leadNoteMatch (L-4)", () => {
  it("counts a note only when it starts on time with the right pitch", () => {
    const read = [{ t: 0, midi: 67 }, { t: 0.5, midi: 65 }, { t: 1, midi: 67 }, { t: 1.5, midi: 69 }];
    expect(leadNoteMatch(read, read, 0.06)).toBe(100);
    expect(leadNoteMatch(read, [read[0], read[1], { t: 1, midi: 69 }, read[3]], 0.06)).toBe(75); // a wrong pitch
    expect(leadNoteMatch(read, [read[0], read[1], { t: 1, midi: 79 }, read[3]], 0.06)).toBe(100); // an octave up still counts
    expect(leadNoteMatch(read, [read[0], read[1], { t: 1.2, midi: 67 }, read[3]], 0.06)).toBe(75); // late
    expect(leadNoteMatch([], [], 0.06)).toBeNull();
  });
});
