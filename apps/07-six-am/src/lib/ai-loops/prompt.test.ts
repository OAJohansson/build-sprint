import { describe, expect, it } from "vitest";
import { bassLoopRequest, keyPhrase, loopSeconds, scaleNotes } from "./prompt";

// The prompt string decides whether the loop comes back in minor (L124), so it's pinned here.
describe("bass loop prompt", () => {
  it("spells out a minor key with its notes and the minor third", () => {
    expect(keyPhrase("D#", "minor")).toBe(
      "in D# minor: a dark natural-minor bassline rooted on D#, using only the notes D# F F# G# A# B C# (minor third F#, no major third)",
    );
    expect(scaleNotes("A", "minor")).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
  });

  it("spells out a major key, and reads flats as sharps", () => {
    expect(keyPhrase("C", "major")).toBe(
      "in C major: a bright major-key bassline rooted on C, using only the notes C D E F G A B (major third E, no minor third)",
    );
    expect(scaleNotes("Eb", "minor")?.[0]).toBe("D#");
  });

  it("falls back to the plain key for an unknown root", () => {
    expect(keyPhrase("H", "minor")).toBe("in H minor");
  });

  it("builds the full request from an analysis", () => {
    const r = bassLoopRequest({ bpm: 123.6, key: "F", scale: "minor", genres: [{ style: "Electronic---Tech House", p: 0.6 }] }, 8, 42);
    expect(r).toMatchObject({ bpm: 124, key: "F", scale: "minor", bars: 8, seed: 42 });
    expect(r.prompt).toBe(
      "Tech House bass loop. Solo bassline only: no drums, no percussion, no chords, no vocals. " +
        "124 BPM, in F minor: a dark natural-minor bassline rooted on F, using only the notes F G G# A# C C# D# (minor third G#, no major third). " +
        "8 bars of 4/4, a seamless loop that repeats cleanly. Tight, groovy, clean studio mix.",
    );
    expect(loopSeconds(124, 8)).toBe(15.484);
  });
});
