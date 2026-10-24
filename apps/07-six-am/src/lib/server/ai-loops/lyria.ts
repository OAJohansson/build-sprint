// Google Lyria via the Gemini API, plain fetch. Checked against the official docs on 25 Oct 2026
// (docs/products/07-six-am/evals-runs/2026-10-25-ai-loops-bakeoff.md):
// - Request/response, not streaming: POST https://generativelanguage.googleapis.com/v1beta/interactions
//   with { model, input } and the x-goog-api-key header. The answer's `steps` hold model_output
//   blocks: `audio` (base64 MP3) and `text` (lyrics / structure).
// - lyria-3-clip-preview: always a 30 s clip, MP3, $0.04 per request (paid tier). No BPM, key,
//   duration or seed parameters: tempo and key go in the prompt. lyria-3.5 is full songs, $0.08.
// - Lyria RealTime (lyria-realtime-exp, WebSocket) is the only one with bpm / scale parameters;
//   not used here (streaming, experimental, no published price).
// store: false so Google doesn't keep the interaction (default is 55 days on the paid tier).
// Types-only imports: Node runs this file directly (bake-off).
import type { LoopAdapter, LoopProviderError, LoopRequest, LoopResult } from "./types";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";

export type LyriaModel = "lyria-3-clip-preview" | "lyria-3.5";
/** Published price per request, USD (ai.google.dev/gemini-api/docs/pricing, paid tier). */
export const LYRIA_USD: Record<LyriaModel, number> = { "lyria-3-clip-preview": 0.04, "lyria-3.5": 0.08 };

const fail = (status: number, message: string): LoopProviderError =>
  Object.assign(new Error(`Lyria: ${message}`), { provider: "lyria" as const, status, retryable: status === 0 || status === 429 || status >= 500 });

type Block = { type: string; data?: string; mime_type?: string; mimeType?: string; text?: string };
type Interaction = { id?: string; status?: string; steps?: { type: string; content?: Block[] }[]; usage?: unknown; error?: { message?: string } };

export function lyriaAdapter(model: LyriaModel = "lyria-3-clip-preview", timeoutMs = 55_000): LoopAdapter {
  return {
    id: "lyria",
    model,
    async generate(req: LoopRequest, apiKey: string): Promise<LoopResult> {
      const t0 = performance.now();
      const seconds = Math.round(((req.bars * 240) / req.bpm) * 1000) / 1000;
      // The same prompt as Stable Audio (a fair bake-off) plus one line: the clip is always 30 s,
      // so the phrase should repeat through it and the Studio cuts `bars` from it.
      const input = `${req.prompt} The ${req.bars}-bar phrase repeats, unchanged, for the whole clip.`;
      let res: Response;
      try {
        res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({ model, input, store: false }),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (e) {
        throw fail(0, e instanceof Error ? e.message : String(e));
      }
      const body = (await res.json().catch(() => null)) as Interaction | null;
      if (!res.ok || !body) throw fail(res.status, body?.error?.message ?? `HTTP ${res.status}`);
      const blocks = (body.steps ?? []).filter((s) => s.type === "model_output").flatMap((s) => s.content ?? []);
      const audioBlock = blocks.filter((b) => b.type === "audio" && b.data).pop();
      if (!audioBlock?.data) throw fail(502, `no audio in the answer (status ${body.status ?? "?"})`);
      const audio = new Uint8Array(Buffer.from(audioBlock.data, "base64"));
      return {
        audio,
        mime: audioBlock.mime_type ?? audioBlock.mimeType ?? "audio/mpeg",
        provider: "lyria",
        model,
        costUsd: LYRIA_USD[model],
        seconds: Math.round(performance.now() - t0) / 1000,
        requestedSeconds: seconds,
        meta: {
          interactionId: body.id ?? null,
          status: body.status ?? null,
          usage: body.usage ?? null,
          text: blocks.filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n").slice(0, 2000) || null,
          promptSent: input,
          bytes: audio.byteLength,
        },
      };
    },
  };
}
