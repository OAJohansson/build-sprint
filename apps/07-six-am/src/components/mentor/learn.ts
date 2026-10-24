"use client";

// Learning from use (M11): genres typed, suggestions accepted or corrected, more like this / not
// for me, topics asked about. Collected in the background and sent as one "learn" request after a
// quiet spell (they cost a little but don't count toward 50/day). Text only.
import type { LearnEvent } from "@/lib/mentor/prompt";
import { mentorApi } from "@/lib/mentor/client";

// shortcut: one batch after 45 s of quiet (or 8 events); a learn call costs ~1–2 cents, so a
// longer window or a daily digest is the upgrade if learning gets expensive.
const QUIET_MS = 45_000;
const MAX_BATCH = 8;

let events: LearnEvent[] = [];
/** The Mentor's last genre suggestion per track, so a different typed genre reads as a correction. */
const suggested = new Map<string, string>();
export const rememberSuggestion = (trackId: string, genre: string) => suggested.set(trackId, genre);
export const lastSuggestion = (trackId: string) => suggested.get(trackId);
let timer: ReturnType<typeof setTimeout> | null = null;
let codeNow = "";
const listeners = new Set<(note: string) => void>();

/** Hear about the profile updates the background learning makes ("Updated: …"). */
export function onLearned(fn: (note: string) => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function learn(code: string, e: LearnEvent) {
  if (!e.detail.trim()) return;
  codeNow = code;
  // The same thing twice in one batch is one event.
  if (!events.some((x) => x.type === e.type && x.detail === e.detail && x.trackId === e.trackId)) events.push(e);
  if (events.length >= MAX_BATCH) return void flush();
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, QUIET_MS);
}

export async function flush() {
  if (timer) clearTimeout(timer);
  timer = null;
  const batch = events.splice(0);
  if (!batch.length) return;
  try {
    const r = await mentorApi(codeNow).ask({ job: "learn", events: batch });
    if (r.profileUpdated) listeners.forEach((f) => f(r.profileUpdated!.note));
  } catch {
    // Locked or offline: keep them for the next try, capped.
    events = [...batch, ...events].slice(-30);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    const batch = events.splice(0);
    if (!batch.length) return;
    // keepalive lets the last batch go out as the page closes.
    void fetch("/api/mentor", {
      method: "POST", keepalive: true,
      headers: { "content-type": "application/json", "x-access-code": codeNow },
      body: JSON.stringify({ job: "learn", events: batch, tz: new Date().getTimezoneOffset() }),
    }).catch(() => {});
  });
}
