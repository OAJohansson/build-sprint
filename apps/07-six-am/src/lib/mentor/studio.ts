// Studio starting point (M6, L58, unit test 3): tempo from Ears, the track's key said against the
// crate's fixed A minor (no transposing), and loops from the real crate only. Pure.
import { bpmChoice, type BpmInput } from "@/lib/ears/bpm-choice";
import { camelot } from "@/lib/ears/labels";
import type { EarsAnalysis } from "@/lib/ears/results";
import { clampBpm } from "@/lib/tempo";
import { BARS, LOOPS, newId, TRACKS, type Doc, type Region } from "@/lib/timeline";

/** Every loop in the crate is written in A minor (recipes.ts, decision 0019). */
export const CRATE_KEY = { key: "A", scale: "minor", camelot: "8A" } as const;

const PITCH: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
};

export type KeyRelation = "same" | "relative" | "neighbour" | "far" | "unknown";
export type KeyNote = { trackKey: string; crateKey: string; relation: KeyRelation; note: string };

/** How the track's key sits against the crate's A minor, in one plain sentence (N5: no semitones,
 *  key wheel or Camelot codes; the wheel is only used to decide). */
export function keyNote(key: string, scale: string): KeyNote {
  const crateKey = "A minor";
  const code = camelot(key, scale);
  if (!code || PITCH[key] === undefined) {
    return { trackKey: `${key} ${scale}`.trim() || "unknown", crateKey, relation: "unknown", note: "Ears couldn't name the track's key, so treat the crate's A minor as a starting guess." };
  }
  const trackKey = `${key} ${scale}`;
  const num = Number.parseInt(code, 10), letter = code.slice(-1);
  const wheel = Math.min(Math.abs(num - 8), 12 - Math.abs(num - 8));
  if (code === CRATE_KEY.camelot) {
    return { trackKey, crateKey, relation: "same", note: "The same key as the crate, so every loop fits." };
  }
  if (num === 8 && letter === "B") {
    return { trackKey, crateKey, relation: "relative", note: "C major uses the same notes as the crate's A minor, so every loop fits." };
  }
  if (wheel === 1 && letter === "A") {
    return { trackKey, crateKey, relation: "neighbour", note: "A close key to the crate's A minor: nearly the same notes, so the loops should blend." };
  }
  return {
    trackKey, crateKey, relation: "far",
    note: "A different key from the crate's A minor: the bass and chords would clash with the track, while drums and percussion still fit. The crate can't change key.",
  };
}

export const CRATE_IDS: ReadonlySet<string> = new Set(LOOPS.map((l) => l.id));

/** The crate as the prompt sees it: one line per loop, "id: Name (group, vibe, bars)". */
export function crateText(): string {
  return LOOPS.map((l) => `${l.id}: ${l.name} (${TRACKS[l.track]}; ${l.vibe}; ${l.bars} bars)`).join("\n");
}

/** Keep only real crate ids, once each, at most `max`. */
export function realLoops(ids: unknown, max = 6): string[] {
  if (!Array.isArray(ids)) return [];
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id === "string" && CRATE_IDS.has(id) && !out.includes(id)) out.push(id);
    if (out.length >= max) break;
  }
  return out;
}

export type StudioStart = { bpm: number; key: KeyNote; loops: { id: string; why: string }[] };

/** The deterministic part (tempo, key) from the analysis plus the model's loop picks, checked. */
export function studioStart(a: BpmInput & Pick<EarsAnalysis, "key" | "scale">, picks: { id: string; why?: string }[]): StudioStart {
  const ids = realLoops(picks.map((p) => p.id));
  return {
    // The same reading Set Studio uses (bpm-choice.ts): inside 90–160 when half/double is unclear.
    bpm: clampBpm(bpmChoice(a).studio),
    key: keyNote(a.key, a.scale),
    loops: ids.map((id) => ({ id, why: picks.find((p) => p.id === id)?.why?.trim() ?? "" })),
  };
}

/** Where the Studio picks up a Mentor starting point (N1): a new, unsaved track. */
export const STUDIO_DRAFT_KEY = "six-am:studio-draft:v1";
/** analysisId: the reference track of a map template (L134), also kept on the doc. */
export type StudioDraft = { name: string; bpm: number; doc: Doc; at: string; analysisId?: string };

/** The suggested loops laid out on the timeline: each lane's loops one after another in 16-bar
 *  blocks from bar 1 (every crate loop is 2, 4 or 8 bars, so 16 always fits whole loops). */
export function starterDoc(ids: string[]): Doc {
  const regions: Region[] = [];
  const next = TRACKS.map(() => 1);
  for (const id of realLoops(ids)) {
    const loop = LOOPS.find((l) => l.id === id)!;
    const start = next[loop.track];
    if (start + 16 - 1 > BARS) continue;
    regions.push({ id: newId(), loopId: id, track: loop.track, start, length: 16 });
    next[loop.track] = start + 16;
  }
  return { regions, muted: TRACKS.map(() => false) };
}
