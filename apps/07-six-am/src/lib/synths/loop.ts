// The shape a synth or kit loop takes in a Studio lane, like a crate loop (name, bars, lane), plus
// what makes it playable: preset and knobs, or kit; and a pattern. The key and tempo are the
// track's, not the loop's, so a loop follows the track. Pure; integration with timeline.ts later.
import { drumPatternById, KITS, type KitId } from "./kits";
import { patternById } from "./patterns";
import { clampKnobs, PRESETS, type KnobValues, type PresetId } from "./presets";
import { parseLibLoop, type LibLoop } from "@/lib/make/lib-loop";

/** Studio lane indexes, the same as timeline.ts TRACKS: Drums 0, Bass 1, Chords 2. */
export const LANE = { drums: 0, bass: 1, chords: 2 } as const;

export type SynthLoop = {
  id: string;
  source: "synth";
  name: string;
  bars: number;
  lane: 1 | 2;
  preset: PresetId;
  knobs: KnobValues;
  pattern: string;
};
export type KitLoop = {
  id: string;
  source: "kit";
  name: string;
  bars: number;
  lane: 0;
  kit: KitId;
  pattern: string;
};
export type PlayableLoop = SynthLoop | KitLoop;

/** A new synth loop with the preset's default knobs, or null if the pattern doesn't fit the preset's kind. */
export function makeSynthLoop(preset: PresetId, patternId: string, knobs?: Partial<KnobValues>, id?: string): SynthLoop | null {
  const p = PRESETS[preset], pattern = patternById(patternId);
  if (!p || !pattern || pattern.kind !== p.kind) return null;
  return {
    id: id ?? `${preset}-${patternId}`, source: "synth", name: `${p.name} · ${pattern.name}`, bars: pattern.bars,
    lane: p.kind === "bass" ? LANE.bass : LANE.chords, preset, knobs: clampKnobs(preset, knobs), pattern: patternId,
  };
}

export function makeKitLoop(kit: KitId, patternId: string, id?: string): KitLoop | null {
  const pattern = drumPatternById(patternId);
  if (!KITS[kit] || !pattern) return null;
  return { id: id ?? `${kit}-${patternId}`, source: "kit", name: `${kit} · ${pattern.name}`, bars: pattern.bars, lane: LANE.drums, kit, pattern: patternId };
}

/** A stored loop we can trust, or null: known preset/kit and pattern, knobs clamped, id ≤ 40 chars. */
export function parsePlayableLoop(v: unknown): PlayableLoop | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id || o.id.length > 40 || typeof o.pattern !== "string") return null;
  if (o.source === "synth" && typeof o.preset === "string" && o.preset in PRESETS) {
    return makeSynthLoop(o.preset as PresetId, o.pattern, (o.knobs ?? {}) as Partial<KnobValues>, o.id);
  }
  if (o.source === "kit" && (o.kit === "909" || o.kit === "808")) return makeKitLoop(o.kit, o.pattern, o.id);
  return null;
}

/**
 * An AI-generated bass loop (S4) on the Bass lane: the stored file's id (served by
 * GET /api/loops/<aiId>), the tempo it was made at (it loops on the grid at that tempo) and what
 * the server measured. The audio itself is never in the doc.
 */
export type AiLoop = {
  id: string;
  source: "ai";
  name: string;
  bars: 4 | 8;
  lane: 1;
  aiId: string;
  /** The tempo and key it was asked for: one pass is exactly `bars` bars at `bpm`. */
  bpm: number;
  key: string;
  scale: "major" | "minor";
  measured?: { bpm: number; key: string; scale: "major" | "minor" } | null;
  /** True when a draw passed the server's tempo and key check. */
  checked: boolean;
  costUsd: number;
  draws: number;
};

/** Anything a doc's `sounds` list can hold: a synth, a kit, an AI loop, or a library sound (S5). */
export type Sound = PlayableLoop | AiLoop | LibLoop;

const AI_KEYS = new Set(["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"]);
const num = (v: unknown, lo: number, hi: number) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;

/** A stored sound we can trust, or null (synth/kit via parsePlayableLoop; AI loops checked here). */
export function parseSound(v: unknown): Sound | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (o.source === "lib") return parseLibLoop(v);
  if (o.source !== "ai") return parsePlayableLoop(v);
  if (typeof o.id !== "string" || !o.id || o.id.length > 40) return null;
  if (typeof o.aiId !== "string" || !/^[0-9a-f-]{36}$/i.test(o.aiId)) return null;
  if ((o.bars !== 4 && o.bars !== 8) || !num(o.bpm, 60, 200) || typeof o.key !== "string" || !AI_KEYS.has(o.key)) return null;
  if (o.scale !== "major" && o.scale !== "minor") return null;
  const m = o.measured as Record<string, unknown> | null | undefined;
  const measured = m && num(m.bpm, 20, 400) && typeof m.key === "string" && AI_KEYS.has(m.key) && (m.scale === "major" || m.scale === "minor")
    ? { bpm: m.bpm as number, key: m.key, scale: m.scale as "major" | "minor" } : null;
  return {
    id: o.id, source: "ai", name: typeof o.name === "string" && o.name.trim() ? o.name.trim().slice(0, 60) : "AI bass loop",
    bars: o.bars, lane: 1, aiId: o.aiId, bpm: o.bpm as number, key: o.key, scale: o.scale, measured,
    checked: o.checked === true, costUsd: num(o.costUsd, 0, 10) ? (o.costUsd as number) : 0,
    draws: Number.isInteger(o.draws) && (o.draws as number) >= 1 && (o.draws as number) <= 10 ? (o.draws as number) : 1,
  };
}

/** How a sound shows in the timeline: its lane, name, bars and a waveform shape. */
export function soundMeta(s: Sound): { track: number; name: string; bars: number; vibe: string; kind: "kick" | "sub" | "acid" | "pump" | "stab" | "pad" } {
  if (s.source === "kit") return { track: s.lane, name: s.name, bars: s.bars, vibe: `${s.kit} kit`, kind: "kick" };
  if (s.source === "ai") return { track: s.lane, name: s.name, bars: s.bars, vibe: "AI loop", kind: "sub" };
  if (s.source === "lib") {
    const kind = ({ "round-sub": "sub", "rubber-pluck": "pump", reese: "pump", "acid-line": "acid" } as const)[s.preset];
    return { track: s.lane, name: s.name, bars: s.bars, vibe: "My sound", kind };
  }
  const kind = ({ sub: "sub", acid: "acid", reese: "pump", organ: "stab", rhodes: "stab", pad: "pad" } as const)[s.preset];
  return { track: s.lane, name: s.name, bars: s.bars, vibe: PRESETS[s.preset].name, kind };
}
