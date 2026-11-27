// Make (S3, L157, T82): tagged bass presets with six macro knobs (Tone, Length, Pitch drop, Drive,
// Wobble, Width). A macro is 0–1; each maps to one or more synth parameters inside the preset's
// own ranges (`synthParams`), and reads as a word ("dark", "1/8"). Pure data and maths; the sound
// is made from these numbers in render.ts, the same offline and live.

// Phase 7 slice 1 (L266, L267, R1): 20 starting sounds over the variety map's bass families: the four
// Phase 4 presets (unchanged, golden-hashed), 13 more synth presets on a richer engine (square, FM,
// organ drawbars, amplitude decay, overtones on Tone) and 3 sampled basses (tonejs-instruments, CC BY 3.0).
export type MakePresetId = "round-sub" | "rubber-pluck" | "reese" | "acid-line"
  | "sine-sub" | "rubber-drop" | "reese-wide" | "acid-scream" | "organ-house" | "organ-click" | "fm-glass" | "fm-wood"
  | "analog-round" | "detroit-square" | "filtered-saw" | "wobble-bass" | "stab-bass"
  | "electric-finger" | "electric-bright" | "upright";
export type MacroId = "tone" | "length" | "pitchDrop" | "drive" | "wobble" | "width" | "sub" | "weight";
export type Macros = Record<MacroId, number>;
export const MACRO_IDS: MacroId[] = ["tone", "length", "pitchDrop", "drive", "wobble", "width", "sub", "weight"];
/** L209: added after the first sounds were saved; a sound saved without them has them off (its old sound). */
export const LATER_MACROS: MacroId[] = ["sub", "weight"];

export type Wave = "sine" | "triangle" | "saw" | "square" | "fm" | "organ" | "sample";

/** What the renderer plays. Times in seconds, frequencies in Hz. */
export type SynthParams = {
  wave: Wave;
  /** Oscillators per side, spread by `detuneCents` (a Reese uses 3). */
  voices: number;
  detuneCents: number;
  /** Width: a detuned copy added to the left and taken from the right (mid/side), at this level 0–1,
   *  detuned by `stereoCents`. The centre stays as it was, so the sound gets wider, not thinner. */
  width: number;
  stereoCents: number;
  cutoffHz: number;
  resonance: number;
  /** Octaves the filter opens on each note, closing over `filterDecayS`. */
  filterEnvOct: number;
  filterDecayS: number;
  /** How many 16ths a note sounds at most (Length); the pattern can make it shorter. */
  lengthSteps: number;
  attackS: number;
  releaseS: number;
  /** Semitones each note starts above its pitch, falling back over `dropS` (Pitch drop). */
  dropSemis: number;
  dropS: number;
  /** 0–1: soft clipping before the output (Drive). */
  drive: number;
  /** Filter LFO: cycles per beat (0 = off) and depth in octaves (Wobble). */
  wobblePerBeat: number;
  wobbleOct: number;
  gainDb: number;
  /** L209 Sub: a clean sine at the note's fundamental, under the voice, at this level (0 = none). */
  sub: number;
  /** L209 Weight 0–1: a saturated, low-passed copy of the voice mixed in, body at ~100–400 Hz. */
  weight: number;
  // Phase 7 (all optional: a Phase 4–6 preset never sets them and renders as before).
  /** Amplitude decay while the note is held (s): a pluck dies away even on a long note. */
  decayS?: number;
  /** FM: the modulator's frequency ratio, its depth at the note's start, how fast it falls, and where it rests. */
  fm?: { ratio: number; index: number; decayS: number; sustain: number };
  /** Organ: drawbar levels of harmonics 1, 2, 3, … */
  organ?: number[];
  /** Sampled: the recordings (kit-samples.ts ids) and the MIDI note each was played at. */
  samples?: { id: string; midi: number }[];
  /** Overtones Tone adds to a clean wave (0–1), and the Tone knob's value they follow. */
  toneDrive?: number;
  toneV?: number;
  /** Phase 7 knob ranges (D7-1, L282), new presets only: Sub's and Weight's extra level at full (it grows with the knob's cube, on top of the Phase 4 level), and how much louder full Drive gets (× 1 + this). */
  subLevel?: number;
  weightLevel?: number;
  driveMakeup?: number;
  /** The wobble swings the cutoff up and down round Tone (not only down). */
  wobbleBipolar?: boolean;
};

