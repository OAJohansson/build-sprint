// K10 / H12: the theory facts the server gives the Mentor, on chord/key pairs incl. borrowed chords,
// stepping stones (secondary dominants), the minor key's raised 7th and spelling by key.
import { describe, expect, it } from "vitest";
import { chordFacts, chordFactsLines, chordFactsPlain } from "./chord-facts";

const f = (key: string, scale: "major" | "minor", chord: string, more: { notes?: number[]; prev?: string; next?: string } = {}) => chordFacts({ key, scale, chord, ...more })!;
const row = (key: string, scale: "major" | "minor", chord: string) => { const x = f(key, scale, chord); return [x.chord, x.numeral, x.inKey, x.role, x.borrowed, x.secondaryOf]; };

describe("chord facts (H12)", () => {
  it.each([
    ["C", "major", "C", ["C", "I", true, "home", null, null]],
    ["C", "major", "G7", ["G7", "V7", true, "pull", null, null]],
    ["C", "major", "Dm", ["Dm", "ii", true, "away", null, null]],
    ["C", "major", "Am", ["Am", "vi", true, "soft", null, null]],
    ["C", "major", "F", ["F", "IV", true, "away", null, null]],
    ["C", "major", "Em", ["Em", "iii", true, "soft", null, null]],
    ["C", "major", "Bdim", ["Bdim", "vii°", true, "pull", null, null]],
    ["C", "major", "Cmaj7", ["Cmaj7", "Imaj7", true, "home", null, null]],
    ["C", "major", "Gsus4", ["Gsus4", "Vsus4", true, "pull", null, null]],
    ["C", "major", "Bb", ["B♭", "♭VII", false, "borrowed", "C minor", null]],
    ["C", "major", "Fm", ["Fm", "iv", false, "borrowed", "C minor", null]],
    ["C", "major", "Ab", ["A♭", "♭VI", false, "borrowed", "C minor", null]],
    ["C", "major", "D7", ["D7", "II7", false, "secondary", null, "G"]],
    ["C", "major", "E7", ["E7", "III7", false, "secondary", null, "Am"]],
    ["G", "major", "G7", ["G7", "I7", false, "secondary", null, "C"]],
    ["A", "minor", "Am", ["Am", "i", true, "home", null, null]],
    ["A", "minor", "E7", ["E7", "V7", true, "pull", null, null]],
    ["A", "minor", "Em", ["Em", "v", true, "away", null, null]],
    ["A", "minor", "G", ["G", "VII", true, "pull", null, null]],
    ["A", "minor", "F", ["F", "VI", true, "away", null, null]],
    ["A", "minor", "C", ["C", "III", true, "soft", null, null]],
    ["A", "minor", "D", ["D", "IV", false, "borrowed", "A major", null]],
    ["Ab", "major", "C#", ["D♭", "IV", true, "away", null, null]],
    ["Ab", "major", "Eb", ["E♭", "V", true, "pull", null, null]],
    ["Ab", "major", "Bbm", ["B♭m", "ii", true, "away", null, null]],
    ["F#", "minor", "C#7", ["C♯7", "V7", true, "pull", null, null]],
    ["C", "minor", "Db", ["D♭", "♭II", false, "outside", null, null]],
  ] as const)("%s %s: %s", (key, scale, chord, want) => {
    expect(row(key, scale, chord)).toEqual(want);
  });

  it("lists the tones, marks the ones outside the key, and the piano edits", () => {
    const x = f("G", "major", "G7", { notes: [55, 59, 62, 65, 69] });
    expect(x.tones).toEqual([{ name: "G", role: "root", inKey: true }, { name: "B", role: "third", inKey: true }, { name: "D", role: "fifth", inKey: true }, { name: "F", role: "seventh", inKey: false }]);
    expect(x.outside).toEqual(["F"]);
    expect(x.yourNotes).toEqual({ names: ["G", "B", "D", "F", "A"], added: ["A"], missing: [] });
  });

  it("says how it moves to the chords around it", () => {
    const x = f("C", "major", "G7", { prev: "Dm", next: "C" });
    expect(x.next).toMatchObject({ chord: "C", numeral: "I", shared: 1 });
    expect(x.next!.move).toMatch(/drops a fifth/);
    expect(x.prev).toMatchObject({ chord: "Dm", numeral: "ii", shared: 2 });
  });

  it("refuses what it can't read", () => {
    expect(chordFacts({ key: "H", scale: "major", chord: "C" })).toBeNull();
    expect(chordFacts({ key: "C", scale: "major", chord: "Cadd9" })).toBeNull();
  });

  it("writes prompt lines with glosses and a plain offline answer", () => {
    const x = f("C", "major", "G7", { next: "C" });
    const lines = chordFactsLines(x, 71).join("\n");
    expect(lines).toContain("V7 = the fifth chord of C major");
    expect(lines).toContain("pulls home");
    expect(chordFactsPlain(x)).toBe("G7 is the V7 of C major (its fifth chord): pulls home: tension that wants to resolve to the home chord. All its notes are in the key. Next comes C: its root drops a fifth (up a fourth): the strongest pull, it sounds like arriving, sharing 1 note.");
  });
});
