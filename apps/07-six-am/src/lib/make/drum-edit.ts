// Phase 7 slice 2 (R4, L272, T233, W6): fixing a drum row by ear. A row's edits are kept apart from
// what Six AM read, so read hits, added hits and taken-out hits can be drawn differently, and a second
// tap undoes the first: tapping a read hit takes it out (tap again: back); tapping an empty step adds
// a hit (tap again: gone). What plays (and what is saved) is the read hits minus the taken-out ones
// plus the added ones. Mute and solo never touch this: they only decide which rows are heard. Pure TS.
import type { RowHit } from "./drums-make";

export type HitKind = "read" | "added" | "removed";
/** A row's edits: steps added by ear, and read steps taken out. */
export type RowEdits = { added: number[]; removed: number[] };
export const NO_EDITS: RowEdits = { added: [], removed: [] };

/** One tap on `step` of a row whose read hits are `read` (a loop of `steps` 16ths). */
export function toggleStep(e: RowEdits, read: Pick<RowHit, "step">[], step: number, steps: number): RowEdits {
  if (!Number.isInteger(step) || step < 0 || step >= steps) return e;
  if (read.some((h) => h.step === step)) {
    return e.removed.includes(step) ? { ...e, removed: e.removed.filter((s) => s !== step) } : { ...e, removed: [...e.removed, step].sort((a, b) => a - b) };
  }
  return e.added.includes(step) ? { ...e, added: e.added.filter((s) => s !== step) } : { ...e, added: [...e.added, step].sort((a, b) => a - b) };
}

/** What each step of a row shows: a read hit, an added one, a taken-out one, or nothing. */
export function stepKinds(read: Pick<RowHit, "step">[], e: RowEdits): Map<number, HitKind> {
  const out = new Map<number, HitKind>();
  for (const h of read) out.set(h.step, e.removed.includes(h.step) ? "removed" : "read");
  for (const s of e.added) if (!out.has(s)) out.set(s, "added");
  return out;
}

/** A hit added by ear sits on its step (no swing) at the row's usual loudness. */
export function addedVel(read: Pick<RowHit, "vel">[]): number {
  if (!read.length) return 0.9;
  const v = read.map((h) => h.vel).sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
}

/**
 * The hits a row plays (and saves): read minus taken out, plus added, by step. `gridMs` and `sps`
 * (s per 16th) place an added hit in the loop as the reader's hits are placed.
 */
export function playedHits(read: RowHit[], e: RowEdits, o: { gridMs: number; sps: number }): RowHit[] {
  const vel = addedVel(read);
  const kept = read.filter((h) => !e.removed.includes(h.step));
  const added = e.added.filter((s) => !read.some((h) => h.step === s)).map((step): RowHit => ({ step, off: 0, vel, t: Math.round((o.gridMs / 1000 + step * o.sps) * 100000) / 100000, db: null, faint: false }));
  return [...kept, ...added].sort((a, b) => a.step - b.step);
}

/** How many steps differ from the reading (for the save name and the dev hook). */
export const editCount = (e: RowEdits) => e.added.length + e.removed.length;

/**
 * Which rows are heard (R4): a muted row is silent; if any row is soloed, only soloed rows play. The
 * pattern itself is untouched, so Save keeps every hit of a muted row (W6).
 */
export function heardRows<R extends string>(rows: readonly R[], mute: Partial<Record<R, boolean>>, solo: Partial<Record<R, boolean>>): Record<R, boolean> {
  const anySolo = rows.some((r) => solo[r]);
  return Object.fromEntries(rows.map((r) => [r, anySolo ? !!solo[r] : !mute[r]])) as Record<R, boolean>;
}
