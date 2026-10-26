import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { StickerState, Yum, YumFields } from "@/lib/yum";

// My yums live in the shared Supabase project (supabase/schema.sql; decisions 0021, 0029): one
// table and a private bucket for photos and stickers. Only this server code holds the secret key.
// Every call names a library ('owner' or the graders' 'sandbox'), so tests never touch my book.
// Without Supabase env vars in development, an in-memory store stands in.

export type Library = "owner" | "sandbox";
export type Image = { bytes: Uint8Array; type: string };

/** A drawing that hasn't finished after this long is treated as failed (and can be retried). */
export const DRAWING_TIMEOUT_MS = 2 * 60 * 1000;

export type Store = {
  list(lib: Library): Promise<Yum[]>;
  get(lib: Library, id: string): Promise<Yum | null>;
  /** Saves a new yum (and its photo) and gives it the next yum number. */
  create(lib: Library, id: string, fields: YumFields, photo: Image | null, drawing: boolean): Promise<Yum>;
  update(lib: Library, id: string, fields: YumFields): Promise<Yum | null>;
  /** Takes a yum off the shelf, or puts it back (Undo). */
  setRemoved(lib: Library, id: string, removed: boolean): Promise<Yum | null>;
  readPhoto(lib: Library, id: string): Promise<Image | null>;
  readSticker(lib: Library, id: string): Promise<Image | null>;
  setSticker(lib: Library, id: string, state: StickerState, image?: Image): Promise<void>;
};

export class StoreError extends Error {}

type DbError = { message: string; code?: string };

function explain(error: DbError): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message)) {
    return "The database refused. SUPABASE_SECRET_KEY must be the secret key (sb_secret_…), not the publishable key.";
  }
  if (error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(error.message)) {
    return "The magpie table is missing. Run apps/10-magpie/supabase/schema.sql in the Supabase SQL Editor.";
  }
  if (/bucket not found/i.test(error.message)) return "The magpie bucket is missing. Run apps/10-magpie/supabase/schema.sql.";
  if (/invalid api key|jwt|unauthorized/i.test(error.message)) return "Supabase rejected the key. Check SUPABASE_SECRET_KEY.";
  return `Database error: ${error.message}${error.code ? ` (${error.code})` : ""}`;
}

type Row = {
  id: string; number: number; name: string; kind: Yum["kind"]; sub_kind: string | null; place: string | null; city: string | null;
  country: string | null; hearts: number; note: string | null; photo_path: string | null; sticker_state: StickerState;
  sticker_started_at: string | null; saved_at: string; updated_at: string;
};
const COLS = "id, number, name, kind, sub_kind, place, city, country, hearts, note, photo_path, sticker_state, sticker_started_at, saved_at, updated_at";

/** A drawing that has been going too long has died with its server; show it as failed. */
const stateOf = (state: StickerState, startedAt: string | null): StickerState =>
  state === "drawing" && startedAt && Date.now() - Date.parse(startedAt) > DRAWING_TIMEOUT_MS ? "failed" : state;

const toYum = (r: Row): Yum => ({
  id: r.id, number: r.number, name: r.name, kind: r.kind, subKind: r.sub_kind, place: r.place, city: r.city, country: r.country,
  hearts: r.hearts, note: r.note, hasPhoto: !!r.photo_path, sticker: stateOf(r.sticker_state, r.sticker_started_at),
  savedAt: r.saved_at, updatedAt: r.updated_at,
});

const toRow = (f: YumFields) => ({ name: f.name, kind: f.kind, sub_kind: f.subKind, place: f.place, city: f.city, country: f.country, hearts: f.hearts, note: f.note });

const photoPath = (lib: Library, id: string) => `${lib}/photos/${id}.webp`;
const stickerPath = (lib: Library, id: string) => `${lib}/stickers/${id}.webp`;

