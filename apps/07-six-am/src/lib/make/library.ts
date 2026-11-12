// The personal sound library (S4, L146, L158): a sound and its loop, linked: the preset and its
// macro values (the sound) plus the note pattern (the loop), tagged with part, key, BPM and the
// source song, under a suggested name the owner can rename. Only the owner's own settings and
// measurements: never audio, and never audio of the original (L143). Pure: shapes, tag
// normalisation, the suggested name and the whitelist parsers the API uses (library.test.ts).
import { pitchClass, type Scale } from "@/lib/synths/theory";
import { MAKE_PRESETS, clampMacros, macroWord, type Macros, type MakePresetId } from "./presets";
import type { MakeNote } from "./render";
import { FX_KNOBS, FX_NOUN, FX_PRESETS, clampFxMacros, fxPassBars, fxRowOf, isFxPreset, type FxKnobId, type FxMacros, type FxPresetId } from "./fx-synth";
import { POLY_KNOBS, clampPolyMacros, isMelodyPreset, kindOf, melodyPreset, melodyRowOf, type MelodyPresetId, type PolyKnobId, type PolyMacros } from "./poly-synth";
import { DRUM_PRESETS, ROW_KNOBS, clampDrumMacros, isDrumPreset, rowOf, type DrumKnobId, type DrumMacros, type DrumPresetId } from "./drum-synth";

export const LIB_PARTS = ["bass", "drums", "other", "vocals"] as const;
export type LibPart = (typeof LIB_PARTS)[number];

type SoundBase = {
  id: string;
  name: string;
  part: LibPart;
  /** The loop: 1–4 bars of notes on the 16th grid (MIDI pitches in `key`; a drum row's hits carry
   *  the General MIDI drum note and their swing offset `off`, in 16ths). */
  pattern: { bars: 1 | 2 | 4; notes: MakeNote[] };
  key: string;
  scale: Scale;
  bpm: number;
  /** The song it was made from (title and SoundCloud URL), or null. */
  source: { title: string; url: string } | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};
/** A bass (S4) or, from Phase 5, one drum row (part "drums"; the preset says which row: kick, clap or hats). */
export type BassSound = SoundBase & { preset: MakePresetId; macros: Macros };
export type DrumSound = SoundBase & { part: "drums"; preset: DrumPresetId; macros: DrumMacros };
/** Phase 5 slice 2: a melody row (part "other"; the preset says the row: chords-… or lead-…), its
 *  notes in `key`, with a repeat of up to 16 bars. */
export type MelodySound = Omit<SoundBase, "pattern"> & { part: "other"; preset: MelodyPresetId; macros: PolyMacros; pattern: { bars: 1 | 2 | 4 | 8 | 16; notes: MakeNote[] } };
/** Phase 5 slice 3: one FX row (part "other"; the preset says which: fx-impact-…, fx-down-…, fx-riser-…),
 *  one event per pass (its note carries the step it starts on and the key's root). */
export type FxSound = Omit<SoundBase, "pattern"> & { part: "other"; preset: FxPresetId; macros: FxMacros; pattern: { bars: 1 | 2 | 4 | 8; notes: MakeNote[] } };
export type LibrarySound = BassSound | DrumSound | MelodySound | FxSound;
type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type NewSound = DistOmit<LibrarySound, "id" | "createdAt" | "updatedAt">;
export type SoundPatch = { name?: string; tags?: string[]; preset?: MakePresetId | DrumPresetId | MelodyPresetId | FxPresetId; macros?: Macros | DrumMacros | PolyMacros | FxMacros };
export const isDrumSound = <T extends { preset: string }>(s: T): s is T & { preset: DrumPresetId } => isDrumPreset(s.preset);
export const isBassSound = (s: LibrarySound): s is BassSound => !isDrumPreset(s.preset) && !isMelodyPreset(s.preset) && !isFxPreset(s.preset);
export const isFxSound = <T extends { preset: string }>(s: T): s is T & { preset: FxPresetId } => isFxPreset(s.preset);
export const isMelodySound = <T extends { preset: string }>(s: T): s is T & { preset: MelodyPresetId } => isMelodyPreset(s.preset);

