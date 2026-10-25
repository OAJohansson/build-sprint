// What the Analyse table shows: stored results, the queue and the loaded link's tracks merged into
// one list of rows. Analysed and queued tracks first; the link's other tracks below a divider.
import type { QueueItem, QueueState } from "@/lib/ears/queue";
import type { EarsAnalysis } from "@/lib/ears/results";

export const SOURCE_KEY = "six-am:ears-source:v1";

/** A track of the pasted link (a playlist's tracks, or the one track). Metadata only. */
export type SourceTrack = { url: string; trackId?: number; title?: string; uploader?: string; durationMs?: number; blocked?: boolean; preview?: boolean };
export type Source = { version: 1; url: string; kind: "track" | "set" | "list"; tracks: SourceTrack[] };

export type RowState = "done" | "loading" | "listening" | "analysing" | "queued" | "failed" | "new" | "blocked";
export type Row = {
  key: string;
  url: string;
  title: string;
  uploader: string;
  durationMs: number | null;
  state: RowState;
  result?: EarsAnalysis;
  item?: QueueItem;
  /** 1-based place among waiting tracks. */
  queuePos?: number;
  /** SoundCloud only plays a 30 s preview (from the pasted link's details). */
  preview?: boolean;
};

export function sanitiseSource(raw: unknown): Source | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Source;
  if (typeof s.url !== "string" || !Array.isArray(s.tracks)) return null;
  return { version: 1, url: s.url, kind: s.kind === "set" || s.kind === "list" ? s.kind : "track", tracks: s.tracks.filter((t) => t && typeof t.url === "string") };
}

/** Same track? SoundCloud id when both have one, else the link without query, case or trailing slash. */
const urlKey = (u: string) => u.split(/[?#]/)[0].replace(/\/+$/, "").toLowerCase();
export function sameTrack(a: SourceTrack, b: SourceTrack): boolean {
  if (a.trackId != null && b.trackId != null) return a.trackId === b.trackId;
  return urlKey(a.url) === urlKey(b.url);
}

/** A pasted link adds its tracks to the list (owner, 23 Oct): new ones go at the end, repeats are
 *  skipped (the earlier entry keeps its place but takes fresher details). */
export function appendToSource(prev: Source | null, incoming: SourceTrack[], url: string, kind: Source["kind"]): { source: Source; added: number } {
  const tracks = [...(prev?.tracks ?? [])];
  let added = 0;
  for (const t of incoming) {
    const i = tracks.findIndex((x) => sameTrack(x, t));
    if (i >= 0) { tracks[i] = { ...tracks[i], ...t, url: tracks[i].url }; continue; }
    tracks.push(t);
    added++;
  }
  const source: Source = prev
    ? { version: 1, url: prev.url, kind: prev.kind === "track" && prev.tracks.length === tracks.length ? prev.kind : "list", tracks }
    : { version: 1, url, kind, tracks };
  return { source, added };
}

export function buildRows(results: EarsAnalysis[], queue: QueueState, source: Source | null): { main: Row[]; rest: Row[] } {
  const byResult = new Map(results.map((r) => [r.id, r]));
  // A queue item is "about" a result if they share the URL, or the item finished as that result.
  const itemFor = new Map<string, QueueItem>();
  const waiting = queue.items.filter((i) => i.status === "queued");
  for (const i of queue.items) {
    if (i.status === "done") continue;
    itemFor.set(i.id, i);
    if (i.resultId) itemFor.set(i.resultId, i);
  }
  const pos = (i: QueueItem) => (i.status === "queued" ? waiting.indexOf(i) + 1 : undefined);
  const covered = new Set<string>();
  const main: Row[] = [];

  // Analysed tracks, oldest first: new results land at the bottom, next to the work in progress.
  for (const r of [...results].sort((a, b) => a.analysedAt.localeCompare(b.analysedAt))) {
    // A failed re-run keeps the earlier result on show.
    const found = itemFor.get(r.id);
    const item = found && found.status !== "failed" ? found : undefined;
    covered.add(r.id);
    if (found) covered.add(found.id);
    main.push({
      key: r.id, url: r.soundcloudUrl, title: r.title, uploader: r.uploader, durationMs: r.durationMs, result: r,
      state: item ? (item.status as RowState) : "done", item, queuePos: item ? pos(item) : undefined,
    });
  }
  // Then whatever is being analysed, waiting or failed, in queue order.
  for (const i of queue.items) {
    if (covered.has(i.id)) continue;
    if (i.status === "done") {
      if (i.resultId && byResult.has(i.resultId)) covered.add(i.id);
      continue;
    }
    covered.add(i.id);
    main.push({ key: i.id, url: i.url, title: i.title ?? "", uploader: i.uploader ?? "", durationMs: i.durationMs ?? null, state: i.status as RowState, item: i, queuePos: pos(i) });
  }
  // The link's tracks not analysed yet.
  const rest: Row[] = [];
  for (const t of source?.tracks ?? []) {
    if (covered.has(t.url)) continue;
    covered.add(t.url);
    rest.push({ key: t.url, url: t.url, title: t.title ?? "", uploader: t.uploader ?? "", durationMs: t.durationMs ?? null, state: t.blocked ? "blocked" : "new", ...(t.preview ? { preview: true } : {}) });
  }
  return { main, rest };
}
