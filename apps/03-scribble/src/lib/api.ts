"use client";

import type { Feedback, Piece, PieceInput } from "@/lib/types";

// Client-side calls to the app's own API. Every call carries the access code.

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
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
    throw new ApiError("No connection. Your words are kept on this device.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "Something went wrong.", res.status);
  return data as T;
}

export const api = (code: string) => ({
  list: () => call<{ pieces: Piece[] }>(code, "/api/pieces").then((r) => r.pieces),
  save: (id: string, input: PieceInput, opts: { keepalive?: boolean } = {}) =>
    call<{ piece: Piece }>(code, `/api/pieces?id=${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input),
      // keepalive lets the save finish even as the page closes (user test F6).
      keepalive: opts.keepalive,
    }).then((r) => r.piece),
  read: (input: { prompt: string; body: string; lastLesson?: string; recentLessons?: string[] }) =>
    call<{ feedback: Feedback }>(code, "/api/feedback", { method: "POST", body: JSON.stringify(input) }).then((r) => r.feedback),
});
export type Api = ReturnType<typeof api>;
