import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Piece, PieceInput } from "@/lib/types";

// Pieces live in Supabase (see supabase/schema.sql). Only this server code holds the secret key.
// Without Supabase env vars in development, an in-memory store stands in so the app runs locally;
// in production that's an error instead. Pattern from CrossFit Log (decision 0005).

export type Store = {
  list(): Promise<Piece[]>;
  /** Create or update a piece. Returns it as stored. */
  save(id: string, input: PieceInput): Promise<Piece>;
};

type Row = {
  id: string;
  prompt: string;
  body: string;
  status: Piece["status"];
  feedback: Piece["feedback"];
  created_at: string;
  updated_at: string;
  finished_at: string | null;
};

const toPiece = (r: Row): Piece => ({
  id: r.id,
  prompt: r.prompt,
  body: r.body,
  status: r.status,
  feedback: r.feedback,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  finishedAt: r.finished_at,
});

/** A database error with a plain-language reason for the server logs. */
export class StoreError extends Error {}

type DbError = { message: string; code?: string };

function explain(error: DbError): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message)) {
    return "The database refused. SUPABASE_SECRET_KEY must be the secret key (sb_secret_… or service_role), not the publishable/anon key.";
  }
  if (error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(error.message)) {
    return "The scribble_pieces table is missing. Run apps/03-scribble/supabase/schema.sql in the Supabase SQL Editor.";
  }
  if (/invalid api key|jwt|unauthorized/i.test(error.message)) {
    return "Supabase rejected the key. Check SUPABASE_SECRET_KEY (copied in full, no spaces).";
  }
  return `Database error: ${error.message}${error.code ? ` (${error.code})` : ""}`;
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

function supabaseStore(db: SupabaseClient): Store {
  const check = (error: DbError | null) => {
    if (error) throw new StoreError(explain(error));
  };
  return {
    async list() {
      const { data, error } = await db.from("scribble_pieces").select("*").order("updated_at", { ascending: false });
      check(error);
      return (data as Row[]).map(toPiece);
    },
    async save(id, input) {
      const { data: existing, error: readError } = await db
        .from("scribble_pieces")
        .select("finished_at")
        .eq("id", id)
        .maybeSingle();
      check(readError);
      const now = new Date().toISOString();
      const finishedAt = existing?.finished_at ?? (input.status === "done" ? now : null);
      const { data, error } = await db
        .from("scribble_pieces")
        .upsert({ id, ...input, updated_at: now, finished_at: finishedAt })
        .select()
        .single();
      check(error);
      return toPiece(data as Row);
    },
  };
}

function memoryStore(): Store {
  const g = globalThis as unknown as { __scribbleMem?: Map<string, Piece> };
  const mem = (g.__scribbleMem ??= new Map());
  return {
    async list() {
      return [...mem.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async save(id, input) {
      const now = new Date().toISOString();
      const prev = mem.get(id);
      const piece: Piece = {
        id,
        ...input,
        createdAt: prev?.createdAt ?? now,
        updatedAt: now,
        finishedAt: prev?.finishedAt ?? (input.status === "done" ? now : null),
      };
      mem.set(id, piece);
      return piece;
    },
  };
}

export function getStore(): { store: Store } | { problem: string } {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (url && key) {
    if (keyKind(key) === "public") {
      return { problem: "SUPABASE_SECRET_KEY is the publishable/anon key. Use the secret key (sb_secret_… or service_role) and redeploy." };
    }
    return { store: supabaseStore(createClient(url, key, { auth: { persistSession: false } })) };
  }
  if (process.env.NODE_ENV !== "production") return { store: memoryStore() };
  return { problem: "Database is not configured (SUPABASE_URL / SUPABASE_SECRET_KEY)." };
}
