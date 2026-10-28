// Putting blocks on the new lanes (S5, L159, T102): place a block on one lane only, and drop a
// library sound at the phrase under the pointer, creating its lane type when the track has none.
// Pure apart from timeline.ts's sound registry (place() reads loop lengths from it).
import { libLoopFrom, libLaneType, dropLength, phraseStart } from "./make/lib-loop";
import type { LibrarySound } from "./make/library";
import { accepts, legacyTrack as legacyTrackOf, addLane, laneOfRegion, lanesOf, legacyMix, type Lane, type LaneType } from "./studio-lanes";
import { docBars, newId, place, registerSounds, type Doc, type Region } from "./timeline";

/** Places a block on its lane (`r.lane`), trimming whatever it overlaps there only; blocks on
 *  other lanes of the same old track are untouched. */
export function placeInLane(regions: Region[], r: Region, lanes: Lane[]): Region[] {
  const mine = regions.filter((o) => o.id !== r.id && laneOfRegion(o, lanes)?.id === r.lane);
  const rest = regions.filter((o) => o.id !== r.id && laneOfRegion(o, lanes)?.id !== r.lane);
  // place() only trims blocks on the same track; a lane can hold loops from several old tracks.
  // Each keeps its own track through place() (a trimmed block's split half copies its fields).
  type Tagged = Region & { own?: number };
  const tagged: Tagged[] = mine.map((o) => ({ ...o, track: r.track, own: o.track }));
  const placed = (place(tagged, r) as Tagged[]).map(({ own, ...o }) => (own === undefined ? o : { ...o, track: own, lane: r.lane }));
  return [...rest, ...placed];
}

export const MAX_SOUNDS = 64; // parseDoc's limit

/**
 * Drops a library sound on the track at `bar`: a copy of its settings joins the track's sounds, and
 * a block of whole passes filling the phrase that holds `bar` (moved back to fit before the track's
 * end) lands on `laneId` when that lane takes it (accepts), else on the first lane of its type,
 * else (or with `newLane`) on a new lane of it. The block overwrites what it overlaps on that lane only. null when
 * the track is full (sounds or lanes) or too short for one pass.
 */
export function dropLibSound(
  doc: Doc, s: LibrarySound, bar: number,
  o: { laneId?: string; type?: LaneType; soundId?: string; regionId?: string; newLane?: boolean } = {},
): { doc: Doc; laneId: string; regionId: string; soundId: string } | null {
  const type = o.type ?? libLaneType(s);
  const sounds = doc.sounds ?? [];
  if (sounds.length >= MAX_SOUNDS) return null;
  let lanes = lanesOf(doc);
  let lane = lanes.find((l) => l.id === o.laneId && accepts(l, { type, track: legacyTrackOf(type) })) ?? (o.newLane ? undefined : lanes.find((l) => l.type === type));
  if (!lane) {
    const added = addLane(lanes, type);
    if (!added.id) return null;
    lanes = added.lanes;
    lane = lanes.find((l) => l.id === added.id)!;
  }
  const loop = libLoopFrom(s, type, o.soundId);
  const total = docBars(doc);
  // Too close to the end for a whole phrase: move back so the block keeps its length.
  const full = dropLength(loop.bars, 1, total);
  const start = Math.max(1, Math.min(phraseStart(bar), total - full + 1));
  const length = dropLength(loop.bars, start, total);
  if (length === 0) return null;
  const nextSounds = [...sounds, loop];
  registerSounds(nextSounds);
  const region: Region = { id: o.regionId ?? newId(), loopId: loop.id, track: loop.lane, lane: lane.id, start, length };
  const migrated = doc.regions.map((r) => (r.lane ? r : { ...r, lane: laneOfRegion(r, lanes)?.id }));
  const regions = placeInLane(migrated, region, lanes);
  const { muted, soloed } = legacyMix(lanes);
  const { soloed: _drop, ...rest } = doc;
  void _drop;
  return {
    doc: { ...rest, lanes, regions, sounds: nextSounds, muted, ...(soloed.some(Boolean) ? { soloed } : {}) },
    laneId: lane.id, regionId: region.id, soundId: loop.id,
  };
}
