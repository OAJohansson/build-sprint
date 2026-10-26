// Sync between devices (v1.1, L27–L29) as pure functions, used by the browser and the server
// route alike. Each habit and each habit-day carries a stamp: the time it last changed on the
// device where it changed. Merging keeps the later change per habit and per habit-day (L28).
// A delete or an undo is a change too (a stamp with nothing behind it), so it never comes back.
// History written before sync existed has no stamp (0); on a tie the side that has data wins, so
// the first connect can only add to a device, never wipe it.
import type { DayKey } from "./day";
import type { DayLog, Habit, Logs, WontState } from "./habits";
import { migrate } from "./migrate";

export interface Stamps {
  /** habitId → when the habit (its wording, or its deletion) last changed. */
  habits: Record<string, number>;
  /** `${habitId}|${day}` → when that day's log last changed (cleared counts). */
  days: Record<string, number>;
}

export interface SyncDoc {
  state: WontState;
  stamps: Stamps;
}

export const emptyStamps = (): Stamps => ({ habits: {}, days: {} });

const dayKey = (habitId: string, day: DayKey) => `${habitId}|${day}`;
const splitKey = (k: string) => {
  const i = k.lastIndexOf("|");
  return [k.slice(0, i), k.slice(i + 1)] as const;
};
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Stamps every habit and habit-day that differs between prev and next with `now`. */
export function stampChanges(prev: WontState, next: WontState, stamps: Stamps, now: number): Stamps {
  const out: Stamps = { habits: { ...stamps.habits }, days: { ...stamps.days } };
  const before = new Map(prev.habits.map((h) => [h.id, h]));
  const after = new Map(next.habits.map((h) => [h.id, h]));
  for (const id of new Set([...before.keys(), ...after.keys()])) {
    if (!same(before.get(id), after.get(id))) out.habits[id] = now;
  }
  for (const id of new Set([...Object.keys(prev.logs), ...Object.keys(next.logs)])) {
    const a = prev.logs[id] ?? {}, b = next.logs[id] ?? {};
    for (const day of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!same(a[day], b[day])) out.days[dayKey(id, day)] = now;
    }
  }
  return out;
}

/** Both sides logged the same habit-day at the same stamp (legacy history on two devices). */
function unionLog(a: DayLog, b: DayLog): DayLog {
  const out: DayLog = {};
  const first = (x?: number, y?: number) => (x === undefined ? y : y === undefined ? x : Math.min(x, y));
  const kept = first(a.kept, b.kept), clean = first(a.clean, b.clean);
  if (kept !== undefined) out.kept = kept;
  if (clean !== undefined) out.clean = clean;
  const slip = !a.slip ? b.slip : !b.slip ? a.slip : a.slip.at >= b.slip.at ? a.slip : b.slip;
  if (slip) out.slip = slip;
  const urges = [...new Set([...(a.urges ?? []), ...(b.urges ?? [])])].sort((x, y) => x - y);
  if (urges.length) out.urges = urges;
  return out;
}

/**
 * Picks per key: the later stamp wins (a missing stamp is 0); on a tie the side with data wins,
 * and if both have data `tie` decides. Returns the winning value (undefined = deleted) and stamp.
 */
function pick<T>(va: T | undefined, sa: number, vb: T | undefined, sb: number, tie: (a: T, b: T) => T) {
  const stamp = Math.max(sa, sb);
  if (sa > sb) return { value: va, stamp };
  if (sb > sa) return { value: vb, stamp };
  if (va !== undefined && vb !== undefined) return { value: tie(va, vb), stamp };
  return { value: va ?? vb, stamp };
}

/** L28: merge two devices' documents. Deterministic; `a` wins exact ties on a habit's wording. */
export function mergeDocs(a: SyncDoc, b: SyncDoc): SyncDoc {
  const stamps = emptyStamps();

  const ha = new Map(a.state.habits.map((h) => [h.id, h]));
  const hb = new Map(b.state.habits.map((h) => [h.id, h]));
  const habitIds = new Set([...ha.keys(), ...hb.keys(), ...Object.keys(a.stamps.habits), ...Object.keys(b.stamps.habits)]);
  const habits: Habit[] = [];
  for (const id of habitIds) {
    const r = pick(ha.get(id), a.stamps.habits[id] ?? 0, hb.get(id), b.stamps.habits[id] ?? 0, (x) => x);
    if (r.stamp) stamps.habits[id] = r.stamp;
    if (r.value) habits.push(r.value);
  }
  const alive = new Set(habits.map((h) => h.id));

  const cells = new Set<string>([...Object.keys(a.stamps.days), ...Object.keys(b.stamps.days)]);
  for (const s of [a, b]) {
    for (const [id, days] of Object.entries(s.state.logs)) for (const day of Object.keys(days)) cells.add(dayKey(id, day));
  }
  const logs: Logs = {};
  for (const k of cells) {
    const [id, day] = splitKey(k);
    // A deleted habit takes its days with it (their stamps too: the habit's stamp covers them).
    if (!alive.has(id)) continue;
    const r = pick(a.state.logs[id]?.[day], a.stamps.days[k] ?? 0, b.state.logs[id]?.[day], b.stamps.days[k] ?? 0, unionLog);
    if (r.stamp) stamps.days[k] = r.stamp;
    if (r.value && Object.keys(r.value).length) (logs[id] ??= {})[day] = r.value;
  }

  // Seen comebacks only move forward; the intro, once seen anywhere, is seen.
  const comebacksSeen: Record<string, DayKey> = {};
  for (const id of alive) {
    const x = a.state.comebacksSeen[id], y = b.state.comebacksSeen[id];
    const v = x === undefined ? y : y === undefined ? x : x >= y ? x : y;
    if (v !== undefined) comebacksSeen[id] = v;
  }

  return {
    state: { version: 1, habits, logs, comebacksSeen, introSeen: a.state.introSeen || b.state.introSeen },
    stamps,
  };
}

/** A document from the network or storage, made safe: unknown shapes become empty parts. */
export function readDoc(raw: unknown): SyncDoc {
  const r = (raw && typeof raw === "object" ? raw : {}) as { state?: unknown; stamps?: unknown };
  const st = (r.stamps && typeof r.stamps === "object" ? r.stamps : {}) as { habits?: unknown; days?: unknown };
  const nums = (m: unknown) => {
    const out: Record<string, number> = {};
    if (m && typeof m === "object") {
      for (const [k, v] of Object.entries(m)) if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    }
    return out;
  };
  return { state: migrate(r.state ?? null), stamps: { habits: nums(st.habits), days: nums(st.days) } };
}

/** True when the document holds nothing worth keeping (no habits, logs or stamps). */
export const isEmptyDoc = (d: SyncDoc) =>
  d.state.habits.length === 0 && Object.keys(d.state.logs).length === 0 &&
  Object.keys(d.stamps.habits).length === 0 && Object.keys(d.stamps.days).length === 0;
