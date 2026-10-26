// Stable Audio (Stability AI), plain fetch. Checked against the official docs on 25 Oct 2026
// (docs/products/07-six-am/evals-runs/2026-10-25-ai-loops-bakeoff.md):
// - Stable Audio 2.5: POST https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio,
//   multipart/form-data, synchronous; accept: audio/* returns the bytes, with `seed` and
//   `finish-reason` headers. duration 1–190 s, steps 4–8 (default 8), cfg_scale default 1,
//   output_format mp3 | wav. Flat 8 credits per successful result (1 credit = $0.01).
// - It returns whole seconds (the floor of `duration`; seen in the bake-off, L124), so we ask for
//   ceil(seconds + 50 ms) and finishLoop (src/lib/ai-loops/wav.ts) trims to the exact bar length.
// - Stable Audio 3.0 (async, same price) was dropped after the bake-off: tempo 0/5 (L124).
// Failed generations aren't charged. Types-only imports: Node runs this file directly (bake-off).
import type { LoopAdapter, LoopProviderError, LoopRequest, LoopResult } from "./types";

const BASE = "https://api.stability.ai";
const USD_PER_CREDIT = 0.01;
/** Published price per successful generation, in credits (docs.stability.ai/pricing). */
export const STABILITY_CREDITS: Record<StabilityModel, number> = { "stable-audio-2.5": 8 };

export type StabilityModel = "stable-audio-2.5";

const fail = (status: number, message: string): LoopProviderError =>
  Object.assign(new Error(`Stable Audio: ${message}`), { provider: "stability" as const, status, retryable: status === 0 || status === 429 || status >= 500 });

async function errorText(res: Response) {
  const body = (await res.json().catch(() => null)) as { name?: string; errors?: string[] } | null;
  return body ? `${body.name ?? "error"}: ${(body.errors ?? []).join("; ")}` : `HTTP ${res.status}`;
}

async function call(url: string, init: RequestInit, signal: AbortSignal) {
  try {
    return await fetch(url, { ...init, signal });
  } catch (e) {
    throw fail(0, e instanceof Error ? e.message : String(e));
  }
}

export function stabilityAdapter(model: StabilityModel = "stable-audio-2.5", timeoutMs = 55_000): LoopAdapter {
  const path = "/v2beta/audio/stable-audio-2/text-to-audio";
  return {
    id: "stability",
    model,
    async generate(req: LoopRequest, apiKey: string): Promise<LoopResult> {
      const t0 = performance.now();
      const signal = AbortSignal.timeout(timeoutMs);
      const seconds = Math.round(((req.bars * 240) / req.bpm) * 1000) / 1000;
      const form = new FormData();
      form.set("prompt", req.prompt);
      form.set("model", model);
      // Whole seconds come back (floor), so ask for the next whole second past the loop plus 50 ms:
      // finishLoop trims to the exact length and blends that tail into the head (20 ms seam).
      // The price is flat per generation, so the extra second costs nothing.
      form.set("duration", String(Math.min(190, Math.max(1, Math.ceil(seconds + 0.05)))));
      // WAV, not MP3: MP3 encoder padding puts a gap at the loop point; the loop must repeat cleanly.
      form.set("output_format", "wav");
      if (req.seed !== undefined) form.set("seed", String(req.seed));
      const auth = { authorization: `Bearer ${apiKey}`, "stability-client-id": "six-am" };

      const res = await call(`${BASE}${path}`, { method: "POST", headers: { ...auth, accept: "audio/*" }, body: form }, signal);
      if (!res.ok) throw fail(res.status, await errorText(res));
      const audio = new Uint8Array(await res.arrayBuffer());
      const mime = (res.headers.get("content-type") ?? "audio/wav").split(";")[0];
      return {
        audio,
        mime,
        provider: "stability",
        model,
        costUsd: STABILITY_CREDITS[model] * USD_PER_CREDIT,
        seconds: Math.round(performance.now() - t0) / 1000,
        requestedSeconds: seconds,
        meta: {
          seed: res.headers.get("seed"),
          finishReason: res.headers.get("finish-reason"),
          requestId: res.headers.get("x-request-id"),
          credits: STABILITY_CREDITS[model],
          bytes: audio.byteLength,
        },
      };
    },
  };
}
