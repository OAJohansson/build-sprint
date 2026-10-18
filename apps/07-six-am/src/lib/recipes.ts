// What each loop plays (decision 0019): an instrument plus notes on a 16-step-per-bar grid, all
// in A minor at 124 BPM so any combination is in key and in time. Pure data, no audio here.

export type Inst =
  | "kit" | "sub" | "acid" | "pump" | "rubber" | "reese"
  | "stab" | "pad" | "organ" | "strings" | "piano" | "wash"
  | "shaker" | "chop" | "ride" | "riser" | "cowbell" | "swell";

/** One note: the 16th it starts on (from the loop's start), the pitch or drum, its length in 16ths. */
export type Note = { step: number; note: string; dur: number; vel: number };
export type Recipe = { inst: Inst; notes: Note[] };

const n = (step: number, note: string, dur = 1, vel = 0.9): Note => ({ step, note, dur, vel });
/** Repeat a one-bar pattern over `bars`, with `fn(bar)` choosing notes for each bar. */
const bars = (count: number, fn: (bar: number, at: (s: number) => number) => Note[]) =>
  Array.from({ length: count }, (_, b) => fn(b, (s) => b * 16 + s)).flat();

const AM7 = ["A3", "C4", "E4", "G4"], FMAJ7 = ["F3", "A3", "C4", "E4"], G = ["G3", "B3", "D4"];
const DM7 = ["D3", "F3", "A3", "C4"], EM7 = ["E3", "G3", "B3", "D4"], C = ["C4", "E4", "G4"], F = ["F3", "A3", "C4"];
const chord = (step: number, notes: string[], dur: number, vel = 0.8) => notes.map((x) => n(step, x, dur, vel));

