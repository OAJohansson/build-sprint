"use client";

import type { Doc } from "@/lib/timeline";
import type { Track, TrackSummary } from "@/lib/tracks";

// Client-side calls to the app's own API. Every call carries the access code. Pattern from Folio.

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

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

const q = (id: string) => `/api/tracks?id=${encodeURIComponent(id)}`;

export const api = (code: string) => ({
  list: () => call<{ tracks: TrackSummary[] }>(code, "/api/tracks").then((r) => r.tracks),
  get: (id: string) => call<{ track: Track }>(code, q(id)).then((r) => r.track),
  /** The list plus the track to open (`open` if it exists, else the newest) in one request. */
  listAndOpen: (open: string) => call<{ tracks: TrackSummary[]; track: Track | null }>(code, `/api/tracks?open=${encodeURIComponent(open || "newest")}`),
  save: (id: string, name: string, doc: Doc) =>
    call<{ track: Track }>(code, q(id), { method: "PUT", body: JSON.stringify({ name, doc }) }).then((r) => r.track),
  remove: (id: string) => call<{ ok: true }>(code, q(id), { method: "DELETE" }),
});
export type Api = ReturnType<typeof api>;
