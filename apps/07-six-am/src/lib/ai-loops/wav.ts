// Make a generated WAV loop sit on the bar grid and repeat without a click (S4 fix pass, L124).
// Stable Audio returns whole seconds (floor of what was asked), so the adapter asks for
// ceil(seconds) and this trims to exactly bars × 4 × 60 / bpm at sample precision, then blends
// the audio just past the loop end into the head so the wrap from the last sample back to the
// first is continuous. Pure, no dependencies, no value imports: Node runs it directly (bake-off).
//
// shortcut: 16-bit PCM WAV only; any other format (Lyria's MP3) is returned untouched. Decoding MP3
// on the server needs a decoder dependency; trim Lyria in the browser (decodeAudioData) if it's
// ever switched on.

export const SEAM_MS = 20;
/** Fallback when there's no audio past the loop end to blend in: fade both ends this long. */
export const EDGE_FADE_MS = 3;

export type LoopFinish = {
  trimmed: boolean;
  /** "crossfade" (tail blended into the head), "edge-fade" (short fades, not enough tail), or why not. */
  seam: "crossfade" | "edge-fade" | "none";
  rawSeconds: number | null;
  seconds: number | null;
  note?: string;
};

type Pcm = { sampleRate: number; channels: number; dataOffset: number; dataBytes: number };

function readPcm16(bytes: Uint8Array): Pcm | null {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (o: number) => String.fromCharCode(bytes[o], bytes[o + 1], bytes[o + 2], bytes[o + 3]);
  if (bytes.byteLength < 44 || tag(0) !== "RIFF" || tag(8) !== "WAVE") return null;
  let fmt: { format: number; channels: number; sampleRate: number; bits: number } | null = null;
  for (let o = 12; o + 8 <= bytes.byteLength; ) {
    const id = tag(o);
    const size = v.getUint32(o + 4, true);
    if (id === "fmt ") {
      fmt = { format: v.getUint16(o + 8, true), channels: v.getUint16(o + 10, true), sampleRate: v.getUint32(o + 12, true), bits: v.getUint16(o + 22, true) };
    } else if (id === "data") {
      // Format 1 = PCM; 0xFFFE = extensible (still PCM for 16-bit here).
      if (!fmt || (fmt.format !== 1 && fmt.format !== 0xfffe) || fmt.bits !== 16) return null;
      return { sampleRate: fmt.sampleRate, channels: fmt.channels, dataOffset: o + 8, dataBytes: Math.min(size, bytes.byteLength - o - 8) };
    }
    o += 8 + size + (size % 2);
  }
  return null;
}

function writeWav16(samples: Int16Array, sampleRate: number, channels: number): Uint8Array {
  const out = new Uint8Array(44 + samples.byteLength);
  const v = new DataView(out.buffer);
  const tag = (o: number, s: string) => [...s].forEach((c, i) => (out[o + i] = c.charCodeAt(0)));
  tag(0, "RIFF");
  v.setUint32(4, 36 + samples.byteLength, true);
  tag(8, "WAVE");
  tag(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, channels, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * channels * 2, true);
  v.setUint16(32, channels * 2, true);
  v.setUint16(34, 16, true);
  tag(36, "data");
  v.setUint32(40, samples.byteLength, true);
  for (let i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, samples[i], true);
  return out;
}

/** Exact loop length in sample frames: bars of 4/4 at bpm. */
export const loopFrames = (bpm: number, bars: number, sampleRate: number) => Math.round(((bars * 240) / bpm) * sampleRate);

/**
 * Trim a WAV loop to exactly `bars` at `bpm` and make the seam clean. Returns the input untouched
 * (with the reason) when it isn't 16-bit PCM WAV or is shorter than the loop.
 */
export function finishLoop(audio: Uint8Array, mime: string, bpm: number, bars: number): { audio: Uint8Array; finish: LoopFinish } {
  const none = (note: string, rawSeconds: number | null = null): { audio: Uint8Array; finish: LoopFinish } => ({
    audio, finish: { trimmed: false, seam: "none", rawSeconds, seconds: rawSeconds, note },
  });
  if (!(bpm > 0) || !(bars > 0)) return none("not trimmed: no tempo or bar count");
  if (!/wav/i.test(mime)) return none(`not trimmed: ${mime} (no server-side decoder)`);
  const pcm = readPcm16(audio);
  if (!pcm) return none("not trimmed: not 16-bit PCM WAV");
  const { sampleRate: sr, channels: ch } = pcm;
  // Copy the samples out (the data chunk may sit at an odd offset, so no Int16Array view on it).
  const total = Math.floor(pcm.dataBytes / 2 / ch);
  const src = new Int16Array(total * ch);
  const dv = new DataView(audio.buffer, audio.byteOffset + pcm.dataOffset, total * ch * 2);
  for (let i = 0; i < src.length; i++) src[i] = dv.getInt16(i * 2, true);
  const rawSeconds = Math.round((total / sr) * 1e4) / 1e4;

  const n = loopFrames(bpm, bars, sr);
  if (total < n) return none(`not trimmed: ${rawSeconds} s is shorter than the loop`, rawSeconds);

  const out = src.slice(0, n * ch);
  const seamFrames = Math.round((SEAM_MS / 1000) * sr);
  let seam: LoopFinish["seam"];
  if (total - n >= seamFrames) {
    // Crossfade: the head's first SEAM_MS fades in while the audio that followed the loop end
    // fades out over it. Sample 0 then continues sample n-1, so the wrap has no jump.
    for (let i = 0; i < seamFrames; i++) {
      const g = i / seamFrames;
      for (let c = 0; c < ch; c++) {
        const k = i * ch + c;
        out[k] = Math.round(src[k] * g + src[(n + i) * ch + c] * (1 - g));
      }
    }
    seam = "crossfade";
  } else {
    const f = Math.max(1, Math.round((EDGE_FADE_MS / 1000) * sr));
    for (let i = 0; i < f; i++) {
      const g = i / f;
      for (let c = 0; c < ch; c++) {
        out[i * ch + c] = Math.round(out[i * ch + c] * g);
        out[(n - 1 - i) * ch + c] = Math.round(out[(n - 1 - i) * ch + c] * g);
      }
    }
    seam = "edge-fade";
  }
  return { audio: writeWav16(out, sr, ch), finish: { trimmed: true, seam, rawSeconds, seconds: Math.round((n / sr) * 1e4) / 1e4 } };
}

/** A 16-bit PCM WAV as one mono Float32 channel (-1…1) for the loop check; null for anything else. */
export function decodeMono(bytes: Uint8Array): { pcm: Float32Array; sampleRate: number } | null {
  const p = readPcm16(bytes);
  if (!p) return null;
  const frames = Math.floor(p.dataBytes / 2 / p.channels);
  const dv = new DataView(bytes.buffer, bytes.byteOffset + p.dataOffset, frames * p.channels * 2);
  const pcm = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let s = 0;
    for (let c = 0; c < p.channels; c++) s += dv.getInt16((i * p.channels + c) * 2, true);
    pcm[i] = s / p.channels / 32768;
  }
  return { pcm, sampleRate: p.sampleRate };
}
