import { findMovement } from "@/lib/movements";
import type { Entry, NewPb, Pb, PbKindStored, Unit } from "@/lib/types";

// Shared by the app (to flag NEW PB while reviewing) and the server (to record
// PBs on save), so both always agree on what counts as a PB.

const toKg = (value: number, unit: Unit | null) => (unit === "lb" ? value * 0.45359237 : value);

/** What people type on a number pad: "510" → 5:10, "1230" → 12:30, "5" → 5:00, "4:32" as is. */
export function parseTimeInput(s: string): number | null {
  const t = s.trim();
  if (/^\d{3,4}$/.test(t)) return Number(t.slice(0, -2)) * 60 + Number(t.slice(-2));
  if (/^\d{1,2}$/.test(t)) return Number(t) * 60;
  return parseTime(t.replace(/[.,]/g, ":"));
}

/** "4:32" → 272, "1:02:03" → 3723, "95" → 95. */
export function parseTime(s: string): number | null {
  const parts = s.trim().split(":").map(Number);
  if (!parts.length || parts.length > 3 || parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** "20+5" or "20 rounds + 5 reps" → 20005 (rounds * 1000 + reps). */
export function parseRounds(s: string): number | null {
  const nums = s.match(/\d+/g)?.map(Number);
  if (!nums?.length) return null;
  return nums[0] * 1000 + (nums[1] ?? 0);
}

export function formatPb(pb: Pick<Pb, "kind" | "value" | "unit">): string {
  switch (pb.kind) {
    case "load":
      return `${+pb.value.toFixed(2)} ${pb.unit ?? "kg"}`;
    case "reps":
      return `${pb.value} reps`;
    case "time": {
      const s = Math.round(pb.value);
      const h = Math.floor(s / 3600);
      const mm = Math.floor((s % 3600) / 60);
      const ss = String(s % 60).padStart(2, "0");
      return h ? `${h}:${String(mm).padStart(2, "0")}:${ss}` : `${mm}:${ss}`;
    }
    case "rounds": {
      const reps = pb.value % 1000;
      return `${Math.floor(pb.value / 1000)}${reps ? `+${reps}` : ""} rds`;
    }
  }
}

export const repLabel = (repMax: number | null) => (repMax ? `${repMax}RM` : "");

/** Groups records that compete with each other. Rx and scaled WOD times are separate. */
export const pbKey = (pb: Pick<Pb, "movement" | "kind" | "repMax" | "rx">) =>
  [pb.movement.toLowerCase(), pb.kind, pb.repMax ?? "", pb.kind === "time" || pb.kind === "rounds" ? String(pb.rx ?? false) : ""].join("|");

export function isBetter(a: Pick<Pb, "kind" | "value" | "unit">, b: Pick<Pb, "kind" | "value" | "unit">) {
  if (a.kind === "load") return toKg(a.value, a.unit) > toKg(b.value, b.unit) + 1e-9;
  if (a.kind === "time") return a.value < b.value;
  return a.value > b.value;
}

/** Best record per key. */
export function currentPbs(pbs: Pb[]): Map<string, Pb> {
  const best = new Map<string, Pb>();
  for (const pb of pbs) {
    const key = pbKey(pb);
    const cur = best.get(key);
    if (!cur || isBetter(pb, cur)) best.set(key, pb);
  }
  return best;
}

/** The PB a logged entry would set, if any. */
export function candidateFromEntry(e: Entry, date: string, sessionId: string | null): Pb | null {
  const mv = findMovement(e.movement);
  const base = { id: "", movement: mv.name, achievedOn: date, sessionId, repMax: null, unit: null, rx: null };
  const kind: PbKindStored | null = mv.pb === "none" ? null : mv.pb;
  switch (kind) {
    case "load":
      if (e.weight == null || e.weight <= 0 || !e.reps || e.reps < 1 || e.reps > 10) return null;
      // Only a single set counts: 5 × 3 @ 90 are working sets, not a 3RM.
      if (e.sets != null && e.sets > 1) return null;
      return { ...base, kind, repMax: e.reps, value: e.weight, unit: e.unit };
    case "reps":
      // Only a single max set counts: 5 × 10 pull-ups isn't a max-reps test.
      if (!e.reps || (e.sets != null && e.sets > 1)) return null;
      return { ...base, kind, value: e.reps };
    case "time": {
      const v = e.score ? parseTime(e.score) : null;
      return v ? { ...base, kind, value: v, rx: e.rx ?? false } : null;
    }
    case "rounds": {
      const v = e.score ? parseRounds(e.score) : null;
      return v ? { ...base, kind, value: v, rx: e.rx ?? false } : null;
    }
    default:
      return null;
  }
}

/**
 * Which entries set a PB. A first-ever record for a movement is stored (so it
 * shows on the board) but `previous` is null, so it isn't celebrated.
 */
export function detectPbs(entries: Entry[], existing: Pb[], date: string, sessionId: string | null): NewPb[] {
  const best = currentPbs(existing);
  const found = new Map<string, Pb>();
  for (const e of entries) {
    const cand = candidateFromEntry(e, date, sessionId);
    if (!cand) continue;
    const key = pbKey(cand);
    const sameSession = found.get(key);
    if (sameSession && !isBetter(cand, sameSession)) continue;
    const prev = best.get(key);
    if (!prev || isBetter(cand, prev)) found.set(key, cand);
  }
  return [...found.entries()].map(([key, pb]) => ({ pb, previous: best.get(key) ?? null }));
}

/** Percentage of a load, rounded to what you can put on a bar. */
export function percentOf(value: number, unit: Unit | null, pct: number) {
  const step = unit === "lb" ? 5 : 2.5;
  return Math.round((value * pct) / 100 / step) * step;
}
