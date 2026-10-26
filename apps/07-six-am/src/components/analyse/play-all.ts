// Play all (L142): the shown tracks one after another in the Analyse player. Pure: which rows can
// play, what was skipped and why, and what comes next. Tested in play-all.test.ts.
import type { Row } from "./rows";

export type SkipReason = "preview only" | "not available";
export type PlayList = { keys: string[]; urls: string[]; titles: string[]; skipped: Record<SkipReason, number> };

/** Why a row can't play in full, or null when it can. */
export function skipReason(r: Pick<Row, "state" | "result" | "preview">): SkipReason | null {
  if (r.state === "blocked") return "not available";
  if (r.result?.preview || r.preview) return "preview only";
  return null;
}

/** The rows that play, in order, and the counts of those skipped. */
export function playList(rows: Pick<Row, "key" | "url" | "title" | "state" | "result" | "preview">[]): PlayList {
  const out: PlayList = { keys: [], urls: [], titles: [], skipped: { "preview only": 0, "not available": 0 } };
  for (const r of rows) {
    const why = skipReason(r);
    if (why) { out.skipped[why] += 1; continue; }
    out.keys.push(r.key); out.urls.push(r.url); out.titles.push(r.title || r.url);
  }
  return out;
}

/** "Skipped 2: preview only" / "Skipped 3: 2 preview only, 1 not available" / "" when none. */
export function skippedText(s: Record<SkipReason, number>): string {
  const parts = (Object.entries(s) as [SkipReason, number][]).filter(([, n]) => n > 0);
  const total = parts.reduce((t, [, n]) => t + n, 0);
  if (!total) return "";
  return parts.length === 1 ? `Skipped ${total}: ${parts[0][0]}` : `Skipped ${total}: ${parts.map(([w, n]) => `${n} ${w}`).join(", ")}`;
}

/** The next index after `i` (a track that failed to load is skipped by calling this again), or null at the end. */
export const nextIndex = (list: PlayList, i: number): number | null => (i + 1 < list.keys.length ? i + 1 : null);
