import "server-only";
import { lyriaAdapter } from "./lyria";
import { stabilityAdapter } from "./stability";
import { isLoopProviderError, type LoopAdapter, type LoopProviderId, type LoopRequest, type LoopResult } from "./types";

// AI loops (S4, A9–A11): one adapter per provider behind generate(), the keys read here on the
// server only. LOOPS_PROVIDER picks the primary; the other is the fallback when the primary
// fails with a retryable error (5xx, 429, network) and its key is set.
//
// PROVISIONAL default (until the bake-off is graded, A10): stability. Change DEFAULT_PROVIDER, or
// set LOOPS_PROVIDER on Vercel, to switch without a code change.
export const DEFAULT_PROVIDER: LoopProviderId = "stability";

const ADAPTERS: Record<LoopProviderId, LoopAdapter> = {
  stability: stabilityAdapter("stable-audio-2.5"),
  lyria: lyriaAdapter("lyria-3-clip-preview"),
};

const KEY_ENV: Record<LoopProviderId, string> = { stability: "STABILITY_API_KEY", lyria: "GEMINI_API_KEY" };

const keyFor = (p: LoopProviderId) => process.env[KEY_ENV[p]]?.trim() || "";

export function primaryProvider(): LoopProviderId {
  const v = process.env.LOOPS_PROVIDER?.trim().toLowerCase();
  return v === "lyria" || v === "stability" ? v : DEFAULT_PROVIDER;
}

const other = (p: LoopProviderId): LoopProviderId => (p === "stability" ? "lyria" : "stability");

/** The model each provider would use, for the UI / logs. */
export const providerModels = () => ({ stability: ADAPTERS.stability.model, lyria: ADAPTERS.lyria.model });

export class LoopsUnavailable extends Error {}

/**
 * Generate one loop: `prefer` (or the primary) first, then the fallback on a retryable failure.
 * The result says which provider made it, and `fellBack` when the fallback did.
 */
export async function generateLoop(req: LoopRequest, prefer?: LoopProviderId): Promise<LoopResult & { fellBack: boolean }> {
  const first = prefer ?? primaryProvider();
  const order = [first, other(first)].filter((p) => keyFor(p));
  if (!order.length) throw new LoopsUnavailable("No AI loop key is set (STABILITY_API_KEY / GEMINI_API_KEY).");
  let lastError: unknown;
  for (const p of order) {
    try {
      const result = await ADAPTERS[p].generate(req, keyFor(p));
      return { ...result, fellBack: p !== first };
    } catch (e) {
      lastError = e;
      // Not retryable (bad prompt, moderation, no credits): the fallback would fail the same way
      // or hide a problem the owner should see.
      if (!isLoopProviderError(e) || !e.retryable) throw e;
    }
  }
  throw lastError;
}
