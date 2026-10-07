import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Entry, Pb, Session } from "@/lib/types";

// Data lives in Supabase (see supabase/schema.sql). Only this server code holds
// the secret key. Without Supabase env vars in development, an in-memory store
// stands in so the app runs locally; in production that's an error instead.

export type Store = {
  load(): Promise<{ sessions: Session[]; pbs: Pb[] }>;
  addSession(session: Session, pbs: Pb[]): Promise<void>;
  deleteSession(id: string): Promise<void>;
  addPb(pb: Pb): Promise<void>;
  deletePb(id: string): Promise<void>;
};

type SessionRow = { id: string; date: string; title: string; transcript: string; created_at: string };
type EntryRow = {
  id: string; session_id: string; position: number; movement: string; sets: number | null; reps: number | null;
  weight: number | string | null; unit: "kg" | "lb"; score: string | null; rx: boolean | null; note: string | null;
};
type PbRow = {
  id: string; movement: string; kind: Pb["kind"]; rep_max: number | null; value: number | string;
  unit: "kg" | "lb" | null; rx: boolean | null; achieved_on: string; session_id: string | null;
};

const num = (v: number | string | null) => (v == null ? null : Number(v));

/** A database error with a plain-language reason the app can show. */
export class StoreError extends Error {}

type DbError = { message: string; code?: string };

function explain(error: DbError): string {
  // 42501: permission denied / row-level security. Happens with the public key.
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message)) {
    return "The database refused to save. SUPABASE_SECRET_KEY in Vercel must be the secret key (sb_secret_… or service_role), not the publishable/anon key.";
  }
  // Table missing: the schema wasn't run.
  if (error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(error.message)) {
    return "The database tables are missing. Run apps/01-crossfit/supabase/schema.sql in the Supabase SQL Editor.";
  }
  if (/invalid api key|jwt|unauthorized/i.test(error.message)) {
    return "Supabase rejected the key. Check SUPABASE_SECRET_KEY in Vercel (copied in full, no spaces).";
  }
  return `Database error: ${error.message}${error.code ? ` (${error.code})` : ""}`;
}

/** What kind of Supabase key this is, without trusting the variable name. */
export function keyKind(key: string): "secret" | "public" | "unknown" {
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.startsWith("sb_publishable_")) return "public";
  try {
    const role = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role;
    if (role === "service_role") return "secret";
    if (role === "anon" || role === "authenticated") return "public";
  } catch {}
  return "unknown";
}

function supabaseStore(db: SupabaseClient): Store {
  const check = (error: DbError | null) => {
    if (error) {
      console.error("Supabase error", error);
      throw new StoreError(explain(error));
    }
  };
  return {
    async load() {
      const [s, e, p] = await Promise.all([
        db.from("crossfit_sessions").select("*"),
        db.from("crossfit_entries").select("*").order("position"),
        db.from("crossfit_pbs").select("*"),
      ]);
      check(s.error);
      check(e.error);
      check(p.error);
      const entries = new Map<string, Entry[]>();
      for (const r of (e.data ?? []) as EntryRow[]) {
        const list = entries.get(r.session_id) ?? [];
        list.push({ id: r.id, movement: r.movement, sets: r.sets, reps: r.reps, weight: num(r.weight), unit: r.unit, score: r.score, rx: r.rx, note: r.note });
        entries.set(r.session_id, list);
      }
      return {
        sessions: ((s.data ?? []) as SessionRow[]).map((r) => ({
          id: r.id, date: r.date, title: r.title, transcript: r.transcript, createdAt: r.created_at, entries: entries.get(r.id) ?? [],
        })),
        pbs: ((p.data ?? []) as PbRow[]).map((r) => ({
          id: r.id, movement: r.movement, kind: r.kind, repMax: r.rep_max, value: Number(r.value), unit: r.unit,
          rx: r.rx, achievedOn: r.achieved_on, sessionId: r.session_id,
        })),
      };
    },
    async addSession(session, pbs) {
      check((await db.from("crossfit_sessions").insert({
        id: session.id, date: session.date, title: session.title, transcript: session.transcript,
      })).error);
      if (session.entries.length) {
        const { error } = await db.from("crossfit_entries").insert(
          session.entries.map((e, i) => ({
            id: e.id, session_id: session.id, position: i, movement: e.movement, sets: e.sets, reps: e.reps,
            weight: e.weight, unit: e.unit, score: e.score, rx: e.rx, note: e.note,
          })),
        );
        if (error) {
          await db.from("crossfit_sessions").delete().eq("id", session.id);
          check(error);
        }
      }
      for (const pb of pbs) await this.addPb(pb);
    },
    async deleteSession(id) {
      check((await db.from("crossfit_sessions").delete().eq("id", id)).error);
    },
    async addPb(pb) {
      check((await db.from("crossfit_pbs").insert({
        id: pb.id, movement: pb.movement, kind: pb.kind, rep_max: pb.repMax, value: pb.value, unit: pb.unit,
        rx: pb.rx, achieved_on: pb.achievedOn, session_id: pb.sessionId,
      })).error);
    },
    async deletePb(id) {
      check((await db.from("crossfit_pbs").delete().eq("id", id)).error);
    },
  };
}

function memoryStore(): Store {
  const g = globalThis as unknown as { __cfMem?: { sessions: Session[]; pbs: Pb[] } };
  const mem = (g.__cfMem ??= { sessions: [], pbs: [] });
  return {
    async load() {
      return structuredClone(mem);
    },
    async addSession(session, pbs) {
      mem.sessions.push(structuredClone(session));
      mem.pbs.push(...structuredClone(pbs));
    },
    async deleteSession(id) {
      mem.sessions = mem.sessions.filter((s) => s.id !== id);
      mem.pbs = mem.pbs.filter((p) => p.sessionId !== id);
    },
    async addPb(pb) {
      mem.pbs.push(structuredClone(pb));
    },
    async deletePb(id) {
      mem.pbs = mem.pbs.filter((p) => p.id !== id);
    },
  };
}

export function getStore(): { store: Store } | { problem: string } {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (url && key) {
    if (keyKind(key) === "public") {
      return { problem: "SUPABASE_SECRET_KEY in Vercel is the publishable/anon key. Use the secret key (sb_secret_… or service_role) and redeploy." };
    }
    return { store: supabaseStore(createClient(url, key, { auth: { persistSession: false } })) };
  }
  if (process.env.NODE_ENV !== "production") return { store: memoryStore() };
  return { problem: "Database is not configured (SUPABASE_URL / SUPABASE_SECRET_KEY)." };
}
