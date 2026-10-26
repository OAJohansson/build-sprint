// Notes in key and on the grid (Phase 3 unit test 3, eval X3's pure half).
import { describe, expect, it } from "vitest";
import { loopEvents } from "./events";
import { DRUM_PATTERNS } from "./kits";
import { makeKitLoop, makeSynthLoop, parsePlayableLoop } from "./loop";
import { BASS_LOW, CHORD_LOW, renderPattern, stepToBBS, SYNTH_PATTERNS, patternById } from "./patterns";
import { PRESETS, clampKnobs, knobPosition, knobValue, type PresetId } from "./presets";
import { degreeToMidi, inScale, midiName, pitchClass, tonicAtOrAbove, type Scale } from "./theory";

const KEYS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];
const SCALES: Scale[] = ["major", "minor"];

describe("pitchClass", () => {
  it("reads sharps, flats and their unicode signs as the same note", () => {
    expect(pitchClass("A")).toBe(9);
    expect(pitchClass("A#")).toBe(10);
    expect(pitchClass("Bb")).toBe(10);
    expect(pitchClass("b♭")).toBe(10);
    expect(pitchClass("C♯")).toBe(1);
  });
  it("wraps enharmonic edge spellings", () => {
    expect(pitchClass("Cb")).toBe(11);
    expect(pitchClass("B#")).toBe(0);
    expect(pitchClass("E#")).toBe(5);
  });
  it("rejects junk", () => {
    expect(pitchClass("H")).toBeNull();
    expect(pitchClass("")).toBeNull();
    expect(pitchClass("A minor")).toBeNull();
    expect(pitchClass("C###")).toBeNull();
  });
});

describe("degreeToMidi", () => {
  const a1 = 33; // A1 = 55 Hz
  it("walks the minor scale and wraps the octave both ways", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((d) => degreeToMidi(d, a1, "minor"))).toEqual([33, 35, 36, 38, 40, 41, 43, 45]);
    expect(degreeToMidi(-1, a1, "minor")).toBe(31); // G0
    expect(degreeToMidi(-7, a1, "minor")).toBe(21); // A0
    expect(degreeToMidi(14, a1, "minor")).toBe(57); // A3
  });
  it("uses the major scale's raised 3rd, 6th and 7th", () => {
    const c4 = 60;
    expect([2, 5, 6].map((d) => degreeToMidi(d, c4, "major"))).toEqual([64, 69, 71]);
    expect(degreeToMidi(-1, c4, "major")).toBe(59); // B3, the leading tone
  });
  it("puts the tonic inside a 12-note register window", () => {
    expect(tonicAtOrAbove(9, BASS_LOW)).toBe(33); // A1
    expect(tonicAtOrAbove(4, BASS_LOW)).toBe(28); // E1, the window's floor
    expect(tonicAtOrAbove(3, BASS_LOW)).toBe(39); // D#2, the window's top
  });
});

describe("renderPattern keeps every note in key", () => {
  for (const pattern of SYNTH_PATTERNS) {
    it(`${pattern.id}: every note in the scale in all ${KEYS.length * 2} keys`, () => {
      for (const key of KEYS) for (const scale of SCALES) {
        const notes = renderPattern(pattern, key, scale)!;
        const tonic = pitchClass(key)!;
        expect(notes.length).toBeGreaterThan(0);
        for (const n of notes) expect(inScale(n.midi, tonic, scale), `${pattern.id} ${key} ${scale}: ${n.name}`).toBe(true);
      }
    });
  }

  it("A# minor: the tonic is A#/Bb, spelled with flats, and nothing else creeps in", () => {
    const notes = renderPattern(patternById("rolling-acid")!, "A#", "minor")!;
    const allowed = new Set(["Bb", "C", "Db", "Eb", "F", "Gb", "Ab"]);
    for (const n of notes) expect(allowed.has(n.name.replace(/-?\d+$/, ""))).toBe(true);
    expect(notes[0].name).toBe("Bb1");
  });

  it("major keys use the major scale (F# major's A# is in, A is out)", () => {
    const notes = renderPattern(patternById("chicago-stab")!, "F#", "major")!;
    const pcs = new Set(notes.map((n) => n.midi % 12));
    expect(pcs.has(9)).toBe(false);
    for (const pc of pcs) expect([6, 8, 10, 11, 1, 3, 5]).toContain(pc);
  });

  it("keeps bass and chord roots in their registers", () => {
    for (const key of KEYS) {
      const bass = renderPattern(patternById("offbeat-bass")!, key, "minor")!;
      expect(bass[0].midi).toBeGreaterThanOrEqual(BASS_LOW);
      expect(bass[0].midi).toBeLessThan(BASS_LOW + 12);
      const stab = renderPattern(patternById("chicago-stab")!, key, "minor")!;
      expect(Math.min(...stab.map((n) => n.midi))).toBeGreaterThanOrEqual(CHORD_LOW);
      expect(Math.min(...stab.map((n) => n.midi))).toBeLessThan(CHORD_LOW + 12);
    }
  });

  it("returns null for an unknown key", () => {
    expect(renderPattern(SYNTH_PATTERNS[0], "X", "minor")).toBeNull();
  });

  it("a mono bass note never overlaps the next, and a note the next slides into is held up to it", () => {
    for (const p of SYNTH_PATTERNS.filter((x) => x.kind === "bass")) {
      const notes = renderPattern(p, "A", "minor")!;
      notes.forEach((n, i) => {
        const next = notes[i + 1];
        expect(n.dur).toBeGreaterThan(0);
        if (next) expect(n.step + n.dur).toBeLessThanOrEqual(next.step);
        if (next?.slide) { expect(n.tie).toBe(true); expect(n.step + n.dur).toBe(next.step); }
      });
    }
  });

  it("spells notes for the key", () => {
    expect(midiName(70, true)).toBe("Bb4");
    expect(midiName(70, false)).toBe("A#4");
    expect(midiName(24)).toBe("C1");
  });
});

