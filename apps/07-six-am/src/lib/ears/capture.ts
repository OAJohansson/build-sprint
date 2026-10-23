// Tab audio capture (F3): getDisplayMedia on this tab → Web Audio → AudioWorklet PCM blocks in
// memory. Never connected to the speakers, never recorded (no MediaRecorder), never stored.
import { TARGET_RATE } from "./ears-client";

export type TabCapture = {
  ctx: AudioContext;
  tap: AudioWorkletNode;
  rate: number;
  stop(): void;
};

export class CaptureError extends Error {
  constructor(public reason: "cancelled" | "no-audio" | "unsupported", message: string) {
    super(message);
  }
}

export async function startTabCapture(onEnded: () => void): Promise<TabCapture> {
  if (!navigator.mediaDevices?.getDisplayMedia) throw new CaptureError("unsupported", "This browser can't share tab audio. Use desktop Chrome.");
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      // Chrome-only hints (Step 0 used the same set).
      ...({ preferCurrentTab: true, selfBrowserSurface: "include", surfaceSwitching: "exclude", systemAudio: "exclude" } as object),
    });
  } catch (e) {
    throw new CaptureError("cancelled", `Sharing cancelled or failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  stream.getVideoTracks().forEach((t) => t.stop()); // audio only; we never look at the picture
  const audio = stream.getAudioTracks();
  if (!audio.length) {
    stream.getTracks().forEach((t) => t.stop());
    throw new CaptureError("no-audio", "No audio shared: switch on 'Also share tab audio' and try again.");
  }
  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule("/ears/pcm-tap.js");
  const src = ctx.createMediaStreamSource(new MediaStream(audio));
  const tap = new AudioWorkletNode(ctx, "pcm-tap");
  src.connect(tap); // not connected to ctx.destination: no echo
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    tap.port.postMessage({ on: false });
    tap.port.onmessage = null;
    stream.getTracks().forEach((t) => t.stop());
    ctx.close();
    onEnded();
  };
  audio[0].onended = stop; // the user pressed Chrome's "Stop sharing"
  return { ctx, tap, rate: ctx.sampleRate, stop };
}

/** Downmixed PCM at the capture rate → 16 kHz mono, in memory (OfflineAudioContext's resampler). */
export async function resampleTo16k(pcm: Float32Array<ArrayBuffer>, rate: number): Promise<Float32Array<ArrayBuffer>> {
  if (rate === TARGET_RATE) return pcm;
  const off = new OfflineAudioContext(1, Math.ceil((pcm.length * TARGET_RATE) / rate), TARGET_RATE);
  const buf = off.createBuffer(1, pcm.length, rate);
  buf.copyToChannel(pcm, 0);
  const src = off.createBufferSource();
  src.buffer = buf;
  src.connect(off.destination);
  src.start();
  const out = await off.startRendering();
  return new Float32Array(out.getChannelData(0)); // own copy, so it can be transferred to the worker
}
