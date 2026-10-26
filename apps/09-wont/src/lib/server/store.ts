import "server-only";
import { createClient } from "@supabase/supabase-js";

// The synced document lives in the shared Supabase project, one row per space in `wont_docs`
// (supabase/schema.sql; L29). Only this server code holds the secret key. Without Supabase env
// vars in development, an in-memory store stands in so the app runs locally; in production
// that's an error instead. Pattern from Selvedge.

export type Space = "owner" | "sandbox";
export type Row = { doc: unknown; rev: number };

export type Store = {
  read(space: Space): Promise<Row | null>;
  /** Saves `doc` if the stored revision is still `rev` (null: no row yet). False if it moved on. */
  write(space: Space, doc: unknown, rev: number | null): Promise<boolean>;
};

type DbError = { message: string; code?: string };

function explain(error: DbError): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message)) {
    return "The database refused. SUPABASE_SECRET_KEY must be the secret key (sb_secret_… or service_role), not the publishable key.";
  }
  if (error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(error.message)) {
    return "The wont_docs table is missing. Run apps/09-wont/supabase/schema.sql in the Supabase SQL Editor.";
  }
  if (/invalid api key|jwt|unauthorized/i.test(error.message)) {
    return "Supabase rejected the key. Check SUPABASE_SECRET_KEY (copied in full, no spaces).";
  }
  return `Database error: ${error.message}${error.code ? ` (${error.code})` : ""}`;
}

function supabaseStore(url: string, key: string): Store {
  const db = createClient(url, key, { auth: { persistSession: false } });
  return {
    async read(space) {
      const { data, error } = await db.from("wont_docs").select("doc, rev").eq("space", space).maybeSingle();
      if (error) throw new Error(explain(error));
      return data as Row | null;
    },
    async write(space, doc, rev) {
      const updated_at = new Date().toISOString();
      if (rev === null) {
        const { error } = await db.from("wont_docs").insert({ space, doc, rev: 1, updated_at });
        if (error?.code === "23505") return false; // another device created it first
        if (error) throw new Error(explain(error));
        return true;
      }
      const { data, error } = await db
        .from("wont_docs")
        .update({ doc, rev: rev + 1, updated_at })
        .eq("space", space)
        .eq("rev", rev)
        .select("rev");
      if (error) throw new Error(explain(error));
      return (data?.length ?? 0) > 0;
    },
  };
}

// shortcut: dev-only memory store, lost on restart; fine for local runs without keys.
const memory = new Map<Space, Row>();
const memoryStore: Store = {
  async read(space) {
    return memory.get(space) ?? null;
  },
  async write(space, doc, rev) {
    const row = memory.get(space);
    if ((row?.rev ?? null) !== rev) return false;
    memory.set(space, { doc, rev: (rev ?? 0) + 1 });
    return true;
  },
};

export function getStore(): { store: Store } | { problem: string } {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (url && key && process.env.WONT_MEMORY_STORE !== "1") return { store: supabaseStore(url, key) };
  if (process.env.NODE_ENV === "production") return { problem: "SUPABASE_URL or SUPABASE_SECRET_KEY is not set on the server." };
  return { store: memoryStore };
}
