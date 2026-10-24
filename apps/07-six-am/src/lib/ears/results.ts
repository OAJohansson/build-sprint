// Stored analyses (F8, US7): one record per track, numbers and track metadata only, never audio.
// Shape follows the brief's "Data captured per analysis" plus the BPM alternative, the listening
// plan and per-snippet results (for the Deck's detail strip).
import type { Snippet } from "./snippets";
import type { BpmAlternative, EarsCombined, EarsResult } from "./types";

export const RESULTS_KEY = "six-am:ears-results:v1";
export const QUEUE_KEY = "six-am:ears-queue:v1";

export type SnippetResult = {
  startMs: number;
  lengthMs: number;
  /** Seconds actually heard (may be less if the track ended or a snippet was cut short). */
  heardSeconds: number;
  topStyle: string | null;
  p: number | null;
  bpm: number;
};

export type EarsAnalysis = {
  version: 1;
  /** = soundcloudUrl: one record per track; re-analysing replaces it. */
  id: string;
  soundcloudUrl: string;
  trackId: number | null;
  title: string;
  uploader: string;
  uploaderGenreTag: string | null;
  uploaderTags: string[];
  /** 30 s preview only (policy SNIP, L16). */
  preview: boolean;
  durationMs: number | null;
  analysedSeconds: number;
  bpm: number;
  bpmConfidence: number;
  bpmAlternative: BpmAlternative | null;
  bpmAmbiguous: boolean;
  key: string;
  scale: string;
  keyStrength: number;
  /** Second-best key; missing on results saved before it existed. */
  keyRunnerUp?: { key: string; scale: string; strength: number } | null;
  /** 0–1 label scale (see energyLevel); raw dBFS kept next to it. */
  energy: number;
  energyDbfs: number;
  /** 0–1 label scale (see brightnessLevel); raw centroid kept next to it. */
  brightness: number;
  brightnessHz: number;
  /** Top 5 Discogs styles, p in 0–1. */
  genres: { style: string; p: number }[];
  snippetPlan: Snippet[];
  snippets: SnippetResult[];
  analysedAt: string;
};

// shortcut: energy and brightness 0–1 scales are fixed guesses (-40…-5 dBFS, 500 Hz…4 kHz log),
// fine for relative labels across one playlist; recalibrate on the validation set if labels feel off.
export function energyLevel(dbfs: number) {
  if (!Number.isFinite(dbfs)) return 0;
  return round2(clamp01((dbfs + 40) / 35));
}
export function brightnessLevel(centroidHz: number) {
  if (!(centroidHz > 0)) return 0;
  return round2(clamp01(Math.log2(centroidHz / 500) / 3));
}

/** SoundCloud's tag_list: space-separated, multi-word tags in double quotes. */
export function parseTagList(tagList: string | null | undefined): string[] {
  const out: string[] = [];
  const re = /"([^"]+)"|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tagList ?? ""))) {
    const t = (m[1] ?? m[2]).trim();
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}

export type TrackMeta = {
  url: string;
  trackId?: number | null;
  title?: string;
  uploader?: string;
  genre?: string | null;
  tagList?: string | null;
  preview: boolean;
  durationMs?: number | null;
};

export function toAnalysis(meta: TrackMeta, combined: EarsCombined, plan: Snippet[], snippets: { plan: Snippet; heardSeconds: number; result: EarsResult | null }[], now: Date): EarsAnalysis {
  return {
    version: 1,
    id: meta.url,
    soundcloudUrl: meta.url,
    trackId: meta.trackId ?? null,
    title: meta.title ?? "",
    uploader: meta.uploader ?? "",
    uploaderGenreTag: meta.genre?.trim() || null,
    uploaderTags: parseTagList(meta.tagList),
    preview: meta.preview,
    durationMs: meta.durationMs ?? null,
    analysedSeconds: combined.seconds,
    bpm: combined.bpm,
    bpmConfidence: combined.bpmConfidence,
    bpmAlternative: combined.bpmAlternative,
    bpmAmbiguous: combined.bpmAmbiguous,
    key: combined.key,
    scale: combined.scale,
    keyStrength: combined.keyStrength,
    keyRunnerUp: combined.keyRunnerUp ?? null,
    energy: energyLevel(combined.energy.dbfs),
    energyDbfs: combined.energy.dbfs,
    brightness: brightnessLevel(combined.brightness.centroidHz),
    brightnessHz: combined.brightness.centroidHz,
    genres: combined.styles.map((s) => ({ style: s.style, p: Math.round(s.pct * 10) / 1000 })),
    snippetPlan: plan,
    snippets: snippets.map((s) => ({
      startMs: s.plan.startMs,
      lengthMs: s.plan.lengthMs,
      heardSeconds: Math.round(s.heardSeconds * 10) / 10,
      topStyle: s.result?.styles[0]?.style ?? null,
      p: s.result?.styles[0] ? Math.round(s.result.styles[0].pct * 10) / 1000 : null,
      bpm: s.result?.bpm ?? 0,
    })),
    analysedAt: now.toISOString(),
  };
}

/** Newest first; a re-analysis of the same track replaces the old record. */
export function upsertAnalysis(list: EarsAnalysis[], a: EarsAnalysis): EarsAnalysis[] {
  return [a, ...list.filter((x) => x.id !== a.id)];
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const round2 = (x: number) => Math.round(x * 100) / 100;