export type MacroSpec = { id: MacroId; name: string; explain: string };
export const MACRO_SPECS: Record<MacroId, MacroSpec> = {
  tone: { id: "tone", name: "Tone", explain: "How bright the sound is: low is dark and round, high lets the buzz of the waveform through (the filter's cutoff)." },
  length: { id: "length", name: "Length", explain: "How long each note sounds, from a 1/16 blip to a whole bar. Short notes leave room between the kicks; that gap is a lot of a bassline's bounce." },
  pitchDrop: { id: "pitchDrop", name: "Pitch drop", explain: "Each note starts a little higher and falls onto its pitch: a hint gives a rubbery 'boing', a lot sounds like a tom or an 808." },
  drive: { id: "drive", name: "Drive", explain: "Soft clipping: adds warm overtones so the bass is heard on small speakers; a lot sounds gritty and loud." },
  wobble: { id: "wobble", name: "Wobble", explain: "A slow movement of the filter in time with the beat: off is steady, up is a 'wub' that gets faster." },
  sub: { id: "sub", name: "Sub", explain: "A clean sine at the note's own pitch under the sound: the deep part you feel on a club system. Off leaves the preset as it is." },
  weight: { id: "weight", name: "Weight", explain: "Body: a saturated copy of the sound kept below about 400 Hz, so the bass is heavy on small speakers too without getting brighter." },
  width: { id: "width", name: "Width", explain: "Spreads the sound between the speakers by detuning left and right. Keep it near mono for a sub; widen a Reese." },
};

export type MakePreset = {
  id: MakePresetId;
  name: string;
  part: "bass";
  /** Phase 7 shelf: the variety map's family and one feel word. */
  family: BassFamily;
  feel: string;
  tags: string[];
  about: string;
  /** Starting macro values. */
  macros: Macros;
  /** The preset's ranges the macros move through. */
  base: { wave: Wave; voices: number; detuneCents: number; resonance: number; filterEnvOct: number; filterDecayS: number; attackS: number; releaseS: number; gainDb: number;
    decayS?: number; fm?: SynthParams["fm"]; organ?: number[]; samples?: { id: string; midi: number }[]; toneDrive?: number; wobbleBipolar?: boolean };
  tone: [number, number]; // cutoff Hz at Tone 0 and 1
  maxDropSemis: number;
  maxStereoCents: number;
  maxWobbleOct: number;
};

/** The variety map's bass families (kickoff.md, L267), in the shelf's order. */
export const BASS_FAMILIES = ["clean sub", "rubber pluck", "Reese", "acid", "organ bass (90s house)", "FM bass", "round analog", "Detroit square", "filtered saw", "wobble", "stab bass", "electric bass (sampled)", "upright bass (sampled)"] as const;
export type BassFamily = (typeof BASS_FAMILIES)[number];

/** The sampled basses' recordings (tonejs-instruments, CC BY 3.0; public/kits/LICENSES.md): id → file. */
export const BASS_SAMPLE_FILES: Record<string, string> = Object.fromEntries([
  ...["E1", "As1", "E2", "As2", "E3"].map((n) => [`bass-eb-${n}`, `/kits/bass/electric/${n}.m4a`]),
  ...["G1", "C2", "E2", "A2", "E3"].map((n) => [`bass-cb-${n}`, `/kits/bass/upright/${n}.m4a`]),
]);
// shortcut: five recordings per sampled bass, a tritone or less apart and pitched by playback speed (up to ±3 semitones, so the timbre shifts a little), each cut to 2 s (a held note longer than that fades out); add the in-between notes from tonejs-instruments if a line sounds uneven or notes run short.
const EB = [["E1", 28], ["As1", 34], ["E2", 40], ["As2", 46], ["E3", 52]].map(([n, midi]) => ({ id: `bass-eb-${n}`, midi: midi as number }));
const CB = [["G1", 31], ["C2", 36], ["E2", 40], ["A2", 45], ["E3", 52]].map(([n, midi]) => ({ id: `bass-cb-${n}`, midi: midi as number }));

const M = (tone: number, length: number, pitchDrop: number, drive: number, wobble: number, width: number, sub: number, weight: number): Macros => ({ tone, length, pitchDrop, drive, wobble, width, sub, weight });
type NewId = Exclude<MakePresetId, "round-sub" | "rubber-pluck" | "reese" | "acid-line">;

