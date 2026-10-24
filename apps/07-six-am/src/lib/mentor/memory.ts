// The Mentor's full context and memory (L88). Pure: no SDK, no store.
// - The library: one compact line per analysed track with a short ref (T1, T2…) the model uses to
//   say which track(s) a question means (L86).
// - The Studio tracks: names and the loops they use (read-only).
// - Memory: a running summary the model rewrites every few exchanges, plus the turns since the
//   last rewrite verbatim (see MEMORY_EVERY / MEMORY_KEEP). Stored as the newest row of the
//   reserved message thread "memory" (no schema change).
import { bpmSentence } from "@/lib/ears/bpm-choice";
import { brightnessLabel, energyLabel, keyLabel, pct, shownStyles } from "@/lib/ears/labels";
import { styleDisplayName } from "@/lib/ears/styles";
import { keyNote, type KeyRelation } from "./studio";

/** How the track's key sits against the crate's A minor, worked out in code (studio.ts keyNote);
 *  the model takes this as a fact and never infers it. */
const KEY_FIT: Record<KeyRelation, string> = {
  same: "same key, every loop fits", relative: "same notes, every loop fits", neighbour: "close key, loops should blend",
  far: "clashes: bass and chords would clash, drums fit", unknown: "key unknown",
};
import type { EarsAnalysis } from "@/lib/ears/results";
import { LOOPS, TRACKS, type Doc } from "@/lib/timeline";
import type { LearnEvent } from "./prompt";

/** The one chat stream (L86). Older per-track threads stay in the table, unread by the UI. */
export const MAIN_THREAD = "main";
export const MEMORY_THREAD = "memory";
/** Rewrite the summary once this many exchanges (question + answer) have piled up verbatim… */
export const MEMORY_EVERY = 10;
/** …and keep this many of the newest ones verbatim after a rewrite (so history is 5–10 exchanges). */
export const MEMORY_KEEP = 5;
/** Run a profile refresh early once this many learning events are waiting (tags, ratings). */
export const EVENTS_FOR_REFRESH = 5;

export type SetupTrack = { url: string; title: string; uploader: string };
export type MemoryState = {
  summary: string;
  /** createdAt of the first message still sent verbatim; null = everything in MAIN_THREAD. */
  anchor: string | null;
  /** Learning events (genres typed, suggestions accepted, more like this…) not folded in yet. */
  events: LearnEvent[];
  /** Tracks read from playlists in setup (metadata only): they count toward the unlock (L94). */
  setupTracks: SetupTrack[];
  /** When the profile was last rewritten as a pattern summary (L92). */
  profileAt: string | null;
};

export const emptyMemory = (): MemoryState => ({ summary: "", anchor: null, events: [], setupTracks: [], profileAt: null });

export function parseMemory(raw: string | null | undefined): MemoryState {
  if (!raw) return emptyMemory();
  try {
    const o = JSON.parse(raw) as Partial<MemoryState>;
    return {
      summary: typeof o.summary === "string" ? o.summary.slice(0, 4000) : "",
      anchor: typeof o.anchor === "string" ? o.anchor : null,
      events: Array.isArray(o.events) ? o.events.slice(-40) : [],
      setupTracks: Array.isArray(o.setupTracks) ? o.setupTracks.filter((t) => t && typeof t.url === "string").slice(-1000) : [],
      profileAt: typeof o.profileAt === "string" ? o.profileAt : null,
    };
  } catch {
    return emptyMemory();
  }
}

