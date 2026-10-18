import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Doc } from "@/lib/timeline";
import type { Track, TrackSummary } from "@/lib/tracks";

// My tracks live in Supabase (supabase/schema.sql; decision 0020). Only this server code holds
// the secret key. Without Supabase env vars in development, an in-memory store stands in so the
// app runs locally; in production that's an error instead. Pattern from Folio (decision 0015).

export type Store = {
  list(): Promise<TrackSummary[]>;
  get(id: string): Promise<Track | null>;
  /** Create or update a track by id. Returns it as stored. */
  save(id: string, name: string, doc: Doc): Promise<Track>;
  remove(id: string): Promise<void>;
};

type Row = { id: string; name: string; doc: Doc; updated_at: string };
const toTrack = (r: Row): Track => ({ id: r.id, name: r.name, doc: r.doc, updatedAt: r.updated_at });

/** A database error with a plain-language reason for the server logs. */
export class StoreError extends Error {}

type DbError = { message: string; code?: string };

function explain(error: DbError): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message)) {
    return "The database refused. SUPABASE_SECRET_KEY must be the secret key (sb_secret_… or service_role), not the publishable key.";
  }
  if (error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(error.message)) {
    return "The sixam_tracks table is missing. Run apps/07-six-am/supabase/schema.sql in the Supabase SQL Editor.";
  }
  if (/invalid api key|jwt|unauthorized/i.test(error.message)) {
    return "Supabase rejected the key. Check SUPABASE_SECRET_KEY (copied in full, no spaces).";
  }
  return `Database error: ${error.message}${error.code ? ` (${error.code})` : ""}`;
}

function supabaseStore(db: SupabaseClient): Store {
  const check = (error: DbError | null) => {
    if (error) throw new StoreError(explain(error));
  };
  return {
    async list() {
      const { data, error } = await db.from("sixam_tracks").select("id, name, updated_at").order("updated_at", { ascending: false });
      check(error);
      return (data as Omit<Row, "doc">[]).map((r) => ({ id: r.id, name: r.name, updatedAt: r.updated_at }));
    },
    async get(id) {
      const { data, error } = await db.from("sixam_tracks").select("id, name, doc, updated_at").eq("id", id).maybeSingle();
      check(error);
      return data ? toTrack(data as Row) : null;
    },
    async save(id, name, doc) {
      const { data, error } = await db
        .from("sixam_tracks")
        .upsert({ id, name, doc, updated_at: new Date().toISOString() })
        .select("id, name, doc, updated_at")
        .single();
      check(error);
      return toTrack(data as Row);
    },
    async remove(id) {
      const { error } = await db.from("sixam_tracks").delete().eq("id", id);
      check(error);
    },
  };
}

function memoryStore(): Store {
  const g = globalThis as unknown as { __sixamMem?: Map<string, Track> };
  const mem = (g.__sixamMem ??= new Map());
  return {
    async list() {
      return [...mem.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(({ id, name, updatedAt }) => ({ id, name, updatedAt }));
    },
    async get(id) {
      return mem.get(id) ?? null;
    },
    async save(id, name, doc) {
      const track = { id, name, doc, updatedAt: new Date().toISOString() };
      mem.set(id, track);
      return track;
    },
    async remove(id) {
      mem.delete(id);
    },
  };
}

/** What kind of Supabase key this is, without trusting the variable name. */
function keyKind(key: string): "secret" | "public" | "unknown" {
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.startsWith("sb_publishable_")) return "public";
  try {
    const role = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role;
    if (role === "service_role") return "secret";
    if (role === "anon" || role === "authenticated") return "public";
  } catch {}
  return "unknown";
}

export function getStore(): { store: Store } | { problem: string } {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (url && key) {
    if (keyKind(key) === "public") {
      return { problem: "SUPABASE_SECRET_KEY is the publishable key. Use the secret key (sb_secret_…) and redeploy." };
    }
    return { store: supabaseStore(createClient(url, key, { auth: { persistSession: false } })) };
  }
  if (process.env.NODE_ENV !== "production") return { store: memoryStore() };
  return { problem: "Database is not configured (SUPABASE_URL / SUPABASE_SECRET_KEY)." };
}
