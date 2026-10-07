"use client";

import type { Entry, NewPb, ParsedSession, Pb, Session, Unit } from "@/lib/types";

// Client-side calls to the app's own API. Every call carries the access code.

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function call<T>(code: string, path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", "x-access-code": code, ...init.headers },
    });
  } catch {
    throw new ApiError("No connection. Try again.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "Something went wrong.", res.status);
  return data as T;
}

export type NewEntry = Omit<Entry, "id">;
export type NewPbInput = Omit<Pb, "id" | "sessionId">;

export const api = (code: string) => ({
  load: () => call<{ sessions: Session[]; pbs: Pb[] }>(code, "/api/data"),
  parse: (transcript: string, today: string, unit: Unit) =>
    call<ParsedSession>(code, "/api/parse", { method: "POST", body: JSON.stringify({ transcript, today, unit }) }),
  saveSession: (s: { date: string; title: string; transcript: string; entries: NewEntry[] }) =>
    call<{ session: Session; newPbs: NewPb[] }>(code, "/api/sessions", { method: "POST", body: JSON.stringify(s) }),
  updateSession: (id: string, s: { date: string; title: string; transcript: string; entries: NewEntry[] }) =>
    call<{ session: Session; newPbs: NewPb[] }>(code, `/api/sessions?id=${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(s) }),
  deleteSession: (id: string) => call(code, `/api/sessions?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
  addPb: (pb: NewPbInput) =>
    call<{ pb: Pb; previous: Pb | null; isBest: boolean }>(code, "/api/pbs", { method: "POST", body: JSON.stringify(pb) }),
  deletePb: (id: string) => call(code, `/api/pbs?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
});
export type Api = ReturnType<typeof api>;
