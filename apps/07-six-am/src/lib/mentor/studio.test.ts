import { describe, expect, it } from "vitest";
import { RECIPES } from "@/lib/recipes";
import { LOOPS } from "@/lib/timeline";
import { CRATE_IDS, crateText, keyNote, realLoops, studioStart } from "./studio";

const track = { bpm: 128.1, bpmAlternative: null, bpmAmbiguous: false, key: "F", scale: "minor" };

describe("studio starting point", () => {
  it("every crate id the prompt offers is a real loop with a recipe", () => {
    expect(CRATE_IDS.size).toBe(LOOPS.length);
    for (const id of CRATE_IDS) expect(RECIPES[id], id).toBeDefined();
    for (const line of crateText().split("\n")) expect(CRATE_IDS.has(line.split(":")[0])).toBe(true);
  });
  it("keeps only real loop ids, once each", () => {
    expect(realLoops(["deep-sub", "made-up-loop", "deep-sub", 7, "chicago-stab"])).toEqual(["deep-sub", "chicago-stab"]);
    expect(realLoops("deep-sub")).toEqual([]);
  });
  it("tempo comes from the analysis; invented loops are dropped", () => {
    const s = studioStart(track, [{ id: "four-to-the-floor", why: "steady kick" }, { id: "jazz-flute", why: "?" }]);
    expect(s.bpm).toBe(128.1);
    expect(s.loops).toEqual([{ id: "four-to-the-floor", why: "steady kick" }]);
  });
  it("uses the Set Studio reading when half/double time is unclear", () => {
    const s = studioStart({ ...track, bpm: 64, bpmAlternative: { bpm: 128, relation: "2:1" }, bpmAmbiguous: true }, []);
    expect(s.bpm).toBe(128);
  });
});

describe("keyNote: the track's key against the crate's A minor (L58)", () => {
  it("A minor is the same key", () => expect(keyNote("A", "minor").relation).toBe("same"));
  it("C major is the relative major", () => expect(keyNote("C", "major").relation).toBe("relative"));
  it("E minor and D minor are neighbours on the wheel", () => {
    expect(keyNote("E", "minor").relation).toBe("neighbour");
    expect(keyNote("D", "minor").relation).toBe("neighbour");
  });
  it("F minor is far: says it clashes, and that the crate stays in A minor", () => {
    const k = keyNote("F", "minor");
    expect(k.relation).toBe("far");
    expect(k.trackKey).toBe("F minor (4A)");
    expect(k.note).toMatch(/4 semitones below A/);
    expect(k.note).toMatch(/no transposing/);
  });
  it("an unknown key says so", () => expect(keyNote("", "").relation).toBe("unknown"));
});