/** Phase 7: the 16 new starting sounds (L267). Each says what it is in one plain line. */
const NEW_PRESETS: Record<NewId, MakePreset> = {
  "sine-sub": {
    id: "sine-sub", name: "Pure sine", part: "bass", family: "clean sub", feel: "pure", tags: ["sub", "sine"],
    about: "A plain sine wave: the cleanest, deepest sub. Tone adds a little buzz on top so small speakers hear it.",
    macros: M(0.1, 0.45, 0, 0, 0, 0, 0, 0.4),
    base: { wave: "sine", voices: 1, detuneCents: 0, resonance: 0.7, filterEnvOct: 0, filterDecayS: 0.1, attackS: 0.004, releaseS: 0.06, gainDb: -7, toneDrive: 1, wobbleBipolar: true },
    tone: [60, 4000], maxDropSemis: 9, maxStereoCents: 8, maxWobbleOct: 8,
  },
  "rubber-drop": {
    id: "rubber-drop", name: "Rubber drop", part: "bass", family: "rubber pluck", feel: "boingy", tags: ["short", "boingy"],
    about: "A triangle that starts high and drops onto its note and dies away fast: a rubbery 'doong'.",
    macros: M(0.35, 0.25, 0.75, 0.15, 0, 0, 0.3, 0.5),
    base: { wave: "triangle", voices: 1, detuneCents: 0, resonance: 1, filterEnvOct: 1.5, filterDecayS: 0.05, attackS: 0.002, releaseS: 0.03, gainDb: -8, decayS: 0.25, toneDrive: 1 },
    tone: [60, 3000], maxDropSemis: 9, maxStereoCents: 15, maxWobbleOct: 5,
  },
  "reese-wide": {
    id: "reese-wide", name: "Wide Reese", part: "bass", family: "Reese", feel: "wide", tags: ["wide", "bright"],
    about: "Five detuned sawtooths spread wide, brighter than the plain Reese: a big, rolling drum-and-bass growl.",
    macros: M(0.45, 0.7, 0, 0.2, 0, 0.8, 0.35, 0.3),
    base: { wave: "saw", voices: 5, detuneCents: 28, resonance: 0.9, filterEnvOct: 0.3, filterDecayS: 0.5, attackS: 0.01, releaseS: 0.15, gainDb: -15 },
    tone: [200, 6000], maxDropSemis: 9, maxStereoCents: 30, maxWobbleOct: 5,
  },
  "acid-scream": {
    id: "acid-scream", name: "Acid scream", part: "bass", family: "acid", feel: "screaming", tags: ["acid", "dirty"],
    about: "The 303-style line pushed hard: a sharper filter peak and drive, so every note squeals.",
    macros: M(0.45, 0.35, 0, 0.55, 0, 0, 0.2, 0.4),
    base: { wave: "saw", voices: 1, detuneCents: 0, resonance: 16, filterEnvOct: 3.5, filterDecayS: 0.12, attackS: 0.002, releaseS: 0.02, gainDb: -16 },
    tone: [150, 4000], maxDropSemis: 9, maxStereoCents: 12, maxWobbleOct: 5,
  },
  "organ-house": {
    id: "organ-house", name: "House organ", part: "bass", family: "organ bass (90s house)", feel: "hollow", tags: ["organ", "90s"],
    about: "The 90s house organ bass (think Robin S, 'Show Me Love'): a few sine drawbars stacked, short and hollow.",
    macros: M(0.75, 0.3, 0, 0.1, 0, 0, 0.1, 0.3),
    base: { wave: "organ", voices: 1, detuneCents: 0, resonance: 0.8, filterEnvOct: 0.6, filterDecayS: 0.06, attackS: 0.003, releaseS: 0.03, gainDb: -6, organ: [1, 0.8, 0.5, 0.35, 0, 0.2], decayS: 0.35, toneDrive: 0.4 },
    tone: [60, 6000], maxDropSemis: 9, maxStereoCents: 10, maxWobbleOct: 5,
  },
  "organ-click": {
    id: "organ-click", name: "Click organ", part: "bass", family: "organ bass (90s house)", feel: "clicky", tags: ["organ", "click"],
    about: "An organ bass with a bright click on each note (the upper drawbars) that fades into a round body.",
    macros: M(1, 0.5, 0.1, 0.2, 0, 0, 0.2, 0.2),
    base: { wave: "organ", voices: 1, detuneCents: 0, resonance: 0.8, filterEnvOct: 2.2, filterDecayS: 0.02, attackS: 0.001, releaseS: 0.04, gainDb: -6, organ: [1, 0.3, 0.6, 0.2, 0.4, 0.3, 0, 0.3], toneDrive: 0.3 },
    tone: [70, 8000], maxDropSemis: 9, maxStereoCents: 10, maxWobbleOct: 5,
  },
  "fm-glass": {
    id: "fm-glass", name: "FM glass", part: "bass", family: "FM bass", feel: "glassy", tags: ["fm", "bright"],
    about: "A DX7-style FM bass: one sine bends another, so each note starts with a glassy, metallic bite that quickly softens.",
    macros: M(0.7, 0.4, 0, 0.1, 0, 0, 0.3, 0.2),
    base: { wave: "fm", voices: 1, detuneCents: 0, resonance: 0.8, filterEnvOct: 0, filterDecayS: 0.1, attackS: 0.002, releaseS: 0.05, gainDb: -7, fm: { ratio: 1, index: 5, decayS: 0.08, sustain: 0.6 }, decayS: 0.5, toneDrive: 0.5 },
    tone: [60, 9000], maxDropSemis: 9, maxStereoCents: 12, maxWobbleOct: 5,
  },
  "fm-wood": {
    id: "fm-wood", name: "FM wood", part: "bass", family: "FM bass", feel: "woody", tags: ["fm", "plucky"],
    about: "A softer FM bass, the modulator an octave up: a woody, slap-like pluck that dies away.",
    macros: M(0.6, 0.2, 0.15, 0.05, 0, 0, 0.2, 0.4),
    base: { wave: "fm", voices: 1, detuneCents: 0, resonance: 0.8, filterEnvOct: 0, filterDecayS: 0.1, attackS: 0.002, releaseS: 0.04, gainDb: -7, fm: { ratio: 2, index: 2.5, decayS: 0.05, sustain: 0.1 }, decayS: 0.16, toneDrive: 0.5 },
    tone: [60, 5000], maxDropSemis: 9, maxStereoCents: 12, maxWobbleOct: 5,
  },
  "analog-round": {
    id: "analog-round", name: "Warm Moog", part: "bass", family: "round analog", feel: "warm", tags: ["analog", "warm"],
    about: "A Moog-style sawtooth through a soft low-pass that opens a little on each note: warm and round.",
    macros: M(0.3, 0.55, 0.1, 0.25, 0, 0, 0.3, 0.5),
    base: { wave: "saw", voices: 2, detuneCents: 5, resonance: 1.4, filterEnvOct: 1, filterDecayS: 0.15, attackS: 0.004, releaseS: 0.08, gainDb: -12 },
    tone: [100, 2500], maxDropSemis: 9, maxStereoCents: 15, maxWobbleOct: 5,
  },
  "detroit-square": {
    id: "detroit-square", name: "Square blip", part: "bass", family: "Detroit square", feel: "hollow", tags: ["square", "detroit"],
    about: "A square wave with a quick filter blip on each note: the hollow, punchy bass of Detroit techno and early house.",
    macros: M(0.4, 0.3, 0, 0.15, 0, 0, 0.15, 0.4),
    base: { wave: "square", voices: 1, detuneCents: 0, resonance: 2.5, filterEnvOct: 2, filterDecayS: 0.07, attackS: 0.002, releaseS: 0.03, gainDb: -13 },
    tone: [150, 4500], maxDropSemis: 9, maxStereoCents: 12, maxWobbleOct: 5,
  },
  "filtered-saw": {
    id: "filtered-saw", name: "Open saw", part: "bass", family: "filtered saw", feel: "buzzy", tags: ["saw", "buzzy"],
    about: "A bright sawtooth with the filter mostly open: buzzy and full, for a bass that cuts through.",
    macros: M(0.65, 0.65, 0, 0.2, 0, 0.15, 0.3, 0.3),
    base: { wave: "saw", voices: 1, detuneCents: 0, resonance: 1.1, filterEnvOct: 0.4, filterDecayS: 0.3, attackS: 0.003, releaseS: 0.06, gainDb: -14 },
    tone: [200, 9000], maxDropSemis: 9, maxStereoCents: 15, maxWobbleOct: 5,
  },
  "wobble-bass": {
    id: "wobble-bass", name: "Wub", part: "bass", family: "wobble", feel: "wobbly", tags: ["wobble", "moving"],
    about: "Two detuned sawtooths whose filter swings in time with the beat: a 'wub' on every note (the Wobble knob sets the speed).",
    macros: M(0.4, 0.75, 0, 0.3, 0.45, 0.2, 0.3, 0.3),
    base: { wave: "saw", voices: 2, detuneCents: 9, resonance: 3, filterEnvOct: 0, filterDecayS: 0.1, attackS: 0.005, releaseS: 0.08, gainDb: -14 },
    tone: [150, 5000], maxDropSemis: 9, maxStereoCents: 20, maxWobbleOct: 5,
  },
  "stab-bass": {
    id: "stab-bass", name: "Punchy stab", part: "bass", family: "stab bass", feel: "punchy", tags: ["stab", "short"],
    about: "A short, bright stab: the filter snaps open and shut and the note is gone, leaving room for the kick.",
    macros: M(0.25, 0.15, 0.1, 0.3, 0, 0.1, 0.2, 0.5),
    base: { wave: "saw", voices: 2, detuneCents: 7, resonance: 2, filterEnvOct: 4, filterDecayS: 0.03, attackS: 0.001, releaseS: 0.015, gainDb: -12, decayS: 0.12 },
    tone: [100, 2500], maxDropSemis: 9, maxStereoCents: 15, maxWobbleOct: 5,
  },
  "electric-finger": {
    id: "electric-finger", name: "Fingered", part: "bass", family: "electric bass (sampled)", feel: "warm", tags: ["electric", "sampled"],
    about: "A real electric bass, played with the fingers: round and warm.",
    macros: M(0.45, 0.4, 0, 0, 0, 0, 0, 0.2),
    base: { wave: "sample", voices: 1, detuneCents: 0, resonance: 0.7, filterEnvOct: 0, filterDecayS: 0.1, attackS: 0.002, releaseS: 0.06, gainDb: -2, samples: EB },
    tone: [80, 9000], maxDropSemis: 9, maxStereoCents: 10, maxWobbleOct: 5,
  },
  "electric-bright": {
    id: "electric-bright", name: "Picked", part: "bass", family: "electric bass (sampled)", feel: "bright", tags: ["electric", "bright"],
    about: "A real electric bass with its top open and a little drive: a picked, funky edge.",
    macros: M(0.85, 0.35, 0, 0.35, 0, 0, 0, 0),
    base: { wave: "sample", voices: 1, detuneCents: 0, resonance: 1.2, filterEnvOct: 0.8, filterDecayS: 0.05, attackS: 0.001, releaseS: 0.04, gainDb: -3, samples: EB },
    tone: [60, 12000], maxDropSemis: 9, maxStereoCents: 10, maxWobbleOct: 5,
  },
  upright: {
    id: "upright", name: "Double bass", part: "bass", family: "upright bass (sampled)", feel: "woody", tags: ["upright", "sampled"],
    about: "A real double bass, plucked: woody and deep, for jazzy deep house.",
    macros: M(0.6, 0.55, 0, 0, 0, 0, 0, 0.2),
    base: { wave: "sample", voices: 1, detuneCents: 0, resonance: 0.7, filterEnvOct: 0, filterDecayS: 0.1, attackS: 0.003, releaseS: 0.08, gainDb: -1, samples: CB },
    tone: [60, 7000], maxDropSemis: 9, maxStereoCents: 10, maxWobbleOct: 5,
  },
};

