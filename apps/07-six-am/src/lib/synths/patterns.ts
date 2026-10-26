// Bass and chord patterns as scale degrees on the Studio's 16-steps-per-bar grid (A6), and the
// pure function that turns one into notes in a track's key. Because every note is a scale degree
// and every time is a whole 16th, any pattern is in key and on the grid at any key and tempo.
import type { BassPresetId, ChordPresetId, SynthKind } from "./presets";
import { chordDegrees, degreeToMidi, midiName, pitchClass, tonicAtOrAbove, usesFlats, type Scale } from "./theory";

/** One bass note: a 16th to start on, a scale degree (0 = tonic, 7 = an octave up, -2 = the 6th below). */
export type BassStep = { step: number; degree: number; dur: number; vel?: number; accent?: boolean; slide?: boolean };
/** One chord hit: a 16th, the chord's root as a scale degree, triad / 7th / 9th, length in 16ths. */
export type ChordHit = { step: number; root: number; size: 3 | 4 | 5; dur: number; vel?: number };

type Base = { id: string; name: string; bars: number; idiom: string };
export type BassPattern = Base & { kind: "bass"; presets: BassPresetId[]; notes: BassStep[] };
export type ChordPattern = Base & { kind: "chords"; presets: ChordPresetId[]; hits: ChordHit[] };
export type SynthPattern = BassPattern | ChordPattern;

/** Registers: the bass tonic lands in E1–D#2 (41–78 Hz), chord roots in E3–D#4. */
export const BASS_LOW = 28;
export const CHORD_LOW = 52;

/** Repeat a one-bar figure over `count` bars; `fn(bar)` returns that bar's steps (0–15). */
function perBar<T extends { step: number }>(count: number, fn: (bar: number) => T[]): T[] {
  return Array.from({ length: count }, (_, b) => fn(b).map((x) => ({ ...x, step: b * 16 + x.step }))).flat();
}
const b = (step: number, degree: number, dur: number, extra: Partial<BassStep> = {}): BassStep => ({ step, degree, dur, ...extra });
const c = (step: number, root: number, size: 3 | 4 | 5, dur: number, vel?: number): ChordHit => ({ step, root, size, dur, vel });

// Root movement that works in both major and minor: i–i–VI–v (minor) is I–I–vi–V (major).
const ROOTS = [0, 0, -2, -3];
const CHORD_ROOTS = [0, 0, 5, 4];

