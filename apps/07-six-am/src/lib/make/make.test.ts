// Make (S3): presets and macros, notes in key and on tempo, patch matching and level-matched A/B.
import { describe, expect, it } from "vitest";
import { BASS_PATTERNS, renderPattern } from "@/lib/synths/patterns";
import { inScale, pitchClass, type Scale } from "@/lib/synths/theory";
import { featureDistance } from "./features";
import { lufs, matchGain, rmsDb } from "./level";
import { featuresOf, suggestMacros } from "./match";
import { notesForLoop, pitchHz } from "./pattern";
import { MACRO_IDS, MAKE_PRESETS, MAKE_PRESET_IDS, clampMacros, lengthSteps, macroGuide, macroWord, synthParams, wobblePerBeat, type Macros } from "./presets";
import { renderBass, secondsPer16th, type MakeNote } from "./render";

const RATE = 22050;
const KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

describe("presets and macros", () => {
  it("has the four bass presets, tagged, each with the six macros", () => {
    expect(MAKE_PRESET_IDS.map((id) => MAKE_PRESETS[id].name)).toEqual(["Round sub", "Rubber pluck", "Reese", "Acid line"]);
    for (const id of MAKE_PRESET_IDS) {
      expect(MAKE_PRESETS[id].tags.length).toBeGreaterThan(0);
      expect(Object.keys(MAKE_PRESETS[id].macros).sort()).toEqual([...MACRO_IDS].sort());
      expect(macroGuide(id, MAKE_PRESETS[id].macros)).toContain("Pitch drop");
    }
  });
  it("clamps junk and keeps the preset's own values for missing ones", () => {
    expect(clampMacros("reese", { tone: 2, length: -1, drive: Number.NaN, width: "x" })).toEqual({ ...MAKE_PRESETS.reese.macros, tone: 1, length: 0 });
  });
  it("maps each macro onto its synth parameters", () => {
    const at = (m: Partial<Macros>) => synthParams("acid-line", clampMacros("acid-line", m));
    expect(at({ tone: 1 }).cutoffHz).toBeCloseTo(2500);
    expect(at({ tone: 0 }).cutoffHz).toBeCloseTo(120);
    expect(at({ length: 0.25 }).lengthSteps).toBeCloseTo(2);
    expect(at({ pitchDrop: 1 }).dropSemis).toBe(5);
    expect(at({ wobble: 0 }).wobbleOct).toBe(0);
    expect(at({ width: 0.4 }).width).toBe(0.4);
    expect(lengthSteps(1)).toBe(16);
    expect(wobblePerBeat(1)).toBeCloseTo(4);
  });
  it("says each value in a word", () => {
    expect(macroWord("tone", 0.3)).toBe("dark");
    expect(macroWord("tone", 0.9)).toBe("bright");
    expect(macroWord("length", 0.55)).toBe("1/4");
    expect(macroWord("length", 0.25)).toBe("1/8");
    expect(macroWord("length", 0)).toBe("1/16");
    expect(macroWord("pitchDrop", 0)).toBe("off");
    expect(macroWord("wobble", 0)).toBe("off");
    expect(macroWord("width", 0)).toBe("mono");
    expect(macroWord("drive", 0.8)).toBe("dirty");
  });
});

describe("Mine: in key and on tempo (Y4)", () => {
  it("every bass pattern's notes are in key, in every key and both scales", () => {
    for (const p of BASS_PATTERNS) for (const k of KEYS) for (const sc of ["major", "minor"] as Scale[]) {
      for (const n of renderPattern(p, k, sc)!) expect(inScale(n.midi, pitchClass(k)!, sc)).toBe(true);
    }
  });
  it("each preset starts its notes within 5 ms of their 16th, at 124 and 97 BPM", () => {
    for (const bpm of [124, 97]) for (const id of MAKE_PRESET_IDS) {
      const notes: MakeNote[] = [0, 6, 16, 22, 33, 50].map((step) => ({ step, midi: 33, dur: 2, vel: 0.9 }));
      const r = renderBass(notes, synthParams(id, { ...MAKE_PRESETS[id].macros, length: 0.2, pitchDrop: 0 }), { bpm, steps: 64, rate: RATE });
      const sps = secondsPer16th(bpm);
      for (const n of notes) {
        const at = Math.round(n.step * sps * RATE);
        let first = Math.max(0, at - Math.round(0.01 * RATE));
        while (first < r.left.length && Math.abs(r.left[first]) < 1e-3) first++;
        expect(Math.abs(first - at) / RATE).toBeLessThanOrEqual(0.005);
      }
    }
  });
  it("sounds the note's pitch (A1 = 55 Hz) once the pitch drop has settled", () => {
    const r = renderBass([{ step: 0, midi: 33, dur: 16, vel: 1 }], synthParams("round-sub", { ...MAKE_PRESETS["round-sub"].macros, length: 1 }), { bpm: 124, steps: 16, rate: RATE });
    expect(pitchHz(r.left.subarray(Math.round(0.4 * RATE), Math.round(0.6 * RATE)), RATE)!).toBeCloseTo(55, 0);
  });
  it("repeats a pattern over the loop, each note lasting until the next", () => {
    const notes = notesForLoop({ bars: 1, notes: [{ step: 2, midi: 33, dur: 1, vel: 1 }, { step: 10, midi: 36, dur: 1, vel: 1 }] }, 32);
    expect(notes.map((n) => [n.step, n.dur])).toEqual([[2, 8], [10, 8], [18, 8], [26, 6]]);
  });
});

