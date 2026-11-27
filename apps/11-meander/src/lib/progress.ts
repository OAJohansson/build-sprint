// Your thread as progress (#37): each school is not started, started (its card opened or stepped inside) or
// explored (every one of its ideas opened). Stored per school with when it was last touched, so the panel can
// list the most recent first.
// shortcut: "explored" is the top state because no school has articles yet; add "done" (read all its articles) once articles exist.
import type { Visit } from "./visits";

export type ProgressEntry = {
  /** ISO timestamp of the last time the school was opened or one of its ideas was. */
  at: string;
  /** Names of the ideas (themes) opened, in the order first opened. Names, not indexes, so a reordered theme keeps its mark. */
  ideas: string[];
};
export type Progress = Record<string, ProgressEntry>;
export type SchoolState = "new" | "started" | "explored";

/** The school was opened (card, stepping inside, or one of its thinkers): started, and now the most recent. */
export function touchSchool(p: Progress, id: string, now: Date = new Date()): Progress {
  return { ...p, [id]: { at: now.toISOString(), ideas: p[id]?.ideas ?? [] } };
}

/** One of the school's ideas was opened (picked in the skeleton, expanded on the phone or in the card). */
export function seeIdea(p: Progress, id: string, idea: string, now: Date = new Date()): Progress {
  const ideas = p[id]?.ideas ?? [];
  return { ...p, [id]: { at: now.toISOString(), ideas: ideas.includes(idea) ? ideas : [...ideas, idea] } };
}

/** Migration and safety net: every school in the old visit history counts as started (at its last visit). */
export function withHistory(p: Progress, visits: Visit[]): Progress {
  const out: Progress = { ...p };
  for (const v of visits) {
    if (v.kind !== "school") continue;
    const e = out[v.id];
    if (!e) out[v.id] = { at: v.at, ideas: [] };
    else if (v.at > e.at) out[v.id] = { ...e, at: v.at };
  }
  return out;
}

/** How many of the school's current ideas were opened (ideas renamed or removed since don't count). */
export const ideasSeen = (e: ProgressEntry | undefined, ideaNames: string[]) =>
  e ? ideaNames.filter((n) => e.ideas.includes(n)).length : 0;

export function stateOf(e: ProgressEntry | undefined, ideaNames: string[]): SchoolState {
  if (!e) return "new";
  return ideaNames.length > 0 && ideasSeen(e, ideaNames) === ideaNames.length ? "explored" : "started";
}

export type ThreadRow = { id: string; state: Exclude<SchoolState, "new">; seen: number; total: number; at: string };
export type ThreadProgress = { explored: number; started: number; toGo: number; rows: ThreadRow[] };

/** The panel: counts over the given schools, and the started or explored ones, most recent first. */
export function threadProgress(p: Progress, schools: { id: string; ideas: string[] }[]): ThreadProgress {
  const rows: ThreadRow[] = [];
  for (const s of schools) {
    const e = p[s.id];
    const state = stateOf(e, s.ideas);
    if (state === "new" || !e) continue;
    rows.push({ id: s.id, state, seen: ideasSeen(e, s.ideas), total: s.ideas.length, at: e.at });
  }
  rows.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  const explored = rows.filter((r) => r.state === "explored").length;
  return { explored, started: rows.length - explored, toGo: schools.length - rows.length, rows };
}

/** "3 explored · 5 started · 15 to go"; parts that are zero are left out, and a field with nothing begun says so. */
export function progressLine(t: Pick<ThreadProgress, "explored" | "started" | "toGo">): string {
  const total = t.explored + t.started + t.toGo;
  if (total > 0 && t.explored === total) return `All ${total} explored`;
  if (t.explored + t.started === 0) return `${t.toGo} to go`;
  return [t.explored && `${t.explored} explored`, t.started && `${t.started} started`, t.toGo && `${t.toGo} to go`].filter(Boolean).join(" · ");
}
