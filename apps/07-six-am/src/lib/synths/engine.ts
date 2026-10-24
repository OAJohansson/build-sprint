// The Tone.js side of the synths and kits (A6, A8): build a voice from a preset and its knobs,
// play notes at exact audio times, schedule a loop on a Transport, and render one offline for
// graders (X3). No React; works in the live context and inside Tone.Offline.
//
// Every note is booked as AudioParam automation at its time (no setting properties "now"), so
// the same code is sample-exact offline and on the Studio's lookahead clock.
import * as Tone from "tone";
import { clampBpm, secondsPerStep } from "@/lib/tempo";
import { DRUM_SOUNDS, drumPatternById, KITS, type DrumHit, type DrumSound, type KitId } from "./kits";
import type { KitLoop, PlayableLoop, SynthLoop } from "./loop";
import { patternById, renderPattern, stepToBBS, type SynthNote } from "./patterns";
import { PRESETS, type BassPresetId, type ChordPresetId, type KnobValues, type PresetId } from "./presets";
import { midiToHz, type Scale } from "./theory";
import { loopEvents, loopSeconds, type TimedEvent } from "./events";

export type SynthVoice = {
  /** Sound one note at audio time `time`; `sps` is the length of a 16th in seconds. */
  play(note: SynthNote, time: number, sps: number): void;
  /** New knob values; apply from now on (cutoff and resonance glide over 50 ms). */
  setKnobs(knobs: KnobValues): void;
  output: Tone.Gain;
  dispose(): void;
};

// Per-preset sound design that isn't a knob. Amp envelope: attack, decay to sustain, release
// (seconds, time constants are a third of these so each stage is ~95% done in its time).
type BassDesign = { gainDb: number; filterOctaves: number; accentOctaves: number; ampDecay: (k: KnobValues) => number; sustain: number; release: number };
const BASS: Record<BassPresetId, BassDesign> = {
  sub: { gainDb: -4, filterOctaves: 0, accentOctaves: 0, ampDecay: (k) => k.envelope, sustain: 0.45, release: 0.05 },
  acid: { gainDb: -13, filterOctaves: 3, accentOctaves: 4.3, ampDecay: () => 0.35, sustain: 0.7, release: 0.02 },
  reese: { gainDb: -10, filterOctaves: 1.2, accentOctaves: 1.6, ampDecay: () => 0.5, sustain: 0.9, release: 0.12 },
};
const GLIDE = 0.06; // a 303-style slide, seconds (capped below one 16th)
const MAX_HZ = 18000;

function bassVoice(preset: BassPresetId, knobs: KnobValues, destination: Tone.InputNode): SynthVoice {
  const d = BASS[preset], attack = PRESETS[preset].attack;
  let k = { ...knobs };
  const output = new Tone.Gain(Tone.dbToGain(d.gainDb)).connect(destination);
  const amp = new Tone.Gain(0).connect(output);
  const filter = new Tone.Filter({ type: "lowpass", frequency: k.cutoff, Q: k.resonance, rolloff: preset === "acid" ? -24 : -12 }).connect(amp);
  const osc = preset === "reese"
    ? new Tone.FatOscillator({ type: "sawtooth", count: 3, spread: 28, frequency: 55 })
    : new Tone.Oscillator({ type: preset === "sub" ? "triangle" : "sawtooth", frequency: 55 });
  osc.connect(filter).start();
  let lastHz = 55;

  return {
    output,
    play(n, t, sps) {
      const hz = midiToHz(n.midi), peak = n.vel * (n.accent ? 1.25 : 1), dur = n.dur * sps;
      // Pitch: jump, or glide from the last note when this one slides.
      if (n.slide) {
        osc.frequency.setValueAtTime(lastHz, t);
        osc.frequency.exponentialRampToValueAtTime(hz, t + Math.min(GLIDE, sps * 0.9));
      } else {
        osc.frequency.setValueAtTime(hz, t);
      }
      lastHz = hz;
      // Amp: a slid note keeps the gate open (no new attack), like a 303.
      if (!n.slide) {
        amp.gain.setTargetAtTime(peak, t, attack / 3);
        amp.gain.setTargetAtTime(peak * d.sustain, t + attack, d.ampDecay(k) / 3);
      }
      if (!n.tie) amp.gain.setTargetAtTime(0, t + dur * 0.92, d.release / 3);
      // Filter: snaps open by the envelope amount and closes back to the cutoff over Decay.
      const octaves = n.accent ? d.accentOctaves : d.filterOctaves;
      if (octaves > 0 && !n.slide) {
        filter.frequency.setValueAtTime(Math.min(MAX_HZ, k.cutoff * Math.pow(2, octaves)), t);
        filter.frequency.setTargetAtTime(k.cutoff, t + 0.002, k.envelope / 3);
      }
    },
    setKnobs(next) {
      k = { ...next };
      filter.Q.rampTo(k.resonance, 0.05);
      if (d.filterOctaves === 0) filter.frequency.rampTo(k.cutoff, 0.05);
    },
    dispose() { [osc, filter, amp, output].forEach((x) => x.dispose()); },
  };
}

