// A saved track and the check every save goes through (client and server share it).
import { BARS, LOOPS, MAX_BARS, MIN_BARS, TRACKS, loopById, type Doc, type Marker } from "./timeline";
import { MAX_BPM, MIN_BPM } from "./tempo";
import { parseSound, soundMeta, type Sound } from "./synths/loop";
import { LEGACY_LANES, legacyTrack, parseLanes, type Lane } from "./studio-lanes";

export type TrackSummary = { id: string; name: string; updatedAt: string };
export type Track = TrackSummary & { doc: Doc };

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOOP_IDS = new Set(LOOPS.map((l) => l.id));

export const cleanName = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : null);

const KEYS = new Set(["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"]);

/**
 * A doc we can trust, or null: known loops, on their own track, on the grid, inside the track's
 * length (64 bars unless it sets its own). The optional template fields (bars, bpm, key, markers)
 * are checked when present; a doc without them (every track saved before Phase 3) comes back
 * exactly as it was, with only regions and muted.
 */
export function parseDoc(v: unknown): Doc | null {
  if (!v || typeof v !== "object") return null;
  const d = v as { regions?: unknown; muted?: unknown; bars?: unknown; bpm?: unknown; key?: unknown; markers?: unknown; sounds?: unknown; analysisId?: unknown; soloed?: unknown; lanes?: unknown };
  const extra: Omit<Doc, "regions" | "muted"> = {};
  if (d.bars !== undefined) {
    if (!Number.isInteger(d.bars) || (d.bars as number) < MIN_BARS || (d.bars as number) > MAX_BARS) return null;
    extra.bars = d.bars as number;
  }
  const total = extra.bars ?? BARS;
  if (d.soloed !== undefined) {
    if (!Array.isArray(d.soloed) || d.soloed.length !== TRACKS.length || !d.soloed.every((x) => typeof x === "boolean")) return null;
    if (d.soloed.some(Boolean)) extra.soloed = d.soloed as boolean[];
  }
  if (d.analysisId !== undefined) {
    if (typeof d.analysisId !== "string" || d.analysisId.length > 600 || !/^https:\/\/(on\.|m\.)?soundcloud\.com\/\S+$/i.test(d.analysisId)) return null;
    extra.analysisId = d.analysisId;
  }
  if (d.bpm !== undefined) {
    if (typeof d.bpm !== "number" || !Number.isFinite(d.bpm) || d.bpm < MIN_BPM || d.bpm > MAX_BPM) return null;
    extra.bpm = Math.round(d.bpm * 10) / 10;
  }
  if (d.key !== undefined) {
    const k = d.key as { key?: unknown; scale?: unknown } | null;
    if (!k || typeof k.key !== "string" || !KEYS.has(k.key) || (k.scale !== "major" && k.scale !== "minor")) return null;
    extra.key = { key: k.key, scale: k.scale };
  }
  if (d.markers !== undefined) {
    if (!Array.isArray(d.markers) || d.markers.length > 64) return null;
    const markers: Marker[] = [];
    for (const m of d.markers as Record<string, unknown>[]) {
      if (!m || !Number.isInteger(m.bar) || (m.bar as number) < 1 || (m.bar as number) > total) return null;
      if (typeof m.label !== "string" || !m.label.trim() || m.label.length > 24) return null;
      markers.push({ bar: m.bar as number, label: m.label.trim() });
    }
    extra.markers = markers;
  }
  // S3/S4: the track's own sounds; regions may play them by id (a doc without sounds is unchanged).
  const sounds = new Map<string, { track: number; bars: number }>();
  if (d.sounds !== undefined) {
    if (!Array.isArray(d.sounds) || d.sounds.length > 64) return null;
    const list: Sound[] = [];
    for (const x of d.sounds) {
      const sound = parseSound(x);
      if (!sound || sounds.has(sound.id) || LOOP_IDS.has(sound.id)) return null;
      const m = soundMeta(sound);
      sounds.set(sound.id, { track: m.track, bars: m.bars });
      list.push(sound);
    }
    extra.sounds = list;
  }
  // S5: the track's own lanes; a region may name one (any lane: a lane takes loops of its family).
  if (d.lanes !== undefined) {
    const lanes = parseLanes(d.lanes);
    if (!lanes) return null;
    extra.lanes = lanes;
  }
  const laneTrack = new Map<string, number>(
    (extra.lanes ?? (LEGACY_LANES as Pick<Lane, "id" | "type">[])).map((l) => [l.id, legacyTrack(l.type)]),
  );
  if (!Array.isArray(d.regions) || d.regions.length > 500) return null;
  if (!Array.isArray(d.muted) || d.muted.length !== TRACKS.length || !d.muted.every((m) => typeof m === "boolean")) return null;
  const regions = [];
  for (const r of d.regions as Record<string, unknown>[]) {
    if (!r || typeof r.id !== "string" || r.id.length > 40 || typeof r.loopId !== "string") return null;
    const loop = LOOP_IDS.has(r.loopId) ? loopById(r.loopId) : sounds.get(r.loopId);
    if (!loop) return null;
    const { start, length } = r;
    if (r.track !== loop.track || !Number.isInteger(start) || !Number.isInteger(length)) return null;
    if ((start as number) < 1 || (length as number) < loop.bars || (length as number) % loop.bars !== 0) return null;
    if ((start as number) + (length as number) - 1 > total) return null;
    if (r.lane !== undefined && (typeof r.lane !== "string" || !laneTrack.has(r.lane))) return null;
    regions.push({ id: r.id, loopId: r.loopId, track: loop.track, start: start as number, length: length as number, ...(r.lane !== undefined ? { lane: r.lane as string } : {}) });
  }
  return { regions, muted: d.muted as boolean[], ...extra };
}
