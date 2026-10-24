// The Ears queue (F11, US8, L27): tracks analysed one after another. Plain state + a pure reducer,
// persisted by the caller (localStorage). Holds track URLs, titles and status only, never audio.

export type QueueStatus = "queued" | "loading" | "listening" | "analysing" | "done" | "failed";
export type FailReason = "geo-blocked" | "unavailable" | "no-audio" | "cancelled" | "error";

export type QueueItem = {
  /** The track URL is the id: one row per track. */
  id: string;
  url: string;
  title?: string;
  uploader?: string;
  durationMs?: number;
  status: QueueStatus;
  /** While listening: snippet i of n, seconds heard of this snippet. */
  progress?: { snippet: number; of: number; seconds: number; snippetSeconds: number };
  reason?: FailReason;
  message?: string;
  /** Id of the stored analysis (results.ts) once done. */
  resultId?: string;
  addedAt: string;
  updatedAt: string;
};

export type QueueState = { version: 1; items: QueueItem[] };
export const EMPTY_QUEUE: QueueState = { version: 1, items: [] };

export type QueueTrack = { url: string; title?: string; uploader?: string; durationMs?: number };

export type QueueAction =
  | { type: "add"; tracks: QueueTrack[]; now: string }
  | { type: "start"; id: string; now: string }
  | { type: "loaded"; id: string; title?: string; uploader?: string; durationMs?: number; now: string }
  | { type: "listening"; id: string; snippet: number; of: number; seconds: number; snippetSeconds: number; now: string }
  | { type: "analysing"; id: string; now: string }
  | { type: "done"; id: string; resultId: string; now: string }
  | { type: "fail"; id: string; reason: FailReason; message?: string; now: string }
  /** Put the active item back in line (listening stopped mid-track): it restarts from snippet 1. */
  | { type: "requeue"; id: string; now: string }
  | { type: "retry"; id: string; now: string }
  | { type: "remove"; id: string }
  | { type: "clear" }
  /** After a reload: whatever was mid-analysis goes back to queued; it resumes once listening is on. */
  | { type: "restore"; now: string };

const ACTIVE: QueueStatus[] = ["loading", "listening", "analysing"];
export const isActive = (s: QueueStatus) => ACTIVE.includes(s);

export function activeItem(state: QueueState): QueueItem | undefined {
  return state.items.find((i) => isActive(i.status));
}
export function nextQueued(state: QueueState): QueueItem | undefined {
  return state.items.find((i) => i.status === "queued");
}
export function queueCounts(state: QueueState) {
  const c = { total: state.items.length, queued: 0, active: 0, done: 0, failed: 0 };
  for (const i of state.items) {
    if (i.status === "queued") c.queued++;
    else if (i.status === "done") c.done++;
    else if (i.status === "failed") c.failed++;
    else c.active++;
  }
  return c;
}

/** Fresh state for a queued item: no progress, reason or result. */
function reset(i: QueueItem, now: string): QueueItem {
  return { id: i.id, url: i.url, title: i.title, uploader: i.uploader, durationMs: i.durationMs, status: "queued", addedAt: i.addedAt, updatedAt: now };
}

export function queueReducer(state: QueueState, action: QueueAction): QueueState {
  const update = (id: string, allowed: QueueStatus[], fn: (i: QueueItem) => QueueItem): QueueState => {
    let changed = false;
    const items = state.items.map((i) => {
      if (i.id !== id || !allowed.includes(i.status)) return i;
      changed = true;
      return fn(i);
    });
    return changed ? { ...state, items } : state;
  };

  switch (action.type) {
    case "add": {
      // Already waiting, running or done: left as is. Failed: back in line. New: appended.
      const items = [...state.items];
      for (const t of action.tracks) {
        const at = items.findIndex((i) => i.id === t.url);
        if (at < 0) {
          items.push({ id: t.url, url: t.url, title: t.title, uploader: t.uploader, durationMs: t.durationMs, status: "queued", addedAt: action.now, updatedAt: action.now });
        } else if (items[at].status === "failed") {
          items[at] = reset({ ...items[at], title: items[at].title ?? t.title }, action.now);
        }
      }
      return { ...state, items };
    }
    case "start":
      // One at a time: nothing starts while another item is active.
      if (activeItem(state)) return state;
      return update(action.id, ["queued"], (i) => ({ ...i, status: "loading", updatedAt: action.now }));
    case "loaded":
      return update(action.id, ["loading"], (i) => ({
        ...i,
        title: action.title ?? i.title,
        uploader: action.uploader ?? i.uploader,
        durationMs: action.durationMs ?? i.durationMs,
        updatedAt: action.now,
      }));
    case "listening":
      return update(action.id, ["loading", "listening"], (i) => ({
        ...i,
        status: "listening",
        progress: { snippet: action.snippet, of: action.of, seconds: action.seconds, snippetSeconds: action.snippetSeconds },
        updatedAt: action.now,
      }));
    case "analysing":
      return update(action.id, ["listening"], (i) => ({ ...i, status: "analysing", updatedAt: action.now }));
    case "done":
      return update(action.id, ["analysing"], (i) => ({ ...i, status: "done", progress: undefined, resultId: action.resultId, updatedAt: action.now }));
    case "fail":
      return update(action.id, ACTIVE, (i) => ({ ...i, status: "failed", progress: undefined, reason: action.reason, message: action.message, updatedAt: action.now }));
    case "requeue":
      return update(action.id, ACTIVE, (i) => reset(i, action.now));
    case "retry":
      return update(action.id, ["failed", "done"], (i) => reset(i, action.now));
    case "remove":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case "clear":
      return { ...state, items: [] };
    case "restore": {
      if (!state.items.some((i) => isActive(i.status))) return state;
      return { ...state, items: state.items.map((i) => (isActive(i.status) ? reset(i, action.now) : i)) };
    }
  }
}

/** Whatever came out of localStorage → a valid queue (unknown shapes are dropped, not trusted). */
export function sanitiseQueue(raw: unknown): QueueState {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as QueueState).items)) return EMPTY_QUEUE;
  const statuses: QueueStatus[] = ["queued", ...ACTIVE, "done", "failed"];
  const items = (raw as QueueState).items.filter(
    (i): i is QueueItem => !!i && typeof i.id === "string" && typeof i.url === "string" && statuses.includes(i.status),
  );
  return { version: 1, items };
}