export const MAKE_PRESETS: Record<MakePresetId, MakePreset> = {
  "round-sub": {
    id: "round-sub", name: "Round sub", part: "bass", family: "clean sub", feel: "round", tags: ["sub", "clean"],
    about: "A triangle filtered nearly to a sine: the deep, round bass you feel more than hear.",
    macros: { tone: 0.3, length: 0.3, pitchDrop: 0.35, drive: 0.2, wobble: 0, width: 0, sub: 0.2, weight: 0.85 },
    base: { wave: "triangle", voices: 1, detuneCents: 0, resonance: 0.7, filterEnvOct: 0, filterDecayS: 0.1, attackS: 0.003, releaseS: 0.03, gainDb: -6 },
    tone: [90, 900], maxDropSemis: 12, maxStereoCents: 12, maxWobbleOct: 1.5,
  },
  "rubber-pluck": {
    id: "rubber-pluck", name: "Rubber pluck", part: "bass", family: "rubber pluck", feel: "bouncy", tags: ["short", "bouncy"],
    about: "A sawtooth whose filter snaps open on every note and closes fast, with a little pitch drop: short, bouncy house bass.",
    macros: { tone: 0.15, length: 0.3, pitchDrop: 0.5, drive: 0.05, wobble: 0, width: 0.1, sub: 0.2, weight: 0.6 },
    base: { wave: "saw", voices: 1, detuneCents: 0, resonance: 2, filterEnvOct: 2.5, filterDecayS: 0.08, attackS: 0.002, releaseS: 0.02, gainDb: -12 },
    tone: [120, 2400], maxDropSemis: 7, maxStereoCents: 15, maxWobbleOct: 1.5,
  },
  reese: {
    id: "reese", name: "Reese", part: "bass", family: "Reese", feel: "growly", tags: ["wide", "dark"],
    about: "Three detuned sawtooths beating against each other, so even one long note growls and moves (after Kevin 'Reese' Saunderson, 1988).",
    macros: { tone: 0.15, length: 0.4, pitchDrop: 0, drive: 0.05, wobble: 0, width: 0.5, sub: 0.3, weight: 0.2 },
    base: { wave: "saw", voices: 3, detuneCents: 18, resonance: 1.2, filterEnvOct: 0.6, filterDecayS: 0.4, attackS: 0.008, releaseS: 0.1, gainDb: -14 },
    tone: [150, 3000], maxDropSemis: 5, maxStereoCents: 25, maxWobbleOct: 2,
  },
  "acid-line": {
    id: "acid-line", name: "Acid line", part: "bass", family: "acid", feel: "squelchy", tags: ["squelchy", "resonant"],
    about: "A TB-303-style sawtooth through a resonant filter that opens on every note: Chicago acid house, 1987.",
    macros: { tone: 0.15, length: 0.3, pitchDrop: 0, drive: 0.1, wobble: 0, width: 0, sub: 0.3, weight: 0.7 },
    base: { wave: "saw", voices: 1, detuneCents: 0, resonance: 10, filterEnvOct: 3, filterDecayS: 0.18, attackS: 0.002, releaseS: 0.02, gainDb: -14 },
    tone: [120, 2500], maxDropSemis: 5, maxStereoCents: 12, maxWobbleOct: 2,
  },
  ...NEW_PRESETS,
};
export const MAKE_PRESET_IDS = Object.keys(MAKE_PRESETS) as MakePresetId[];
/** Phase 7 knob ranges for the new presets (D7-1, L282). */
export const P7_KNOBS = { subLevel: 2.6, weightLevel: 45, driveMakeup: 1.5 };
/** The four Phase 4 presets: their sound is guarded sample for sample (bass-golden.test.ts, R9). */
export const PHASE4_PRESET_IDS: MakePresetId[] = ["round-sub", "rubber-pluck", "reese", "acid-line"];
/** Presets that play recordings (they need their samples loaded before they sound). */
export const isSampledBass = (id: MakePresetId) => MAKE_PRESETS[id].base.wave === "sample";

