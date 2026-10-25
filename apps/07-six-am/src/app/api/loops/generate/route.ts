import { loopGuard } from "@/lib/server/access";
import { fallbackProvider, generateLoop, LoopsUnavailable, primaryProvider, providerModels } from "@/lib/server/ai-loops";
import { MAX_DRAWS } from "@/lib/server/ai-loops/draws";
import { isLoopProviderError } from "@/lib/server/ai-loops/types";
import { failure, serverError } from "@/lib/server/failure";
import { getMentorStore } from "@/lib/server/mentor-store";
import { dailyLoopCap, loopUsage } from "@/lib/ai-loops/cap";
import { bassLoopRequest, LOOP_BARS, mergeSource, type LoopSource } from "@/lib/ai-loops/prompt";
import { cleanTzOffset, monthRange } from "@/lib/mentor/periods";

// "Generate a bass loop like this track" (S4, A9, A11). Behind the access code; the provider keys
// stay on the server. The prompt is built here from the track's analysis (numbers and style words,
// never audio). The server checks each draw (tempo ±1 BPM, same or relative key) and draws again
// until one passes, at most MAX_DRAWS = 3 (L126); each paid draw counts towards the hard per-day
// cap (LOOPS_DAILY_CAP, default 20 draws ≈ $1.60).
//
// POST { analysisId?, analysis?: { bpm, key, scale, genres?, myGenre? }, bars?: 4 | 8, seed?, tz? }
//   Sent analysis numbers win; the stored analysisId only adds style words (either may be alone).
//   The service is picked by env only (LOOPS_PROVIDER / LOOPS_FALLBACK, both off = Stable Audio).
//   → { loop: { id, provider, model, prompt, bpm, key, scale, bars, seed, mime, costUsd (all draws),
//               seconds, draws, checked, measured, … },
//       measured: { bpm, key, scale, inKey, onTempo } | null, checked, draws, costUsd,
//       audio: { base64, mime }, finish: { trimmed, seam, rawSeconds, seconds }, fellBack,
//       usage: { today (draws), cap, left, todayUsd, monthUsd } }
// GET ?tz= → { usage, provider, fallback, models }
export const maxDuration = 60;

type Body = {
  analysisId?: unknown;
  analysis?: Partial<LoopSource>;
  bars?: unknown;
  seed?: unknown;
  tz?: unknown;
};

const KEYS = new Set(["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"]);

/** The analysis fields the prompt needs, validated; null when they don't add up. */
function cleanSource(a: Partial<LoopSource> | null | undefined): LoopSource | null {
  if (!a || typeof a !== "object") return null;
  const bpm = Number(a.bpm);
  const key = typeof a.key === "string" ? a.key.trim() : "";
  if (!Number.isFinite(bpm) || bpm < 60 || bpm > 200 || !KEYS.has(key)) return null;
  const genres = Array.isArray(a.genres)
    ? a.genres.filter((g) => g && typeof g.style === "string" && Number.isFinite(g.p)).slice(0, 5).map((g) => ({ style: g.style.slice(0, 80), p: g.p }))
    : [];
  const myGenre = typeof a.myGenre === "string" ? a.myGenre.trim().slice(0, 80) : undefined;
  return { bpm, key, scale: a.scale === "major" ? "major" : "minor", genres, ...(myGenre ? { myGenre } : {}) };
}

