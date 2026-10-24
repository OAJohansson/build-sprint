// The shape a synth or kit loop takes in a Studio lane, like a crate loop (name, bars, lane), plus
// what makes it playable: preset and knobs, or kit; and a pattern. The key and tempo are the
// track's, not the loop's, so a loop follows the track. Pure; integration with timeline.ts later.
import { drumPatternById, KITS, type KitId } from "./kits";
import { patternById } from "./patterns";
import { clampKnobs, PRESETS, type KnobValues, type PresetId } from "./presets";

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
