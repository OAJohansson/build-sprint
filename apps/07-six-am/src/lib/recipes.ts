// What each loop plays (decision 0019): an instrument plus notes on a 16-step-per-bar grid, all
// in A minor at 124 BPM so any combination is in key and in time. Pure data, no audio here.

export type Inst =
  | "kit" | "sub" | "acid" | "pump" | "rubber" | "reese" | "octave" | "pluck"
  | "stab" | "pad" | "organ" | "strings" | "piano" | "wash" | "keys" | "dub" | "arp" | "disco"
  | "shaker" | "chop" | "ride" | "riser" | "cowbell" | "swell"
  | "conga" | "clave" | "tamb" | "fall" | "siren" | "crackle";

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

  // Added 19 Oct. Drums
  "garage-skip": { inst: "kit", notes: bars(4, (b, at) => [
    ...(b % 2 ? [0, 7, 10] : [0, 10]).map((s) => n(at(s), "kick")),
    n(at(4), "snare", 1, 0.8), n(at(12), "snare", 1, 0.8),
    ...[2, 6, 7, 10, 14].map((s) => n(at(s), "hat", 1, s === 7 ? 0.3 : 0.55)),
    ...(b === 3 ? [n(at(15), "rim", 1, 0.6)] : []),
  ]) },
  "disco-hats": { inst: "kit", notes: bars(2, (_, at) =>
    Array.from({ length: 16 }, (_, s) => (s % 4 === 2 ? n(at(s), "ohat", 1, 0.7) : n(at(s), "hat", 1, 0.28)))) },
  "rimshot-groove": { inst: "kit", notes: bars(2, (_, at) => [
    ...[0, 4, 8, 12].map((s) => n(at(s), "kick", 1, 0.85)),
    ...[3, 6, 11, 14].map((s) => n(at(s), "rim", 1, 0.6)),
  ]) },
  "tribal-toms": { inst: "kit", notes: bars(4, (_, at) => [
    ...[0, 4, 8, 12].map((s) => n(at(s), "kick", 1, 0.6)),
    n(at(0), "tomL", 1, 0.8), n(at(6), "tomL", 1, 0.6), n(at(3), "tomM", 1, 0.7), n(at(10), "tomM", 1, 0.7),
    n(at(8), "tomH", 1, 0.6), n(at(13), "tomH", 1, 0.5), n(at(14), "tomH", 1, 0.7),
  ]) },
  "techno-thump": { inst: "kit", notes: bars(4, (_, at) => [
    ...[0, 4, 8, 12].map((s) => n(at(s), "kick", 1, 1)),
    ...[2, 6, 10, 14].map((s) => n(at(s), "rumble", 2, 0.7)),
    ...[2, 6, 10, 14].map((s) => n(at(s), "hat", 1, 0.4)),
  ]) },
  "snare-fill": { inst: "kit", notes: [
    ...bars(3, (_, at) => [0, 4, 8, 12].map((s) => n(at(s), "kick"))),
    n(48, "kick"), n(52, "kick"),
    ...Array.from({ length: 16 }, (_, i) => n(48 + i, "snare", 1, 0.25 + i * 0.045)),
  ] },

  // Bass
  "disco-octaves": { inst: "octave", notes: bars(2, (b, at) =>
    [0, 2, 4, 6, 8, 10, 12, 14].map((s, i) => n(at(s), (b && s >= 8 ? ["G1", "G2"] : ["A1", "A2"])[i % 2], 1, i % 2 ? 0.7 : 0.9))) },
  "acid-squelch": { inst: "acid", notes: bars(4, (b, at) =>
    ["E2", "A2", "G2", "A2", "C3", "A2", "E2", "G2", "A2", "E3", "A2", "G2", "C3", "A2", "G2", "E2"]
      .map((x, s) => n(at(s), b === 2 ? x.replace("3", "2") : x, 1, [0, 3, 6, 10, 13].includes(s) ? 1 : 0.55))) },
  "walking-funk": { inst: "rubber", notes: bars(4, (b, at) =>
    (b === 2 ? ["F1", "A1", "C2", "D2", "F2", "D2"] : ["A1", "C2", "D2", "E2", "G2", "E2"]).map((x, i) => n(at([0, 3, 6, 8, 11, 14][i]), x, 2))) },
  "sub-stabs": { inst: "sub", notes: ["A1", "A1", "F1", "G1"].flatMap((x, b) => [n(b * 16 + 2, x, 2), n(b * 16 + 10, x, 2)]) },
  "deep-pluck": { inst: "pluck", notes: bars(4, (b, at) => [3, 7, 11, 14].map((s, i) => n(at(s), (b === 3 ? ["G1", "G1", "B1", "D2"] : ["A1", "A1", "C2", "E2"])[i], 1))) },
  "rolling-sixteenths": { inst: "pump", notes: bars(2, (_, at) =>
    Array.from({ length: 16 }, (_, s) => s).filter((s) => s % 4 !== 0).map((s) => n(at(s), "A1", 1, s % 4 === 2 ? 0.9 : 0.55))) },

  // Chords
  "rhodes-swing": { inst: "keys", notes: bars(4, (b, at) => [3, 11].flatMap((s) =>
    chord(at(s), [["A3", "C4", "E4", "G4", "B4"], ["D3", "F3", "A3", "C4", "E4"], ["A3", "C4", "E4", "G4", "B4"], EM7][b], 3, 0.6))) },
  "disco-strings": { inst: "disco", notes: bars(4, (b, at) => [2, 6, 10, 14].flatMap((s) =>
    chord(at(s), [["A4", "C5", "E5"], ["F4", "A4", "C5"], ["C5", "E5", "G5"], ["G4", "B4", "D5"]][b], 1, 0.7))) },
  "house-organ": { inst: "organ", notes: bars(4, (b, at) => [2, 6, 10, 14].flatMap((s) => chord(at(s), [AM7, AM7, DM7, EM7][b], 1, 0.75))) },
  "dub-chord": { inst: "dub", notes: bars(4, (b, at) => [2, 10].flatMap((s) => chord(at(s), b === 2 ? FMAJ7 : AM7, 1, 0.7))) },
  "sunrise-arp": { inst: "arp", notes: bars(4, (b, at) => {
    const up = b < 2 ? ["A4", "C5", "E5", "G5"] : b === 2 ? ["F4", "A4", "C5", "E5"] : ["G4", "B4", "D5", "G5"];
    return Array.from({ length: 16 }, (_, s) => n(at(s), up[s % 4], 1, s % 4 === 0 ? 0.75 : 0.5));
  }) },
  "gospel-lift": { inst: "piano", notes: [FMAJ7, G, AM7, AM7, FMAJ7, G, EM7, AM7].flatMap((c, b) => [...chord(b * 16, c, 8, 0.7), ...chord(b * 16 + 8, c, 8, 0.55)]) },

  // Top / FX
  "conga-loop": { inst: "conga", notes: bars(2, (b, at) =>
    (b ? [[0, "D4"], [3, "A3"], [6, "D4"], [10, "G4"], [12, "D4"]] : [[0, "D4"], [3, "A3"], [6, "D4"], [8, "G4"], [11, "A3"], [14, "D4"]])
      .map(([s, x]) => n(at(s as number), x as string, 1, 0.7))) },
  "clave": { inst: "clave", notes: [0, 6, 12, 20, 24].map((s) => n(s, "x", 1, 0.7)) },
  "tambourine": { inst: "tamb", notes: bars(2, (_, at) => [...[2, 6, 10, 14].map((s) => n(at(s), "x", 1, 0.7)), ...[3, 7, 11, 15].map((s) => n(at(s), "x", 1, 0.3))]) },
  "downlifter": { inst: "fall", notes: [n(0, "x", 64, 0.7)] },
  "siren": { inst: "siren", notes: [n(0, "A4", 32, 0.6), n(32, "A4", 32, 0.6)] },
  // Fixed "random" clicks, so the crackle is the same every time.
  "vinyl-crackle": { inst: "crackle", notes: [1, 5, 9, 12, 18, 22, 27, 31, 34, 38, 41, 47, 50, 55, 58, 62].map((s, i) => n(s, "x", 1, 0.2 + ((i * 37) % 30) / 100)) },
};
