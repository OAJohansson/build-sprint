// Keys, scales and scale degrees (A6, Phase 3 S3). Patterns are written as scale degrees, so the
// same pattern is in key in any of the 24 keys. Pure, no audio, unit tested.

export type Scale = "major" | "minor";

/** Steps above the tonic, in semitones. Minor is natural minor (Aeolian), house's default. */
export const SCALE_STEPS: Record<Scale, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

const LETTER: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** "A", "A#", "Bb", "a♯", "Cb", "E#" → pitch class 0–11 (C = 0); anything else → null. */
export function pitchClass(key: string): number | null {
  const m = /^\s*([A-Ga-g])\s*([#♯b♭]*)\s*$/.exec(key ?? "");
  if (!m) return null;
  const accidentals = m[2];
  if (accidentals.length > 2) return null;
  let pc = LETTER[m[1].toUpperCase()];
  for (const a of accidentals) pc += a === "#" || a === "♯" ? 1 : -1;
  return mod(pc, 12);
}

/** Every pitch class in the key's scale. */
export function scalePitchClasses(tonic: number, scale: Scale): number[] {
  return SCALE_STEPS[scale].map((s) => mod(tonic + s, 12));
}

export function inScale(midi: number, tonic: number, scale: Scale): boolean {
  return scalePitchClasses(tonic, scale).includes(mod(midi, 12));
}

/** The tonic's MIDI note at or just above `low` (so a register is a 12-note window). */
export function tonicAtOrAbove(tonic: number, low: number): number {
  return low + mod(tonic - low, 12);
}

/**
 * Scale degree → MIDI note. Degree 0 is `tonicMidi`; 1 is the 2nd, 7 the tonic an octave up,
 * -1 the 7th below. Wraps across octaves in both directions.
 */
export function degreeToMidi(degree: number, tonicMidi: number, scale: Scale): number {
  const steps = SCALE_STEPS[scale];
  const octave = Math.floor(degree / 7);
  return tonicMidi + 12 * octave + steps[mod(degree, 7)];
}

/** A chord built in thirds on a scale degree: size 3 = triad, 4 = seventh, 5 = ninth. Diatonic, so always in key. */
export function chordDegrees(root: number, size: 3 | 4 | 5): number[] {
  return Array.from({ length: size }, (_, i) => root + 2 * i);
}

// Flat keys spell with flats (Bb minor, not A# minor), the rest with sharps.
const FLAT_MAJOR = new Set([5, 10, 3, 8, 1, 6]); // F Bb Eb Ab Db Gb
const FLAT_MINOR = new Set([2, 7, 0, 5, 10, 3]); // D G C F Bb Eb
const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export function usesFlats(tonic: number, scale: Scale): boolean {
  return (scale === "major" ? FLAT_MAJOR : FLAT_MINOR).has(mod(tonic, 12));
}

/** 33 → "A1" (MIDI octave numbering, C4 = 60), spelled for the key. */
export function midiName(midi: number, flats = false): string {
  return `${(flats ? FLATS : SHARPS)[mod(midi, 12)]}${Math.floor(midi / 12) - 1}`;
}

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