export const BASS_PATTERNS: BassPattern[] = [
  {
    id: "sub-on-the-one", name: "Sub on the One", kind: "bass", bars: 4, presets: ["sub", "reese"],
    idiom: "One long note on the downbeat of each bar: the deep-house foundation that lets the kick breathe.",
    notes: perBar(4, (bar) => [b(0, ROOTS[bar], 12, { vel: 0.9 })]),
  },
  {
    id: "offbeat-bass", name: "Offbeat Bass", kind: "bass", bars: 2, presets: ["sub", "reese", "acid"],
    idiom: "A short note on every 'and' between the kicks: the classic house bounce.",
    notes: perBar(2, (bar) => [2, 6, 10, 14].map((s) => b(s, bar === 1 && s >= 10 ? -2 : 0, 2, { vel: 0.85 }))),
  },
  {
    id: "sub-stabs", name: "Sub Stabs", kind: "bass", bars: 4, presets: ["sub"],
    idiom: "Two short subs a bar, after the kick: tight and minimal.",
    notes: perBar(4, (bar) => [b(2, ROOTS[bar], 3), b(10, ROOTS[bar], 2, { vel: 0.75 })]),
  },
  {
    id: "rolling-acid", name: "Rolling Acid", kind: "bass", bars: 2, presets: ["acid"],
    idiom: "Rolling 16ths with accents and slides, jumping octaves: a Phuture-style acid line.",
    notes: perBar(2, (bar) => [0, 7, 0, 2, 0, 4, 7, 0, 0, 6, 0, 2, 7, 0, 4, bar ? -1 : 0].map((d, s) =>
      b(s, d, 1, { accent: [0, 3, 6, 10, 13].includes(s), slide: s === 6 || s === 12, vel: 0.8 }))),
  },
  {
    id: "acid-offbeat", name: "Acid Offbeat", kind: "bass", bars: 2, presets: ["acid"],
    idiom: "Acid notes off the beat with a slide into the next bar: leaves the kicks clear.",
    notes: perBar(2, (bar) => [
      b(2, 0, 1, { accent: true }), b(3, 7, 1, { slide: true }), b(6, 0, 1), b(7, 2, 1, { accent: true }),
      b(10, 0, 1), b(11, 4, 1, { slide: true }), b(14, bar ? 6 : 0, 2, { accent: bar === 1 }),
    ]),
  },
  {
    id: "acid-question", name: "Acid Question", kind: "bass", bars: 4, presets: ["acid"],
    idiom: "A two-bar call and a two-bar answer that climbs: acid that tells a little story.",
    notes: perBar(4, (bar) => {
      const top = [4, 4, 6, 7][bar];
      return [0, 2, 3, 5, 6, 8, 10, 11, 13, 14].map((s, i) =>
        b(s, i % 3 === 2 ? top : i % 2 ? 7 : 0, 1, { accent: s === 3 || s === 11, slide: s === 6 || s === 14 }));
    }),
  },
  {
    id: "reese-roll", name: "Reese Roll", kind: "bass", bars: 4, presets: ["reese"],
    idiom: "Long, overlapping reese notes moving down: a dark, rolling techno and garage bed.",
    notes: perBar(4, (bar) => [b(0, ROOTS[bar], 8, { vel: 0.85 }), b(8, ROOTS[bar], 6, { vel: 0.75 }), b(14, bar === 3 ? 0 : ROOTS[bar], 2, { vel: 0.7 })]),
  },
  {
    id: "reese-sixteenths", name: "Reese Sixteenths", kind: "bass", bars: 2, presets: ["reese", "sub"],
    idiom: "Three 16ths out of every four, skipping the kick: a driving tech-house roll.",
    notes: perBar(2, (bar) => [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15].map((s) =>
      b(s, bar === 1 && s > 8 ? -2 : 0, 1, { vel: s % 4 === 2 ? 0.9 : 0.6 }))),
  },
];

export const CHORD_PATTERNS: ChordPattern[] = [
  {
    id: "chicago-stab", name: "Chicago Stab", kind: "chords", bars: 4, presets: ["organ", "rhodes"],
    idiom: "Minor-7th stabs on a syncopated 3-6-11 rhythm: Chicago house, 1987.",
    hits: perBar(4, (bar) => [3, 6, 11].map((s) => c(s, CHORD_ROOTS[bar], 4, 1))),
  },
  {
    id: "offbeat-organ", name: "Offbeat Organ", kind: "chords", bars: 2, presets: ["organ"],
    idiom: "Short chords on every offbeat: the M1-organ bounce of early-'90s house.",
    hits: perBar(2, (bar) => [2, 6, 10, 14].map((s) => c(s, bar ? 5 : 0, 4, 1, 0.8))),
  },
  {
    id: "organ-push", name: "Organ Push", kind: "chords", bars: 4, presets: ["organ", "rhodes"],
    idiom: "A chord on the one and a pushed one before beat 4: the piano-house 'push' (think Robin S).",
    hits: perBar(4, (bar) => [c(0, CHORD_ROOTS[bar], 3, 2), c(10, CHORD_ROOTS[bar], 3, 2, 0.75), c(14, CHORD_ROOTS[bar], 3, 1, 0.6)]),
  },
  {
    id: "rhodes-nines", name: "Rhodes Nines", kind: "chords", bars: 4, presets: ["rhodes", "pad"],
    idiom: "Minor-9th chords, two lazy hits a bar: the warm deep-house Rhodes.",
    hits: perBar(4, (bar) => [c(3, [0, 3, 0, 4][bar], 5, 3, 0.7), c(11, [0, 3, 0, 4][bar], 5, 3, 0.6)]),
  },
  {
    id: "rhodes-swing", name: "Rhodes Swing", kind: "chords", bars: 2, presets: ["rhodes"],
    idiom: "A held ninth, then a short answer before the next bar.",
    hits: perBar(2, (bar) => [c(0, bar ? 3 : 0, 5, 6, 0.7), c(14, bar ? 4 : 0, 4, 2, 0.55)]),
  },
  {
    id: "sustained-pad", name: "Sustained Pad", kind: "chords", bars: 4, presets: ["pad"],
    idiom: "One held seventh chord per bar: the breakdown bed.",
    hits: perBar(4, (bar) => [c(0, [0, 5, 3, 4][bar], 4, 16, 0.6)]),
  },
  {
    id: "long-pad", name: "Long Pad", kind: "chords", bars: 8, presets: ["pad"],
    idiom: "Two ninth chords, four bars each: a slow sunrise intro.",
    hits: [c(0, 0, 5, 64, 0.55), c(64, 5, 5, 64, 0.55)],
  },
];

