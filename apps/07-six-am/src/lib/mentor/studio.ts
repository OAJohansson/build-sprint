// Studio starting point (M6, L58, unit test 3): tempo from Ears, the track's key said against the
// crate's fixed A minor (no transposing), and loops from the real crate only. Pure.
import { bpmChoice, type BpmInput } from "@/lib/ears/bpm-choice";
import { camelot } from "@/lib/ears/labels";
import type { EarsAnalysis } from "@/lib/ears/results";
import { clampBpm } from "@/lib/tempo";
import { LOOPS, TRACKS } from "@/lib/timeline";

/** Every loop in the crate is written in A minor (recipes.ts, decision 0019). */
export const CRATE_KEY = { key: "A", scale: "minor", camelot: "8A" } as const;

const PITCH: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
};

export type KeyRelation = "same" | "relative" | "neighbour" | "far" | "unknown";
export type KeyNote = { trackKey: string; crateKey: string; relation: KeyRelation; note: string };

/** How the track's key sits against the crate's A minor, in one plain sentence. */
export function keyNote(key: string, scale: string): KeyNote {
  const crateKey = `A minor (${CRATE_KEY.camelot})`;
  const code = camelot(key, scale);
  if (!code || PITCH[key] === undefined) {
    return { trackKey: `${key} ${scale}`.trim() || "unknown", crateKey, relation: "unknown", note: "Ears couldn't name the track's key, so the crate's A minor is a starting guess." };
  }
  const trackKey = `${key} ${scale} (${code})`;
  const num = Number.parseInt(code, 10), letter = code.slice(-1);
  const wheel = Math.min(Math.abs(num - 8), 12 - Math.abs(num - 8));
  if (code === CRATE_KEY.camelot) {
    return { trackKey, crateKey, relation: "same", note: "Same key as the crate (A minor), so every loop sits in key with the track." };
  }
  if (num === 8 && letter === "B") {
    return { trackKey, crateKey, relation: "relative", note: "C major is A minor's relative major: the same notes, so the crate's loops fit." };
  }
  if (wheel === 1 && letter === "A") {
    return { trackKey, crateKey, relation: "neighbour", note: `Next to A minor on the key wheel (${code} vs 8A): all but one note shared, so the crate should blend.` };
  }
  const semis = (((PITCH[key] - PITCH.A) % 12) + 12) % 12;
  const up = semis <= 6 ? semis : semis - 12;
  const dir = up === 0 ? "the same root as A" : `${Math.abs(up)} semitone${Math.abs(up) === 1 ? "" : "s"} ${up > 0 ? "above" : "below"} A`;
  return {
    trackKey, crateKey, relation: "far",
    note: `The track's root is ${dir} and its key is ${wheel} step${wheel === 1 ? "" : "s"} from the crate's A minor on the key wheel, so tonal loops (bass, chords) will clash with it; drums and percussion still fit. The crate stays in A minor (no transposing).`,
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
