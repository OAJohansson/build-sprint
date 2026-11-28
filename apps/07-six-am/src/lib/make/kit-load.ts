// Phase 7 slice 1 (W12, T234): loading the sampled sounds in the browser, only when they are needed
// (a sound's first tap, the row's sounds for Suggest, a saved sound in the Studio): fetch the file
// from the app's own /kits folder, decode it to mono at 44.1 kHz, drop the leading silence below
// −60 dB and keep it in kit-samples.ts. Plus a one-shot preview for a tap when the loop isn't playing.
import { p7SoundById } from "./kit-p7";
import { BASS_SAMPLE_FILES, MAKE_PRESETS, synthParams, type Macros, type MakePresetId } from "./presets";
import { renderBass } from "./render";
import { hasKitSample, setKitSample, trimLead } from "./kit-samples";
import { renderDrumHits, type DrumMacros, type DrumSoundId } from "./drum-synth";

const RATE = 44100;
const loads = new Map<string, Promise<boolean>>();

/** The file a sampled sound's id plays from (a drum kit sound or a bass recording), or null. */
export const sampleUrl = (id: string): string | null => p7SoundById(id)?.url ?? BASS_SAMPLE_FILES[id] ?? null;

/** Loads one recording (once; later calls share the first). Resolves false when it can't. */
export function loadSample(id: string): Promise<boolean> {
  if (hasKitSample(id)) return Promise.resolve(true);
  const have = loads.get(id);
  if (have) return have;
  const url = sampleUrl(id);
  if (!url) return Promise.resolve(false);
  const p = fetch(url)
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
    .then((b) => new OfflineAudioContext(1, 1, RATE).decodeAudioData(b))
    .then((buf) => {
      const n = buf.length, mono = new Float32Array(n);
      for (let c = 0; c < buf.numberOfChannels; c++) { const x = buf.getChannelData(c); for (let i = 0; i < n; i++) mono[i] += x[i] / buf.numberOfChannels; }
      setKitSample(id, trimLead(mono), buf.sampleRate);
      return true;
    })
    .catch((e) => { loads.delete(id); console.warn(`[make] couldn't load the sound ${id}:`, e); return false; });
  loads.set(id, p);
  return p;
}

export const loadSamples = (ids: Iterable<string>) => Promise.all([...ids].map(loadSample)).then((xs) => xs.every(Boolean));

let ctx: AudioContext | null = null;
let playing: AudioBufferSourceNode | null = null;

/**
 * One hit of a sampled drum sound with its knobs, on its own (a tap on the shelf while the loop is
 * stopped): the next preview cuts the last. Resolves once it starts (the sound is loaded first).
 */
export async function previewDrum(id: DrumSoundId, macros: DrumMacros, gain = 0.7): Promise<void> {
  if (!(await loadSample(id))) return;
  ctx ??= new AudioContext({ latencyHint: "interactive" });
  if (ctx.state === "suspended") await ctx.resume().catch(() => {});
  const rate = ctx.sampleRate;
  const r = renderDrumHits(id, macros, [{ t: 0, vel: 1 }], { lenS: 2.5, rate, wrap: false });
  let end = r.left.length;
  while (end > 1 && Math.abs(r.left[end - 1]) < 1e-5) end--;
  const buf = ctx.createBuffer(2, end, rate);
  buf.copyToChannel(r.left.subarray(0, end), 0);
  buf.copyToChannel(r.right.subarray(0, end), 1);
  try { playing?.stop(); } catch { /* already ended */ }
  const src = ctx.createBufferSource(), g = ctx.createGain();
  g.gain.value = gain;
  src.buffer = buf;
  src.connect(g).connect(ctx.destination);
  src.start();
  playing = src;
}

/** The recordings a bass preset plays from (none for the synth presets). */
export const bassSampleIds = (id: MakePresetId): string[] => MAKE_PRESETS[id].base.samples?.map((x) => x.id) ?? [];

/** One bass note (A1, a quarter note) of a preset at its own knobs, on its own: a tap on the bass shelf while the loop is stopped. */
export async function previewBass(id: MakePresetId, macros?: Macros, gain = 0.6): Promise<void> {
  if (!(await loadSamples(bassSampleIds(id)))) return;
  ctx ??= new AudioContext({ latencyHint: "interactive" });
  if (ctx.state === "suspended") await ctx.resume().catch(() => {});
  const rate = ctx.sampleRate;
  const r = renderBass([{ step: 0, midi: 33, dur: 4, vel: 0.9 }], synthParams(id, macros ?? MAKE_PRESETS[id].macros), { bpm: 124, steps: 8, rate });
  const buf = ctx.createBuffer(2, r.left.length, rate);
  buf.copyToChannel(r.left, 0);
  buf.copyToChannel(r.right, 1);
  try { playing?.stop(); } catch { /* already ended */ }
  const src = ctx.createBufferSource(), g = ctx.createGain();
  g.gain.value = gain;
  src.buffer = buf;
  src.connect(g).connect(ctx.destination);
  src.start();
  playing = src;
}