export const SYNTH_PATTERNS: SynthPattern[] = [...BASS_PATTERNS, ...CHORD_PATTERNS];
export const patternById = (id: string): SynthPattern | undefined => SYNTH_PATTERNS.find((p) => p.id === id);
export const patternsFor = (kind: SynthKind) => SYNTH_PATTERNS.filter((p) => p.kind === kind);

/**
 * One note to play: the 16th it starts on, MIDI pitch, length in 16ths, velocity 0–1, 303 accent
 * and slide (glide from the previous pitch), and tie (held into the next note, which slides).
 */
export type SynthNote = { step: number; midi: number; name: string; dur: number; vel: number; accent: boolean; slide: boolean; tie: boolean };

/**
 * A pattern in a key → its notes, sorted by step. Bass sits with its tonic in E1–D#2, chords with
 * their root in E3–D#4 (a chord whose root would climb past the window drops an octave, so stabs
 * stay in one register). Unknown key → null.
 */
export function renderPattern(pattern: SynthPattern, key: string, scale: Scale): SynthNote[] | null {
  const tonic = pitchClass(key);
  if (tonic === null) return null;
  const flats = usesFlats(tonic, scale);
  const note = (step: number, midi: number, dur: number, vel = 0.8, accent = false, slide = false): SynthNote =>
    ({ step, midi, name: midiName(midi, flats), dur, vel, accent, slide, tie: false });

  if (pattern.kind === "bass") {
    const t = tonicAtOrAbove(tonic, BASS_LOW);
    const notes = pattern.notes
      .map((n) => note(n.step, degreeToMidi(n.degree, t, scale), n.dur, n.vel ?? (n.accent ? 1 : 0.75), !!n.accent, !!n.slide))
      .sort((x, y) => x.step - y.step);
    // The bass is monophonic: a note ends by the next one's start (or the loop's end), and a note
    // the next one slides into is held right up to it, like a 303's tie.
    return notes.map((n, i) => {
      const next = notes[i + 1], end = next ? next.step : pattern.bars * 16;
      return { ...n, dur: next?.slide ? end - n.step : Math.min(n.dur, end - n.step), tie: !!next?.slide };
    });
  }
  const t = tonicAtOrAbove(tonic, CHORD_LOW);
  return pattern.hits
    .flatMap((h) => {
      // Fold the root into the register window, then stack the chord above it.
      const rootMidi = degreeToMidi(h.root, t, scale);
      const shift = rootMidi >= CHORD_LOW + 12 ? -12 : rootMidi < CHORD_LOW ? 12 : 0;
      return chordDegrees(h.root, h.size).map((d) => note(h.step, degreeToMidi(d, t, scale) + shift, h.dur, h.vel ?? 0.7));
    })
    .sort((x, y) => x.step - y.step || x.midi - y.midi);
}

/** The Transport position of a 16th, "bars:beats:sixteenths" (Tone's notation, follows its tempo). */
export function stepToBBS(step: number): string {
  return `${Math.floor(step / 16)}:${Math.floor((step % 16) / 4)}:${step % 4}`;
}
