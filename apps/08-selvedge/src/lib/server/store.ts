import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Board, BoardDoc, BoardSummary, Folder, Save, Source } from "@/lib/library";

// My saves and boards live in the shared Supabase project (supabase/schema.sql; decision 0021):
// two tables and a private picture bucket. Only this server code holds the secret key. Without
// Supabase env vars in development, an in-memory store stands in so the app runs locally; in
// production that's an error instead. Pattern from Six AM (decision 0020).

export type NewSave = { id: string; image: { bytes: Uint8Array; type: string } | null; aspect: number | null; link: string | null; source: Source; title: string | null };

export type Store = {
  listSaves(): Promise<Save[]>;
  addSave(save: NewSave): Promise<Save>;
  removeSave(id: string): Promise<void>;
  /** The picture of a save, or null. */
  readImage(id: string): Promise<{ bytes: Uint8Array; type: string } | null>;
  /** A save's cut-out (its picture with the background removed, made in the browser), or null. */
  readCutout(id: string): Promise<{ bytes: Uint8Array; type: string } | null>;
  writeCutout(id: string, image: { bytes: Uint8Array; type: string }): Promise<void>;
  removeCutout(id: string): Promise<void>;
  /** Move saves into a folder, or back to their day pages with null. */
  moveSaves(ids: string[], folderId: string | null): Promise<void>;
  listFolders(): Promise<Folder[]>;
  /** Create or update a folder by id (its name and colour notes). */
  saveFolder(id: string, name: string, colourNotes: boolean): Promise<Folder>;
  /** Delete a folder; its saves go back to their day pages. */
  removeFolder(id: string): Promise<void>;
  listBoards(): Promise<BoardSummary[]>;
  getBoard(id: string): Promise<Board | null>;
  /** Create or update a board by id. Returns it as stored. */
  saveBoard(id: string, name: string, doc: BoardDoc): Promise<Board>;
  removeBoard(id: string): Promise<void>;
};

/** A database error with a plain-language reason for the server logs. */
export class StoreError extends Error {}

type DbError = { message: string; code?: string; statusCode?: string };

function explain(error: DbError): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message)) {
    return "The database refused. SUPABASE_SECRET_KEY must be the secret key (sb_secret_… or service_role), not the publishable key.";
  }
  if (error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(error.message)) {
    return "The selvedge tables are missing or out of date. Run apps/08-selvedge/supabase/schema.sql in the Supabase SQL Editor.";
  }
  if (/bucket not found/i.test(error.message)) {
    return "The selvedge bucket is missing. Run apps/08-selvedge/supabase/schema.sql in the Supabase SQL Editor.";
  }
  if (/invalid api key|jwt|unauthorized/i.test(error.message)) {
    return "Supabase rejected the key. Check SUPABASE_SECRET_KEY (copied in full, no spaces).";
  }
  return `Database error: ${error.message}${error.code ? ` (${error.code})` : ""}`;
}

type SaveRow = { id: string; image_path: string | null; aspect: number | null; link: string | null; source: Source; title: string | null; created_at: string; folder_id: string | null };
const toSave = (r: SaveRow): Save => ({ id: r.id, hasImage: !!r.image_path, aspect: r.aspect, link: r.link, source: r.source, title: r.title, createdAt: r.created_at, folderId: r.folder_id });
type FolderRow = { id: string; name: string; colour_notes: boolean; created_at: string };
const toFolder = (r: FolderRow): Folder => ({ id: r.id, name: r.name, colourNotes: r.colour_notes, createdAt: r.created_at });
type BoardRow = { id: string; name: string; doc: BoardDoc; updated_at: string };
const toBoard = (r: BoardRow): Board => ({ id: r.id, name: r.name, doc: r.doc, updatedAt: r.updated_at });

const EXT: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