describe("Suggest settings: patch matching (Y10's pure half)", () => {
  const st = [0, 3, 6, 10, 14, 16, 19, 22, 26, 30];
  const notes: MakeNote[] = st.map((step, i) => ({ step, midi: [33, 33, 36, 33, 31][i % 5], dur: (st[i + 1] ?? 32) - step, vel: 0.9 }));
  const target: Macros = { tone: 0.65, length: 0.35, pitchDrop: 0.6, drive: 0.5, wobble: 0, width: 0.3 };

  it.each(MAKE_PRESET_IDS)("lands much closer than the preset's own settings on a render of %s", (id) => {
    const f = featuresOf(id, target, notes, 124, 32);
    const s = suggestMacros(f, id, notes, 124, 32);
    expect(s.distance).toBeLessThan(s.presetDistance / 5);
    expect(Math.abs(s.macros.width - target.width)).toBeLessThanOrEqual(0.1);
  }, 20_000);
  it("recovers brightness and pitch drop on a pluck", () => {
    const s = suggestMacros(featuresOf("rubber-pluck", target, notes, 124, 32), "rubber-pluck", notes, 124, 32);
    expect(Math.abs(s.macros.tone - target.tone)).toBeLessThanOrEqual(0.15);
    expect(Math.abs(s.macros.pitchDrop - target.pitchDrop)).toBeLessThanOrEqual(0.15);
    expect(Math.abs(s.macros.length - target.length)).toBeLessThanOrEqual(0.15);
  }, 20_000);
  it("an identical sound has distance 0", () => {
    const f = featuresOf("reese", target, notes, 124, 32);
    expect(featureDistance(f, f)).toBe(0);
  });
});

describe("level-matched A/B (Y9)", () => {
  const notes: MakeNote[] = [0, 4, 8, 12, 16, 20, 24, 28].map((step) => ({ step, midi: 33, dur: 4, vel: 0.9 }));
  const original = renderBass(notes, synthParams("acid-line", { ...MAKE_PRESETS["acid-line"].macros, drive: 0.8 }), { bpm: 124, steps: 32, rate: RATE });
  const mine = renderBass(notes, synthParams("round-sub", MAKE_PRESETS["round-sub"].macros), { bpm: 124, steps: 32, rate: RATE });
  const scaled = (s: typeof mine, g: number) => ({ left: s.left.map((x) => x * g), right: s.right.map((x) => x * g), rate: s.rate });

  it("brings Mine within 1 dB RMS of the original", () => {
    const g = matchGain(original, mine);
    expect(Math.abs(rmsDb(original) - rmsDb(scaled(mine, g.gain)))).toBeLessThan(1);
  });
  it("by loudness (LUFS) too", () => {
    const g = matchGain(original, mine, "lufs");
    expect(Math.abs(lufs(original) - lufs(scaled(mine, g.gain)))).toBeLessThan(0.1);
  });
  it("reads a known gain back", () => {
    expect(matchGain(original, scaled(original, Math.pow(10, -7 / 20))).db).toBeCloseTo(7, 1);
  });
  it("leaves the level alone when either side is silent", () => {
    const silent = { left: new Float32Array(RATE), right: new Float32Array(RATE), rate: RATE };
    expect(matchGain(silent, mine)).toEqual({ db: 0, gain: 1 });
  });
});
