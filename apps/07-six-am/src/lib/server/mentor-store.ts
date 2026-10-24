import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EarsAnalysis } from "@/lib/ears/results";
import type { Sentence } from "@/lib/mentor/answer";
import type { StoredUsage } from "@/lib/mentor/cost";
import type { CostRow } from "@/lib/mentor/periods";
import { parseAnalysis } from "@/lib/mentor/context";
import { profileDiff } from "@/lib/mentor/profile-diff";
import { connect, explain, StoreError, type DbError } from "./store";

// The Mentor's data (decision 0027, L51): taste profile, chats, genre groups and Ears results, in
// Supabase (supabase/migrations/2026-10-24-mentor.sql). Without Supabase env in development an
// in-memory store stands in, so a fresh dev server is the clean-start "new user" (L57).

/** One profile change: when, the one-line note, who, what prompted it (a job or "Settings") and
 *  the sentences that went (was) and came (now). from / was / now are missing on older notes. */
export type ProfileNote = { at: string; note: string; by: "owner" | "mentor"; from?: string; was?: string; now?: string };
export type Profile = { text: string; updatedAt: string | null; history: ProfileNote[] };

export type MessageRow = {
  id: string;
  threadId: string;
  role: "user" | "assistant";
  job: string;
  content: string;
  sources: Sentence[] | null;
  usage: StoredUsage | null;
  costUsd: number;
  counted: boolean;
  createdAt: string;
};
export type NewMessage = Omit<MessageRow, "id" | "createdAt">;

export type GroupStatus = "proposed" | "accepted" | "dismissed";
export type Group = { id: string; name: string; reason: string; trackIds: string[]; status: GroupStatus; createdAt: string; updatedAt: string };
export type NewGroup = Pick<Group, "name" | "reason" | "trackIds" | "status">;

export type MentorStore = {
  /** Which store this is: demo rows may only ever go to "memory" (dev without Supabase). */
  kind: "memory" | "supabase";
  getProfile(): Promise<Profile>;
  saveProfile(text: string, note: ProfileNote): Promise<Profile>;
  thread(threadId: string, limit?: number): Promise<MessageRow[]>;
  addMessage(m: NewMessage): Promise<MessageRow>;
  /** Rows created at or after `since`, for the Today / Month sums. */
  costRows(since: Date): Promise<CostRow[]>;
  listGroups(): Promise<Group[]>;
  addGroups(groups: NewGroup[]): Promise<Group[]>;
  updateGroup(id: string, patch: Partial<Pick<Group, "name" | "status" | "trackIds" | "reason">>): Promise<Group | null>;
  deleteGroup(id: string): Promise<void>;
  listAnalyses(): Promise<EarsAnalysis[]>;
  getAnalysis(id: string): Promise<EarsAnalysis | null>;
  /** Create or replace one result; its myGenre (or none) is stored as given. */
  putAnalysis(a: EarsAnalysis): Promise<EarsAnalysis>;
  /** One-time migration from localStorage: adds missing results and fills a missing My genre;
   *  never overwrites what the server already has. */
  importAnalyses(list: EarsAnalysis[]): Promise<{ added: number; genresFilled: number; kept: number }>;
  /** Clear list in Ears: the results go from the server too, so a sync doesn't bring them back. */
  deleteAnalyses(ids: string[]): Promise<number>;
};

const MAX_HISTORY = 50;
const pushNote = (h: ProfileNote[], n: ProfileNote, before: string, after: string) =>
  [...h, { ...n, ...profileDiff(before, after) }].slice(-MAX_HISTORY);

// ── Supabase ────────────────────────────────────────────────────────────────────────────────────

type MsgDb = { id: string; thread_id: string; role: "user" | "assistant"; job: string; content: string; sources: Sentence[] | null; usage: StoredUsage | null; cost_usd: number | string; counted: boolean; created_at: string };
const toMsg = (r: MsgDb): MessageRow => ({
  id: r.id, threadId: r.thread_id, role: r.role, job: r.job, content: r.content, sources: r.sources, usage: r.usage,
  costUsd: Number(r.cost_usd) || 0, counted: r.counted, createdAt: r.created_at,
});
type GroupDb = { id: string; name: string; reason: string; track_ids: string[]; status: GroupStatus; created_at: string; updated_at: string };
const toGroup = (r: GroupDb): Group => ({ id: r.id, name: r.name, reason: r.reason, trackIds: r.track_ids ?? [], status: r.status, createdAt: r.created_at, updatedAt: r.updated_at });
type AnalysisDb = { id: string; data: unknown; my_genre: string | null };
const toAnalysis = (r: AnalysisDb): EarsAnalysis | null => {
  const a = parseAnalysis({ ...(r.data as object), myGenre: r.my_genre ?? undefined });
  if (!a) return null;
  if (!r.my_genre) delete a.myGenre;
  return a;
};
const analysisRow = (a: EarsAnalysis) => {
  const { myGenre, ...data } = a;
  return { id: a.id, track_id: a.trackId, data, my_genre: myGenre ?? null, analysed_at: a.analysedAt, updated_at: new Date().toISOString() };
};