function supabaseStore(db: SupabaseClient): Store {
  const check = (error: DbError | null) => { if (error) throw new StoreError(explain(error)); };
  const bucket = db.storage.from("selvedge");
  const SAVE_COLS = "id, image_path, aspect, link, source, title, created_at, folder_id";
  const FOLDER_COLS = "id, name, colour_notes, created_at";
  return {
    async listSaves() {
      const { data, error } = await db.from("selvedge_saves").select(SAVE_COLS).order("created_at", { ascending: false });
      check(error);
      return (data as SaveRow[]).map(toSave);
    },
    async addSave(s) {
      let image_path: string | null = null;
      if (s.image) {
        image_path = `saves/${s.id}.${EXT[s.image.type] ?? "img"}`;
        const { error } = await bucket.upload(image_path, s.image.bytes, { contentType: s.image.type, upsert: true });
        check(error);
      }
      const { data, error } = await db.from("selvedge_saves")
        .upsert({ id: s.id, image_path, aspect: s.aspect, link: s.link, source: s.source, title: s.title })
        .select(SAVE_COLS).single();
      check(error);
      return toSave(data as SaveRow);
    },
    async removeSave(id) {
      const { data } = await db.from("selvedge_saves").select("image_path").eq("id", id).maybeSingle();
      const { error } = await db.from("selvedge_saves").delete().eq("id", id);
      check(error);
      await bucket.remove([...(data?.image_path ? [data.image_path] : []), `cutouts/${id}.webp`]);
    },
    async readImage(id) {
      const { data: row, error } = await db.from("selvedge_saves").select("image_path").eq("id", id).maybeSingle();
      check(error);
      if (!row?.image_path) return null;
      const { data, error: e2 } = await bucket.download(row.image_path);
      check(e2);
      return data ? { bytes: new Uint8Array(await data.arrayBuffer()), type: data.type || "image/webp" } : null;
    },
    async readCutout(id) {
      const { data, error } = await bucket.download(`cutouts/${id}.webp`);
      if (error) return null; // none made yet
      return { bytes: new Uint8Array(await data.arrayBuffer()), type: "image/webp" };
    },
    async writeCutout(id, image) {
      const { error } = await bucket.upload(`cutouts/${id}.webp`, image.bytes, { contentType: image.type, upsert: true });
      check(error);
    },
    async removeCutout(id) {
      const { error } = await bucket.remove([`cutouts/${id}.webp`]);
      check(error);
    },
    async moveSaves(ids, folderId) {
      const { error } = await db.from("selvedge_saves").update({ folder_id: folderId }).in("id", ids);
      check(error);
    },
    async listFolders() {
      const { data, error } = await db.from("selvedge_folders").select(FOLDER_COLS).order("created_at", { ascending: true });
      check(error);
      return (data as FolderRow[]).map(toFolder);
    },
    async saveFolder(id, name, colourNotes) {
      const { data, error } = await db.from("selvedge_folders").upsert({ id, name, colour_notes: colourNotes }).select(FOLDER_COLS).single();
      check(error);
      return toFolder(data as FolderRow);
    },
    async removeFolder(id) {
      const { error } = await db.from("selvedge_folders").delete().eq("id", id); // saves fall back to null
      check(error);
    },
    async listBoards() {
      const { data, error } = await db.from("selvedge_boards").select("id, name, updated_at").order("updated_at", { ascending: false });
      check(error);
      return (data as Omit<BoardRow, "doc">[]).map((r) => ({ id: r.id, name: r.name, updatedAt: r.updated_at }));
    },
    async getBoard(id) {
      const { data, error } = await db.from("selvedge_boards").select("id, name, doc, updated_at").eq("id", id).maybeSingle();
      check(error);
      return data ? toBoard(data as BoardRow) : null;
    },
    async saveBoard(id, name, doc) {
      const { data, error } = await db.from("selvedge_boards")
        .upsert({ id, name, doc, updated_at: new Date().toISOString() })
        .select("id, name, doc, updated_at").single();
      check(error);
      return toBoard(data as BoardRow);
    },
    async removeBoard(id) {
      const { error } = await db.from("selvedge_boards").delete().eq("id", id);
      check(error);
    },
  };
}

function memoryStore(): Store {
  type Img = { bytes: Uint8Array; type: string };
  type Mem = { saves: Map<string, Save>; images: Map<string, Img>; cutouts?: Map<string, Img>; folders?: Map<string, Folder>; boards: Map<string, Board> };
  const g = globalThis as unknown as { __selvedgeMem?: Mem };
  const mem: Mem = (g.__selvedgeMem ??= { saves: new Map(), images: new Map(), boards: new Map() });
  const cutouts = (mem.cutouts ??= new Map<string, Img>());
  const folders = (mem.folders ??= new Map<string, Folder>());
  return {
    async listSaves() { return [...mem.saves.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
    async addSave(s) {
      if (s.image) mem.images.set(s.id, s.image);
      const save: Save = { id: s.id, hasImage: !!s.image, aspect: s.aspect, link: s.link, source: s.source, title: s.title, createdAt: new Date().toISOString(), folderId: mem.saves.get(s.id)?.folderId ?? null };
      mem.saves.set(s.id, save);
      return save;
    },
    async removeSave(id) { mem.saves.delete(id); mem.images.delete(id); cutouts.delete(id); },
    async readImage(id) { return mem.images.get(id) ?? null; },
    async readCutout(id) { return cutouts.get(id) ?? null; },
    async writeCutout(id, image) { cutouts.set(id, image); },
    async removeCutout(id) { cutouts.delete(id); },
    async moveSaves(ids, folderId) {
      if (folderId && !folders.has(folderId)) throw new StoreError("That folder doesn't exist.");
      for (const id of ids) { const s = mem.saves.get(id); if (s) mem.saves.set(id, { ...s, folderId }); }
    },
    async listFolders() { return [...folders.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)); },
    async saveFolder(id, name, colourNotes) {
      const folder = { id, name, colourNotes, createdAt: folders.get(id)?.createdAt ?? new Date().toISOString() };
      folders.set(id, folder);
      return folder;
    },
    async removeFolder(id) {
      folders.delete(id);
      for (const s of mem.saves.values()) if (s.folderId === id) mem.saves.set(s.id, { ...s, folderId: null });
    },
    async listBoards() {
      return [...mem.boards.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(({ id, name, updatedAt }) => ({ id, name, updatedAt }));
    },
    async getBoard(id) { return mem.boards.get(id) ?? null; },
    async saveBoard(id, name, doc) {
      const board = { id, name, doc, updatedAt: new Date().toISOString() };
      mem.boards.set(id, board);
      return board;
    },
    async removeBoard(id) { mem.boards.delete(id); },
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
  if (process.env.SELVEDGE_MEMORY_STORE === "1" && process.env.NODE_ENV !== "production") return { store: memoryStore() };
  if (url && key) {
    if (keyKind(key) === "public") {
      return { problem: "SUPABASE_SECRET_KEY is the publishable key. Use the secret key (sb_secret_…) and redeploy." };
    }
    return { store: supabaseStore(createClient(url, key, { auth: { persistSession: false } })) };
  }
  if (process.env.NODE_ENV !== "production") return { store: memoryStore() };
  return { problem: "Database is not configured (SUPABASE_URL / SUPABASE_SECRET_KEY)." };
}