describe("loop events stay on the tempo grid", () => {
  it("every onset is a whole number of 16ths at the track's tempo", () => {
    const loop = makeSynthLoop("acid", "rolling-acid")!;
    for (const bpm of [120, 124, 122.4, 174]) {
      const sps = 60 / bpm / 4;
      const events = loopEvents(loop, "A", "minor", bpm, 2)!;
      expect(events.length).toBe(64);
      for (const e of events) expect(e.time).toBeCloseTo(e.step * sps, 9);
      expect(events[32].time).toBeCloseTo(32 * sps, 9); // the second pass starts right after bar 2
    }
  });

  it("drum patterns sit on the grid too", () => {
    for (const p of DRUM_PATTERNS) {
      const events = loopEvents(makeKitLoop("909", p.id)!, "A", "minor", 124, 1)!;
      for (const e of events) {
        expect(Number.isInteger(e.step)).toBe(true);
        expect(e.step).toBeLessThan(p.bars * 16);
      }
    }
  });

  it("writes Transport positions as bars:beats:16ths", () => {
    expect(stepToBBS(0)).toBe("0:0:0");
    expect(stepToBBS(6)).toBe("0:1:2");
    expect(stepToBBS(35)).toBe("2:0:3");
  });
});

describe("presets, knobs and loops", () => {
  it("every preset has cutoff, resonance and an envelope knob with the default inside the range", () => {
    for (const p of Object.values(PRESETS)) {
      expect(p.knobs.map((k) => k.id)).toEqual(["cutoff", "resonance", "envelope"]);
      for (const k of p.knobs) {
        expect(k.default).toBeGreaterThanOrEqual(k.min);
        expect(k.default).toBeLessThanOrEqual(k.max);
        expect(k.explain.length).toBeGreaterThan(20);
        expect(knobValue(k, knobPosition(k, k.default))).toBeCloseTo(k.default, 6);
      }
    }
  });

  it("clamps knobs and replaces junk with defaults", () => {
    expect(clampKnobs("acid", { cutoff: 99999, resonance: "x", envelope: Number.NaN })).toEqual({ cutoff: 3000, resonance: 12, envelope: 0.22 });
  });

  it("only pairs a pattern with a preset of the same kind, and parses stored loops", () => {
    expect(makeSynthLoop("sub", "chicago-stab")).toBeNull();
    const loop = makeSynthLoop("pad", "long-pad", { cutoff: 900 })!;
    expect(loop).toMatchObject({ lane: 2, bars: 8, knobs: { cutoff: 900 } });
    expect(parsePlayableLoop(JSON.parse(JSON.stringify(loop)))).toEqual(loop);
    expect(parsePlayableLoop({ ...loop, preset: "nope" })).toBeNull();
    expect(parsePlayableLoop({ id: "k", source: "kit", kit: "808", pattern: "kit-house-groove" })).toMatchObject({ lane: 0, bars: 2 });
    const presets = Object.keys(PRESETS) as PresetId[];
    for (const id of presets) expect(SYNTH_PATTERNS.some((p) => (p.presets as string[]).includes(id))).toBe(true);
  });
});