function supabaseMentor(db: SupabaseClient): MentorStore {
  const check = (error: DbError | null, table: string) => {
    if (error) throw new StoreError(explain(error, table));
  };
  return {
    kind: "supabase",
    async getProfile() {
      const { data, error } = await db.from("sixam_taste_profile").select("text, history, updated_at").eq("id", 1).maybeSingle();
      check(error, "sixam_taste_profile");
      return data ? { text: data.text, history: data.history ?? [], updatedAt: data.updated_at } : { text: "", history: [], updatedAt: null };
    },
    async saveProfile(text, note) {
      const current = await this.getProfile();
      const row = { id: 1, text, history: pushNote(current.history, note, current.text, text), updated_at: new Date().toISOString() };
      const { data, error } = await db.from("sixam_taste_profile").upsert(row).select("text, history, updated_at").single();
      check(error, "sixam_taste_profile");
      if (!data) throw new StoreError("The taste profile wasn't saved.");
      return { text: data.text, history: data.history, updatedAt: data.updated_at };
    },
    async thread(threadId, limit = 100) {
      const { data, error } = await db
        .from("sixam_mentor_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: false })
        .limit(limit);
      check(error, "sixam_mentor_messages");
      return (data as MsgDb[]).map(toMsg).reverse();
    },
    async addMessage(m) {
      const { data, error } = await db
        .from("sixam_mentor_messages")
        .insert({ thread_id: m.threadId, role: m.role, job: m.job, content: m.content, sources: m.sources, usage: m.usage, cost_usd: m.costUsd, counted: m.counted })
        .select("*")
        .single();
      check(error, "sixam_mentor_messages");
      return toMsg(data as MsgDb);
    },
    async costRows(since) {
      const { data, error } = await db
        .from("sixam_mentor_messages")
        .select("created_at, cost_usd, counted, role")
        .gte("created_at", since.toISOString())
        .limit(20000);
      check(error, "sixam_mentor_messages");
      return (data as Pick<MsgDb, "created_at" | "cost_usd" | "counted" | "role">[]).map((r) => ({
        createdAt: r.created_at, costUsd: Number(r.cost_usd) || 0, counted: r.counted, role: r.role,
      }));
    },
    async listGroups() {
      const { data, error } = await db.from("sixam_genre_groups").select("*").order("updated_at", { ascending: false });
      check(error, "sixam_genre_groups");
      return (data as GroupDb[]).map(toGroup);
    },
    async addGroups(groups) {
      if (!groups.length) return [];
      const { data, error } = await db
        .from("sixam_genre_groups")
        .insert(groups.map((g) => ({ name: g.name, reason: g.reason, track_ids: g.trackIds, status: g.status })))
        .select("*");
      check(error, "sixam_genre_groups");
      return (data as GroupDb[]).map(toGroup);
    },
    async updateGroup(id, patch) {
      const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.reason !== undefined) row.reason = patch.reason;
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.trackIds !== undefined) row.track_ids = patch.trackIds;
      const { data, error } = await db.from("sixam_genre_groups").update(row).eq("id", id).select("*").maybeSingle();
      check(error, "sixam_genre_groups");
      return data ? toGroup(data as GroupDb) : null;
    },
    async deleteGroup(id) {
      const { error } = await db.from("sixam_genre_groups").delete().eq("id", id);
      check(error, "sixam_genre_groups");
    },
    async listAnalyses() {
      const { data, error } = await db.from("sixam_analyses").select("id, data, my_genre").order("analysed_at", { ascending: false }).limit(5000);
      check(error, "sixam_analyses");
      return (data as AnalysisDb[]).map(toAnalysis).filter((a): a is EarsAnalysis => a !== null);
    },
    async getAnalysis(id) {
      const { data, error } = await db.from("sixam_analyses").select("id, data, my_genre").eq("id", id).maybeSingle();
      check(error, "sixam_analyses");
      return data ? toAnalysis(data as AnalysisDb) : null;
    },
    async putAnalysis(a) {
      const { error } = await db.from("sixam_analyses").upsert(analysisRow(a));
      check(error, "sixam_analyses");
      return a;
    },
    async importAnalyses(list) {
      const { data, error } = await db.from("sixam_analyses").select("id, my_genre").limit(5000);
      check(error, "sixam_analyses");
      const have = new Map((data as { id: string; my_genre: string | null }[]).map((r) => [r.id, r.my_genre]));
      const fresh = list.filter((a) => !have.has(a.id));
      const fill = list.filter((a) => have.has(a.id) && !have.get(a.id) && a.myGenre);
      if (fresh.length) {
        const { error: e } = await db.from("sixam_analyses").upsert(fresh.map(analysisRow));
        check(e, "sixam_analyses");
      }
      for (const a of fill) {
        const { error: e } = await db.from("sixam_analyses").update({ my_genre: a.myGenre, updated_at: new Date().toISOString() }).eq("id", a.id);
        check(e, "sixam_analyses");
      }
      return { added: fresh.length, genresFilled: fill.length, kept: list.length - fresh.length - fill.length };
    },
    async deleteAnalyses(ids) {
      if (!ids.length) return 0;
      const { error, count } = await db.from("sixam_analyses").delete({ count: "exact" }).in("id", ids);
      check(error, "sixam_analyses");
      return count ?? ids.length;
    },
  };
}

