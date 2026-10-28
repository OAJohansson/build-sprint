// The personal sound library (S4, L146, L158): a sound and its loop, linked: the preset and its
// macro values (the sound) plus the note pattern (the loop), tagged with part, key, BPM and the
// source song, under a suggested name the owner can rename. Only the owner's own settings and
// measurements: never audio, and never audio of the original (L143). Pure: shapes, tag
// normalisation, the suggested name and the whitelist parsers the API uses (library.test.ts).
import { pitchClass, type Scale } from "@/lib/synths/theory";
import { MAKE_PRESETS, clampMacros, macroWord, type Macros, type MakePresetId } from "./presets";
import type { MakeNote } from "./render";
import { DRUM_PRESETS, clampDrumMacros, isDrumPreset, rowOf, type DrumMacros, type DrumPresetId, type DrumRow } from "./drum-synth";

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
export type LibrarySound = BassSound | DrumSound;
type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type NewSound = DistOmit<LibrarySound, "id" | "createdAt" | "updatedAt">;
export type SoundPatch = { name?: string; tags?: string[]; preset?: MakePresetId | DrumPresetId; macros?: Macros | DrumMacros };
export const isDrumSound = <T extends { preset: string }>(s: T): s is T & { preset: DrumPresetId } => isDrumPreset(s.preset);
export const isBassSound = (s: LibrarySound): s is BassSound => !isDrumPreset(s.preset);

export const MAX_TAGS = 12;
export const MAX_NAME = 60;
const MAX_TAG = 32;
const MAX_NOTES = 64;

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
export function parseNotes(v: unknown, bars: number): MakeNote[] | null {
  if (!Array.isArray(v) || v.length > MAX_NOTES) return null;
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
  const tags = normalizeTags(Array.isArray(r.tags) ? r.tags : suggestDrumTags(preset, bpm, source?.title));
  return { name, part: "drums", preset, macros, pattern: { bars, notes }, key, scale, bpm: Math.round(bpm * 100) / 100, source, tags };
}

/** What a drum row's sound is called: kick, clap, snare, rim or hats (the row's noun, by preset). */
export function drumNoun(preset: DrumPresetId): string {
  if (preset === "clap-tight-snare") return "snare";
  if (preset === "clap-rim") return "rim";
  return rowOf(preset) === "clap" ? "clap" : rowOf(preset);
}

/** A word for a drum sound from its knobs, else its preset ("Deep kick", "Crisp clap", "Open hats"). */
export function drumWord(preset: DrumPresetId, m: DrumMacros): string {
  const row: DrumRow = rowOf(preset);
  if (row === "kick") {
    if ((m.drive ?? 0) >= 0.6) return "Gritty";
    if ((m.click ?? 0) >= 0.6) return "Punchy";
    if ((m.decay ?? 0) >= 0.7) return "Boomy";
    if ((m.tune ?? 0.5) <= 0.4) return "Deep";
    return (m.decay ?? 0.5) <= 0.3 ? "Tight" : "Round";
  }
  if (row === "clap") {
    if ((m.room ?? 0) >= 0.5) return "Roomy";
    if ((m.snap ?? 0) >= 0.4 && (m.room ?? 0) < 0.35) return "Crisp";
    return (m.tone ?? 0.5) < 0.34 ? "Dark" : preset === "clap-wide" ? "Wide" : "Short";
  }
  if ((m.width ?? 0) >= 0.7) return "Wide";
  if (preset === "hats-ride") return "Ringing";
  if (preset === "hats-shaker") return "Shaken";
  return (m.length ?? 0.5) < 0.3 ? "Closed" : (m.length ?? 0.5) >= 0.45 ? "Open" : "Ticking";
}

/** The suggested name for a drum row's sound: "Deep kick, from Lost in The Loop". */
export function suggestDrumName(preset: DrumPresetId, m: DrumMacros, songTitle?: string | null): string {
  const what = `${drumWord(preset, m)} ${drumNoun(preset)}`;
  const s = songTitle ? shortTitle(songTitle) : "";
  return (s ? `${what}, from ${s}` : what).slice(0, MAX_NAME);
}

/** A drum sound's tags: its noun, the preset's tags, BPM, song (no key: drums aren't in one). */
export function suggestDrumTags(preset: DrumPresetId, bpm: number, songTitle?: string | null): string[] {
  return normalizeTags([drumNoun(preset), ...DRUM_PRESETS[preset].tags, `${Math.round(bpm)} bpm`, songTitle ? shortTitle(songTitle) : ""]);
}

/** A rename / retag / re-tune we can trust (empty object when nothing usable). */
export function parseSoundPatch(raw: unknown, current: Pick<LibrarySound, "preset">): SoundPatch {
  const r = (raw ?? {}) as Record<string, unknown>;
  const out: SoundPatch = {};
  const name = cleanName(r.name);
  if (name) out.name = name;
  if (Array.isArray(r.tags)) out.tags = normalizeTags(r.tags);
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
export const soundId = (preset: MakePresetId | DrumPresetId, m: Macros | DrumMacros) => { const v = m as Record<string, number>; return `${preset}|${Object.keys(v).sort().map((k) => Math.round(v[k] * 1000)).join(",")}`; };

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