const key = (u: string) => u.trim().toLowerCase().replace(/^https?:\/\/(www\.|m\.)?/, "").replace(/[?#].*$/, "").replace(/\/+$/, "");

/** Setup tracks added once each (by URL). */
export function mergeSetupTracks(have: SetupTrack[], add: SetupTrack[]): SetupTrack[] {
  const seen = new Set(have.map((t) => key(t.url)));
  const out = [...have];
  for (const t of add) if (t.url && !seen.has(key(t.url))) { seen.add(key(t.url)); out.push(t); }
  return out;
}

/** Library size for the unlock: analysed tracks plus setup tracks not analysed too. */
export function libraryCount(analysed: Pick<EarsAnalysis, "id" | "soundcloudUrl">[], setup: SetupTrack[]): number {
  const seen = new Set(analysed.flatMap((a) => [key(a.id), key(a.soundcloudUrl)]));
  return analysed.length + setup.filter((t) => !seen.has(key(t.url))).length;
}

/** Library order for refs: oldest analysis first, so a new track appends a ref instead of shifting. */
export function libraryOrder(list: EarsAnalysis[]): EarsAnalysis[] {
  return [...list].sort((a, b) => a.analysedAt.localeCompare(b.analysedAt) || a.id.localeCompare(b.id));
}
export const refOf = (i: number) => `T${i + 1}`;

/** One short line per analysed track (L88): ref | artist – title | BPM | key | energy, tone | top styles | uploader tag | My genre. */
export function libraryLine(a: EarsAnalysis, i: number): string {
  const styles = shownStyles(a).slice(0, 3).map((x) => `${x.name} ${pct(x.p)}%`).join(", ") || "-";
  // Where Ears listened (for ear-training moments); a preview-only measurement says so.
  const heard = a.snippets.map((x) => `${clock(x.startMs)} ${styleDisplayName(x.topStyle)}${x.p != null ? ` ${pct(x.p)}%` : ""}`).join(", ");
  return `${refOf(i)} | ${a.uploader || "?"} – ${a.title || "untitled"} | ${bpmSentence(a)} BPM | ${keyLabel(a.key, a.scale)} | ${energyLabel(a.energy)} energy, ${brightnessLabel(a.brightness)} | ${styles} | tag: ${a.uploaderGenreTag ?? "-"} | my genre: ${a.myGenre?.trim() || "-"} | crate key fit: ${KEY_FIT[keyNote(a.key, a.scale).relation]} | heard${a.preview ? " (30 s preview only)" : ""}: ${heard || "-"}`;
}

/** m:ss, as the prompt and the ear-training check write Ears' snippet times. */
export const clock = (ms: number) => { const t = Math.round(ms / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };

export function libraryText(ordered: EarsAnalysis[]): string {
  if (!ordered.length) return "The person's Analyse library is empty: no tracks analysed yet.";
  return `The person's Analyse library (${ordered.length} tracks; ref | uploader – title | BPM [ears] | key [ears] | energy, tone [ears] | top styles [ears] | uploader genre tag [uploader] | My genre [library], live | crate key fit (worked out by Six AM) | where Ears listened: time and top style [ears]):\n${ordered.map(libraryLine).join("\n")}`;
}

export type StudioTrackLike = { name: string; doc: Doc };
/** The person's own Studio tracks: name, length and the loops used (read-only). */
export function studioText(tracks: StudioTrackLike[]): string {
  if (!tracks.length) return "The person has no saved Studio tracks yet.";
  const lines = tracks.slice(0, 30).map((t) => {
    const ids = [...new Set(t.doc.regions.map((r) => r.loopId))];
    const bars = t.doc.regions.reduce((m, r) => Math.max(m, r.start + r.length - 1), 0);
    const byLane = TRACKS.map((lane, i) => {
      const names = ids.map((id) => LOOPS.find((l) => l.id === id)).filter((l) => l && l.track === i).map((l) => l!.name);
      return names.length ? `${lane}: ${names.join(", ")}` : "";
    }).filter(Boolean);
    return `- "${t.name}": ${bars} bars; ${byLane.join("; ") || "empty"}`;
  });
  // shortcut: the Studio's tempo is per device (localStorage), not saved per track, so the Mentor
  // doesn't see one; store the tempo on the track if it ever needs it.
  return `The person's own Studio tracks (made in Six AM's Studio from the crate; tempo isn't saved per track):\n${lines.join("\n")}`;
}

/** Turns is user/assistant pairs since the anchor: time to rewrite the summary? */
export const memoryDue = (exchangesSinceAnchor: number) => exchangesSinceAnchor >= MEMORY_EVERY;
