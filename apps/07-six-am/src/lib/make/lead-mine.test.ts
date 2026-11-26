// Slice 4 (K7): the lead's times on the grid (decision 0011: time logic gets a test).
import { describe, expect, it } from "vitest";
import { foldMelodyRow, type MelNote } from "./melody-make";
import { asPatternNotes, exactPattern } from "./chords-mine";
import { chordToneShare, tooLowForLead, gridOf, gridsFromSaved, leadNoteMatch, leadNotesOf, leadRows, placeNote, stretchNote } from "./lead-mine";

// 120 BPM: a 16th is 0.125 s.
const n = (step: number, off: number, durSteps: number, midi: number): MelNote => ({ t: (step + off) * 0.125, dur: durSteps * 0.125, midi, vel: 1, step, off, durSteps });

describe("gridOf", () => {
  it("puts each note on its nearest 16th of its bar, cut where the next starts, one per 16th (the highest)", () => {
    const read = [n(16, 0.4, 3, 67), n(18, -0.1, 1, 65), n(18, 0, 1, 72), n(31, 0.2, 4, 70)];
    expect(gridOf(read, 1)).toEqual([{ at: 0, len: 2, midi: 67, off: 0.4, vel: 1 }, { at: 2, len: 1, midi: 72, vel: 1 }, { at: 15, len: 1, midi: 70, off: 0.2, vel: 1 }]);
    expect(gridOf(read, 0)).toEqual([]);
  });
  it("a note just before a bar line belongs to the next bar", () => {
    expect(gridOf([n(15, 0.6, 1, 60)], 1)).toEqual([{ at: 0, len: 1, midi: 60, off: -0.4, vel: 1 }]);
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
  it("LD-1: saved == loaded, offsets, lengths and strengths kept", () => {
    const read = [n(1, 0.1, 2.37, 67), n(5, -0.3, 1, 65), n(17, 0.2, 3, 67), n(22, 0, 1.5, 68)].map((x, i) => ({ ...x, vel: [0.63, 0.8, 0.55, 0.9][i] }));
    const saved = exactPattern(read, 32, foldMelodyRow);
    const loaded = leadNotesOf(read, gridsFromSaved(saved.notes, saved.bars, 2), 120, 32);
    expect(asPatternNotes(loaded)).toEqual(asPatternNotes(read));
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

describe("chordToneShare (L-2)", () => {
  it("the stab's bottom voice counts too (T213: Basic Pitch's line on Lost is G2 under each G7 stab)", () => {
    const g7 = [0, 0.5, 1, 1.5].flatMap((t) => [43, 47, 50, 53].map((midi) => ({ t, midi })));
    expect(chordToneShare([0, 0.5, 1, 1.5].map((t) => ({ t, midi: 43 })), g7, chords, tones)).toBe(1);
    expect(tooLowForLead([0, 0.5, 1, 1.5].map((t) => ({ t, midi: 43 })))).toBe(true);
    expect(tooLowForLead([67, 65, 67, 65, 68].map((midi) => ({ midi })))).toBe(false);
  });
  // 120 BPM, one bar of G7 stabbed on each beat (G3 B3 D4 F4), 0.2 s each.
  const chords = { bpm: 120, cells: [{ startStep: 0, steps: 16, name: "G7" }], events: [0, 0.5, 1, 1.5].map((t) => ({ t, dur: 0.2, cell: 0 })) };
  const tones = (n: string) => (n === "G7" ? [7, 11, 2, 5] : []);
  const stabs = [0, 0.5, 1, 1.5].flatMap((t) => [55, 59, 62, 65].map((midi) => ({ t, midi })));
  it("a line that is the stabs' top notes counts in full", () => {
    expect(chordToneShare([0, 0.5, 1, 1.5].map((t) => ({ t, midi: 65 })), stabs, chords, tones)).toBe(1);
  });
  it("a riff alone counts nothing, even on chord tones read from itself", () => {
    const riff = [0, 0.5, 1, 1.5].map((t, i) => ({ t, midi: i % 2 ? 65 : 67 }));
    expect(chordToneShare(riff, riff, chords, tones)).toBe(0);
  });
  it("a riff between the stabs counts nothing; an octave double or a note outside the chord doesn't make a stack", () => {
    const riff = [0.25, 0.75, 1.25, 1.75].map((t) => ({ t, midi: 67 }));
    expect(chordToneShare(riff, [...stabs, ...riff], chords, tones)).toBe(0);
    const oct = [0, 0.5].map((t) => ({ t, midi: 67 }));
    expect(chordToneShare(oct, [...oct, ...oct.map((x) => ({ ...x, midi: 55 }))], { ...chords, events: chords.events }, tones)).toBe(0);
  });
  it("is 0 for an empty line", () => {
    expect(chordToneShare([], stabs, chords, tones)).toBe(0);
  });
});
