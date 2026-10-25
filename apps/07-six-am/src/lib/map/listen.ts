// The full-track listen (A1): play a SoundCloud track from start to end through the existing tab
// capture and turn it into frame features as it plays. PCM lives in a half-second buffer, is read
// into numbers and dropped; nothing is recorded, stored or uploaded. When the track has no Ears
// result yet, the four usual 30 s snippets are cut from the same listen (in memory, one at a time)
// and analysed by the Ears worker, so tempo and key come from Ears as everywhere else.
import { resampleTo16k, type TabCapture } from "@/lib/ears/capture";
import type { EarsClient } from "@/lib/ears/ears-client";
import { toAnalysis, type EarsAnalysis } from "@/lib/ears/results";
import { snippetPlan, type Snippet } from "@/lib/ears/snippets";
import type { EarsResult } from "@/lib/ears/types";
import { LoadError, type Player, type ScSound } from "@/lib/ears/widget";
import type { BarRaw, FrameSeries } from "./bars";
import { buildMap } from "./build";
import { CHANNELS, FrameAnalyser } from "./frames";
import type { TrackMap } from "./types";

export type MapStage =
  | { stage: "loading" }
  | { stage: "listening"; seconds: number; of: number }
  | { stage: "analysing" };

export class MapError extends Error {
  constructor(public reason: "unavailable" | "geo-blocked" | "preview" | "no-audio" | "cancelled" | "no-tempo", message: string) {
    super(message);
  }
}

export type MapRun = {
  map: TrackMap;
  /** A fresh Ears result when the track had none (save it like any other), else null. */
  analysis: EarsAnalysis | null;
  raws: BarRaw[];
  downbeatScores: number[];
  /** The frame features on track time (numbers only), for the debug page and offline tuning. */
  series: FrameSeries;
  timings: { loadMs: number; listenMs: number; buildMs: number; heardSec: number; frames: number; anchors: number; segments: number };
};

type Anchor = { cap: number; pos: number };

const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

/**
 * Capture time → track time. The widget's playhead (PLAY_PROGRESS) is sampled against how much audio
 * was captured; the difference is constant while it plays smoothly and jumps after a stall or a
 * pause. Split at jumps over 0.3 s; each stretch uses its median difference.
 */
export function offsetSegments(anchors: Anchor[]): { from: number; offset: number }[] {
  if (!anchors.length) return [{ from: 0, offset: 0 }];
  const d = anchors.map((a) => a.pos - a.cap);
  const smooth = d.map((_, i) => median(d.slice(Math.max(0, i - 4), i + 5)));
  const segs: { from: number; idx: number[] }[] = [{ from: 0, idx: [0] }];
  for (let i = 1; i < d.length; i++) {
    if (Math.abs(smooth[i] - smooth[i - 1]) > 0.3) segs.push({ from: anchors[i].cap, idx: [] });
    segs.at(-1)!.idx.push(i);
  }
  return segs.map((s) => ({ from: s.from, offset: median(s.idx.map((i) => d[i])) }));
}

function offsetAt(segs: { from: number; offset: number }[], cap: number) {
  let o = segs[0].offset;
  for (const s of segs) if (cap >= s.from) o = s.offset;
  return o;
}