export async function GET(request: Request) {
  const g = loopGuard(request);
  if ("error" in g) return g.error;
  const tz = cleanTzOffset(new URL(request.url).searchParams.get("tz"));
  const now = new Date();
  try {
    const rows = await g.store.costRows(monthRange(now, tz).start);
    return Response.json({ usage: loopUsage(rows, now, tz, dailyLoopCap(process.env.LOOPS_DAILY_CAP)), provider: primaryProvider(), fallback: fallbackProvider(), models: providerModels() });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const g = loopGuard(request);
  if ("error" in g) return g.error;
  const body = ((await request.json().catch(() => null)) ?? {}) as Body;
  const tz = cleanTzOffset(body.tz);
  const now = new Date();
  const cap = dailyLoopCap(process.env.LOOPS_DAILY_CAP);

  try {
    // 1. What to make it from (L134 + fix): the sent numbers (the Studio track's tempo and key) for
    // the prompt and the check; the stored Ears result by id adds its style words when found. A
    // missing or unreadable analysis is not an error while numbers were sent.
    const analysisId = typeof body.analysisId === "string" ? body.analysisId.slice(0, 600) : null;
    const sent = cleanSource(body.analysis);
    let fromStore: LoopSource | null = null;
    if (analysisId) {
      const m = getMentorStore();
      if ("problem" in m) { if (!sent) return failure(m.problem, 503); }
      else fromStore = cleanSource(await m.store.getAnalysis(analysisId).catch(() => null));
    }
    const source = mergeSource(sent, fromStore);
    if (!source) {
      return analysisId
        ? Response.json({ error: "That track has no analysis with a usable BPM and key yet." }, { status: 404 })
        : Response.json({ error: "Send analysisId, or analysis with bpm (60–200) and key." }, { status: 400 });
    }
    const bars = LOOP_BARS.includes(Number(body.bars) as (typeof LOOP_BARS)[number]) ? Number(body.bars) : 8;
    const seed = Number.isInteger(body.seed) && (body.seed as number) >= 0 && (body.seed as number) < 4294967295 ? (body.seed as number) : undefined;

    // 2. The daily cap, before any money is spent.
    const before = loopUsage(await g.store.costRows(monthRange(now, tz).start), now, tz, cap);
    if (before.left <= 0) {
      return Response.json({ error: `That's the daily limit of ${cap} AI loop draws. More tomorrow.`, kind: "cap", usage: before }, { status: 429 });
    }

    // 3. Draw until one passes the check (never past the cap), then keep the file.
    const req = bassLoopRequest(source, bars, seed);
    const result = await generateLoop(req, Math.min(MAX_DRAWS, before.left));
    const meta = {
      provider: result.provider, model: result.model, prompt: req.prompt, bpm: req.bpm, key: req.key, scale: req.scale,
      bars: req.bars, seed: result.seed, mime: result.mime, costUsd: result.totalCostUsd,
      seconds: Math.round(result.log.reduce((s, d) => s + d.seconds, 0) * 1000) / 1000,
      draws: result.draws, checked: result.checked, measured: result.measured, analysisId,
    };
    let loop;
    let stored = true;
    try {
      loop = await g.store.add({ ...meta, audio: result.audio });
    } catch (error) {
      // The loop is paid for: hand it back even if keeping it failed, and say so.
      // shortcut: an unstored loop doesn't count towards the cap; fine while storage is reliable.
      console.error(`[app] AI loop not stored: ${error instanceof Error ? error.message : String(error)}`);
      loop = { ...meta, id: null, createdAt: now.toISOString() };
      stored = false;
    }
    const after = loopUsage(await g.store.costRows(monthRange(now, tz).start).catch(() => []), now, tz, cap);
    return Response.json({
      loop: { ...loop, requestedSeconds: result.requestedSeconds, estimate: true },
      measured: result.measured
        ? { bpm: result.measured.bpm, key: result.measured.key, scale: result.measured.scale, inKey: result.measured.inKey, onTempo: result.measured.onTempo }
        : null,
      checked: result.checked,
      draws: result.draws,
      costUsd: result.totalCostUsd,
      audio: { base64: Buffer.from(result.audio).toString("base64"), mime: result.mime },
      finish: result.finish,
      fellBack: result.fellBack,
      stored,
      usage: after,
    });
  } catch (error) {
    if (error instanceof LoopsUnavailable) return failure(error.message, 503);
    if (isLoopProviderError(error)) {
      console.error(`[app] ${error.message} (HTTP ${error.status})`);
      const status = error.status === 403 ? 422 : 502;
      const message = error.status === 403 ? "The AI service refused that prompt." : "The AI loop service failed. Try again in a minute.";
      return Response.json({ error: message, kind: "provider" }, { status });
    }
    return serverError(error);
  }
}
