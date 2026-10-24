// The common shape of an AI-loop provider (S4). Types only, so adapters stay importable by Node's
// type stripping (scripts/loops-bakeoff.mjs) as well as by Next.
import type { LoopProviderId, LoopRequest } from "../../ai-loops/prompt";

export type { LoopProviderId, LoopRequest };

export type LoopResult = {
  audio: Uint8Array;
  mime: string;
  provider: LoopProviderId;
  model: string;
  /** USD, from the published price for this model and what the call used. An estimate. */
  costUsd: number;
  /** Wall-clock seconds for the provider call(s), incl. polling. */
  seconds: number;
  /** Seconds of audio asked for (the provider may return a fixed length, e.g. Lyria Clip = 30 s). */
  requestedSeconds: number;
  /** Small provider metadata worth keeping (seed, finish reason, request id, lyrics/structure text). */
  meta: Record<string, unknown>;
};

/** A provider call that failed: an Error with these fields. retryable = worth trying the fallback
 *  (5xx, 429, network, timeout). A plain shape, not a class, so adapters need no value imports. */
export type LoopProviderError = Error & { provider: LoopProviderId; status: number; retryable: boolean };

export const isLoopProviderError = (e: unknown): e is LoopProviderError =>
  e instanceof Error && typeof (e as LoopProviderError).provider === "string" && typeof (e as LoopProviderError).retryable === "boolean";

export type LoopAdapter = {
  id: LoopProviderId;
  model: string;
  generate(req: LoopRequest, apiKey: string): Promise<LoopResult>;
};
