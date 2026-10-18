// A saved track and the check every save goes through (client and server share it).
import { BARS, LOOPS, TRACKS, loopById, type Doc } from "./timeline";

export type TrackSummary = { id: string; name: string; updatedAt: string };
export type Track = TrackSummary & { doc: Doc };

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOOP_IDS = new Set(LOOPS.map((l) => l.id));

export const cleanName = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : null);

/** A doc we can trust, or null: known loops, on their own track, on the grid, inside 64 bars. */
export function parseDoc(v: unknown): Doc | null {
  if (!v || typeof v !== "object") return null;
  const d = v as { regions?: unknown; muted?: unknown };
  if (!Array.isArray(d.regions) || d.regions.length > 500) return null;
  if (!Array.isArray(d.muted) || d.muted.length !== TRACKS.length || !d.muted.every((m) => typeof m === "boolean")) return null;
  const regions = [];
  for (const r of d.regions as Record<string, unknown>[]) {
    if (!r || typeof r.id !== "string" || r.id.length > 40 || typeof r.loopId !== "string" || !LOOP_IDS.has(r.loopId)) return null;
    const loop = loopById(r.loopId);
    const { start, length } = r;
    if (r.track !== loop.track || !Number.isInteger(start) || !Number.isInteger(length)) return null;
    if ((start as number) < 1 || (length as number) < loop.bars || (length as number) % loop.bars !== 0) return null;
    if ((start as number) + (length as number) - 1 > BARS) return null;
    regions.push({ id: r.id, loopId: r.loopId, track: loop.track, start: start as number, length: length as number });
  }
  return { regions, muted: d.muted as boolean[] };
}