const clamp01 = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null);

/** Any input → macros 0–1; missing or junk values get the preset's own. */
export function clampMacros(preset: MakePresetId, v: Partial<Record<MacroId, unknown>> | undefined): Macros {
  const out = { ...MAKE_PRESETS[preset].macros };
  for (const id of MACRO_IDS) { const x = clamp01(v?.[id]); if (x !== null) out[id] = x; }
  // L209: a sound saved before Sub and Weight existed keeps exactly its old sound (both off).
  if (v) for (const id of LATER_MACROS) if (clamp01(v[id]) === null) out[id] = 0;
  return out;
}

/** Length 0–1 → 16ths: 1, 2, 4, 8, 16 (1/16 … a whole bar) at 0, ¼, ½, ¾, 1, and between. */
export const lengthSteps = (v: number) => Math.pow(2, 4 * v);
/** Wobble 0–1 → LFO cycles per beat: off below 0.05, then ¼ (a bar) up to 4 (16ths). */
export const wobblePerBeat = (v: number) => (v < 0.05 ? 0 : Math.pow(2, -2 + 4 * ((v - 0.05) / 0.95)));

/** The preset's synth parameters at these macro values. */
export function synthParams(preset: MakePresetId, m: Macros): SynthParams {
  const p = MAKE_PRESETS[preset];
  const [lo, hi] = p.tone;
  const b = p.base;
  // Phase 7's engine fields only when a preset has them, so the four Phase 4 presets' params are exactly as before.
  const extra: Partial<SynthParams> = {};
  if (b.decayS) extra.decayS = b.decayS;
  if (b.fm) extra.fm = b.fm;
  if (b.organ) extra.organ = b.organ;
  if (b.samples) extra.samples = b.samples;
  if (b.toneDrive) { extra.toneDrive = b.toneDrive; extra.toneV = m.tone; }
  // D7-1 (L282): wider Sub, Weight and Drive on the 16 new presets; the Phase 4 four render exactly as before (golden hashes).
  if (!PHASE4_PRESET_IDS.includes(preset)) { extra.subLevel = P7_KNOBS.subLevel; extra.weightLevel = P7_KNOBS.weightLevel; extra.driveMakeup = P7_KNOBS.driveMakeup; }
  if (b.wobbleBipolar) extra.wobbleBipolar = true;
  return {
    ...extra,
    wave: p.base.wave,
    voices: p.base.voices,
    detuneCents: p.base.detuneCents,
    width: m.width,
    stereoCents: p.maxStereoCents,
    cutoffHz: lo * Math.pow(hi / lo, m.tone),
    resonance: p.base.resonance,
    filterEnvOct: p.base.filterEnvOct,
    filterDecayS: p.base.filterDecayS,
    lengthSteps: lengthSteps(m.length),
    attackS: p.base.attackS,
    releaseS: p.base.releaseS,
    dropSemis: m.pitchDrop * p.maxDropSemis,
    dropS: 0.03 + 0.05 * m.pitchDrop,
    drive: m.drive,
    wobblePerBeat: wobblePerBeat(m.wobble),
    wobbleOct: m.wobble < 0.05 ? 0 : p.maxWobbleOct * Math.min(1, 0.4 + m.wobble),
    gainDb: p.base.gainDb,
    sub: m.sub ?? 0,
    weight: m.weight ?? 0,
  };
}