// Chords. Organ: the M1 "Organ 2" stab, a few strong low harmonics and a fast decay.
// Rhodes: 1:1 FM, the modulation dying faster than the note (the tine "bell" then a mellow tone).
// Pad: three detuned saws, slow attack, long release.
const ORGAN_PARTIALS = [1, 0.75, 0.08, 0.45, 0, 0.22, 0, 0.12];

function chordVoice(preset: ChordPresetId, knobs: KnobValues, destination: Tone.InputNode): SynthVoice {
  let k = { ...knobs };
  const attack = PRESETS[preset].attack;
  const output = new Tone.Gain(Tone.dbToGain(preset === "pad" ? -16 : preset === "organ" ? -14 : -10)).connect(destination);
  const filter = new Tone.Filter({ type: "lowpass", frequency: k.cutoff, Q: k.resonance }).connect(output);
  const envelopeFor = (kv: KnobValues) =>
    preset === "pad" ? { attack, decay: 0.6, sustain: 0.85, release: kv.envelope }
      : preset === "organ" ? { attack, decay: kv.envelope, sustain: 0.1, release: 0.06 }
        : { attack, decay: kv.envelope, sustain: 0.06, release: 0.35 };
  const poly: Tone.PolySynth = preset === "rhodes"
    ? new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1, modulationIndex: 3.2,
      oscillator: { type: "sine" }, modulation: { type: "sine" },
      envelope: envelopeFor(k),
      modulationEnvelope: { attack: 0.002, decay: k.envelope * 0.3, sustain: 0.05, release: 0.3 },
    })
    : new Tone.PolySynth(Tone.Synth, {
      oscillator: preset === "pad" ? { type: "fatsawtooth", count: 3, spread: 24 } : { type: "custom", partials: ORGAN_PARTIALS },
      envelope: envelopeFor(k),
    } as Tone.SynthOptions);
  poly.maxPolyphony = 32;
  poly.connect(filter);

  return {
    output,
    play(n, t, sps) { poly.triggerAttackRelease(midiToHz(n.midi), n.dur * sps * 0.95, t, n.vel); },
    setKnobs(next) {
      k = { ...next };
      filter.frequency.rampTo(k.cutoff, 0.05);
      filter.Q.rampTo(k.resonance, 0.05);
      if (preset === "rhodes") poly.set({ envelope: envelopeFor(k), modulationEnvelope: { decay: k.envelope * 0.3 } } as never);
      else poly.set({ envelope: envelopeFor(k) });
    },
    dispose() { [poly, filter, output].forEach((x) => x.dispose()); },
  };
}

export function createSynthVoice(preset: PresetId, knobs: KnobValues, destination: Tone.InputNode): SynthVoice {
  return PRESETS[preset].kind === "bass"
    ? bassVoice(preset as BassPresetId, knobs, destination)
    : chordVoice(preset as ChordPresetId, knobs, destination);
}

// ---- Drum kits ----

export type LoadedKit = {
  id: KitId;
  buffers: Record<DrumSound, Tone.ToneAudioBuffer>;
  /** Seconds of near-silence at each file's start (MP3 encoder padding), skipped when played so hits land on the grid. */
  offsets: Record<DrumSound, number>;
};

/** Seconds before the first sample above -34 dB of the file's peak, minus 0.5 ms of pre-roll. */
// shortcut: a fixed −34 dB threshold for the MP3 padding; switch to the LAME gapless header if a sample with a soft attack gets clipped.
export function leadingSilence(data: Float32Array, sampleRate: number): number {
  let peak = 0;
  for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
  const threshold = Math.max(1e-4, peak * 0.02);
  let i = 0;
  while (i < data.length && Math.abs(data[i]) < threshold) i++;
  return Math.max(0, i - 0.0005 * sampleRate) / sampleRate;
}

const kitCache = new Map<KitId, Promise<LoadedKit>>();

/** Fetch and decode a kit's samples once (decoded buffers work in the live and offline contexts). */
export function loadKit(id: KitId): Promise<LoadedKit> {
  let p = kitCache.get(id);
  if (!p) {
    p = (async () => {
      const entries = await Promise.all(DRUM_SOUNDS.map(async (s) => [s, await Tone.ToneAudioBuffer.fromUrl(KITS[id].urls[s])] as const));
      const buffers = Object.fromEntries(entries) as Record<DrumSound, Tone.ToneAudioBuffer>;
      const offsets = Object.fromEntries(entries.map(([s, b]) => [s, leadingSilence(b.getChannelData(0), b.sampleRate)])) as Record<DrumSound, number>;
      return { id, buffers, offsets };
    })();
    p.catch(() => kitCache.delete(id));
    kitCache.set(id, p);
  }
  return p;
}

export type KitVoice = { play(hit: DrumHit, time: number): void; output: Tone.Gain; dispose(): void };

