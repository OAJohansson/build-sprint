import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LibrarySound, NewSound, SoundPatch } from "@/lib/make/library";
import type { Macros, MakePresetId } from "@/lib/make/presets";
import { connect, explain, StoreError, type DbError } from "./store";

// The sound library (Lab S4, L158): the owner's own sounds, settings and numbers only (never
// audio). Supabase table sixam_sounds (supabase/migrations/2026-10-26-library.sql); without
// Supabase env in development an in-memory store stands in (the graders' sandbox).

export type SoundFilter = { sourceUrl?: string; part?: string; tag?: string };

export type LibraryStore = {
  kind: "memory" | "supabase";
  list(f?: SoundFilter, limit?: number): Promise<LibrarySound[]>;
  get(id: string): Promise<LibrarySound | null>;
  add(s: NewSound): Promise<LibrarySound>;
  update(id: string, patch: SoundPatch): Promise<LibrarySound | null>;
};

const TABLE = "sixam_sounds";
type Row = {
  id: string; name: string; part: LibrarySound["part"]; preset: MakePresetId; macros: Macros; pattern: LibrarySound["pattern"];
  key: string; scale: LibrarySound["scale"]; bpm: number | string; source_url: string | null; source_title: string | null;
  tags: string[] | null; created_at: string; updated_at: string;
};
const toSound = (r: Row): LibrarySound => ({
  id: r.id, name: r.name, part: r.part, preset: r.preset, macros: r.macros, pattern: r.pattern, key: r.key, scale: r.scale,
  bpm: Number(r.bpm), source: r.source_url ? { url: r.source_url, title: r.source_title ?? "" } : null, tags: r.tags ?? [],
  createdAt: r.created_at, updatedAt: r.updated_at,
});
const toRow = (s: NewSound) => ({
  name: s.name, part: s.part, preset: s.preset, macros: s.macros, pattern: s.pattern, key: s.key, scale: s.scale, bpm: s.bpm,
  source_url: s.source?.url ?? null, source_title: s.source?.title ?? null, tags: s.tags,
});

function supabaseLibrary(db: SupabaseClient): LibraryStore {
  const check = (error: DbError | null) => { if (error) throw new StoreError(explain(error, TABLE)); };
  return {
    kind: "supabase",
    async list(f = {}, limit = 200) {
      let q = db.from(TABLE).select("*").order("created_at", { ascending: false }).limit(limit);
      if (f.sourceUrl) q = q.eq("source_url", f.sourceUrl);
      if (f.part) q = q.eq("part", f.part);
      if (f.tag) q = q.contains("tags", [f.tag]);
      const { data, error } = await q;
      check(error);
      return (data as Row[]).map(toSound);
    },
    async get(id) {
      const { data, error } = await db.from(TABLE).select("*").eq("id", id).maybeSingle();
      check(error);
      return data ? toSound(data as Row) : null;
    },
    async add(s) {
      const { data, error } = await db.from(TABLE).insert(toRow(s)).select("*").single();
      check(error);
      return toSound(data as Row);
    },
    async update(id, patch) {
      const { data, error } = await db.from(TABLE).update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select("*").maybeSingle();
      check(error);
      return data ? toSound(data as Row) : null;
    },
  };
}

function memoryLibrary(): LibraryStore {
  const g = globalThis as unknown as { __sixamSounds?: Map<string, LibrarySound> };
  const mem = (g.__sixamSounds ??= new Map());
  return {
    kind: "memory",
    async list(f = {}, limit = 200) {
      return [...mem.values()]
        .filter((s) => (!f.sourceUrl || s.source?.url === f.sourceUrl) && (!f.part || s.part === f.part) && (!f.tag || s.tags.includes(f.tag)))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit).map((s) => structuredClone(s));
    },
    async get(id) {
      const s = mem.get(id);
      return s ? structuredClone(s) : null;
    },
    async add(s) {
      const now = new Date().toISOString();
      const row: LibrarySound = { ...structuredClone(s), id: crypto.randomUUID(), createdAt: now, updatedAt: now };
      mem.set(row.id, row);
      return structuredClone(row);
    },
    async update(id, patch) {
      const cur = mem.get(id);
      if (!cur) return null;
      const next = { ...cur, ...structuredClone(patch), updatedAt: new Date().toISOString() };
      mem.set(id, next);
      return structuredClone(next);
    },
  };
}

export function getLibraryStore(): { store: LibraryStore } | { problem: string } {
  const c = connect();
  if ("problem" in c) return c;
  return { store: "db" in c ? supabaseLibrary(c.db) : memoryLibrary() };
}
