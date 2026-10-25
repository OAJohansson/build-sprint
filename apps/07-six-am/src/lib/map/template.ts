// Map → Studio draft (S2, A5; L139): a new, unsaved track with the reference's bones AND a rough
// draft you can hear at once: the same tempo and key, its length in whole bars, a marker where each
// section starts, and starter sounds wherever the map's layers play (likely blocks, as the map view
// draws them): drums (909: kick and hats together, kick alone or hats alone), a Sub bass and Rhodes
// chords, in the track's key. Normal Studio blocks: editable, deletable, undoable. Vocals have no
// lane. It opens through the Studio's draft hand-over (L83), so no saved track is changed. Pure.
import type { StudioDraft } from "@/lib/mentor/studio";
import { makeKitLoop, makeSynthLoop, type PlayableLoop } from "@/lib/synths/loop";
import { clampBpm } from "@/lib/tempo";
import { MAX_BARS, MIN_BARS, TRACKS, newId, type Doc, type Region } from "@/lib/timeline";
import type { TrackMap } from "./types";
import { layerBlocks } from "./view";

/** The starter sounds (L139). Ids are fixed per draft: one sound each, used by every block. */
export const STARTERS = {
  groove: () => makeKitLoop("909", "kit-house-groove", "sndTplGroove")!, // kick + clap + hats, 2 bars
  kick: () => makeKitLoop("909", "kit-four-floor", "sndTplKick")!, // kick only, 1 bar
  hats: () => makeKitLoop("909", "kit-offbeat-ohat", "sndTplHats")!, // offbeat open hat, 1 bar
  bass: () => makeSynthLoop("sub", "offbeat-bass", undefined, "sndTplBass")!, // 2 bars
  chords: () => makeSynthLoop("rhodes", "rhodes-swing", undefined, "sndTplChords")!, // 2 bars
};

type Layers = Pick<TrackMap["layers"], "kick" | "bass" | "chords" | "hats">;

/** Bars (1-based) where a layer is drawn solid ("likely") on the map. */
function likelyBars(values: number[], bars: number): boolean[] {
  const on = Array(bars + 2).fill(false);
  for (const b of layerBlocks(values)) if (b.level === "likely") for (let x = b.from; x < b.to && x <= bars; x++) on[x] = true;
  return on;
}

/** Runs of bars with the same value, as [from, to) in 1-based bars. */
function runs<T>(value: (bar: number) => T | null, bars: number): { from: number; to: number; v: T }[] {
  const out: { from: number; to: number; v: T }[] = [];
  for (let b = 1; b <= bars; b++) {
    const v = value(b);
    const last = out.at(-1);
    if (v !== null && last && last.v === v && last.to === b) last.to = b + 1;
    else if (v !== null) out.push({ from: b, to: b + 1, v });
  }
  return out;
}

/** A run snapped inward to whole passes of its sound on the bar grid (passes start at bar 1). */
function snapped(from: number, to: number, pass: number): { start: number; length: number } | null {
  const start = Math.ceil((from - 1) / pass) * pass + 1;
  const end = Math.floor((to - 1) / pass) * pass + 1;
  return end > start ? { start, length: end - start } : null;
}

/** The starter regions and the sounds they use, from the map's layer estimates. */
export function starterLanes(layers: Layers, bars: number, hasKey: boolean): { sounds: PlayableLoop[]; regions: Region[] } {
  const kick = likelyBars(layers.kick, bars), hats = likelyBars(layers.hats, bars);
  const used = new Map<string, PlayableLoop>();
  const regions: Region[] = [];
  const lay = (sound: PlayableLoop, from: number, to: number) => {
    const s = snapped(from, to, sound.bars);
    if (!s) return;
    used.set(sound.id, sound);
    regions.push({ id: newId(), loopId: sound.id, track: sound.lane, start: s.start, length: s.length });
  };
  const drums = { groove: STARTERS.groove(), kick: STARTERS.kick(), hats: STARTERS.hats() };
  for (const r of runs((b) => (kick[b] && hats[b] ? "groove" : kick[b] ? "kick" : hats[b] ? "hats" : null), bars)) {
    lay(drums[r.v as keyof typeof drums], r.from, r.to);
  }
  if (hasKey) {
    const bass = likelyBars(layers.bass, bars), chords = likelyBars(layers.chords, bars);
    const b = STARTERS.bass(), c = STARTERS.chords();
    for (const r of runs((x) => (bass[x] ? true : null), bars)) lay(b, r.from, r.to);
    for (const r of runs((x) => (chords[x] ? true : null), bars)) lay(c, r.from, r.to);
  }
  return { sounds: [...used.values()], regions };
}

export function mapToTemplate(map: Pick<TrackMap, "bpm" | "key" | "scale" | "bars" | "sections"> & { id?: string; layers?: TrackMap["layers"] }): Doc {
  // shortcut: a track longer than MAX_BARS (512) is cut to 512 bars; raise MAX_BARS if that happens.
  const bars = Math.min(MAX_BARS, Math.max(MIN_BARS, Math.round(map.bars)));
  const doc: Doc = { regions: [], muted: TRACKS.map(() => false), bars, bpm: clampBpm(map.bpm) };
  // L134: the reference track, so the Studio's AI loop request can ask for its style.
  if (map.id) doc.analysisId = map.id;
  if (map.key && (map.scale === "major" || map.scale === "minor")) doc.key = { key: map.key, scale: map.scale };
  // Map bars are 0-based from the first downbeat; the Studio's bar 1 is that downbeat.
  doc.markers = map.sections
    .map((s) => ({ bar: Math.round(s.startBar) + 1, label: s.label }))
    .filter((m) => m.bar >= 1 && m.bar <= bars);
  if (map.layers) {
    // Bass and chords need the key to play in; without one only the drums are laid.
    const lanes = starterLanes(map.layers, bars, !!doc.key);
    if (lanes.regions.length) { doc.sounds = lanes.sounds; doc.regions = lanes.regions; }
  }
  return doc;
}

/** The draft the Studio picks up (STUDIO_DRAFT_KEY): named after the reference track. */
export function templateDraft(map: TrackMap, now = new Date()): StudioDraft {
  const doc = mapToTemplate(map);
  const name = `${map.title || "Untitled"} · template`.slice(0, 80);
  return { name, bpm: doc.bpm!, doc, at: now.toISOString(), ...(doc.analysisId ? { analysisId: doc.analysisId } : {}) };
}