const FRACTIONS: [number, string][] = [[1, "1/16"], [2, "1/8"], [4, "1/4"], [8, "1/2"], [16, "1 bar"]];

/** The word under a knob (T82): what the value sounds like, or the note length it gives. */
export function macroWord(id: MacroId, v: number): string {
  switch (id) {
    case "tone": return v < 0.34 ? "dark" : v < 0.67 ? "warm" : "bright";
    case "length": {
      const s = lengthSteps(v);
      return FRACTIONS.reduce((a, b) => (Math.abs(Math.log2(b[0] / s)) < Math.abs(Math.log2(a[0] / s)) ? b : a))[1];
    }
    case "pitchDrop": return v < 0.05 ? "off" : v < 0.5 ? "slight" : "deep";
    case "drive": return v < 0.1 ? "clean" : v < 0.55 ? "warm" : "dirty";
    case "wobble": { const r = wobblePerBeat(v); return r === 0 ? "off" : r < 0.75 ? "slow" : r < 2 ? "beat" : "fast"; }
    case "sub": return v < 0.05 ? "off" : v < 0.6 ? "some" : "full";
    case "weight": return v < 0.34 ? "light" : v < 0.67 ? "full" : "heavy";
    case "width": return v < 0.1 ? "mono" : v < 0.6 ? "wide" : "very wide";
  }
}

/** Plain text for the Mentor (S2/S3): the preset and what each macro does on it. */
export function macroGuide(preset: MakePresetId, m: Macros): string {
  const p = MAKE_PRESETS[preset];
  return [`${p.name} (${p.tags.join(", ")}): ${p.about}`, ...MACRO_IDS.map((id) => `- ${MACRO_SPECS[id].name} ${Math.round(m[id] * 100)}% (${macroWord(id, m[id])}): ${MACRO_SPECS[id].explain}`)].join("\n");
}
