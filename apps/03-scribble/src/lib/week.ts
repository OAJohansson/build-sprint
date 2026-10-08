import type { Piece } from "@/lib/types";

export const WEEKLY_GOAL = 4;

/** Monday 00:00 of this week, in the device's time zone. */
export function startOfWeek(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

/** Pieces set down since Monday. */
export function doneThisWeek(pieces: Piece[], now = new Date()) {
  const start = startOfWeek(now).getTime();
  return pieces.filter((p) => p.status === "done" && p.finishedAt && new Date(p.finishedAt).getTime() >= start).length;
}

export function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
