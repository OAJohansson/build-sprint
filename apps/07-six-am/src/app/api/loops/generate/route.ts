import { loopGuard } from "@/lib/server/access";
import { fallbackProvider, generateLoop, LoopsUnavailable, primaryProvider, providerModels } from "@/lib/server/ai-loops";
import { isLoopProviderError } from "@/lib/server/ai-loops/types";
import { failure, serverError } from "@/lib/server/failure";
import { getMentorStore } from "@/lib/server/mentor-store";
import { dailyLoopCap, loopUsage } from "@/lib/ai-loops/cap";
import { bassLoopRequest, LOOP_BARS, type LoopSource } from "@/lib/ai-loops/prompt";
import { cleanTzOffset, monthRange } from "@/lib/mentor/periods";

// "Generate a bass loop like this track" (S4, A9, A11). Behind the access code; the provider keys
// stay on the server. The prompt is built here from the track's analysis (numbers and style words,
// never audio). A hard per-day cap (LOOPS_DAILY_CAP, default 20) because each loop costs money.
//
// POST { analysisId? | analysis?: { bpm, key, scale, genres?, myGenre? }, bars?: 4 | 8, seed?, tz? }
//   The service is picked by env only (LOOPS_PROVIDER / LOOPS_FALLBACK, both off = Stable Audio).
//   → { loop: { id, provider, model, prompt, bpm, key, scale, bars, mime, costUsd, seconds, … },
//       audio: { base64, mime }, finish: { trimmed, seam, rawSeconds, seconds }, fellBack, usage: { today, cap, left, todayUsd, monthUsd } }
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
    // 1. What to make it from: a stored Ears result by id, or the numbers sent with the request.
    const analysisId = typeof body.analysisId === "string" ? body.analysisId.slice(0, 600) : null;
    let source: LoopSource | null = null;
    if (analysisId) {
      const m = getMentorStore();
      if ("problem" in m) return failure(m.problem, 503);
      source = cleanSource(await m.store.getAnalysis(analysisId));
      if (!source) return Response.json({ error: "That track has no analysis with a usable BPM and key yet." }, { status: 404 });
    } else {
      source = cleanSource(body.analysis);
      if (!source) return Response.json({ error: "Send analysisId, or analysis with bpm (60–200) and key." }, { status: 400 });
    }
    const bars = LOOP_BARS.includes(Number(body.bars) as (typeof LOOP_BARS)[number]) ? Number(body.bars) : 8;
    const seed = Number.isInteger(body.seed) && (body.seed as number) >= 0 && (body.seed as number) < 4294967295 ? (body.seed as number) : undefined;

    // 2. The daily cap, before any money is spent.
    const before = loopUsage(await g.store.costRows(monthRange(now, tz).start), now, tz, cap);
    if (before.left <= 0) {
      return Response.json({ error: `That's the daily limit of ${cap} AI loops. More tomorrow.`, kind: "cap", usage: before }, { status: 429 });
    }

    // 3. Generate (primary, then the fallback on a retryable failure) and keep the file.
    const req = bassLoopRequest(source, bars, seed);
    const result = await generateLoop(req);
    const meta = {
      provider: result.provider, model: result.model, prompt: req.prompt, bpm: req.bpm, key: req.key, scale: req.scale,
      bars: req.bars, seed: seed ?? (Number(result.meta.seed) || null), mime: result.mime, costUsd: result.costUsd,
      seconds: result.seconds, analysisId,
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
