// Library sounds in a Studio track (S5): transposition, tempo, block length, the render in key and
// on tempo (X3's bars: every note in the track's scale, onsets within 5 ms), the drop, saved docs.
import { describe, expect, it } from "vitest";
import { dropLibSound } from "@/lib/studio-drop";
import { parseDoc } from "@/lib/tracks";
import { buildSoundIndex } from "@/lib/synths/schedule";
import { inScale, midiToHz, pitchClass, type Scale } from "@/lib/synths/theory";
import type { Doc } from "@/lib/timeline";
import type { LibrarySound } from "./library";
import { LIB_LEVEL_DB, levelled, midRmsDb, dropLength, editLibLoop, libLoopFrom, notesInKey, parseLibLoop, passSignature, phraseStart, renderLibPass, transposeSemis } from "./lib-loop";
import { pitchHz } from "./pattern";
import { secondsPer16th } from "./render";

const RATE = 22050;
const KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const muted = [false, false, false, false];

// A rubbery bass saved in A minor at 124 BPM: A1, C2, E1, G1 on a 2-bar pattern.
const SOUND: LibrarySound = {
  id: "0f8fad5b-d9cb-469f-a165-70867728950e", name: "Rubbery bass, from It Just Won't Do", part: "bass", preset: "rubber-pluck",
  macros: { tone: 0.4, length: 0.3, pitchDrop: 0, drive: 0.15, wobble: 0, width: 0.1 },
  pattern: { bars: 2, notes: [{ step: 0, midi: 33, dur: 2, vel: 0.9 }, { step: 6, midi: 36, dur: 2, vel: 0.8 }, { step: 16, midi: 28, dur: 2, vel: 0.9 }, { step: 22, midi: 31, dur: 2, vel: 0.8 }] },
  key: "A", scale: "minor", bpm: 124, source: null, tags: ["bass"], createdAt: "", updatedAt: "",
};

describe("transposing to the track's key", () => {
  it("moves tonic onto tonic the nearest way (−6…+5)", () => {
    const am = { key: "A", scale: "minor" as Scale };
    expect(transposeSemis(am, { key: "A", scale: "minor" })).toBe(0);
    expect(transposeSemis(am, { key: "C", scale: "minor" })).toBe(3);
    expect(transposeSemis(am, { key: "F", scale: "minor" })).toBe(-4);
    expect(transposeSemis(am, { key: "D#", scale: "minor" })).toBe(-6);
    expect(transposeSemis(am, { key: "Eb", scale: "minor" })).toBe(-6);
    expect(transposeSemis(am, { key: "G#", scale: "minor" })).toBe(-1);
  });
  it("a minor line in a major track goes to its relative minor (and back)", () => {
    expect(transposeSemis({ key: "A", scale: "minor" }, { key: "C", scale: "major" })).toBe(0);
    expect(transposeSemis({ key: "A", scale: "minor" }, { key: "G", scale: "major" })).toBe(-5); // E minor
    expect(transposeSemis({ key: "C", scale: "major" }, { key: "A", scale: "minor" })).toBe(0);
    expect(transposeSemis({ key: "F", scale: "major" }, { key: "E", scale: "minor" })).toBe(2); // G major
  });
  it("every note lands in the track's scale, in every key and both scales", () => {
    const withPassing = { ...SOUND, pattern: { bars: 2 as const, notes: [...SOUND.pattern.notes, { step: 30, midi: 32, dur: 1, vel: 0.5 }] } };
    for (const k of KEYS) for (const sc of ["major", "minor"] as Scale[]) {
      for (const n of notesInKey(withPassing, k, sc)) expect(inScale(n.midi, pitchClass(k)!, sc)).toBe(true);
    }
  });
  it("keeps the line's shape (intervals) when it was in key", () => {
    const n = notesInKey(SOUND, "C", "minor").map((x) => x.midi);
    expect(n).toEqual([36, 39, 31, 34]);
  });
});