/** Frames in capture order → a uniform track-time series (holes filled from the previous frame). */
export function toTrackTime(frames: Float32Array, frameTime: (i: number) => number, fps: number, segs: { from: number; offset: number }[]): FrameSeries {
  const count = frames.length / CHANNELS;
  let last = 0;
  const idx = new Int32Array(count);
  for (let i = 0; i < count; i++) {
    const t = frameTime(i) + offsetAt(segs, frameTime(i));
    idx[i] = Math.round(t * fps);
    last = Math.max(last, idx[i]);
  }
  const n = Math.max(0, last + 1);
  const data = new Float32Array(n * CHANNELS);
  const filled = new Uint8Array(n);
  for (let i = 0; i < count; i++) {
    const j = idx[i];
    if (j < 0 || j >= n) continue;
    data.set(frames.subarray(i * CHANNELS, (i + 1) * CHANNELS), j * CHANNELS);
    filled[j] = 1;
  }
  const firstFilled = filled.indexOf(1);
  for (let j = 0; j < n; j++) {
    if (filled[j]) continue;
    const src = j < firstFilled ? firstFilled : j - 1;
    if (src >= 0) data.copyWithin(j * CHANNELS, src * CHANNELS, (src + 1) * CHANNELS);
    // Before the first frame: silence rather than a copy of the first sound.
    if (j < firstFilled) for (let k = 0; k < CHANNELS; k++) data[j * CHANNELS + k] = k <= 5 ? -120 : 0;
  }
  return { fps, t0: 0, n, data };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function listenWholeTrack(o: {
  url: string;
  player: Player;
  capture: TabCapture;
  /** Needed only when `known` is null (the snippets are analysed by Ears). */
  ears: EarsClient | null;
  /** The track's stored Ears result, if any: its tempo and key are used. */
  known: EarsAnalysis | null;
  signal: AbortSignal;
  onStage: (s: MapStage) => void;
  /** While it plays: the map of what has been heard so far (every few seconds, once the tempo is
   *  known), with `heardSec` and the track's length, so a view can fill in live. */
  onPartial?: (p: { map: TrackMap; heardSec: number; durationSec: number }) => void;
}): Promise<MapRun> {
  const { player, capture, signal, onStage } = o;
  const t0 = performance.now();
  onStage({ stage: "loading" });
  let sound: ScSound;
  try {
    sound = await player.load(o.url);
  } catch (e) {
    if (e instanceof LoadError) throw new MapError(e.reason, e.message);
    throw e;
  }
  if (sound.policy === "SNIP") throw new MapError("preview", "SoundCloud only plays a 30 s preview of this track here, so there's no whole track to map.");
  const durationMs = (await player.duration().catch(() => 0)) || sound.full_duration || sound.duration || 0;
  if (!durationMs) throw new MapError("unavailable", "SoundCloud didn't say how long this track is.");
  const durationSec = durationMs / 1000;
  const loadMs = performance.now() - t0;

  const rate = capture.rate;
  // shortcut: frame features run on the main thread (~5 ms per half second of audio); move them into
  // a worker if the map view's own rendering ever stutters during a listen.
  const analyser = new FrameAnalyser(rate);
  const frameParts: Float32Array[] = [];
  const anchors: Anchor[] = [];
  // Ears snippets cut from this listen, only when the track has no result yet.
  const plan: Snippet[] = o.known ? [] : snippetPlan(durationMs, sound.policy);
  if (!o.known && !o.ears) throw new MapError("no-tempo", "This track has no Ears result and Ears isn't loaded.");
  const snips = plan.map((p) => ({ plan: p, parts: [] as Float32Array[], got: 0, done: false, result: null as Promise<EarsResult | null> | null }));

  try {
    await player.seekAndPlay(0, signal);
  } catch (e) {
    if (signal.aborted) throw new MapError("cancelled", "Cancelled.");
    throw e instanceof LoadError ? new MapError(e.reason, e.message) : e;
  }
  const listenStart = performance.now();
  let got = 0, lastPos = -1, lastTick = 0;
  let pend: Float32Array[] = [], pendLen = 0;
  const flush = () => {
    if (!pendLen) return;
    const buf = new Float32Array(pendLen);
    let off = 0;
    for (const p of pend) { buf.set(p, off); off += p.length; }
    pend = []; pendLen = 0;
    frameParts.push(analyser.push(buf)); // buf goes out of scope here: only numbers stay
    partial();
  };
  let liveBpm = o.known?.bpm ?? 0, lastPartial = 0;
  const partial = () => {
    if (!o.onPartial || !liveBpm || performance.now() - lastPartial < 3000) return;
    lastPartial = performance.now();
    const all = new Float32Array(frameParts.reduce((t, p) => t + p.length, 0));
    let at = 0;
    for (const p of frameParts) { all.set(p, at); at += p.length; }
    const heard = got / rate + nowOffset();
    if (heard < 8) return;
    try {
      const series = toTrackTime(all, (i) => analyser.frameTime(i), analyser.fps, offsetSegments(anchors));
      const { map } = buildMap(series, {
        id: o.known?.id ?? o.url, title: sound.title ?? "", uploader: sound.user?.username ?? "",
        durationSec: heard, earsBpm: liveBpm, key: o.known?.key ?? "", scale: o.known?.scale ?? "", heardSec: got / rate,
      });
      o.onPartial({ map, heardSec: heard, durationSec });
    } catch { /* a partial map is only a preview */ }
  };
  const nowOffset = () => (anchors.length ? median(anchors.slice(-9).map((a) => a.pos - a.cap)) : 0);

  await new Promise<void>((resolve, reject) => {
    let finished = false;
    const offFinish = player.onFinish(() => { finished = true; });
    const onAbort = () => { cleanup(); reject(new MapError("cancelled", "Cancelled.")); };
    signal.addEventListener("abort", onAbort);
    // Ends on FINISH; a watchdog stops a listen that runs far past the track's length (a stall).
    const deadline = performance.now() + (durationSec * 1.5 + 60) * 1000;
    const idle = setInterval(() => {
      if (finished || performance.now() > deadline || (player.positionMs >= durationMs - 50 && !player.playing)) { cleanup(); resolve(); }
    }, 250);
    function cleanup() {
      capture.tap.port.postMessage({ on: false });
      capture.tap.port.onmessage = null;
      clearInterval(idle);
      offFinish();
      signal.removeEventListener("abort", onAbort);
    }
    capture.tap.port.onmessage = (e: MessageEvent<Float32Array>) => {
      if (!player.playing) return; // only count audio while the widget plays
      const block = e.data;
      if (player.positionMs !== lastPos) { lastPos = player.positionMs; anchors.push({ cap: got / rate, pos: lastPos / 1000 }); }
      // Snippets for Ears: the part of this block that falls inside a planned window (track time).
      if (snips.length) {
        const tt = got / rate + nowOffset();
        for (const s of snips) {
          if (s.done) continue;
          const a = s.plan.startMs / 1000, b = (s.plan.startMs + s.plan.lengthMs) / 1000;
          const end = tt + block.length / rate;
          if (end <= a || tt >= b) { if (tt >= b && s.got) finishSnip(s); continue; }
          const from = Math.max(0, Math.round((a - tt) * rate)), to = Math.min(block.length, Math.round((b - tt) * rate));
          if (to > from) { s.parts.push(block.slice(from, to)); s.got += to - from; }
          if (end >= b) finishSnip(s);
        }
      }
      pend.push(block); pendLen += block.length; got += block.length;
      if (pendLen >= rate / 2) flush();
      if (got - lastTick >= rate / 2) { lastTick = got; onStage({ stage: "listening", seconds: Math.floor(got / rate), of: Math.round(durationSec) }); }
    };
    capture.tap.port.postMessage({ on: true });
  });
  player.pause();
  flush();
  for (const s of snips) if (!s.done && s.got) finishSnip(s);
  const listenMs = performance.now() - listenStart;
  const heardSec = got / rate;
  if (heardSec < 10) throw new MapError("no-audio", "Nothing was heard. Is the tab muted, or did sharing stop?");

  function finishSnip(s: (typeof snips)[number]) {
    s.done = true;
    const pcm = new Float32Array(s.got);
    let off = 0;
    for (const p of s.parts) { pcm.set(p, off); off += p.length; }
    s.parts = [];
    s.result = s.got < rate * 3 ? Promise.resolve(null) : resampleTo16k(pcm, rate).then((p16) => o.ears!.analyse(p16)).catch(() => null);
    // The first snippet's tempo is enough to draw the live map until the full result is in.
    s.result.then((r) => { if (r && !liveBpm) liveBpm = r.bpm; });
  }

  onStage({ stage: "analysing" });
  const b0 = performance.now();
  let analysis: EarsAnalysis | null = null;
  let earsBpm = o.known?.bpm ?? 0, key = o.known?.key ?? "", scale = o.known?.scale ?? "";
  if (!o.known) {
    const results = await Promise.all(snips.map((s) => s.result ?? Promise.resolve(null)));
    const ok = results.filter((r): r is EarsResult => !!r);
    if (!ok.length) throw new MapError("no-audio", "Ears couldn't measure the tempo: no snippet was heard.");
    const combined = await o.ears!.combine(ok.map((r) => r.stats));
    analysis = toAnalysis(
      { url: sound.permalink_url?.split("?")[0] || o.url, trackId: sound.id ?? null, title: sound.title, uploader: sound.user?.username, genre: sound.genre, tagList: sound.tag_list, preview: false, durationMs: sound.full_duration ?? durationMs },
      combined, plan, snips.map((s, i) => ({ plan: s.plan, heardSeconds: s.got / rate, result: results[i] })), new Date(),
    );
    earsBpm = analysis.bpm; key = analysis.key; scale = analysis.scale;
  }
  await sleep(0);
  const all = new Float32Array(frameParts.reduce((t, p) => t + p.length, 0));
  let off = 0;
  for (const p of frameParts) { all.set(p, off); off += p.length; }
  const segs = offsetSegments(anchors);
  const series = toTrackTime(all, (i) => analyser.frameTime(i), analyser.fps, segs);
  let built;
  try {
    built = buildMap(series, {
      id: o.known?.id ?? analysis?.id ?? o.url,
      title: sound.title ?? o.known?.title ?? "",
      uploader: sound.user?.username ?? o.known?.uploader ?? "",
      durationSec, earsBpm, key, scale, heardSec,
    });
  } catch (e) {
    throw new MapError("no-tempo", e instanceof Error ? e.message : String(e));
  }
  return {
    map: built.map, analysis, raws: built.raws, downbeatScores: built.downbeatScores, series,
    timings: { loadMs: Math.round(loadMs), listenMs: Math.round(listenMs), buildMs: Math.round(performance.now() - b0), heardSec: Math.round(heardSec * 10) / 10, frames: analyser.count, anchors: anchors.length, segments: segs.length },
  };
}
