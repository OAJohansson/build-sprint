// Draw until a loop passes the server's own check (S4, L126): draw → finishLoop (exact length,
// clean seam) → checkLoop (tempo ±1 BPM, same or relative key) → pass? done : draw again with a
// new seed, at most MAX_DRAWS. If none pass, the best-scoring draw comes back flagged
// checked: false with what was measured. Every draw is paid for, so the cost is their sum.
// No server-only import here so the bake-off script can run it (scripts/ts-resolve.mjs).
import { checkLoop, checkScore, type Measured } from "@/lib/ai-loops/check";
import { decodeMono, finishLoop, type LoopFinish } from "@/lib/ai-loops/wav";
import type { LoopRequest, LoopResult } from "./types";

export const MAX_DRAWS = 3;

export type DrawLogEntry = { seed: number; costUsd: number; seconds: number; measured: Measured | null; finish: LoopFinish; error?: string };

export type DrawnLoop = LoopResult & {
  finish: LoopFinish;
  /** What the check measured on the returned loop; null when it couldn't be checked (MP3). */
  measured: Measured | null;
  /** True when the returned loop passed both checks. */
  checked: boolean;
  draws: number;
  /** The seed of the returned draw. */
  seed: number;
  /** All draws together, USD (estimate). */
  totalCostUsd: number;
  log: DrawLogEntry[];
};

const randomSeed = () => Math.floor(Math.random() * 4294967294);

type Options = {
  maxDraws?: number;
  /** Asked before every draw after the first (daily cap, a script's budget). */
  canDraw?: () => boolean;
};

export async function drawLoop(req: LoopRequest, generateOnce: (req: LoopRequest) => Promise<LoopResult>, opts: Options = {}): Promise<DrawnLoop> {
  const maxDraws = Math.max(1, Math.min(MAX_DRAWS, opts.maxDraws ?? MAX_DRAWS));
  const log: DrawLogEntry[] = [];
  let best: { result: LoopResult; finish: LoopFinish; measured: Measured | null; score: number; seed: number } | null = null;
  let total = 0;

  for (let i = 0; i < maxDraws; i++) {
    if (i > 0 && opts.canDraw && !opts.canDraw()) break;
    const seed = i === 0 && req.seed !== undefined ? req.seed : randomSeed();
    let raw: LoopResult;
    try {
      raw = await generateOnce({ ...req, seed });
    } catch (e) {
      if (!best) throw e; // nothing to hand back yet
      log.push({ seed, costUsd: 0, seconds: 0, measured: null, finish: { trimmed: false, seam: "none", rawSeconds: null, seconds: null }, error: e instanceof Error ? e.message : String(e) });
      break;
    }
    total += raw.costUsd;
    const { audio, finish } = finishLoop(raw.audio, raw.mime, req.bpm, req.bars);
    const pcm = decodeMono(audio);
    const measured = pcm ? checkLoop(pcm.pcm, pcm.sampleRate, req) : null;
    const result = { ...raw, audio };
    log.push({ seed, costUsd: raw.costUsd, seconds: raw.seconds, measured, finish });
    // Not checkable (MP3): hand back the first draw instead of paying for more blind draws.
    if (!measured) return { ...result, finish, measured: null, checked: false, seed, draws: log.length, totalCostUsd: total, log };
    if (measured.onTempo && measured.inKey) return { ...result, finish, measured, checked: true, seed, draws: log.length, totalCostUsd: total, log };
    const score = checkScore(measured);
    if (!best || score > best.score) best = { result, finish, measured, score, seed };
  }
  const b = best!;
  return { ...b.result, finish: b.finish, measured: b.measured, checked: false, seed: b.seed, draws: log.filter((l) => !l.error).length, totalCostUsd: total, log };
}
