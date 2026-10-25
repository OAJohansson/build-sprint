import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LoopCostRow } from "@/lib/ai-loops/cap";
import type { Measured } from "@/lib/ai-loops/check";
import type { LoopProviderId } from "@/lib/ai-loops/prompt";
import { connect, explain, StoreError, type DbError } from "../store";

// Generated loops are the owner's own files (made for them, not captured), so they may be stored.
// Supabase table sixam_ai_loops (supabase/migrations/2026-10-25-ai-loops.sql, not applied yet);
// without Supabase env in development an in-memory store stands in, like the other stores.
// shortcut: the audio sits base64 in a text column (≤ 8 MB per row, about 20 s of WAV); move it to a
// Supabase Storage bucket if loops get longer or the table grows past a few hundred rows.

export type LoopMeta = {
  id: string;
  provider: LoopProviderId;
  model: string;
  prompt: string;
  bpm: number;
  key: string;
  scale: string;
  bars: number;
  seed: number | null;
  mime: string;
  /** All paid draws together (L126). */
  costUsd: number;
  seconds: number;
  /** Paid draws it took (1–3), and whether the returned one passed the tempo/key check. */
  draws: number;
  checked: boolean;
  measured: Measured | null;
  /** The Ears result it was made from (its SoundCloud URL), if any. */
  analysisId: string | null;
  createdAt: string;
};
export type NewLoop = Omit<LoopMeta, "id" | "createdAt"> & { audio: Uint8Array };

export type LoopStore = {
  kind: "memory" | "supabase";
  add(loop: NewLoop): Promise<LoopMeta>;
  /** Loops created at or after `since`, for the daily cap and Today / Month sums. */
  costRows(since: Date): Promise<LoopCostRow[]>;
  getAudio(id: string): Promise<{ meta: LoopMeta; audio: Uint8Array } | null>;
  /** The newest loops made from one track's analysis (metadata only, no audio), newest first. */
  listFor(analysisId: string, limit: number): Promise<LoopMeta[]>;
};

const TABLE = "sixam_ai_loops";

type Row = {
  id: string; provider: LoopProviderId; model: string; prompt: string; bpm: number | string; key: string; scale: string;
  bars: number; seed: number | string | null; mime: string; cost_usd: number | string; seconds: number | string;
  analysis_id: string | null; draws: number | null; checked: boolean | null; measured: Measured | null; created_at: string;
};
const toMeta = (r: Row): LoopMeta => ({
  id: r.id, provider: r.provider, model: r.model, prompt: r.prompt, bpm: Number(r.bpm), key: r.key, scale: r.scale,
  bars: r.bars, seed: r.seed === null ? null : Number(r.seed), mime: r.mime, costUsd: Number(r.cost_usd) || 0,
  seconds: Number(r.seconds) || 0, draws: r.draws ?? 1, checked: r.checked ?? false, measured: r.measured ?? null,
  analysisId: r.analysis_id, createdAt: r.created_at,
});
const COLUMNS = "id, provider, model, prompt, bpm, key, scale, bars, seed, mime, cost_usd, seconds, draws, checked, measured, analysis_id, created_at";

function supabaseLoops(db: SupabaseClient): LoopStore {
  const check = (error: DbError | null) => {
    if (error) throw new StoreError(explain(error, TABLE));
  };
  return {
    kind: "supabase",
    async add(l) {
      const { data, error } = await db
        .from(TABLE)
        .insert({
          provider: l.provider, model: l.model, prompt: l.prompt, bpm: l.bpm, key: l.key, scale: l.scale, bars: l.bars,
          seed: l.seed, mime: l.mime, cost_usd: l.costUsd, seconds: l.seconds, draws: l.draws, checked: l.checked,
          measured: l.measured, analysis_id: l.analysisId,
          audio_b64: Buffer.from(l.audio).toString("base64"),
        })
        .select(COLUMNS)
        .single();
      check(error);
      return toMeta(data as Row);
    },
    async costRows(since) {
      const { data, error } = await db.from(TABLE).select("created_at, cost_usd, draws").gte("created_at", since.toISOString());
      check(error);
      return (data as Pick<Row, "created_at" | "cost_usd" | "draws">[]).map((r) => ({ createdAt: r.created_at, costUsd: Number(r.cost_usd) || 0, draws: r.draws ?? 1 }));
    },
    async getAudio(id) {
      const { data, error } = await db.from(TABLE).select(`${COLUMNS}, audio_b64`).eq("id", id).maybeSingle();
      check(error);
      if (!data) return null;
      const row = data as Row & { audio_b64: string };
      return { meta: toMeta(row), audio: new Uint8Array(Buffer.from(row.audio_b64, "base64")) };
    },
    async listFor(analysisId, limit) {
      const { data, error } = await db.from(TABLE).select(COLUMNS).eq("analysis_id", analysisId).order("created_at", { ascending: false }).limit(limit);
      check(error);
      return (data as Row[]).map(toMeta);
    },
  };
}

function memoryLoops(): LoopStore {
  const g = globalThis as unknown as { __sixamLoops?: Map<string, { meta: LoopMeta; audio: Uint8Array }> };
  const mem = (g.__sixamLoops ??= new Map());
  return {
    kind: "memory",
    async add({ audio, ...rest }) {
      const meta: LoopMeta = { ...rest, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      mem.set(meta.id, { meta, audio });
      return meta;
    },
    async costRows(since) {
      return [...mem.values()]
        .filter((l) => Date.parse(l.meta.createdAt) >= since.getTime())
        .map((l) => ({ createdAt: l.meta.createdAt, costUsd: l.meta.costUsd, draws: l.meta.draws }));
    },
    async getAudio(id) {
      return mem.get(id) ?? null;
    },
    async listFor(analysisId, limit) {
      return [...mem.values()].map((l) => l.meta).filter((m) => m.analysisId === analysisId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
    },
  };
}

export function getLoopStore(): { store: LoopStore } | { problem: string } {
  const c = connect();
  if ("problem" in c) return c;
  return { store: "db" in c ? supabaseLoops(c.db) : memoryLoops() };
}
