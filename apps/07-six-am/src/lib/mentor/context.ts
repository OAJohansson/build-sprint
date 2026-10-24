// The facts the Mentor gets about a track (M16: text and numbers only, never audio), and a
// whitelist parser for Ears results arriving from the browser (sync, bulk import, smoke test).
import { bpmSentence } from "@/lib/ears/bpm-choice";
import { brightnessLabel, energyLabel, keyLabel, keyWord, pct, shownStyles, tagDiffers } from "@/lib/ears/labels";
import { cleanGenre } from "@/lib/ears/my-genre";
import type { EarsAnalysis, SnippetResult } from "@/lib/ears/results";
import type { Snippet } from "@/lib/ears/snippets";
import type { TempoRelation } from "@/lib/ears/bpm";

const RELATIONS: TempoRelation[] = ["2:1", "1:2", "3:2", "2:3"];
const s = (v: unknown, max = 300) => (typeof v === "string" ? v.slice(0, max) : "");
const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const nOrNull = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const isTrackUrl = (v: unknown): v is string => typeof v === "string" && /^https:\/\/(on\.|m\.)?soundcloud\.com\/\S+$/i.test(v) && v.length <= 600;

/** Copy only the known text and number fields of an Ears result; null if it isn't one. */
export function parseAnalysis(raw: unknown): EarsAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const url = isTrackUrl(r.soundcloudUrl) ? r.soundcloudUrl : isTrackUrl(r.id) ? r.id : null;
  if (!url || typeof r.bpm !== "number") return null;
  const alt = r.bpmAlternative as Record<string, unknown> | null | undefined;
  const runner = r.keyRunnerUp as Record<string, unknown> | null | undefined;
  const genres = (Array.isArray(r.genres) ? r.genres : [])
    .map((g) => ({ style: s((g as Record<string, unknown>)?.style, 120), p: n((g as Record<string, unknown>)?.p) }))
    .filter((g) => g.style)
    .slice(0, 10);
  const plan: Snippet[] = (Array.isArray(r.snippetPlan) ? r.snippetPlan : []).slice(0, 12).map((x) => {
    const o = (x ?? {}) as Record<string, unknown>;
    return { startMs: n(o.startMs), lengthMs: n(o.lengthMs) };
  });
  const snippets: SnippetResult[] = (Array.isArray(r.snippets) ? r.snippets : []).slice(0, 12).map((x) => {
    const o = (x ?? {}) as Record<string, unknown>;
    return { startMs: n(o.startMs), lengthMs: n(o.lengthMs), heardSeconds: n(o.heardSeconds), topStyle: s(o.topStyle, 120) || null, p: nOrNull(o.p), bpm: n(o.bpm) };
  });
  const myGenre = cleanGenre(s(r.myGenre, 80));
  return {
    version: 1,
    id: url,
    soundcloudUrl: url,
    trackId: nOrNull(r.trackId),
    title: s(r.title),
    uploader: s(r.uploader, 120),
    uploaderGenreTag: s(r.uploaderGenreTag, 120) || null,
    uploaderTags: (Array.isArray(r.uploaderTags) ? r.uploaderTags : []).map((t) => s(t, 60)).filter(Boolean).slice(0, 30),
    preview: r.preview === true,
    durationMs: nOrNull(r.durationMs),
    analysedSeconds: n(r.analysedSeconds),
    bpm: n(r.bpm),
    bpmConfidence: n(r.bpmConfidence),
    bpmAlternative:
      alt && typeof alt.bpm === "number" && RELATIONS.includes(alt.relation as TempoRelation)
        ? { bpm: alt.bpm, relation: alt.relation as TempoRelation, ratio: n(alt.ratio) }
        : null,
    bpmAmbiguous: r.bpmAmbiguous === true,
    key: s(r.key, 4),
    scale: s(r.scale, 8),
    keyStrength: n(r.keyStrength),
    keyRunnerUp: runner && typeof runner.key === "string" ? { key: s(runner.key, 4), scale: s(runner.scale, 8), strength: n(runner.strength) } : null,
    energy: n(r.energy),
    energyDbfs: n(r.energyDbfs),
    brightness: n(r.brightness),
    brightnessHz: n(r.brightnessHz),
    genres,
    snippetPlan: plan,
    snippets,
    analysedAt: typeof r.analysedAt === "string" && !Number.isNaN(Date.parse(r.analysedAt)) ? r.analysedAt : new Date(0).toISOString(),
    ...(myGenre ? { myGenre } : {}),
  };
}

/** The track's facts for the prompt, each line labelled with its source. */
export function trackContext(a: EarsAnalysis): string {
  const styles = shownStyles(a).map((x) => `${x.name} ${pct(x.p)}%`).join(", ") || "none";
  const runner = a.keyRunnerUp ? `; runner-up ${a.keyRunnerUp.key} ${a.keyRunnerUp.scale}` : "";
  return [
    `Track id: ${a.id}`,
    `[uploader] Title: ${a.title || "untitled"} | Uploader: ${a.uploader || "unknown"} | URL: ${a.soundcloudUrl}`,
    `[uploader] Genre tag: ${a.uploaderGenreTag ?? "none"}${tagDiffers(a) ? " (differs from the styles Ears measured)" : ""} | Tags: ${a.uploaderTags.join(", ") || "none"}`,
    `[ears] Measured over ${Math.round(a.analysedSeconds)} s${a.preview ? " (30 s preview only)" : ""}, in the person's browser`,
    `[ears] Styles (each style's own likelihood from a Discogs-style classifier): ${styles}`,
    // F2: words, not raw figures (no strength, dBFS or Hz), so answers can't quote them.
    `[ears] BPM: ${bpmSentence(a)} | Key: ${keyLabel(a.key, a.scale)} (${keyWord(a.keyStrength)}${runner})`,
    `[ears] Energy (loudness): ${energyLabel(a.energy)} | Brightness (tone): ${brightnessLabel(a.brightness)}`,
    `[library] My genre (the person's own tag; it always wins): ${a.myGenre?.trim() || "not set yet"}`,
  ].join("\n");
}

/** One short line per track, for jobs that look across the library (groups, taste session). */
export function trackLine(a: EarsAnalysis): string {
  const styles = shownStyles(a).slice(0, 3).map((x) => `${x.name} ${pct(x.p)}%`).join(", ");
  return `${a.id} | ${a.uploader} – ${a.title} | my genre: ${a.myGenre ?? "-"} | ${bpmSentence(a)} BPM | ${keyLabel(a.key, a.scale)} | energy ${energyLabel(a.energy)}, ${brightnessLabel(a.brightness)} | styles: ${styles} | uploader tag: ${a.uploaderGenreTag ?? "-"}; tags: ${a.uploaderTags.slice(0, 8).join(", ") || "-"}`;
}
