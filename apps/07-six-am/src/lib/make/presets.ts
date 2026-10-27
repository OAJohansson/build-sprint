// Make (S3, L157, T82): tagged bass presets with six macro knobs (Tone, Length, Pitch drop, Drive,
// Wobble, Width). A macro is 0–1; each maps to one or more synth parameters inside the preset's
// own ranges (`synthParams`), and reads as a word ("dark", "1/8"). Pure data and maths; the sound
// is made from these numbers in render.ts, the same offline and live.

export type MakePresetId = "round-sub" | "rubber-pluck" | "reese" | "acid-line";
export type MacroId = "tone" | "length" | "pitchDrop" | "drive" | "wobble" | "width" | "sub" | "weight";
export type Macros = Record<MacroId, number>;
export const MACRO_IDS: MacroId[] = ["tone", "length", "pitchDrop", "drive", "wobble", "width", "sub", "weight"];
/** L209: added after the first sounds were saved; a sound saved without them has them off (its old sound). */
export const LATER_MACROS: MacroId[] = ["sub", "weight"];

export type Wave = "sine" | "triangle" | "saw";

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
  tags: string[];
  about: string;
  /** Starting macro values. */
  macros: Macros;
  /** The preset's ranges the macros move through. */
  base: { wave: Wave; voices: number; detuneCents: number; resonance: number; filterEnvOct: number; filterDecayS: number; attackS: number; releaseS: number; gainDb: number };
  tone: [number, number]; // cutoff Hz at Tone 0 and 1
  maxDropSemis: number;
  maxStereoCents: number;
  maxWobbleOct: number;
};

export const MAKE_PRESETS: Record<MakePresetId, MakePreset> = {
  "round-sub": {
    id: "round-sub", name: "Round sub", part: "bass", tags: ["sub", "clean"],
    about: "A triangle filtered nearly to a sine: the deep, round bass you feel more than hear.",
    macros: { tone: 0.3, length: 0.3, pitchDrop: 0.35, drive: 0.2, wobble: 0, width: 0, sub: 0.2, weight: 0.85 },
    base: { wave: "triangle", voices: 1, detuneCents: 0, resonance: 0.7, filterEnvOct: 0, filterDecayS: 0.1, attackS: 0.003, releaseS: 0.03, gainDb: -6 },
    tone: [90, 900], maxDropSemis: 12, maxStereoCents: 12, maxWobbleOct: 1.5,
  },
  "rubber-pluck": {
    id: "rubber-pluck", name: "Rubber pluck", part: "bass", tags: ["short", "bouncy"],
    about: "A sawtooth whose filter snaps open on every note and closes fast, with a little pitch drop: short, bouncy house bass.",
    macros: { tone: 0.15, length: 0.3, pitchDrop: 0.5, drive: 0.05, wobble: 0, width: 0.1, sub: 0.2, weight: 0.6 },
    base: { wave: "saw", voices: 1, detuneCents: 0, resonance: 2, filterEnvOct: 2.5, filterDecayS: 0.08, attackS: 0.002, releaseS: 0.02, gainDb: -12 },
    tone: [120, 2400], maxDropSemis: 7, maxStereoCents: 15, maxWobbleOct: 1.5,
  },
  reese: {
    id: "reese", name: "Reese", part: "bass", tags: ["wide", "dark"],
    about: "Three detuned sawtooths beating against each other, so even one long note growls and moves (after Kevin 'Reese' Saunderson, 1988).",
    macros: { tone: 0.15, length: 0.4, pitchDrop: 0, drive: 0.05, wobble: 0, width: 0.5, sub: 0.3, weight: 0.2 },
    base: { wave: "saw", voices: 3, detuneCents: 18, resonance: 1.2, filterEnvOct: 0.6, filterDecayS: 0.4, attackS: 0.008, releaseS: 0.1, gainDb: -14 },
    tone: [150, 3000], maxDropSemis: 5, maxStereoCents: 25, maxWobbleOct: 2,
  },
  "acid-line": {
    id: "acid-line", name: "Acid line", part: "bass", tags: ["squelchy", "resonant"],
    about: "A TB-303-style sawtooth through a resonant filter that opens on every note: Chicago acid house, 1987.",
    macros: { tone: 0.15, length: 0.3, pitchDrop: 0, drive: 0.1, wobble: 0, width: 0, sub: 0.3, weight: 0.7 },
    base: { wave: "saw", voices: 1, detuneCents: 0, resonance: 10, filterEnvOct: 3, filterDecayS: 0.18, attackS: 0.002, releaseS: 0.02, gainDb: -14 },
    tone: [120, 2500], maxDropSemis: 5, maxStereoCents: 12, maxWobbleOct: 2,
  },
};
export const MAKE_PRESET_IDS = Object.keys(MAKE_PRESETS) as MakePresetId[];

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
  return {
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