// ── Memory (development without Supabase) ──────────────────────────────────────────────────────

type Mem = { profile: Profile; messages: MessageRow[]; groups: Map<string, Group>; analyses: Map<string, EarsAnalysis> };

function memoryMentor(): MentorStore {
  const g = globalThis as unknown as { __sixamMentorMem?: Mem };
  const mem = (g.__sixamMentorMem ??= { profile: { text: "", updatedAt: null, history: [] }, messages: [], groups: new Map(), analyses: new Map() } as Mem);
  const now = () => new Date().toISOString();
  return {
    kind: "memory",
    async getProfile() {
      return structuredClone(mem.profile);
    },
    async saveProfile(text, note) {
      mem.profile = { text, updatedAt: now(), history: pushNote(mem.profile.history, note, mem.profile.text, text) };
      return structuredClone(mem.profile);
    },
    async thread(threadId, limit = 100) {
      return mem.messages.filter((m) => m.threadId === threadId).slice(-limit);
    },
    async addMessage(m) {
      const row = { ...m, id: crypto.randomUUID(), createdAt: now() };
      mem.messages.push(row);
      return row;
    },
    async costRows(since) {
      return mem.messages
        .filter((m) => Date.parse(m.createdAt) >= since.getTime())
        .map((m) => ({ createdAt: m.createdAt, costUsd: m.costUsd, counted: m.counted, role: m.role }));
    },
    async listGroups() {
      return [...mem.groups.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async addGroups(groups) {
      return groups.map((x) => {
        const row = { ...x, id: crypto.randomUUID(), createdAt: now(), updatedAt: now() };
        mem.groups.set(row.id, row);
        return row;
      });
    },
    async updateGroup(id, patch) {
      const cur = mem.groups.get(id);
      if (!cur) return null;
      const next = { ...cur, ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)), updatedAt: now() };
      mem.groups.set(id, next);
      return next;
    },
    async deleteGroup(id) {
      mem.groups.delete(id);
    },
    async listAnalyses() {
      return [...mem.analyses.values()].sort((a, b) => b.analysedAt.localeCompare(a.analysedAt));
    },
    async getAnalysis(id) {
      return mem.analyses.get(id) ?? null;
    },
    async putAnalysis(a) {
      mem.analyses.set(a.id, a);
      return a;
    },
    async importAnalyses(list) {
      let added = 0, genresFilled = 0;
      for (const a of list) {
        const cur = mem.analyses.get(a.id);
        if (!cur) {
          mem.analyses.set(a.id, a);
          added += 1;
        } else if (!cur.myGenre && a.myGenre) {
          mem.analyses.set(a.id, { ...cur, myGenre: a.myGenre });
          genresFilled += 1;
        }
      }
      return { added, genresFilled, kept: list.length - added - genresFilled };
    },
    async deleteAnalyses(ids) {
      let n = 0;
      for (const id of ids) if (mem.analyses.delete(id)) n += 1;
      return n;
    },
  };
}

export function getMentorStore(): { store: MentorStore } | { problem: string } {
  const c = connect();
  if ("problem" in c) return c;
  return { store: "db" in c ? supabaseMentor(c.db) : memoryMentor() };
}
