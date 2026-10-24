"use client";

// The browser's side of the Mentor routes (decision 0027). Every call carries the Studio's access
// code (same localStorage key as the Studio, so one unlock opens both). Text and ids only: no
// audio is ever sent. The server builds the prompts.
import { ApiError } from "@/lib/api";
import type { EarsAnalysis } from "@/lib/ears/results";
import { useSyncExternalStore } from "react";
import { useLocalStorage } from "@/lib/use-local-storage";
import type { Job, MentorAnswer } from "./answer";
import type { StudioStart } from "./studio";
import type { UsageSummary } from "./periods";
import type { LearnEvent } from "./prompt";
import type { PlaylistLike } from "./playlist";
import type { UnlockState } from "./taste-unlock";

export { ApiError };
export const CODE_KEY = "07-six-am:code";
const noSubscribe = () => () => {};
/** [code, setCode, ready]: ready once the browser's stored code has been read (F12: no call goes
 *  out with the empty code of the first, server-rendered pass). */
export function useAccessCode() {
  const [code, setCode] = useLocalStorage(CODE_KEY, "");
  const ready = useSyncExternalStore(noSubscribe, () => true, () => false);
  return [code, setCode, ready] as const;
}

export type ProfileNote = { at: string; note: string; by: "owner" | "mentor"; from?: string; was?: string; now?: string };
/** memory = the dev server's in-memory store (a clean start); supabase = the real data. */
export type StoreKind = "memory" | "supabase";
export type Profile = { text: string; updatedAt: string | null; history: ProfileNote[] };
export type Group = { id: string; name: string; reason: string; trackIds: string[]; status: "proposed" | "accepted" | "dismissed"; createdAt: string; updatedAt: string };

export type ThreadMessage =
  | { id: string; role: "user"; job: string; createdAt: string; text: string }
  | { id: string; role: "assistant"; job: string; createdAt: string; answer: MentorAnswer; costUsd: number };

export type AskReply = {
  threadId: string;
  job: Job;
  message: { id: string; createdAt: string; costUsd: number };
  answer: MentorAnswer;
  studio?: StudioStart;
  groups?: Group[];
  profileUpdated?: { note: string };
  /** suggest_genre: the track "Use as My genre" applies to. */
  genreTrackId?: string;
  dropped: string[];
  latencyMs: number;
  usage: UsageSummary;
};

export type AskInput = {
  job: Job;
  track?: EarsAnalysis | null;
  message?: string;
  events?: LearnEvent[];
  playlists?: PlaylistLike[];
  taste?: { a: string; b: string; preferred: "a" | "b"; why: string };
  /** "setup": learn events from the setup dialog (Settings says "From setup"). */
  source?: "setup";
};

/** getTimezoneOffset(): the server sums Today / Month in the owner's local time. */
const tz = () => new Date().getTimezoneOffset();

async function call<T>(code: string, path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers: { "content-type": "application/json", "x-access-code": code, ...init.headers } });
  } catch {
    throw new ApiError("No connection. Check your internet and try again.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "Something went wrong.", res.status);
  return data as T;
}

export const mentorApi = (code: string) => ({
  ask: (i: AskInput) =>
    call<AskReply>(code, "/api/mentor", {
      method: "POST",
      body: JSON.stringify({
        job: i.job,
        trackId: i.track?.id,
        // Fallback when the result isn't on the server yet (demo rows, an unsynced analysis).
        analysis: i.track ?? undefined,
        message: i.message,
        events: i.events,
        playlists: i.playlists,
        taste: i.taste,
        source: i.source,
        tz: tz(),
      }),
    }),
  thread: (id: string) => call<{ thread: string; messages: ThreadMessage[] }>(code, `/api/mentor?thread=${encodeURIComponent(id)}`).then((r) => r.messages),
  usage: () => call<{ usage: UsageSummary }>(code, `/api/mentor/usage?tz=${tz()}`).then((r) => r.usage),
  profile: () => call<{ profile: Profile; store: StoreKind; unlock: UnlockState }>(code, "/api/mentor/profile"),
  saveProfile: (text: string, from?: "setup") => call<{ profile: Profile }>(code, "/api/mentor/profile", { method: "PUT", body: JSON.stringify({ text, from }) }).then((r) => r.profile),
  groups: () => call<{ groups: Group[] }>(code, "/api/mentor/groups").then((r) => r.groups),
  proposeGroups: () => call<AskReply>(code, "/api/mentor/groups", { method: "POST", body: JSON.stringify({ tz: tz() }) }),
  patchGroup: (body: { id: string; action: "accept" | "rename" | "split" | "dismiss"; name?: string; parts?: { name: string; trackIds: string[] }[] }) =>
    call<{ group?: Group; groups?: Group[] }>(code, "/api/mentor/groups", { method: "PATCH", body: JSON.stringify(body) }),
  analyses: () => call<{ analyses: EarsAnalysis[]; store: StoreKind }>(code, "/api/analyses"),
  putAnalysis: (a: EarsAnalysis) => call<{ analysis: EarsAnalysis }>(code, `/api/analyses?id=${encodeURIComponent(a.id)}`, { method: "PUT", body: JSON.stringify({ analysis: a }) }),
  /** The ?demo=1 view's dev-only copy: the server refuses it unless its store is in memory. */
  putDemoAnalysis: (a: EarsAnalysis) => call<{ analysis: EarsAnalysis }>(code, `/api/analyses?id=${encodeURIComponent(a.id)}`, { method: "PUT", body: JSON.stringify({ analysis: a }), headers: { "x-six-am-demo": "1" } }),
  importAnalyses: (list: EarsAnalysis[]) => call<{ added: number; genresFilled: number; kept: number; rejected: number }>(code, "/api/analyses", { method: "POST", body: JSON.stringify({ analyses: list }) }),
  deleteAnalyses: (ids: string[]) => call<{ deleted: number }>(code, "/api/analyses", { method: "DELETE", body: JSON.stringify({ ids }) }),
});
export type MentorApi = ReturnType<typeof mentorApi>;

/** N6: anything above zero but under a cent reads "< $0.01", never "$0.00". */
export const money = (usd: number) => (usd > 0 && usd < 0.01 ? "< $0.01" : `$${usd < 10 ? usd.toFixed(2) : usd.toFixed(0)}`);
export const moneyFine = money;