describe("blocks on bars", () => {
  it("lands at the start of the 8-bar phrase under the pointer", () => {
    expect([phraseStart(1), phraseStart(8), phraseStart(9), phraseStart(23.7), phraseStart(-3)]).toEqual([1, 1, 9, 17, 1]);
  });
  it("fills a phrase with whole passes, never past the end", () => {
    expect(dropLength(2, 9, 64)).toBe(8);
    expect(dropLength(4, 9, 64)).toBe(8);
    expect(dropLength(1, 1, 64)).toBe(8);
    expect(dropLength(4, 61, 64)).toBe(4);
    expect(dropLength(4, 63, 64)).toBe(0);
  });
});

describe("rendered in key and on tempo (X3's bars)", () => {
  for (const bpm of [124, 97, 140]) {
    it(`a pass at ${bpm} BPM is exactly its bars long, notes within 5 ms of their 16th`, () => {
      const l = libLoopFrom({ ...SOUND, macros: { ...SOUND.macros, length: 0.2 } }, "bass", "s1");
      const r = renderLibPass(l, { key: "C", scale: "minor", bpm }, RATE);
      const sps = secondsPer16th(bpm);
      expect(r.left.length).toBe(Math.round(32 * sps * RATE));
      for (const n of l.pattern.notes) {
        const at = Math.round(n.step * sps * RATE);
        let first = Math.max(0, at - Math.round(0.01 * RATE));
        while (first < r.left.length && Math.abs(r.left[first]) < 1e-3) first++;
        expect(Math.abs(first - at) / RATE).toBeLessThanOrEqual(0.005);
      }
    });
  }
  it("sounds the transposed pitch: A1 saved in A minor plays C2 in C minor", () => {
    const held = { ...SOUND, preset: "round-sub" as const, macros: { tone: 0.3, length: 1, pitchDrop: 0, drive: 0, wobble: 0, width: 0 }, pattern: { bars: 1 as const, notes: [{ step: 0, midi: 33, dur: 16, vel: 1 }] } };
    const r = renderLibPass(libLoopFrom(held, "bass", "s2"), { key: "C", scale: "minor", bpm: 124 }, RATE);
    expect(pitchHz(r.left.subarray(Math.round(0.4 * RATE), Math.round(0.6 * RATE)), RATE)!).toBeCloseTo(midiToHz(36), 0);
  });
  it("needs a new render when the sound, key or tempo changes, not otherwise", () => {
    const l = libLoopFrom(SOUND, "bass", "s1");
    const t = { key: "A", scale: "minor" as Scale, bpm: 124 };
    expect(passSignature(l, t)).toBe(passSignature({ ...l, name: "renamed" }, t));
    expect(passSignature(l, t)).not.toBe(passSignature(l, { ...t, bpm: 125 }));
    expect(passSignature(l, t)).not.toBe(passSignature(l, { ...t, key: "C" }));
    expect(passSignature(l, t)).not.toBe(passSignature(editLibLoop(l, { macros: { tone: 0.9 } }), t));
  });
});

describe("a library block stays editable and its own", () => {
  it("copies the settings, so a later library edit doesn't change the song", () => {
    const src = structuredClone(SOUND);
    const l = libLoopFrom(src, undefined, "s1");
    src.macros.tone = 1;
    src.pattern.notes[0].midi = 40;
    expect(l).toMatchObject({ libId: SOUND.id, type: "bass", lane: 1, bars: 2, preset: "rubber-pluck" });
    expect(l.macros.tone).toBe(0.4);
    expect(l.pattern.notes[0].midi).toBe(33);
  });
  it("edits preset and macros, clamped", () => {
    const l = editLibLoop(libLoopFrom(SOUND, "bass", "s1"), { preset: "reese", macros: { tone: 3 } });
    expect(l.preset).toBe("reese");
    expect(l.macros.tone).toBe(1);
    expect(l.pattern).toEqual(SOUND.pattern);
  });
  it("parses back what it saved, and rejects junk", () => {
    const l = libLoopFrom(SOUND, "bass", "s1");
    expect(parseLibLoop(JSON.parse(JSON.stringify(l)))).toEqual(l);
    expect(parseLibLoop({ ...l, lane: 3 })).toEqual(l); // the old lane follows the type
    expect(parseLibLoop({ ...l, preset: "sub" })).toBeNull();
    expect(parseLibLoop({ ...l, type: "banjo" })).toBeNull();
    expect(parseLibLoop({ ...l, key: "H" })).toBeNull();
    expect(parseLibLoop({ ...l, pattern: { bars: 2, notes: [{ step: 40, midi: 33, dur: 1, vel: 1 }] } })).toBeNull();
  });
});

