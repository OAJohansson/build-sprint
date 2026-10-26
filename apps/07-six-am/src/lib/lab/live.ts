// Lab live separation engine (L143, L144, L150). Captures the Deck tab with its local playback
// suppressed, separates rolling 7.8 s windows in the worker, and plays each part's newest region a
// fixed delay later through one gain per part. Rights by design: the capture lives in a 12 s ring
// that is overwritten as it goes and zeroed on stop; each window is transferred to the worker and
// dropped; each region plays once from an AudioBufferSourceNode and is garbage after. No
// MediaRecorder, no storage, no upload, never connected to the speakers unseparated.
import type { Separator } from "./separator-client";
import { makePlan, playDelay, step } from "./stream";
import { addMark, heardPosition, levelDb, type DeckMark } from "./sync";

export const PART_NAMES = ["drums", "bass", "other", "vocals"] as const;
export type PartName = (typeof PART_NAMES)[number];
const RATE = 44100;
const RING_S = 12;
const SILENT_DB = -70; // a paused Deck: skip the model, play nothing

export type LiveStats = {
  suppressLocalAudioPlayback: boolean | undefined;
  delayS: number;
  windows: number;
  skippedSilent: number;
  late: number;
  meanComputeMs: number;
  ratio: number;
  inDb: number;
  partsDb: number[];
};

export class LiveError extends Error {
  constructor(public reason: "cancelled" | "no-audio" | "unsupported" | "hidden" | "popup", message: string) {
    super(message);
  }
}

/** One separated region, before its crossfade: parts[p*2 + ch], `length` samples that were
 *  captured from ctx time `captureStart` and play at `at`. Valid only during the call (copy what
 *  you keep, in memory only: L161). */
export type Region = { parts: Float32Array[]; captureStart: number; length: number; at: number; fade: number };

type Options = {
  hopS?: number; guardS?: number; computeS?: number; onStats?: (s: LiveStats) => void; onEnded?: () => void; muted?: boolean;
  /** Start with the live parts silent (the Lab's transport opens them after a seek, timing.ts). */
  gated?: boolean;
  onRegion?: (r: Region) => void;
};

export class LiveParts {
  readonly delayS: number;
  readonly rate = RATE;
  /** One gain per part (solo/mute); the live regions and a memory loop both play into these. */
  readonly gains: GainNode[];
  /** Live regions only, per part, before `gains`: the transport mutes these around a seek or a loop. */
  readonly liveIn: GainNode[];
  private marks: DeckMark[] = [];
  private stopped = false;

  private constructor(
    readonly ctx: AudioContext,
    gains: GainNode[],
    liveIn: GainNode[],
    delayS: number,
    private teardown: () => void,
  ) {
    this.gains = gains;
    this.liveIn = liveIn;
    this.delayS = delayS;
  }

