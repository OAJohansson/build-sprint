// A library sound in a Studio track (S5, L158, L172, L174): a copy of the sound's settings (preset,
// six macros, the MIDI note pattern with its key, scale and BPM) plus the library id it came from,
// so it stays editable in the Studio and a later library edit never changes the song. It plays
// in the track's key and tempo: the pattern is transposed from the sound's key to the track's and
// rendered by the Make synth (render.ts) one pass at the track's tempo; the Studio loops that
// buffer over the block. Pure, unit tested (lib-loop.test.ts).
import { legacyTrack, type LaneType } from "@/lib/studio-lanes";
import { inScale, pitchClass, type Scale } from "@/lib/synths/theory";
import { parseNotes, type LibPart, type LibrarySound } from "./library";
import { clampDrumMacros, isDrumPreset, renderDrumRow, rowOf, DRUM_PRESETS, type DrumMacros, type DrumPresetId, type DrumRow } from "./drum-synth";
import { notesForLoop, snapToKey } from "./pattern";
import { MAKE_PRESETS, clampMacros, synthParams, type Macros, type MakePresetId } from "./presets";
import { renderBass, type MakeNote, type Rendered } from "./render";
import { rmsDb } from "./level";

type LibLoopBase = {
  id: string;
  source: "lib";
  name: string;
  /** One pass, in bars (the pattern's). */
  bars: 1 | 2 | 4;
  /** The lane type it belongs in, and the old lane (0–3) that type plays through. */
  type: LaneType;
  lane: 0 | 1 | 2 | 3;
  /** The library sound it was copied from, or null when that's unknown. */
  libId: string | null;
  pattern: { bars: 1 | 2 | 4; notes: MakeNote[] };
  /** The key, scale and tempo the pattern was saved in; the track's are used to play it. */
  key: string;
  scale: Scale;
  bpm: number;
};
export type BassLoop = LibLoopBase & { preset: MakePresetId; macros: Macros };
/** Phase 5: one drum row (kick, clap & snare or hats) with its own knobs; plays at the track's tempo, in no key. */
export type DrumLoop = LibLoopBase & { preset: DrumPresetId; macros: DrumMacros };
export type LibLoop = BassLoop | DrumLoop;
export const isDrumLoop = (l: LibLoop): l is DrumLoop => isDrumPreset(l.preset);

/** The lane type a library part drops into (Make only makes bass today; the rest are guesses
 *  until Make makes them: drums → Percussion, other → Lead). */
export const PART_LANE: Record<LibPart, LaneType> = { bass: "bass", drums: "perc", other: "lead", vocals: "vocals" };
/** Phase 5 (P9): a drum row lands on its own lane (L216). */
export const DRUM_ROW_LANE: Record<DrumRow, LaneType> = { kick: "kick", clap: "clap", hats: "hats" };
/** The lane type a library sound drops into: a drum row's own lane, else its part's. */
export const libLaneType = (s: Pick<LibrarySound, "part" | "preset">): LaneType => (isDrumPreset(s.preset) ? DRUM_ROW_LANE[rowOf(s.preset)] : PART_LANE[s.part]);