export const RECIPES: Record<string, Recipe> = {
  // Drums
  "four-to-the-floor": { inst: "kit", notes: bars(4, (_, at) => [
    ...[0, 4, 8, 12].map((s) => n(at(s), "kick")),
    ...[2, 6, 10, 14].map((s) => n(at(s), "ohat", 1, 0.5)),
    n(at(4), "clap", 1, 0.7), n(at(12), "clap", 1, 0.7),
  ]) },
  "rolling-hats": { inst: "kit", notes: bars(2, (_, at) =>
    Array.from({ length: 16 }, (_, s) => n(at(s), s % 4 === 2 ? "ohat" : "hat", 1, s % 2 ? 0.35 : 0.6))) },
  "jack-shuffle": { inst: "kit", notes: bars(4, (b, at) => [
    ...[0, 4, 8, 12].map((s) => n(at(s), "kick")),
    ...[2, 3, 6, 7, 10, 11, 14].map((s) => n(at(s), "hat", 1, s % 2 ? 0.3 : 0.6)),
    n(at(4), "clap", 1, 0.75), n(at(12), "clap", 1, 0.75),
    ...(b === 3 ? [n(at(14), "kick", 1, 0.7)] : []),
  ]) },
  "broken-beat": { inst: "kit", notes: bars(4, (_, at) => [
    n(at(0), "kick"), n(at(6), "kick", 1, 0.8), n(at(10), "kick", 1, 0.85),
    n(at(4), "snare", 1, 0.8), n(at(12), "snare", 1, 0.8),
    ...[2, 6, 9, 14].map((s) => n(at(s), "hat", 1, 0.5)),
  ]) },
  "clap-stack": { inst: "kit", notes: [
    ...bars(2, (_, at) => [n(at(4), "clap"), n(at(12), "clap")]),
    ...[28, 29, 30, 31].map((s, i) => n(s, "snare", 1, 0.3 + i * 0.15)),
  ] },
  "warehouse-kick": { inst: "kit", notes: bars(4, (_, at) => [
    ...[0, 4, 8, 12].map((s) => n(at(s), "kick", 1, 1)),
    ...[2, 6, 10, 14].map((s) => n(at(s), "rumble", 2, 0.5)),
  ]) },

  // Bass (A1 = 55 Hz)
  "deep-sub": { inst: "sub", notes: ["A1", "A1", "F1", "G1"].map((x, b) => n(b * 16 + 2, x, 12, 0.9)) },
  "acid-line": { inst: "acid", notes: bars(4, (b, at) =>
    ["A1", "A1", "A2", "A1", "C2", "A1", "E2", "A1", "A1", "G2", "A1", "C2", "A1", "E2", "A2", "G1"]
      .map((x, s) => (s % 4 === 0 ? null : n(at(s), b === 3 && s > 11 ? "E2" : x, 1, s % 4 === 3 ? 1 : 0.6)))
      .filter((x): x is Note => x !== null)) },
  "offbeat-pump": { inst: "pump", notes: bars(2, (_, at) => [2, 6, 10, 14].map((s) => n(at(s), "A1", 2))) },
  "rubber-bass": { inst: "rubber", notes: bars(4, (b, at) => [
    n(at(2), "A1", 1), n(at(3), "A2", 1, 0.6), n(at(6), b % 2 ? "C2" : "G1", 2), n(at(10), "A1", 1), n(at(11), "E2", 1, 0.7), n(at(14), "D2", 2),
  ]) },
  "low-rumble": { inst: "reese", notes: ["A1", "A1", "F1", "F1", "G1", "G1", "E1", "E1"].map((x, b) => n(b * 16 + 2, x, 12, 0.8)) },
  "reese-roll": { inst: "reese", notes: bars(4, (b, at) => [2, 6, 10, 14].map((s) => n(at(s), b === 2 ? "F1" : "A1", 2, 0.85))) },

  // Chords
  "chicago-stab": { inst: "stab", notes: bars(4, (b, at) => [3, 6, 11].flatMap((s) => chord(at(s), [AM7, AM7, FMAJ7, G][b], 1))) },
  "warm-pad": { inst: "pad", notes: [AM7, FMAJ7, DM7, EM7].flatMap((c, i) => chord(i * 32, c, 31, 0.6)) },
  "organ-hit": { inst: "organ", notes: bars(2, (b, at) => [0, 10].flatMap((s) => chord(at(s), b ? C : ["A3", "C4", "E4"], 2))) },
  "detroit-strings": { inst: "strings", notes: [AM7, AM7, FMAJ7, FMAJ7, G, G, EM7, EM7].flatMap((c, i) => chord(i * 16, c, 16, 0.55)) },
  "minor-wash": { inst: "wash", notes: [...chord(0, ["A3", "C4", "E4", "B4"], 64, 0.5), ...chord(64, ["F3", "A3", "E4", "G4"], 64, 0.5)] },
  "piano-bounce": { inst: "piano", notes: bars(4, (b, at) => [2, 6, 10, 14].flatMap((s) => chord(at(s), [["A3", "C4", "E4"], C, G, F][b], 1, 0.7))) },

  // Top / FX
  "shaker-loop": { inst: "shaker", notes: bars(2, (_, at) => Array.from({ length: 16 }, (_, s) => n(at(s), "x", 1, s % 2 ? 0.7 : 0.35))) },
  "vocal-chop": { inst: "chop", notes: bars(4, (b, at) => [0, 2, 7, 9, 14].map((s, i) => n(at(s), ["A4", "C5", "E5", "C5", "G4"][(i + b) % 5], 1, 0.7))) },
  "ride-wash": { inst: "ride", notes: bars(4, (_, at) => [0, 2, 4, 6, 8, 10, 12, 14].map((s) => n(at(s), "x", 1, s % 4 === 2 ? 0.8 : 0.45))) },
  "noise-riser": { inst: "riser", notes: [n(0, "x", 128, 0.8)] },
  "cowbell": { inst: "cowbell", notes: bars(2, (_, at) => [0, 3, 8, 11].map((s) => n(at(s), "x", 1, 0.6))) },
  "crash-swell": { inst: "swell", notes: [n(0, "x", 64, 0.7)] },
};
