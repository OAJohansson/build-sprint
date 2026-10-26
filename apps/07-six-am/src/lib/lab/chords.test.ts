import { describe, expect, it } from "vitest";
import { ChordCells, chordCell, chordFromChroma } from "./chords";

const RATE = 44100;
const midiHz = (m: number) => 440 * 2 ** ((m - 69) / 12);
/** Sine tones at MIDI notes, `sec` long. */
function tones(notes: number[], sec: number) {
  const a = new Float32Array(Math.round(sec * RATE));
  for (const m of notes) { const f = midiHz(m); for (let i = 0; i < a.length; i++) a[i] += Math.sin((2 * Math.PI * f * i) / RATE) / notes.length; }
  return a;
}

describe("chordFromChroma", () => {
  it("names a minor and a major triad", () => {
    const am = new Array(12).fill(0.02); am[9] = 1; am[0] = 0.8; am[4] = 0.8; // A C E
    expect(chordFromChroma(am)).toBe("Am");
    const f = new Array(12).fill(0.02); f[5] = 1; f[9] = 0.8; f[0] = 0.8; // F A C
    expect(chordFromChroma(f)).toBe("F");
  });
  it("says nothing for silence or a flat spectrum", () => {
    expect(chordFromChroma(new Array(12).fill(0))).toBe("");
    expect(chordFromChroma(new Array(12).fill(1))).toBe("");
  });
});

describe("ChordCells", () => {
  it("one chord per 8 bars, named once half the cell is heard", () => {
    // 120 BPM: a bar is 2 s, a cell 16 s. Bass A2 + A minor triad, then F major.
    const c = new ChordCells(16, 120, 0);
    expect(c.cells).toEqual([null, null]);
    c.add(tones([45, 57, 60, 64], 6), RATE, 0); // 6 s of cell 0: not enough yet
    expect(c.cells[0]).toBeNull();
    c.add(tones([45, 57, 60, 64], 4), RATE, 6);
    expect(c.cells[0]).toBe("Am");
    c.add(tones([41, 53, 57, 60], 10), RATE, 16);
    expect(c.cells).toEqual(["Am", "F"]);
  });
  it("keeps chords already known and ignores audio before bar 1", () => {
    const c = new ChordCells(16, 120, 4, ["C", null]);
    expect(chordCell(2, 120, 4)).toBeNull();
    c.add(tones([48, 60, 64, 67], 3), RATE, 0);
    expect(c.cells).toEqual(["C", null]);
  });
});