  /**
   * Asks Chrome to share a tab (the user picks the Six AM Deck) and starts separating. Call from a
   * click on a visible tab: getDisplayMedia needs the user activation, so it runs before awaiting
   * the model.
   */
  static async start(sep: Separator, opts: Options = {}): Promise<LiveParts> {
    if (!navigator.mediaDevices?.getDisplayMedia) throw new LiveError("unsupported", "This browser can't share tab audio. Use desktop Chrome.");
    if (document.visibilityState !== "visible") throw new LiveError("hidden", "Come back to this tab, then start listening.");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, suppressLocalAudioPlayback: true } as MediaTrackConstraints,
        // Chrome hints: offer other tabs, not this one (its own output must stay audible).
        ...({ preferCurrentTab: false, selfBrowserSurface: "exclude", surfaceSwitching: "exclude", systemAudio: "exclude", monitorTypeSurfaces: "exclude" } as object),
      });
    } catch (e) {
      throw new LiveError("cancelled", `Sharing cancelled or failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    stream.getVideoTracks().forEach((t) => t.stop()); // audio only
    const track = stream.getAudioTracks()[0];
    if (!track) {
      stream.getTracks().forEach((t) => t.stop());
      throw new LiveError("no-audio", "No audio shared: keep 'Also share tab audio' on and try again.");
    }
    const suppressed = (track.getSettings() as MediaTrackSettings & { suppressLocalAudioPlayback?: boolean }).suppressLocalAudioPlayback;
    try {
      await sep.loaded;
    } catch (e) {
      stream.getTracks().forEach((t) => t.stop());
      throw e;
    }

    const ctx = new AudioContext({ sampleRate: RATE, latencyHint: "playback" });
    await ctx.audioWorklet.addModule("/lab/stereo-tap.js");
    const src = ctx.createMediaStreamSource(new MediaStream([track]));
    const tap = new AudioWorkletNode(ctx, "stereo-tap");
    src.connect(tap); // never to ctx.destination: only separated parts are heard
    const master = ctx.createGain();
    master.gain.value = opts.muted ? 0 : 1; // graders' runs stay quiet
    master.connect(ctx.destination);
    const gains = PART_NAMES.map(() => { const g = ctx.createGain(); g.connect(master); return g; });
    const liveIn = gains.map((g) => { const l = ctx.createGain(); l.gain.value = opts.gated ? 0 : 1; l.connect(g); return l; });

    const hopS = opts.hopS ?? 3;
    const plan = makePlan(RATE, hopS, opts.guardS ?? 0.5);
    const delayS = playDelay(plan, RATE, opts.computeS ?? 1.5);
    const size = RATE * RING_S;
    const ringL = new Float32Array(size);
    const ringR = new Float32Array(size);
    let written = 0;
    let frame0 = -1;
    let k = 0;
    let busy = false;
    const stats: LiveStats = { suppressLocalAudioPlayback: suppressed, delayS: +delayS.toFixed(2), windows: 0, skippedSilent: 0, late: 0, meanComputeMs: 0, ratio: 0, inDb: -120, partsDb: [-120, -120, -120, -120] };
    let computeSum = 0;
    let computeN = 0;

    const windowAt = (start: number) => {
      const out = new Float32Array(plan.window);
      const outR = new Float32Array(plan.window);
      for (let i = 0; i < plan.window; i++) { const j = start + i; if (j >= 0) { out[i] = ringL[j % size]; outR[i] = ringR[j % size]; } }
      return [out, outR] as const;
    };

    let live: LiveParts | null = null;
    const tick = async () => {
      if (busy || live?.stopped) return;
      const s = step(plan, k);
      if (written < s.end) return;
      if (written - s.end > size - plan.window) { k = Math.floor((written - plan.hop - plan.guard) / plan.hop); return; } // fell behind: jump to now
      busy = true;
      const [L, R] = windowAt(s.windowStart);
      stats.inDb = +levelDb(L, s.from, s.from + s.length).toFixed(1);
      if (stats.inDb < SILENT_DB) {
        stats.skippedSilent++;
        // Not separated (nothing to hear), but reported as a silent region, so a loop over a silent
        // stretch (or the track's first moments) still fills and the lanes know it's quiet there.
        opts.onRegion?.({ parts: Array.from({ length: 8 }, () => new Float32Array(s.length)), captureStart: (frame0 + s.regionStart) / RATE, length: s.length, at: (frame0 + s.regionStart) / RATE + delayS, fade: plan.fade });
      } else {
        const w0 = performance.now();
        const r = await sep.separate(L, R, s.from, s.length).catch(() => null);
        if (r && !live?.stopped) {
          const ms = performance.now() - w0;
          if (k > 0) { computeSum += ms; computeN++; } // the first run includes the GPU warm-up
          stats.partsDb = PART_NAMES.map((_, p) => +levelDb(r.parts[p * 2]).toFixed(1));
          const at = (frame0 + s.regionStart) / RATE + delayS;
          opts.onRegion?.({ parts: r.parts, captureStart: (frame0 + s.regionStart) / RATE, length: s.length, at, fade: plan.fade });
          const now = ctx.currentTime + 0.02;
          const offset = Math.max(0, now - at); // late: play the rest of the region, not nothing
          if (offset > 0) stats.late++;
          if (offset < s.length / RATE) {
            PART_NAMES.forEach((_, p) => {
              const buf = ctx.createBuffer(2, s.length, RATE);
              for (let ch = 0; ch < 2; ch++) { const a = r.parts[p * 2 + ch]; fade(a, plan.fade); buf.copyToChannel(a, ch); }
              const node = ctx.createBufferSource();
              node.buffer = buf; // played once, then garbage: never kept
              node.connect(liveIn[p]);
              node.onended = () => node.disconnect();
              node.start(Math.max(at, now), offset);
            });
          }
          stats.windows++;
        }
      }
      stats.meanComputeMs = computeN ? Math.round(computeSum / computeN) : 0;
      stats.ratio = computeN ? +((hopS * 1000) / (computeSum / computeN)).toFixed(2) : 0;
      opts.onStats?.({ ...stats, partsDb: [...stats.partsDb] });
      k++;
      busy = false;
      tick();
    };
    tap.port.onmessage = (e: MessageEvent<{ frame: number; l: Float32Array; r: Float32Array }>) => {
      const { frame, l, r } = e.data;
      if (frame0 < 0) frame0 = frame;
      for (let i = 0; i < l.length; i++) { const j = (written + i) % size; ringL[j] = l[i]; ringR[j] = r[i]; }
      written += l.length;
      tick();
    };
    tap.port.postMessage({ on: true });

    const teardown = () => {
      tap.port.postMessage({ on: false });
      tap.port.onmessage = null;
      stream.getTracks().forEach((t) => t.stop());
      ringL.fill(0);
      ringR.fill(0);
      ctx.close();
      opts.onEnded?.();
    };
    live = new LiveParts(ctx, gains, liveIn, delayS, teardown);
    track.onended = () => live?.stop(); // Chrome's "Stop sharing"
    return live;
  }

  /** Which parts are heard (true = on). Short ramps, no clicks. */
  setParts(on: boolean[]) {
    this.gains.forEach((g, i) => g.gain.setTargetAtTime(on[i] ? 1 : 0, this.ctx.currentTime, 0.01));
  }

  /** Feed the Deck's reported position (from its BroadcastChannel) as it arrives. */
  noteDeck(posMs: number, playing: boolean) {
    this.marks = addMark(this.marks, { at: this.ctx.currentTime, posMs, playing }, this.delayS + 30);
  }

  /** The track position you are hearing now (ms), or null before the first part plays. */
  heardMs() {
    return heardPosition(this.marks, this.ctx.currentTime, this.delayS);
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;
    this.teardown();
  }
}

function fade(a: Float32Array, n: number) {
  for (let i = 0; i < n && i < a.length; i++) { const g = i / n; a[i] *= g; a[a.length - 1 - i] *= g; }
}
