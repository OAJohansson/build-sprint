// Where Ears listens in a track (L26): 4 snippets of 30 s at about 20/40/60/80% of the duration,
// skipping intro and outro. Pure, so the plan can be unit-tested and stored with each result.

export type Snippet = { startMs: number; lengthMs: number };

export const SNIPPETS = 4;
export const SNIPPET_MS = 30_000;
/** Shorter than this per snippet and four snippets stop making sense: listen to the whole track once. */
export const MIN_SNIPPET_MS = 8_000;
/** Audio ignored after each seek while the widget settles (counted on top of the snippet length). */
export const SEEK_SETTLE_MS = 500;
/** 30 s previews ("SNIP") and unknown durations: listen from the start for this long. */
export const PREVIEW_MS = 30_000;

/**
 * The listening plan for a track.
 * - `policy === "SNIP"` (30 s preview): one snippet over what plays, from 0.
 * - unknown or zero duration: one 30 s snippet from 0 (the caller stops early on FINISH).
 * - 2:30 or longer: snippets start at 20/40/60/80%, 30 s each; the last one ends by the end.
 * - shorter: the same starts, each snippet shrunk to a fifth of the track so none overlap;
 *   under ~40 s (snippets < 8 s), one snippet over the whole track.
 */
export function snippetPlan(durationMs: number | null | undefined, policy?: string | null): Snippet[] {
  const d = Number.isFinite(durationMs) && (durationMs as number) > 0 ? Math.floor(durationMs as number) : 0;
  if (policy === "SNIP") return [{ startMs: 0, lengthMs: d ? Math.min(d, PREVIEW_MS) : PREVIEW_MS }];
  if (!d) return [{ startMs: 0, lengthMs: PREVIEW_MS }];
  const slot = Math.floor(d / (SNIPPETS + 1));
  const length = Math.min(SNIPPET_MS, slot);
  if (length < MIN_SNIPPET_MS) return [{ startMs: 0, lengthMs: d }];
  return Array.from({ length: SNIPPETS }, (_, i) => ({ startMs: Math.round(((i + 1) * d) / (SNIPPETS + 1)), lengthMs: length }));
}

/** Total listening time of a plan, in ms (for "about 2 min" progress copy). */
export function planMs(plan: Snippet[]) {
  return plan.reduce((t, s) => t + s.lengthMs, 0);
}