function supabaseStore(db: SupabaseClient): Store {
  const check = (error: DbError | null) => { if (error) throw new StoreError(explain(error)); };
  const bucket = db.storage.from("magpie");
  const table = () => db.from("magpie_yums");
  const download = async (path: string): Promise<Image | null> => {
    const { data, error } = await bucket.download(path);
    if (error || !data) return null;
    return { bytes: new Uint8Array(await data.arrayBuffer()), type: data.type || "image/webp" };
  };
  return {
    async list(lib) {
      const { data, error } = await table().select(COLS).eq("library", lib).is("removed_at", null).order("saved_at", { ascending: false });
      check(error);
      return (data as Row[]).map(toYum);
    },
    async get(lib, id) {
      const { data, error } = await table().select(COLS).eq("library", lib).eq("id", id).is("removed_at", null).maybeSingle();
      check(error);
      return data ? toYum(data as Row) : null;
    },
    async create(lib, id, fields, photo, drawing) {
      if (photo) {
        const { error } = await bucket.upload(photoPath(lib, id), photo.bytes, { contentType: photo.type, upsert: true });
        check(error);
      }
      // The next number; a clash with a save at the same moment just tries the next one.
      for (let attempt = 0; ; attempt++) {
        const { data: top, error: e1 } = await table().select("number").eq("library", lib).order("number", { ascending: false }).limit(1).maybeSingle();
        check(e1);
        const now = new Date().toISOString();
        const { data, error } = await table().insert({
          id, library: lib, number: (top?.number ?? 0) + 1 + attempt, ...toRow(fields),
          photo_path: photo ? photoPath(lib, id) : null,
          sticker_state: drawing ? "drawing" : "none", sticker_started_at: drawing ? now : null,
        }).select(COLS).single();
        if (error?.code === "23505" && attempt < 5 && /number/.test(error.message)) continue;
        check(error);
        return toYum(data as Row);
      }
    },
    async update(lib, id, fields) {
      const { data, error } = await table().update({ ...toRow(fields), updated_at: new Date().toISOString() })
        .eq("library", lib).eq("id", id).is("removed_at", null).select(COLS).maybeSingle();
      check(error);
      return data ? toYum(data as Row) : null;
    },
    async setRemoved(lib, id, removed) {
      const { data, error } = await table().update({ removed_at: removed ? new Date().toISOString() : null })
        .eq("library", lib).eq("id", id).select(COLS).maybeSingle();
      check(error);
      return data ? toYum(data as Row) : null;
    },
    async readPhoto(lib, id) { return download(photoPath(lib, id)); },
    async readSticker(lib, id) { return download(stickerPath(lib, id)); },
    async setSticker(lib, id, state, image) {
      if (image) {
        const { error } = await bucket.upload(stickerPath(lib, id), image.bytes, { contentType: image.type, upsert: true });
        check(error);
      }
      const { error } = await table().update({
        sticker_state: state,
        ...(image ? { sticker_path: stickerPath(lib, id) } : {}),
        ...(state === "drawing" ? { sticker_started_at: new Date().toISOString() } : {}),
      }).eq("library", lib).eq("id", id);
      check(error);
    },
  };
}

function memoryStore(): Store {
  type Entry = { row: Row; lib: Library; removed: boolean; photo: Image | null; sticker: Image | null };
  const g = globalThis as unknown as { __magpieMem?: Map<string, Entry> };
  const mem = (g.__magpieMem ??= new Map());
  const find = (lib: Library, id: string) => { const e = mem.get(id); return e && e.lib === lib ? e : null; };
  return {
    async list(lib) { return [...mem.values()].filter((e) => e.lib === lib && !e.removed).map((e) => toYum(e.row)).sort((a, b) => b.savedAt.localeCompare(a.savedAt)); },
    async get(lib, id) { const e = find(lib, id); return e && !e.removed ? toYum(e.row) : null; },
    async create(lib, id, fields, photo, drawing) {
      const number = Math.max(0, ...[...mem.values()].filter((e) => e.lib === lib).map((e) => e.row.number)) + 1;
      const now = new Date().toISOString();
      const row: Row = { id, number, ...toRow(fields), photo_path: photo ? "mem" : null, sticker_state: drawing ? "drawing" : "none", sticker_started_at: drawing ? now : null, saved_at: now, updated_at: now };
      mem.set(id, { row, lib, removed: false, photo, sticker: null });
      return toYum(row);
    },
    async update(lib, id, fields) {
      const e = find(lib, id);
      if (!e || e.removed) return null;
      e.row = { ...e.row, ...toRow(fields), updated_at: new Date().toISOString() };
      return toYum(e.row);
    },
    async setRemoved(lib, id, removed) { const e = find(lib, id); if (!e) return null; e.removed = removed; return toYum(e.row); },
    async readPhoto(lib, id) { return find(lib, id)?.photo ?? null; },
    async readSticker(lib, id) { return find(lib, id)?.sticker ?? null; },
    async setSticker(lib, id, state, image) {
      const e = find(lib, id);
      if (!e) return;
      if (image) e.sticker = image;
      e.row = { ...e.row, sticker_state: state, ...(state === "drawing" ? { sticker_started_at: new Date().toISOString() } : {}) };
    },
  };
}

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
  if (process.env.MAGPIE_MEMORY_STORE === "1" && process.env.NODE_ENV !== "production") return { store: memoryStore() };
  if (url && key) {
    if (keyKind(key) === "public") return { problem: "SUPABASE_SECRET_KEY is the publishable key. Use the secret key (sb_secret_…)." };
    return { store: supabaseStore(createClient(url, key, { auth: { persistSession: false } })) };
  }
  if (process.env.NODE_ENV !== "production") return { store: memoryStore() };
  return { problem: "Database is not configured (SUPABASE_URL / SUPABASE_SECRET_KEY)." };
}
