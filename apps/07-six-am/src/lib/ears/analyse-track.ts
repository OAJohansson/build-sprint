// One track, end to end (L26): load it in the widget, listen to the planned snippets through the
// tab capture, analyse each in the worker, combine. PCM lives in local arrays for one snippet,
// is transferred to the worker, and is gone; only numbers come back.
import { resampleTo16k, type TabCapture } from "./capture";
import type { EarsClient } from "./ears-client";
import type { FailReason } from "./queue";
import { toAnalysis, type EarsAnalysis } from "./results";
import { SEEK_SETTLE_MS, snippetPlan, type Snippet } from "./snippets";
import type { EarsResult } from "./types";
import { LoadError, type Player, type ScSound } from "./widget";

export type TrackStage =
  | { stage: "loading" }
  | { stage: "loaded"; sound: ScSound; plan: Snippet[] }
  | { stage: "listening"; snippet: number; of: number; seconds: number; snippetSeconds: number }
  | { stage: "analysing" };

export class TrackError extends Error {
  constructor(public reason: FailReason | "listening-stopped", message: string) {
    super(message);
  }
}

/** Below this the snippet is treated as silence (tab muted, sharing broken, ad gap). */
const SILENT_DBFS = -60;

export async function analyseTrack(opts: {
  url: string;
  player: Player;
  capture: TabCapture;
  ears: EarsClient;
  signal: AbortSignal;
  onStage: (s: TrackStage) => void;
  /** Override the plan (the spike's single-window mode). */
  plan?: (durationMs: number, policy?: string) => Snippet[];
}): Promise<EarsAnalysis> {
  const { url, player, capture, ears, signal, onStage } = opts;
  onStage({ stage: "loading" });
  let sound: ScSound;
  try {
    sound = await player.load(url);
  } catch (e) {
    if (e instanceof LoadError) throw new TrackError(e.reason, e.message);
    throw e;
  }
  const preview = sound.policy === "SNIP";
  // For a preview getDuration() is the full track; what plays is sound.duration (L16).
  const durationMs = preview ? sound.duration ?? 30000 : (await player.duration().catch(() => 0)) || sound.duration || 0;
  const plan = (opts.plan ?? snippetPlan)(durationMs, sound.policy);
  onStage({ stage: "loaded", sound, plan });

  const pending: Promise<EarsResult | null>[] = [];
  const heard: number[] = [];
  try {
    for (let i = 0; i < plan.length; i++) {
      const pcm = await listenSnippet({ player, capture, snippet: plan[i], signal, onSeconds: (s) => onStage({ stage: "listening", snippet: i + 1, of: plan.length, seconds: s, snippetSeconds: plan[i].lengthMs / 1000 }) });
      heard.push(pcm.length / capture.rate);
      if (pcm.length < capture.rate * 3) { pending.push(Promise.resolve(null)); continue; }
      // Resample and hand to the worker without waiting: the next snippet listens meanwhile.
      pending.push(resampleTo16k(pcm, capture.rate).then((p16) => ears.analyse(p16)).catch(() => null));
    }
  } finally {
    player.pause();
  }
  onStage({ stage: "analysing" });
  const results = await Promise.all(pending);
  const ok = results.filter((r): r is EarsResult => !!r);
  if (!ok.length) throw new TrackError("no-audio", "Nothing was heard. Is the tab muted, or did sharing stop?");
  const combined = await ears.combine(ok.map((r) => r.stats));
  if (combined.energy.dbfs < SILENT_DBFS) throw new TrackError("no-audio", `Only silence was heard (${combined.energy.dbfs} dBFS). Is the tab muted?`);

  return toAnalysis(
    {
      url: sound.permalink_url?.split("?")[0] || url,
      trackId: sound.id ?? null,
      title: sound.title,
      uploader: sound.user?.username,
      genre: sound.genre,
      tagList: sound.tag_list,
      preview,
      durationMs: sound.full_duration ?? durationMs,
    },
    combined,
    plan,
    plan.map((p, i) => ({ plan: p, heardSeconds: heard[i] ?? 0, result: results[i] ?? null })),
    new Date(),
  );
}

/**
 * Seek to the snippet, then collect PCM blocks while the widget plays, skipping the first
 * SEEK_SETTLE_MS after the seek. Ends at the snippet length, on FINISH, or when playback stays
 * paused (the user paused: waits, and continues when they press play again).
 */
async function listenSnippet(o: { player: Player; capture: TabCapture; snippet: Snippet; signal: AbortSignal; onSeconds: (s: number) => void }): Promise<Float32Array<ArrayBuffer>> {
  const { player, capture, snippet, signal, onSeconds } = o;
  if (signal.aborted) throw abortReason(signal);
  try {
    await player.seekAndPlay(snippet.startMs, signal);
  } catch (e) {
    if (signal.aborted) throw abortReason(signal);
    throw e instanceof LoadError ? new TrackError(e.reason, e.message) : e;
  }
  const rate = capture.rate;
  const want = Math.round((snippet.lengthMs / 1000) * rate);
  let skip = Math.round((SEEK_SETTLE_MS / 1000) * rate);
  // PCM blocks live in this array, in memory only, until they're joined below; then dropped.
  let chunks: Float32Array[] = [];
  let got = 0;
  let lastTick = 0;
  await new Promise<void>((resolve, reject) => {
    let finished = false;
    const done = () => { cleanup(); resolve(); };
    const fail = (e: Error) => { cleanup(); reject(e); };
    const offFinish = player.onFinish(() => { finished = true; });
    const onAbort = () => fail(abortReason(signal));
    signal.addEventListener("abort", onAbort);
    const idle = setInterval(() => { if (finished) done(); }, 250);
    function cleanup() {
      capture.tap.port.postMessage({ on: false });
      capture.tap.port.onmessage = null;
      clearInterval(idle);
      offFinish();
      signal.removeEventListener("abort", onAbort);
    }
    capture.tap.port.onmessage = (e: MessageEvent<Float32Array>) => {
      if (!player.playing) return; // only count audio while the widget plays
      let block = e.data;
      if (skip > 0) {
        const drop = Math.min(skip, block.length);
        skip -= drop;
        if (drop === block.length) return;
        block = block.subarray(drop);
      }
      const take = Math.min(block.length, want - got);
      chunks.push(take === block.length ? block : block.slice(0, take));
      got += take;
      if (got - lastTick >= rate / 2) { lastTick = got; onSeconds(Math.floor(got / rate)); }
      if (got >= want) done();
    };
    capture.tap.port.postMessage({ on: true });
  });
  const pcm = new Float32Array(got);
  let off = 0;
  for (const c of chunks) { pcm.set(c, off); off += c.length; }
  chunks = [];
  return pcm;
}

function abortReason(signal: AbortSignal): Error {
  const r = signal.reason;
  if (r instanceof TrackError) return r;
  return new TrackError("cancelled", "Cancelled.");
}
