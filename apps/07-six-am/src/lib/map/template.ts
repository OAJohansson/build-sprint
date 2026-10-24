// Map → Studio template (S2, A5): a new, unsaved track with the reference's bones: the same tempo
// and key, its length in whole bars, a marker where each section starts, and empty lanes. It opens
// through the Studio's draft hand-over (L83), so no saved track is ever changed. Pure, tested.
import type { StudioDraft } from "@/lib/mentor/studio";
import { clampBpm } from "@/lib/tempo";
import { MAX_BARS, MIN_BARS, TRACKS, type Doc } from "@/lib/timeline";
import type { TrackMap } from "./types";

export function mapToTemplate(map: Pick<TrackMap, "bpm" | "key" | "scale" | "bars" | "sections">): Doc {
  // shortcut: a track longer than MAX_BARS (512) is cut to 512 bars; raise MAX_BARS if that happens.
  const bars = Math.min(MAX_BARS, Math.max(MIN_BARS, Math.round(map.bars)));
  const doc: Doc = { regions: [], muted: TRACKS.map(() => false), bars, bpm: clampBpm(map.bpm) };
  if (map.key && (map.scale === "major" || map.scale === "minor")) doc.key = { key: map.key, scale: map.scale };
  // Map bars are 0-based from the first downbeat; the Studio's bar 1 is that downbeat.
  doc.markers = map.sections
    .map((s) => ({ bar: Math.round(s.startBar) + 1, label: s.label }))
    .filter((m) => m.bar >= 1 && m.bar <= bars);
  return doc;
}

/** The draft the Studio picks up (STUDIO_DRAFT_KEY): named after the reference track. */
export function templateDraft(map: TrackMap, now = new Date()): StudioDraft {
  const doc = mapToTemplate(map);
  const name = `${map.title || "Untitled"} · template`.slice(0, 80);
  return { name, bpm: doc.bpm!, doc, at: now.toISOString() };
}