export const MAX_TAGS = 12;
export const MAX_NAME = 60;
const MAX_TAG = 32;
const MAX_NOTES = 64;
/** Phase 5 melody: a progression of chords over up to 16 bars holds many more notes than a bassline. */
export const MAX_MELODY_NOTES = 512;
/** A melody row's repeat may be 8 or 16 bars (a progression); bass and drums keep 1, 2 or 4. */
export const MELODY_BARS = [1, 2, 4, 8, 16] as const;

/**
 * Tags as stored and searched: lower case, single spaces, no surrounding punctuation, at most 32
 * characters; duplicates and empties dropped; at most 12, in the order given.
 */
export function normalizeTags(tags: unknown[]): string[] {
  const out: string[] = [];
  for (const t of tags) {
    if (typeof t !== "string" && typeof t !== "number") continue;
    const v = String(t).normalize("NFC").toLowerCase().replace(/[\s_]+/g, " ").replace(/^[\s,.;:!?·#-]+|[\s,.;:!?·-]+$/g, "").slice(0, MAX_TAG).trim();
    if (v && !out.includes(v)) out.push(v);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

/** The song's short title: no "(… remix)", "[feat. …]", "feat. …" or " - extra", at most 32 chars on a word. */
export function shortTitle(title: string): string {
  let t = title.normalize("NFC").replace(/\s*[([].*$/, "").replace(/\s+(feat\.?|ft\.?|featuring)\s.*$/i, "").replace(/\s+[-–—]\s+.*$/, "").trim();
  if (!t) t = title.trim();
  if (t.length <= 32) return t;
  const cut = t.slice(0, 32);
  return (cut.includes(" ") ? cut.slice(0, cut.lastIndexOf(" ")) : cut).replace(/[\s,.;:-]+$/, "") + "…";
}

const PRESET_WORD: Record<MakePresetId, string> = { "round-sub": "Round", "rubber-pluck": "Rubbery", reese: "Rolling", "acid-line": "Squelchy" };

/** A word for the sound, from its strongest macro when one stands out, else from its preset. */
export function soundWord(preset: MakePresetId, m: Macros): string {
  if (m.wobble >= 0.4) return "Wobbly";
  if (m.drive >= 0.6) return "Gritty";
  if (m.pitchDrop >= 0.5 && m.length <= 0.4) return "Rubbery";
  if (m.width >= 0.6) return "Wide";
  if (macroWord("tone", m.tone) === "bright" && preset !== "acid-line") return "Bright";
  if (macroWord("tone", m.tone) === "dark" && preset === "round-sub") return "Deep";
  return PRESET_WORD[preset];
}

/** The suggested library name (L158, T83): "Rubbery bass, from Lost in The Loop". */
export function suggestName(part: LibPart, preset: MakePresetId, m: Macros, songTitle?: string | null): string {
  const what = `${soundWord(preset, m)} ${part}`;
  const s = songTitle ? shortTitle(songTitle) : "";
  return (s ? `${what}, from ${s}` : what).slice(0, MAX_NAME);
}

/** The tags a new sound gets: part, preset tags, key, BPM, song. */
export function suggestTags(part: LibPart, preset: MakePresetId, key: string, scale: Scale, bpm: number, songTitle?: string | null): string[] {
  return normalizeTags([part, ...MAKE_PRESETS[preset].tags, `${key} ${scale}`, `${Math.round(bpm)} bpm`, songTitle ? shortTitle(songTitle) : ""]);
}

// ── Parsers (the browser sends these; keep only what we expect) ─────────────────────────────────

const num = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : null);
const cleanName = (v: unknown) => (typeof v === "string" ? v.normalize("NFC").replace(/\s+/g, " ").trim().slice(0, MAX_NAME) : "");

/** A loop's notes we can trust (on the 16th grid inside `bars`, MIDI 12–96), sorted, or null. */
export function parseNotes(v: unknown, bars: number, max = MAX_NOTES): MakeNote[] | null {
  if (!Array.isArray(v) || v.length > max) return null;
  const out: MakeNote[] = [];
  for (const x of v) {
    const o = (x ?? {}) as Record<string, unknown>;
    const step = num(o.step, 0, bars * 16 - 1), midi = num(o.midi, 12, 96), dur = num(o.dur, 0.25, 64), vel = num(o.vel, 0, 1);
    if (step === null || midi === null || dur === null || vel === null || !Number.isInteger(step) || !Number.isInteger(midi)) return null;
    // Phase 5: a drum hit's swing offset (16ths); bass notes never have one, so they parse as before.
    const off = num(o.off, -0.5, 0.5);
    out.push(off === null ? { step, midi, dur, vel } : { step, midi, dur, vel, off });
  }
  return out.sort((a, b) => a.step - b.step);
}

/** A new sound we can trust, or null. Unknown fields (and anything like audio) are dropped. */
export function parseNewSound(raw: unknown): NewSound | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (isDrumPreset(r.preset)) return parseDrumSound(r, r.preset);
  if (isMelodyPreset(r.preset)) return parseMelodySound(r, r.preset);
  if (isFxPreset(r.preset)) return parseFxSound(r, r.preset);
  if (typeof r.preset !== "string" || !(r.preset in MAKE_PRESETS)) return null;
  const preset = r.preset as MakePresetId;
  const part = LIB_PARTS.find((p) => p === r.part);
  const scale = r.scale === "major" || r.scale === "minor" ? r.scale : null;
  const key = typeof r.key === "string" && pitchClass(r.key) !== null ? r.key.trim() : null;
  const bpm = num(r.bpm, 40, 220);
  const pat = (r.pattern ?? {}) as Record<string, unknown>;
  const bars = pat.bars === 1 || pat.bars === 2 || pat.bars === 4 ? pat.bars : null;
  const notes = bars ? parseNotes(pat.notes, bars) : null;
  if (!part || !scale || !key || bpm === null || !bars || !notes) return null;
  const src = r.source as Record<string, unknown> | null | undefined;
  const source = src && typeof src.url === "string" && /^https:\/\/(on\.|m\.)?soundcloud\.com\/\S+$/i.test(src.url) && src.url.length <= 600
    ? { url: src.url, title: typeof src.title === "string" ? src.title.slice(0, 300) : "" } : null;
  const macros = clampMacros(preset, (r.macros ?? {}) as Partial<Macros>);
  const name = cleanName(r.name) || suggestName(part, preset, macros, source?.title);
  const tags = normalizeTags(Array.isArray(r.tags) ? r.tags : suggestTags(part, preset, key, scale, bpm, source?.title));
  return { name, part, preset, macros, pattern: { bars, notes }, key, scale, bpm: Math.round(bpm * 100) / 100, source, tags };
}

const sourceOf = (src: Record<string, unknown> | null | undefined) =>
  src && typeof src.url === "string" && /^https:\/\/(on\.|m\.)?soundcloud\.com\/\S+$/i.test(src.url) && src.url.length <= 600
    ? { url: src.url, title: typeof src.title === "string" ? src.title.slice(0, 300) : "" } : null;

/** A drum row's sound (Phase 5, P9): part "drums", the row's preset and knobs, its hits. */
function parseDrumSound(r: Record<string, unknown>, preset: DrumPresetId): NewSound | null {
  const scale = r.scale === "major" || r.scale === "minor" ? r.scale : null;
  const key = typeof r.key === "string" && pitchClass(r.key) !== null ? r.key.trim() : null;
  const bpm = num(r.bpm, 40, 220);
  const pat = (r.pattern ?? {}) as Record<string, unknown>;
  const bars = pat.bars === 1 || pat.bars === 2 || pat.bars === 4 ? pat.bars : null;
  const notes = bars ? parseNotes(pat.notes, bars) : null;
  if (r.part !== "drums" || !scale || !key || bpm === null || !bars || !notes) return null;
  const source = sourceOf(r.source as Record<string, unknown> | null | undefined);
  const macros = clampDrumMacros(preset, (r.macros ?? {}) as Record<string, unknown>);
  const name = cleanName(r.name) || suggestDrumName(preset, macros, source?.title);
  const tags = normalizeTags(Array.isArray(r.tags) ? r.tags : suggestDrumTags(preset, bpm, source?.title, macros));
  return { name, part: "drums", preset, macros, pattern: { bars, notes }, key, scale, bpm: Math.round(bpm * 100) / 100, source, tags };
}

/** A melody row's sound (Phase 5 slice 2): part "other", the row's preset and six knobs, its notes. */
function parseMelodySound(r: Record<string, unknown>, preset: MelodyPresetId): NewSound | null {
  const scale = r.scale === "major" || r.scale === "minor" ? r.scale : null;
  const key = typeof r.key === "string" && pitchClass(r.key) !== null ? r.key.trim() : null;
  const bpm = num(r.bpm, 40, 220);
  const pat = (r.pattern ?? {}) as Record<string, unknown>;
  const bars = MELODY_BARS.find((b) => b === pat.bars) ?? null;
  const notes = bars ? parseNotes(pat.notes, bars, MAX_MELODY_NOTES) : null;
  if (r.part !== "other" || !scale || !key || bpm === null || !bars || !notes) return null;
  const source = sourceOf(r.source as Record<string, unknown> | null | undefined);
  const macros = clampPolyMacros(preset, (r.macros ?? {}) as Record<string, unknown>);
  const name = cleanName(r.name) || suggestMelodyName(preset, macros, source?.title);
  const tags = normalizeTags(Array.isArray(r.tags) ? r.tags : suggestMelodyTags(preset, key, scale, bpm, source?.title, macros));
  return { name, part: "other", preset, macros, pattern: { bars, notes }, key, scale, bpm: Math.round(bpm * 100) / 100, source, tags };
}

/** An FX row's sound (slice 3): part "other", the row's preset and knobs, one event per pass. */
function parseFxSound(r: Record<string, unknown>, preset: FxPresetId): NewSound | null {
  const scale = r.scale === "major" || r.scale === "minor" ? r.scale : null;
  const key = typeof r.key === "string" && pitchClass(r.key) !== null ? r.key.trim() : null;
  const bpm = num(r.bpm, 40, 220);
  const pat = (r.pattern ?? {}) as Record<string, unknown>;
  const bars = ([1, 2, 4, 8] as const).find((b) => b === pat.bars) ?? null;
  const notes = bars ? parseNotes(pat.notes, bars, 4) : null;
  if (r.part !== "other" || !scale || !key || bpm === null || !bars || !notes) return null;
  const source = sourceOf(r.source as Record<string, unknown> | null | undefined);
  const macros = clampFxMacros(preset, (r.macros ?? {}) as Record<string, unknown>);
  const name = cleanName(r.name) || suggestFxName(preset, macros, source?.title);
  const tags = normalizeTags(Array.isArray(r.tags) ? r.tags : suggestFxTags(preset, key, scale, bpm, source?.title, macros));
  return { name, part: "other", preset, macros, pattern: { bars, notes }, key, scale, bpm: Math.round(bpm * 100) / 100, source, tags };
}

/** FX names, preset first: "Sub drop", "Dark fall", "Bright noise riser", then a knob word (T132). */
const FX_NAME: Record<FxPresetId, string> = {
  "fx-impact-big": "Big hit", "fx-impact-subdrop": "Sub drop", "fx-impact-crash": "Crash hit", "fx-down-dark": "Dark fall", "fx-down-noise": "Noise fall",
  "fx-riser-noise": "Bright noise riser", "fx-riser-revcrash": "Reverse crash", "fx-riser-synth": "Synth riser",
};
const FX_KNOB_WORD: Record<FxKnobId, [string, string]> = { size: ["big", "small"], tone: ["bright", "dark"], tail: ["long", "short"], drop: ["deep", "slight"], length: ["long", "short"], rise: ["long", "short"], width: ["wide", "narrow"] };
export function fxWord(preset: FxPresetId, m: FxMacros): string | null {
  const home = clampFxMacros(preset, undefined), full = clampFxMacros(preset, m);
  const far = FX_KNOBS[fxRowOf(preset)].map((id) => ({ id, d: (full[id] ?? 0) - (home[id] ?? 0) })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
  return far && Math.abs(far.d) >= NAME_MOVE ? FX_KNOB_WORD[far.id][far.d > 0 ? 0 : 1] : null;
}
export function suggestFxName(preset: FxPresetId, m: FxMacros, songTitle?: string | null): string {
  const w = fxWord(preset, m), base = w ? `${FX_NAME[preset]}, ${w}` : FX_NAME[preset];
  const s = songTitle ? shortTitle(songTitle) : "";
  return (s ? `${base}, from ${s}` : base).slice(0, MAX_NAME);
}
export function suggestFxTags(preset: FxPresetId, key: string, scale: Scale, bpm: number, songTitle?: string | null, m?: FxMacros): string[] {
  const bars = fxPassBars(preset, m ?? {});
  return normalizeTags(["fx", FX_NOUN[fxRowOf(preset)], ...FX_PRESETS[preset].tags, (m && fxWord(preset, m)) ?? "", `${bars} bar${bars === 1 ? "" : "s"}`, `${key} ${scale}`, `${Math.round(bpm)} bpm`, songTitle ? shortTitle(songTitle) : ""]);
}

/** A melody sound's name, preset first: "Stab chords", "Pluck lead", then a knob word (as drums, T132). */
const MELODY_KNOB_WORD: Record<PolyKnobId, [string, string]> = { tone: ["bright", "dark"], length: ["long", "short"], attack: ["swelling", "hard"], detune: ["thick", "plain"], width: ["wide", "narrow"], space: ["roomy", "dry"] };
export function melodyWord(preset: MelodyPresetId, m: PolyMacros): string | null {
  const home = melodyPreset(preset).macros, full = clampPolyMacros(preset, m);
  const far = POLY_KNOBS.map((id) => ({ id, d: full[id] - home[id] })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
  return far && Math.abs(far.d) >= NAME_MOVE ? MELODY_KNOB_WORD[far.id][far.d > 0 ? 0 : 1] : null;
}
export const melodyNoun = (preset: MelodyPresetId) => (melodyRowOf(preset) === "lead" ? "lead" : kindOf(preset) === "pad" ? "pads" : "chords");
export function suggestMelodyName(preset: MelodyPresetId, m: PolyMacros, songTitle?: string | null): string {
  const w = melodyWord(preset, m);
  const base = `${melodyPreset(preset).name} ${melodyNoun(preset)}`;
  const s = songTitle ? shortTitle(songTitle) : "";
  return (s ? `${w ? `${base}, ${w}` : base}, from ${s}` : w ? `${base}, ${w}` : base).slice(0, MAX_NAME);
}
export function suggestMelodyTags(preset: MelodyPresetId, key: string, scale: Scale, bpm: number, songTitle?: string | null, m?: PolyMacros): string[] {
  return normalizeTags([melodyNoun(preset), ...melodyPreset(preset).tags, (m && melodyWord(preset, m)) ?? "", `${key} ${scale}`, `${Math.round(bpm)} bpm`, songTitle ? shortTitle(songTitle) : ""]);
}

/** What a drum row's sound is called: kick, clap, snare, rim or hats (the row's noun, by preset). */
export function drumNoun(preset: DrumPresetId): string {
  if (preset === "clap-tight-snare") return "snare";
  if (preset === "clap-rim") return "rim";
  return rowOf(preset) === "clap" ? "clap" : rowOf(preset);
}

/** U8 (user test 12 Nov): a drum sound is named from its preset first ("Deep 909 kick"). */
const DRUM_NAME: Record<DrumPresetId, string> = {
  "kick-deep-909": "Deep 909 kick", "kick-punch": "Punch kick", "kick-round-808": "Round 808 kick", "kick-tight": "Tight kick",
  "clap-wide": "Wide clap", "clap-snap": "Snap", "clap-rim": "Rim", "clap-tight-snare": "Tight snare",
  "hats-open-909": "Open 909 hats", "hats-closed-tick": "Closed hats", "hats-shaker": "Shaker", "hats-ride": "Ride",
};
/** What a knob turned well up or down says about the sound. */
const KNOB_WORD: Record<DrumKnobId, [string, string]> = {
  tune: ["high", "low"], decay: ["long", "short"], click: ["clicky", "soft"], drive: ["gritty", "clean"], tone: ["bright", "dark"],
  snap: ["crisp", "soft"], room: ["roomy", "dry"], length: ["long", "short"], width: ["wide", "narrow"],
};
/** A knob this far from the preset's own value earns a word in the name. */
export const NAME_MOVE = 0.25;

/** Then knob words: the word of the knob turned furthest from the preset's own value, if it moved far. */
export function drumWord(preset: DrumPresetId, m: DrumMacros): string | null {
  const home = clampDrumMacros(preset, undefined);
  const far = ROW_KNOBS[rowOf(preset)].map((id) => ({ id, d: (m[id] ?? 0) - (home[id] ?? 0) })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
  return far && Math.abs(far.d) >= NAME_MOVE ? KNOB_WORD[far.id][far.d > 0 ? 0 : 1] : null;
}

/** The suggested name for a drum row's sound: "Deep 909 kick, from Lost in The Loop", "Wide clap, roomy, from …". */
export function suggestDrumName(preset: DrumPresetId, m: DrumMacros, songTitle?: string | null): string {
  const w = drumWord(preset, m);
  const what = w ? `${DRUM_NAME[preset]}, ${w}` : DRUM_NAME[preset];
  const s = songTitle ? shortTitle(songTitle) : "";
  return (s ? `${what}, from ${s}` : what).slice(0, MAX_NAME);
}

/** A drum sound's tags, matching its name: its noun, the preset's tags, the knob word, BPM, song (no key). */
export function suggestDrumTags(preset: DrumPresetId, bpm: number, songTitle?: string | null, m?: DrumMacros): string[] {
  return normalizeTags([drumNoun(preset), ...DRUM_PRESETS[preset].tags, (m && drumWord(preset, m)) ?? "", `${Math.round(bpm)} bpm`, songTitle ? shortTitle(songTitle) : ""]);
}

/** A rename / retag / re-tune we can trust (empty object when nothing usable). */
export function parseSoundPatch(raw: unknown, current: Pick<LibrarySound, "preset">): SoundPatch {
  const r = (raw ?? {}) as Record<string, unknown>;
  const out: SoundPatch = {};
  const name = cleanName(r.name);
  if (name) out.name = name;
  if (Array.isArray(r.tags)) out.tags = normalizeTags(r.tags);
  if (isFxPreset(current.preset)) {
    const row = fxRowOf(current.preset);
    const preset = isFxPreset(r.preset) && fxRowOf(r.preset) === row ? r.preset : null;
    if (preset) out.preset = preset;
    if (r.macros && typeof r.macros === "object") out.macros = clampFxMacros(preset ?? current.preset, r.macros as Record<string, unknown>);
    return out;
  }
  if (isMelodyPreset(current.preset)) {
    const row = melodyRowOf(current.preset);
    const preset = isMelodyPreset(r.preset) && melodyRowOf(r.preset) === row ? r.preset : null;
    if (preset) out.preset = preset;
    if (r.macros && typeof r.macros === "object") out.macros = clampPolyMacros(preset ?? current.preset, r.macros as Record<string, unknown>);
    return out;
  }
  if (isDrumPreset(current.preset)) {
    // A drum sound stays on its row (a kick stays a kick: its lane depends on it).
    const row = rowOf(current.preset);
    const preset = isDrumPreset(r.preset) && rowOf(r.preset) === row ? r.preset : null;
    if (preset) out.preset = preset;
    if (r.macros && typeof r.macros === "object") out.macros = clampDrumMacros(preset ?? current.preset, r.macros as Record<string, unknown>);
    return out;
  }
  const preset = typeof r.preset === "string" && r.preset in MAKE_PRESETS ? (r.preset as MakePresetId) : null;
  if (preset) out.preset = preset;
  if (r.macros && typeof r.macros === "object") out.macros = clampMacros(preset ?? (current.preset as MakePresetId), r.macros as Partial<Macros>);
  return out;
}

// ── Saving from Make (S4 fix, S5-1) ──────────────────────────────────────────────────────────────

/** A sound's identity in Make: its preset and knob values (rounded), whatever its name. */
export const soundId = (preset: MakePresetId | DrumPresetId | MelodyPresetId | FxPresetId, m: Macros | DrumMacros | PolyMacros | FxMacros) => { const v = m as Record<string, number>; return `${preset}|${Object.keys(v).sort().map((k) => Math.round(v[k] * 1000)).join(",")}`; };

/**
 * What "Save to library" does now, given the last sound saved (or loaded) here: nothing when it's
 * that sound under that name; a rename (PATCH) when only the name changed; a new sound (POST)
 * otherwise.
 */
export function saveAction(now: { sound: string; name: string }, last: { id: string; sound: string; name: string } | null): { kind: "none" } | { kind: "patch"; id: string } | { kind: "post" } {
  if (!last || last.sound !== now.sound) return { kind: "post" };
  const a = now.name.replace(/\s+/g, " ").trim(), b = last.name.replace(/\s+/g, " ").trim();
  return !a || a === b ? { kind: "none" } : { kind: "patch", id: last.id };
}