describe("dropping a library sound on a track", () => {
  const old = (): Doc => ({ regions: [{ id: "r1", loopId: "deep-sub", track: 1, start: 1, length: 16 }, { id: "r2", loopId: "four-to-the-floor", track: 0, start: 1, length: 16 }], muted, bpm: 124, key: { key: "C", scale: "minor" } });

  it("lands on the Bass lane at the phrase, overwriting only there, and saves", () => {
    const r = dropLibSound(old(), SOUND, 11.5, { soundId: "s1", regionId: "n1" })!;
    expect(r.laneId).toBe("bass");
    const placed = r.doc.regions.find((x) => x.id === "n1")!;
    expect(placed).toEqual({ id: "n1", loopId: "s1", track: 1, lane: "bass", start: 9, length: 8 });
    expect(r.doc.regions.find((x) => x.id === "r1")).toMatchObject({ start: 1, length: 8 });
    expect(r.doc.regions.find((x) => x.id === "r2")).toMatchObject({ start: 1, length: 16, lane: "drums" });
    expect(r.doc.lanes!.map((l) => l.id)).toEqual(["drums", "bass", "chords", "top"]);
    const saved = parseDoc(JSON.parse(JSON.stringify(r.doc)));
    expect(saved).not.toBeNull();
    expect(saved!.sounds![0]).toMatchObject({ source: "lib", libId: SOUND.id, macros: SOUND.macros });
  });
  it("creates its lane type when the track has none", () => {
    const vocal = { ...SOUND, part: "vocals" as const };
    const r = dropLibSound(old(), vocal, 1, { soundId: "s2" })!;
    const lane = r.doc.lanes!.find((l) => l.id === r.laneId)!;
    expect(lane).toMatchObject({ type: "vocals", name: "Vocals" });
    expect(r.doc.lanes!.map((l) => l.type)).toEqual(["kick", "bass", "chords", "vocals", "fx"]);
    expect(parseDoc(JSON.parse(JSON.stringify(r.doc)))).not.toBeNull();
  });
  it("moves back from the end so the block keeps its length", () => {
    const r = dropLibSound({ ...old(), bars: 60 }, SOUND, 59, { regionId: "n1" })!;
    expect(r.doc.regions.find((x) => x.id === "n1")).toMatchObject({ start: 53, length: 8 });
  });
  it("plays through the Studio's schedule as one pass per repeat", () => {
    const r = dropLibSound(old(), SOUND, 9, { soundId: "s1" })!;
    const idx = buildSoundIndex(r.doc.regions, r.doc.sounds!, "C", "minor", 64 * 16);
    const hits = [...idx.entries()].flatMap(([step, h]) => h.map((x) => [step, x.kind, "dur" in x ? x.dur : 0]));
    expect(hits).toEqual([[128, "lib", 32], [160, "lib", 32], [192, "lib", 32], [224, "lib", 32]]);
  });
});

describe("level-matched to the crate", () => {
  it("every preset's pass comes out at LIB_LEVEL_DB (mid RMS), whatever its own level", () => {
    for (const preset of ["round-sub", "rubber-pluck", "reese", "acid-line"] as const) for (const drive of [0, 0.9]) {
      const l = libLoopFrom({ ...SOUND, preset, macros: { ...SOUND.macros, drive } }, "bass", "s1");
      expect(midRmsDb(levelled(renderLibPass(l, { key: "A", scale: "minor", bpm: 124 }, RATE)))).toBeCloseTo(LIB_LEVEL_DB, 1);
    }
  });
  it("leaves silence alone", () => {
    const l = libLoopFrom({ ...SOUND, pattern: { bars: 1, notes: [] } }, "bass", "s1");
    const r = renderLibPass(l, { key: "A", scale: "minor", bpm: 124 }, RATE);
    expect(levelled(r)).toBe(r);
  });
});