const newId = () => `s${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

/** A track's own copy of a library sound, for a lane of `type` (its part's type by default). */
export function libLoopFrom(s: LibrarySound, type: LaneType = libLaneType(s), id = newId()): LibLoop {
  return {
    id, source: "lib", name: s.name, bars: s.pattern.bars, type, lane: legacyTrack(type), libId: s.id,
    preset: s.preset, macros: { ...s.macros }, pattern: { bars: s.pattern.bars, notes: s.pattern.notes.map((n) => ({ ...n })) },
    key: s.key, scale: s.scale, bpm: s.bpm,
  } as LibLoop;
}

/** A block's sound edited in the Studio (preset and macros only; the pattern stays). */
export function editLibLoop(l: LibLoop, edit: { preset?: MakePresetId | DrumPresetId; macros?: Partial<Macros> | DrumMacros }): LibLoop {
  if (isDrumLoop(l)) {
    // A drum row stays on its row (its lane depends on it).
    const preset = isDrumPreset(edit.preset) && rowOf(edit.preset) === rowOf(l.preset) ? edit.preset : l.preset;
    return { ...l, preset, macros: clampDrumMacros(preset, { ...l.macros, ...edit.macros }) };
  }
  const preset = edit.preset && edit.preset in MAKE_PRESETS ? (edit.preset as MakePresetId) : l.preset;
  return { ...l, preset, macros: clampMacros(preset, { ...l.macros, ...(edit.macros as Partial<Macros>) }) };
}

// ── Key ─────────────────────────────────────────────────────────────────────────────────────────

const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * Semitones to move a pattern from its key to the track's, −6…+5 (the nearest way, down on a tie,
 * so a bass stays low). Same scale: tonic onto tonic. A minor sound in a major track goes to the
 * track's relative minor (and major into minor to the relative major), which has the same notes,
 * so the line keeps its own mood and every note is in the track's scale.
 */
export function transposeSemis(from: { key: string; scale: Scale }, to: { key: string; scale: Scale }): number {
  const a = pitchClass(from.key), b = pitchClass(to.key);
  if (a === null || b === null) return 0;
  const target = from.scale === to.scale ? b : from.scale === "minor" ? b + 9 : b + 3;
  const up = mod(target - a, 12);
  return up >= 6 ? up - 12 : up;
}

/** The pattern's notes in the track's key: moved by transposeSemis, then any note still outside
 *  the track's scale (a passing note) snapped to the nearest one in it. */
export function notesInKey(l: Pick<LibLoop, "pattern" | "key" | "scale">, key: string, scale: Scale): MakeNote[] {
  const semis = transposeSemis(l, { key, scale });
  const tonic = pitchClass(key) ?? 9;
  return l.pattern.notes.map((n) => {
    const m = n.midi + semis;
    return { ...n, midi: inScale(m, tonic, scale) ? m : snapToKey(m, tonic, scale) };
  });
}

// ── Tempo and length ─────────────────────────────────────────────────────────────────────────────

/** Bars per phrase: house is built in 8-bar phrases (the ruler's numbers, timeline.tsx). */
export const PHRASE = 8;

/** The first bar of the phrase holding `bar` (1, 9, 17, …). */
export const phraseStart = (bar: number, phrase = PHRASE) => 1 + Math.floor((Math.max(1, Math.floor(bar)) - 1) / phrase) * phrase;

/** A dropped block's length: whole passes filling one phrase (at least one pass), never past the
 *  track's last bar. 0 when not even one pass fits from `start`. */
export function dropLength(passBars: number, start: number, total: number, phrase = PHRASE): number {
  const room = total - start + 1;
  const passes = Math.max(1, Math.floor(phrase / passBars));
  return Math.max(0, Math.min(passes, Math.floor(room / passBars))) * passBars;
}

/**
 * One pass of the block in the track's key at the track's tempo, rendered by the Make synth: the
 * notes sit on the track's 16ths (the pattern is in 16ths, not seconds, so a new tempo only changes
 * the 16th's length; the wobble follows the beat too), and the pass is exactly `bars` bars long.
 * Each note lasts until the next and the Length macro shortens it, as in Make (L174).
 */
export function renderLibPass(l: LibLoop, track: { key: string; scale: Scale; bpm: number }, rate = 44100): Rendered {
  const steps = l.bars * 16;
  // A drum row: its hits at their steps and swing offsets, at the track's tempo; drums have no key.
  if (isDrumLoop(l)) return renderDrumRow(l.preset, l.macros, l.pattern.notes, { bpm: track.bpm, steps, rate });
  const notes = notesForLoop({ bars: l.bars, notes: notesInKey(l, track.key, track.scale) }, steps);
  return renderBass(notes, synthParams(l.preset, l.macros), { bpm: track.bpm, steps, rate });
}

/**
 * The level a library block plays at before its lane's trim and fader: −23 dB RMS (mid) over the
 * pass. Calibrated by ear-equivalent on the Studio's master meter (26 Oct, S5): the crate's bass
 * loops read −27…−29 dB through the bass lane, and a pass at −23 reads about −29 there (the meter's
 * short window reads a steady Make line lower than its true RMS). Make's own level varies by preset
 * and Drive; in the Studio each sound starts level with the crate, and the lane fader does the rest.
 */
export const LIB_LEVEL_DB = -23;
const MAX_LIFT_DB = 18, MAX_CUT_DB = 24;

/** The pass's level as the crate was measured: RMS of the mid, (L+R)/2 (Width is side signal). */
export function midRmsDb(r: Rendered): number {
  const mid = r.left.map((x, i) => (x + r.right[i]) / 2);
  return rmsDb({ left: mid, right: mid, rate: r.rate });
}

/** Phase 5: a drum row's level in a Studio block (mid RMS over the pass): a kick sits higher than a clap, a clap than hats. */
// shortcut: per-row levels set by reasoning about a house mix (kick loudest, hats ~8 dB under), not measured against the crate's drum loops; measure them like LIB_LEVEL_DB if the owner finds a lane too loud.
export const DRUM_LIB_LEVEL_DB: Record<DrumRow, number> = { kick: -21, clap: -25, hats: -29 };
/** The level a library block plays at: LIB_LEVEL_DB for a bass, its row's for a drum. */
export const libLevelDb = (l: Pick<LibLoop, "preset">) => (isDrumPreset(l.preset) ? DRUM_LIB_LEVEL_DB[rowOf(l.preset)] : LIB_LEVEL_DB);

/** The pass scaled to `target` (LIB_LEVEL_DB; a silent pass, a pattern with no notes, stays as it is). */
export function levelled(r: Rendered, target = LIB_LEVEL_DB): Rendered {
  const now = midRmsDb(r);
  if (now < -90) return r;
  const g = Math.pow(10, Math.min(MAX_LIFT_DB, Math.max(-MAX_CUT_DB, target - now)) / 20);
  return { left: r.left.map((x) => x * g), right: r.right.map((x) => x * g), rate: r.rate };
}

/** What a rendered pass depends on: a changed sound, key or tempo needs a new render. */
export const passSignature = (l: LibLoop, track: { key: string; scale: Scale; bpm: number }) =>
  JSON.stringify([l.preset, l.macros, l.pattern, l.key, l.scale, track.key, track.scale, Math.round(track.bpm * 100)]);

// ── Parsing (saved docs) ─────────────────────────────────────────────────────────────────────────

const LANE_TYPES: LaneType[] = ["kick", "clap", "hats", "perc", "bass", "chords", "pads", "lead", "vocals", "fx", "texture"];

/** A stored block sound we can trust, or null: known preset and type, macros clamped, notes on the
 *  grid inside the pass, a real key. Its old lane always follows from its type. */
export function parseLibLoop(v: unknown): LibLoop | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (o.source !== "lib" || typeof o.id !== "string" || !o.id || o.id.length > 40) return null;
  const drum = isDrumPreset(o.preset);
  if (!drum && (typeof o.preset !== "string" || !(o.preset in MAKE_PRESETS))) return null;
  if (typeof o.type !== "string" || !LANE_TYPES.includes(o.type as LaneType)) return null;
  const pat = (o.pattern ?? {}) as Record<string, unknown>;
  const bars = pat.bars === 1 || pat.bars === 2 || pat.bars === 4 ? pat.bars : null;
  const notes = bars ? parseNotes(pat.notes, bars) : null;
  if (!bars || !notes || (o.bars !== undefined && o.bars !== bars)) return null;
  if (typeof o.key !== "string" || pitchClass(o.key) === null || (o.scale !== "major" && o.scale !== "minor")) return null;
  if (typeof o.bpm !== "number" || !Number.isFinite(o.bpm) || o.bpm < 40 || o.bpm > 220) return null;
  const type = o.type as LaneType;
  if (drum) {
    const preset = o.preset as DrumPresetId;
    return {
      id: o.id, source: "lib", name: typeof o.name === "string" && o.name.trim() ? o.name.trim().slice(0, 60) : DRUM_PRESETS[preset].name,
      bars, type, lane: legacyTrack(type), libId: typeof o.libId === "string" && o.libId.length <= 40 ? o.libId : null,
      preset, macros: clampDrumMacros(preset, (o.macros ?? {}) as Record<string, unknown>), pattern: { bars, notes },
      key: o.key.trim(), scale: o.scale, bpm: o.bpm,
    };
  }
  const preset = o.preset as MakePresetId;
  return {
    id: o.id, source: "lib", name: typeof o.name === "string" && o.name.trim() ? o.name.trim().slice(0, 60) : MAKE_PRESETS[preset].name,
    bars, type, lane: legacyTrack(type), libId: typeof o.libId === "string" && o.libId.length <= 40 ? o.libId : null,
    preset, macros: clampMacros(preset, (o.macros ?? {}) as Partial<Macros>), pattern: { bars, notes },
    key: o.key.trim(), scale: o.scale, bpm: o.bpm,
  };
}
