"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Yum } from "@/lib/yum";

// The sticker book in the browser: every yum, loaded once and kept between pages. While any
// sticker is still being drawn it checks again every few seconds, so stickers appear on their
// own (R4). shortcut: the whole book loads at once; fine for hundreds of yums, page it past that.

export type BookState = { status: "loading" | "locked" | "ready" | "error"; yums: Yum[] };

let state: BookState = { status: "loading", yums: [] };
const listeners = new Set<() => void>();
const set = (next: BookState) => { state = next; listeners.forEach((l) => l()); };
let inflight: Promise<void> | null = null;
let poll: ReturnType<typeof setTimeout> | null = null;

export function loadBook(): Promise<void> {
  inflight ??= (async () => {
    try {
      const r = await fetch("/api/yums", { cache: "no-store" });
      if (r.status === 401) return set({ status: "locked", yums: [] });
      if (!r.ok) return set({ ...state, status: state.yums.length ? "ready" : "error" });
      const { yums } = (await r.json()) as { yums: Yum[] };
      set({ status: "ready", yums });
    } catch {
      set({ ...state, status: state.yums.length ? "ready" : "error" });
    } finally {
      inflight = null;
      schedulePoll();
    }
  })();
  return inflight;
}

function schedulePoll() {
  if (poll) clearTimeout(poll);
  poll = null;
  if (state.yums.some((y) => y.sticker === "drawing")) poll = setTimeout(() => void loadBook(), 3000);
}

/** Puts a saved or edited yum into the book straight away (no reload needed). */
export function putYum(yum: Yum) {
  const yums = state.yums.some((y) => y.id === yum.id) ? state.yums.map((y) => (y.id === yum.id ? yum : y)) : [yum, ...state.yums];
  set({ status: "ready", yums });
  schedulePoll();
}

export function dropYum(id: string) {
  set({ ...state, yums: state.yums.filter((y) => y.id !== id) });
}

export function useBook(): BookState {
  const snap = useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
    () => state,
  );
  useEffect(() => {
    if (state.status === "loading" || state.status === "error") void loadBook();
  }, []);
  return snap;
}

// The last "Removed …" so the shelf can offer Undo after the item page closes.
let lastRemoved: Yum | null = null;
export const setLastRemoved = (y: Yum | null) => { lastRemoved = y; listeners.forEach((l) => l()); };
export const useLastRemoved = () => useSyncExternalStore(
  (l) => { listeners.add(l); return () => listeners.delete(l); },
  () => lastRemoved,
  () => null,
);
