// Rebuild the song (Phase 7 slice 3, R6, R8b, L269, L272, L273a/d, L277): a Studio track laid out
// from a map, the original's sections bar for bar, one slot per section × lane, every slot empty.
// The owner fills a slot with a part saved in Make; the part repeats to the section's end and stops
// there. Hints say which parts the original has in a section, only for the layers the map measures
// (kick, hats, bass, chords, vocals); other lanes get no hint rather than a guess. Pure: the doc
// is an ordinary Studio Doc (plays, saves and undoes like any track) plus `doc.rebuild`.
// Unit tested in rebuild.test.ts.
import { clips, labSections } from "@/lib/lab/view";
import { libLaneType, libLoopFrom } from "@/lib/make/lib-loop";
import type { LibrarySound } from "@/lib/make/library";
import { LAYERS, type LayerName, type TrackMap } from "@/lib/map/types";
import { legacyMix, legacyTrack, sortLanes, type Lane, type LaneType } from "@/lib/studio-lanes";
import { clampBpm } from "@/lib/tempo";
import { MAX_BARS, MIN_BARS, newId, type Doc, type Region } from "@/lib/timeline";

/** One section of the original, on the Studio's bars (1-based, `bars` long). `has` = the measured
 *  layers the map shows there (estimates from the full mix). */
export type RebuildSection = { name: string; start: number; bars: number; has: LayerName[] };
/** What makes a Studio track a rebuild. `left` = slots the owner chose to leave empty ("i:laneId"). */
export type Rebuild = { mapId: string; sections: RebuildSection[]; left?: string[] };

/** The rebuild's lanes, in the approved design's order; `layer` = the map layer that gives the hint. */
export const REBUILD_LANES: { id: string; type: LaneType; name: string; layer?: LayerName }[] = [
  { id: "kick", type: "kick", name: "Kick", layer: "kick" },
  { id: "claps", type: "clap", name: "Claps" },
  { id: "hats", type: "hats", name: "Hats", layer: "hats" },
  { id: "perc", type: "perc", name: "Percussion" },
  { id: "bass", type: "bass", name: "Bass", layer: "bass" },
  { id: "chords", type: "chords", name: "Chords", layer: "chords" },
  { id: "pads", type: "pads", name: "Pads" },
  { id: "lead", type: "lead", name: "Lead" },
  { id: "fx", type: "fx", name: "FX" },
  { id: "vocals", type: "vocals", name: "Vocals", layer: "vocals" },
];
export const rebuildLane = (id: string) => REBUILD_LANES.find((l) => l.id === id);

/** A section "has" a layer when the Lab draws it solid on at least half the section's bars. */
const HAS_SHARE = 0.5;

/** The original's sections on the Studio's bars, named as the Lab names them ("Drop 1", "Drop 2"),
 *  contiguous from bar 1 to `bars` (a gap before the first or between two is given to a section, so
 *  every bar is in exactly one; each section still starts on its map bar). */
export function rebuildSections(map: Pick<TrackMap, "sections" | "energy" | "layers">, bars: number): RebuildSection[] {
  const named = labSections(map)
    .map((s) => ({ name: s.label, from: Math.max(1, Math.round(s.from)), to: Math.min(bars + 1, Math.round(s.to)) }))
    .filter((s) => s.to > s.from);
  if (!named.length) return [{ name: "Whole song", start: 1, bars, has: layersIn(map, 1, bars + 1) }];
  // shortcut: bars before the map's first section join it (maps start at their first downbeat); give them their own section if a map ever starts later.
  named[0].from = 1;
  const out: RebuildSection[] = [];
  named.forEach((s, i) => {
    const end = i + 1 < named.length ? named[i + 1].from : bars + 1;
    if (end <= s.from) return;
    out.push({ name: s.name.slice(0, 40), start: s.from, bars: end - s.from, has: layersIn(map, s.from, end) });
  });
  return out;
}

/** The measured layers the Lab draws solid on ≥ half of bars [from, to) (1-based). */
function layersIn(map: Pick<TrackMap, "layers">, from: number, to: number): LayerName[] {
  return LAYERS.filter((layer) => {
    const on = Array(to + 1).fill(false);
    for (const c of clips(map.layers[layer] ?? [])) if (c.level === "likely") for (let b = c.from; b < c.to; b++) on[b] = true;
    let n = 0;
    for (let b = from; b < to; b++) if (on[b]) n++;
    return n / Math.max(1, to - from) >= HAS_SHARE;
  });
}