/** One-shot players for a loaded kit; a closed hat chokes a ringing open hat, like the machines. */
export function createKitVoice(kit: LoadedKit, destination: Tone.InputNode): KitVoice {
  const output = new Tone.Gain(Tone.dbToGain(-7)).connect(destination);
  let openHat: Tone.ToneBufferSource | null = null;
  return {
    output,
    play(hit, t) {
      if (hit.sound === "hat" && openHat) { try { openHat.stop(t); } catch { /* already stopped */ } openHat = null; }
      // Created per hit, so give it the voice's context explicitly: inside Tone.Offline the
      // callbacks run after the global context has been switched back to the live one.
      const src = new Tone.ToneBufferSource({ url: kit.buffers[hit.sound], context: output.context }).connect(output);
      src.onended = () => src.dispose();
      src.start(t, kit.offsets[hit.sound], undefined, hit.vel);
      if (hit.sound === "ohat") openHat = src;
    },
    dispose() { output.dispose(); },
  };
}

// ---- Transport ----

/**
 * Put a loop on a Transport at the track's key, looping every `loop.bars` bars from `startBar`
 * (0-based). Times are Transport positions ("bars:beats:16ths"), so the loop stays on the grid
 * when the Transport's tempo changes. Returns the Part (dispose it to remove the loop).
 */
export function scheduleLoop(
  transport: ReturnType<typeof Tone.getTransport>,
  loop: SynthLoop, voice: SynthVoice, key: string, scale: Scale, startBar?: number,
): Tone.Part | null;
export function scheduleLoop(
  transport: ReturnType<typeof Tone.getTransport>,
  loop: KitLoop, voice: KitVoice, key: string, scale: Scale, startBar?: number,
): Tone.Part | null;
export function scheduleLoop(
  transport: ReturnType<typeof Tone.getTransport>,
  loop: PlayableLoop, voice: SynthVoice | KitVoice, key: string, scale: Scale, startBar = 0,
): Tone.Part | null {
  const sps = () => 60 / transport.bpm.value / 4;
  let part: Tone.Part;
  if (loop.source === "kit") {
    const p = drumPatternById(loop.pattern);
    if (!p) return null;
    part = new Tone.Part<{ time: string; hit: DrumHit }>((time, e) => (voice as KitVoice).play(e.hit, time),
      p.hits.map((hit) => ({ time: stepToBBS(hit.step), hit })));
  } else {
    const p = patternById(loop.pattern);
    const notes = p && renderPattern(p, key, scale);
    if (!notes) return null;
    part = new Tone.Part<{ time: string; note: SynthNote }>((time, e) => (voice as SynthVoice).play(e.note, time, sps()),
      notes.map((note) => ({ time: stepToBBS(note.step), note })));
  }
  part.loop = true;
  part.loopEnd = `${loop.bars}m`;
  return part.start(`${startBar}m`);
}

// ---- Offline render for graders (X3) ----

export type OfflineRender = {
  loop: PlayableLoop;
  key: string;
  scale: Scale;
  bpm: number;
  sampleRate: number;
  /** Mono samples, the loop played `repeats` times from 0 s plus a release tail. */
  samples: Float32Array;
  /** What should sound, when: compare onsets and pitch against these. */
  events: TimedEvent[];
  /** Seconds from a note's start to its full level for this preset (pads swell in). */
  attack: number;
  /** Seconds of MP3 padding skipped per drum sound (kits only). */
  offsets?: Record<DrumSound, number>;
};

/**
 * Render a loop offline (Tone.Offline: an OfflineAudioContext, faster than real time) through the
 * same voice and Transport scheduling the Studio will use. Kits are loaded first.
 */
export async function renderLoopOffline(
  loop: PlayableLoop, key: string, scale: Scale, bpm: number, opts: { repeats?: number; sampleRate?: number; tail?: number } = {},
): Promise<OfflineRender | null> {
  const repeats = opts.repeats ?? 2, sampleRate = opts.sampleRate ?? 44100;
  const tempo = clampBpm(bpm);
  const events = loopEvents(loop, key, scale, tempo, repeats);
  if (!events) return null;
  const kit = loop.source === "kit" ? await loadKit(loop.kit) : null;
  const tail = opts.tail ?? (loop.source === "synth" && loop.preset === "pad" ? loop.knobs.envelope + 0.5 : 1);
  const duration = loopSeconds(loop, tempo, repeats) + tail;

  const buffer = await Tone.Offline(({ transport, destination }) => {
    transport.bpm.value = tempo;
    const part = kit
      ? scheduleLoop(transport, loop as KitLoop, createKitVoice(kit, destination), key, scale)
      : scheduleLoop(transport, loop as SynthLoop, createSynthVoice((loop as SynthLoop).preset, (loop as SynthLoop).knobs, destination), key, scale);
    // Stop looping after `repeats` passes, then let the tail ring out.
    part?.stop(`${loop.bars * repeats}m`);
    transport.start(0);
  }, duration, 1, sampleRate);

  return {
    loop, key, scale, bpm: tempo, sampleRate, samples: buffer.getChannelData(0), events,
    attack: loop.source === "synth" ? PRESETS[loop.preset].attack : 0.0005,
    offsets: kit?.offsets,
  };
}

/** The length of a 16th at a tempo, re-exported for callers that schedule voices on their own clock. */
export { secondsPerStep };
