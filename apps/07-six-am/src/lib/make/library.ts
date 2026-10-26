// The personal sound library (S4, L146, L158): a sound and its loop, linked: the preset and its
// macro values (the sound) plus the note pattern (the loop), tagged with part, key, BPM and the
// source song, under a suggested name the owner can rename. Only the owner's own settings and
// measurements: never audio, and never audio of the original (L143). Pure: shapes, tag
// normalisation, the suggested name and the whitelist parsers the API uses (library.test.ts).
import { pitchClass, type Scale } from "@/lib/synths/theory";
import { MAKE_PRESETS, clampMacros, macroWord, type Macros, type MakePresetId } from "./presets";
import type { MakeNote } from "./render";

export const LIB_PARTS = ["bass", "drums", "other", "vocals"] as const;
export type LibPart = (typeof LIB_PARTS)[number];

export type LibrarySound = {
  id: string;
  name: string;
  part: LibPart;
  preset: MakePresetId;
  macros: Macros;
  /** The loop: 1–4 bars of notes on the 16th grid (MIDI pitches in `key`). */
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
export type NewSound = Omit<LibrarySound, "id" | "createdAt" | "updatedAt">;
export type SoundPatch = Partial<Pick<LibrarySound, "name" | "tags" | "macros" | "preset">>;

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

function parseNotes(v: unknown, bars: number): MakeNote[] | null {
  if (!Array.isArray(v) || v.length > MAX_NOTES) return null;
  const out: MakeNote[] = [];
  for (const x of v) {
    const o = (x ?? {}) as Record<string, unknown>;
    const step = num(o.step, 0, bars * 16 - 1), midi = num(o.midi, 12, 96), dur = num(o.dur, 0.25, 64), vel = num(o.vel, 0, 1);
    if (step === null || midi === null || dur === null || vel === null || !Number.isInteger(step) || !Number.isInteger(midi)) return null;
    out.push({ step, midi, dur, vel });
  }
  return out.sort((a, b) => a.step - b.step);
}

/** A new sound we can trust, or null. Unknown fields (and anything like audio) are dropped. */
export function parseNewSound(raw: unknown): NewSound | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
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

/** A rename / retag / re-tune we can trust (empty object when nothing usable). */
export function parseSoundPatch(raw: unknown, current: Pick<LibrarySound, "preset">): SoundPatch {
  const r = (raw ?? {}) as Record<string, unknown>;
  const out: SoundPatch = {};
  const name = cleanName(r.name);
  if (name) out.name = name;
  if (Array.isArray(r.tags)) out.tags = normalizeTags(r.tags);
  const preset = typeof r.preset === "string" && r.preset in MAKE_PRESETS ? (r.preset as MakePresetId) : null;
  if (preset) out.preset = preset;
  if (r.macros && typeof r.macros === "object") out.macros = clampMacros(preset ?? current.preset, r.macros as Partial<Macros>);
  return out;
}

// ── Saving from Make (S4 fix, S5-1) ──────────────────────────────────────────────────────────────

/** A sound's identity in Make: its preset and knob values (rounded), whatever its name. */
export const soundId = (preset: MakePresetId, m: Macros) => `${preset}|${(Object.keys(m) as (keyof Macros)[]).sort().map((k) => Math.round(m[k] * 1000)).join(",")}`;

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