/** A new rebuild: the map's tempo, key and length, its sections, ten lanes, no blocks (L269). */
export function rebuildDoc(map: Pick<TrackMap, "id" | "bpm" | "key" | "scale" | "bars" | "sections" | "energy" | "layers">): Doc {
  // shortcut: a song longer than MAX_BARS (512) is cut to 512 bars; raise MAX_BARS if one is.
  const bars = Math.min(MAX_BARS, Math.max(MIN_BARS, Math.round(map.bars)));
  const sections = rebuildSections(map, bars);
  // Saved in family order (parseLanes sorts: Vocals before FX); the grid shows REBUILD_LANES' order.
  const lanes: Lane[] = sortLanes(REBUILD_LANES.map((l) => ({ id: l.id, type: l.type, name: l.name, volumeDb: 0, pan: 0, muted: false, soloed: false })));
  const doc: Doc = { regions: [], muted: legacyMix(lanes).muted, bars, bpm: clampBpm(map.bpm), lanes, analysisId: map.id };
  if (map.key && (map.scale === "major" || map.scale === "minor")) doc.key = { key: map.key, scale: map.scale };
  doc.markers = sections.slice(0, 64).map((s) => ({ bar: s.start, label: s.name.slice(0, 24) }));
  doc.rebuild = { mapId: map.id, sections, left: [] };
  return doc;
}

// ── Slots ─────────────────────────────────────────────────────────────────────────────────────

export const slotKey = (section: number, lane: string) => `${section}:${lane}`;

/**
 * A slot's hint: "has" = the original has this measured part here and it's the owner's to fill;
 * "vocals" = the original has vocals here (Six AM can't make vocals yet, not counted);
 * "none" = a measured lane the original doesn't have here; null = a lane the map doesn't measure.
 */
export type Hint = "has" | "vocals" | "none" | null;
export function slotHint(sec: RebuildSection, laneId: string): Hint {
  const layer = rebuildLane(laneId)?.layer;
  if (!layer) return null;
  if (!sec.has.includes(layer)) return "none";
  return layer === "vocals" ? "vocals" : "has";
}

/** The block filling a slot: a block on the lane that starts inside the section. */
export function slotRegion(doc: Pick<Doc, "regions">, sec: RebuildSection, laneId: string): Region | undefined {
  return doc.regions.find((r) => r.lane === laneId && r.start >= sec.start && r.start < sec.start + sec.bars);
}

export type SlotState = { state: "filled"; region: Region } | { state: "left" } | { state: "empty" };
export function slotState(doc: Pick<Doc, "regions" | "rebuild">, i: number, laneId: string): SlotState {
  const sec = doc.rebuild?.sections[i];
  if (!sec) return { state: "empty" };
  const region = slotRegion(doc, sec, laneId);
  if (region) return { state: "filled", region };
  return doc.rebuild?.left?.includes(slotKey(i, laneId)) ? { state: "left" } : { state: "empty" };
}

/** Slots still to fill in a section: lanes the original has there (vocals aside), neither filled nor left empty. */
export function toFill(doc: Pick<Doc, "regions" | "rebuild">, i: number): string[] {
  const sec = doc.rebuild?.sections[i];
  if (!sec) return [];
  return REBUILD_LANES.filter((l) => slotHint(sec, l.id) === "has" && slotState(doc, i, l.id).state === "empty").map((l) => l.id);
}

/** The section a (fractional) bar is in. */
export function sectionIndexAt(r: Pick<Rebuild, "sections">, bar: number): number {
  const i = r.sections.findIndex((s) => bar >= s.start && bar < s.start + s.bars);
  return i >= 0 ? i : bar < 1 ? 0 : r.sections.length - 1;
}

/** Whether a saved part fits a lane: its own lane type; chords and pads take each other (one family). */
export function partFits(s: Pick<LibrarySound, "part" | "preset">, laneId: string): boolean {
  const lane = rebuildLane(laneId);
  if (!lane || lane.type === "vocals") return false;
  const t = libLaneType(s);
  const harmony = (x: LaneType) => x === "chords" || x === "pads";
  return t === lane.type || (harmony(t) && harmony(lane.type));
}

const MAX_SOUNDS = 64; // parseDoc's limit

/** Only the lib sounds a block still plays (emptying slots mustn't fill the 64-sound limit). */
const usedSounds = (doc: Doc, regions: Region[]) => (doc.sounds ?? []).filter((x) => x.source !== "lib" || regions.some((r) => r.loopId === x.id));
const withoutLeft = (r: Rebuild, key: string): Rebuild => ({ ...r, left: (r.left ?? []).filter((k) => k !== key) });

