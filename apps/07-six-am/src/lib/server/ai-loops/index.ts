import "server-only";
import { finishLoop, type LoopFinish } from "@/lib/ai-loops/wav";
import { lyriaAdapter } from "./lyria";
import { stabilityAdapter } from "./stability";
import { isLoopProviderError, type LoopAdapter, type LoopProviderId, type LoopRequest, type LoopResult } from "./types";

// AI loops (S4, A9–A11): one adapter per provider behind generate(), the keys read here on the
// server only. Stable Audio 2.5 won the bake-off (L124, evals-runs/2026-10-25-ai-loops-grading.md).
// Lyria 3 Clip is an off-by-default switch: LOOPS_PROVIDER=lyria makes it the primary, and
// LOOPS_FALLBACK=lyria lets it step in when Stable Audio fails with a retryable error. Neither is set
// by default, so only Stable Audio is ever called (and charged).
export const DEFAULT_PROVIDER: LoopProviderId = "stability";

const ADAPTERS: Record<LoopProviderId, LoopAdapter> = {
  stability: stabilityAdapter("stable-audio-2.5"),
  lyria: lyriaAdapter("lyria-3-clip-preview"),
};

const KEY_ENV: Record<LoopProviderId, string> = { stability: "STABILITY_API_KEY", lyria: "GEMINI_API_KEY" };

const keyFor = (p: LoopProviderId) => process.env[KEY_ENV[p]]?.trim() || "";

const asProvider = (v: string | undefined): LoopProviderId | null => {
  const t = v?.trim().toLowerCase();
  return t === "lyria" || t === "stability" ? t : null;
};

export const primaryProvider = (): LoopProviderId => asProvider(process.env.LOOPS_PROVIDER) ?? DEFAULT_PROVIDER;

/** The fallback, only when switched on (LOOPS_FALLBACK) and different from the primary. */
export function fallbackProvider(): LoopProviderId | null {
  const f = asProvider(process.env.LOOPS_FALLBACK);
  return f && f !== primaryProvider() ? f : null;
}

/** The model each provider would use, for the UI / logs. */
export const providerModels = () => ({ stability: ADAPTERS.stability.model, lyria: ADAPTERS.lyria.model });

export class LoopsUnavailable extends Error {}

/**
 * Generate one loop with the primary, then the fallback (if switched on) on a retryable failure.
 * WAV results are trimmed to exactly `bars` with a clean seam (finishLoop).
 */
export async function generateLoop(req: LoopRequest): Promise<LoopResult & { fellBack: boolean; finish: LoopFinish }> {
  const first = primaryProvider();
  const fb = fallbackProvider();
  const order = [first, ...(fb ? [fb] : [])].filter((p) => keyFor(p));
  if (!order.length) throw new LoopsUnavailable(`No key for the AI loop service (${KEY_ENV[first]}).`);
  let lastError: unknown;
  for (const p of order) {
    try {
      const result = await ADAPTERS[p].generate(req, keyFor(p));
      const { audio, finish } = finishLoop(result.audio, result.mime, req.bpm, req.bars);
      return { ...result, audio, finish, fellBack: p !== first };
    } catch (e) {
      lastError = e;
      // Not retryable (bad prompt, moderation, no credits): the fallback would fail the same way
      // or hide a problem the owner should see.
      if (!isLoopProviderError(e) || !e.retryable) throw e;
    }
  }
  throw lastError;
}