/**
 * Fill slot (section i × lane) with a saved part: one block from the section's first bar to its last,
 * the part repeating and stopping at the section's end (the last pass may be cut short). Replaces what
 * the slot held; the track reuses its copy of a part already used on that lane. null if it can't.
 */
export function fillSlot(doc: Doc, i: number, laneId: string, part: LibrarySound, ids: { region?: string; sound?: string } = {}): Doc | null {
  const r = doc.rebuild, sec = r?.sections[i], lane = rebuildLane(laneId);
  if (!r || !sec || !lane || !partFits(part, laneId)) return null;
  const sounds = doc.sounds ?? [];
  const have = sounds.find((x) => x.source === "lib" && x.libId === part.id && x.type === lane.type);
  const loop = have ?? libLoopFrom(part, lane.type, ids.sound);
  const regions = doc.regions.filter((g) => !(g.lane === laneId && g.start >= sec.start && g.start < sec.start + sec.bars));
  const region: Region = { id: ids.region ?? newId(), loopId: loop.id, track: legacyTrack(lane.type), lane: laneId, start: sec.start, length: sec.bars };
  const next = [...regions, region];
  const nextSounds = [...usedSounds(doc, next), ...(have ? [] : [loop])];
  if (nextSounds.length > MAX_SOUNDS) return null;
  return { ...doc, regions: next, sounds: nextSounds, rebuild: withoutLeft(r, slotKey(i, laneId)) };
}

/** Empty a slot (its block goes; a slot left empty stays left until Undo). */
export function emptySlot(doc: Doc, i: number, laneId: string): Doc {
  const r = doc.rebuild, sec = r?.sections[i];
  if (!r || !sec) return doc;
  const regions = doc.regions.filter((g) => !(g.lane === laneId && g.start >= sec.start && g.start < sec.start + sec.bars));
  return { ...doc, regions, sounds: usedSounds(doc, regions) };
}

/** "Leave empty" (L277): the slot drops out of the to-fill count; `on = false` is its Undo. */
export function leaveSlot(doc: Doc, i: number, laneId: string, on: boolean): Doc {
  const r = doc.rebuild;
  if (!r || !r.sections[i]) return doc;
  const key = slotKey(i, laneId), rest = withoutLeft(r, key);
  return { ...doc, rebuild: on ? { ...rest, left: [...(rest.left ?? []), key] } : rest };
}

// ── Saved docs ────────────────────────────────────────────────────────────────────────────────

const SC = /^https:\/\/(on\.|m\.)?soundcloud\.com\/\S+$/i;
const LEFT = /^\d{1,3}:[a-z]{1,12}$/;

/** A rebuild we can trust inside a track of `total` bars, or null: contiguous sections from bar 1. */
export function parseRebuild(v: unknown, total: number): Rebuild | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.mapId !== "string" || o.mapId.length > 600 || !SC.test(o.mapId)) return null;
  if (!Array.isArray(o.sections) || !o.sections.length || o.sections.length > 64) return null;
  const sections: RebuildSection[] = [];
  let next = 1;
  for (const x of o.sections as Record<string, unknown>[]) {
    if (!x || typeof x.name !== "string" || !x.name.trim() || x.name.length > 40) return null;
    if (!Number.isInteger(x.start) || !Number.isInteger(x.bars) || x.start !== next || (x.bars as number) < 1) return null;
    if (!Array.isArray(x.has) || !x.has.every((h) => (LAYERS as readonly unknown[]).includes(h))) return null;
    sections.push({ name: x.name.trim(), start: x.start as number, bars: x.bars as number, has: LAYERS.filter((l) => (x.has as unknown[]).includes(l)) });
    next = (x.start as number) + (x.bars as number);
  }
  if (next - 1 !== total) return null;
  const out: Rebuild = { mapId: o.mapId, sections };
  if (o.left !== undefined) {
    if (!Array.isArray(o.left) || o.left.length > 640 || !o.left.every((k) => typeof k === "string" && LEFT.test(k))) return null;
    out.left = [...new Set(o.left as string[])];
  }
  return out;
}

/** The one rebuild track per mapped song (L272): its id comes from the map's id, so opening the
 *  rebuild again finds the same track. A UUID-shaped hash (4 × 32-bit FNV-1a), not a secret. */
export function rebuildTrackId(mapId: string): string {
  const words = [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b].map((seed) => {
    let h = seed >>> 0;
    for (const ch of `six-am-rebuild:${mapId}`) { h ^= ch.codePointAt(0)!; h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, "0");
  }).join("");
  return `${words.slice(0, 8)}-${words.slice(8, 12)}-5${words.slice(13, 16)}-a${words.slice(17, 20)}-${words.slice(20, 32)}`;
}
