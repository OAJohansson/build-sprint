"use client";

// The sound engine (decision 0019): synthesised instruments, one channel per lane (S5: LaneMixer,
// volume, pan, mute, solo), a master filter, and a lookahead scheduler on the audio clock. Every
// 25 ms it books the notes that fall in the next 120 ms at their exact time ("A Tale of Two
// Clocks", Chris Wilson), so timing never depends on the screen.
import * as Tone from "tone";
import { RECIPES, type Inst, type Note } from "@/lib/recipes";
import { STEPS, buildIndex, previewHits, stepOfBar, type Hit } from "@/lib/schedule";
import { DEFAULT_BPM, clampBpm, secondsPerStep } from "@/lib/tempo";
import { loopById, type Region } from "@/lib/timeline";
import { createKitVoice, createSynthVoice, loadKit, type KitVoice, type LoadedKit, type SynthVoice } from "@/lib/synths/engine";
import type { KitId } from "@/lib/synths/kits";
import type { Sound } from "@/lib/synths/loop";
import { buildSoundIndex, previewSoundHits, type SoundHit } from "@/lib/synths/schedule";
import type { Scale } from "@/lib/synths/theory";
import { levelled, passSignature, renderLibPass, type LibLoop } from "@/lib/make/lib-loop";
import { laneMix, laneOfRegion, lanesOf, type Lane } from "@/lib/studio-lanes";
import { LaneMixer } from "@/lib/studio-mixer";

const LOOKAHEAD = 0.12, TICK_MS = 25;
// Previews (crate loops, the sound drawer's Listen) play at the old lanes' levels: drums, bass,
// chords, top/FX. A lane's own level is its type's trim (studio-lanes.ts, the same numbers) + fader.
const TRACK_DB = [0, -3, -7, -9];

type Play = (note: Note, time: number) => void;

/** Tempo-synced echoes: their delay is a number of 16ths, so it follows the project tempo. */
type Synced = { node: Tone.FeedbackDelay; steps: number };

/** Build every instrument once, each wired into its track's channel. `sps` is the current 16th length. */
function makeInstruments(channels: Tone.InputNode[], sps: () => number): { play: Record<Inst, Play>; synced: Synced[] } {
  const [drums, bass, chords, top] = channels;
  const sec = (steps: number) => steps * sps();

  // Drum kit: a falling-pitch kick, filtered noise for hats, claps and snares (909 territory).
  const kick = new Tone.MembraneSynth({ pitchDecay: 0.045, octaves: 6, envelope: { attack: 0.001, decay: 0.32, sustain: 0 } }).connect(drums);
  const rumble = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 2, volume: -14, envelope: { attack: 0.005, decay: 0.25, sustain: 0 } }).connect(drums);
  const hatF = new Tone.Filter(8000, "highpass").connect(drums);
  const hat = new Tone.NoiseSynth({ noise: { type: "white" }, volume: -14, envelope: { attack: 0.001, decay: 0.04, sustain: 0 } }).connect(hatF);
  const ohat = new Tone.NoiseSynth({ noise: { type: "white" }, volume: -16, envelope: { attack: 0.001, decay: 0.18, sustain: 0 } }).connect(hatF);
  const clapF = new Tone.Filter(1600, "bandpass").connect(drums);
  const clap = new Tone.NoiseSynth({ noise: { type: "pink" }, volume: -4, envelope: { attack: 0.002, decay: 0.16, sustain: 0 } }).connect(clapF);
  const snareF = new Tone.Filter(2500, "bandpass").connect(drums);
  const snare = new Tone.NoiseSynth({ noise: { type: "white" }, volume: -8, envelope: { attack: 0.001, decay: 0.12, sustain: 0 } }).connect(snareF);
  const tom = new Tone.MembraneSynth({ pitchDecay: 0.06, octaves: 2.5, volume: -6, envelope: { attack: 0.001, decay: 0.35, sustain: 0 } }).connect(drums);
  const rimF = new Tone.Filter(3500, "bandpass").connect(drums);
  rimF.Q.value = 4;
  const rim = new Tone.NoiseSynth({ noise: { type: "white" }, volume: -6, envelope: { attack: 0.001, decay: 0.03, sustain: 0 } }).connect(rimF);
  const kit: Play = (n, t) => {
    switch (n.note) {
      case "kick": kick.triggerAttackRelease("A0", 0.3, t, n.vel); break;
      case "rumble": rumble.triggerAttackRelease("A1", sec(n.dur), t, n.vel); break;
      case "hat": hat.triggerAttackRelease(0.04, t, n.vel); break;
      case "ohat": ohat.triggerAttackRelease(0.15, t, n.vel); break;
      case "clap": clap.triggerAttackRelease(0.15, t, n.vel); break;
      case "snare": snare.triggerAttackRelease(0.1, t, n.vel); break;
      case "tomL": tom.triggerAttackRelease("D2", 0.3, t, n.vel); break;
      case "tomM": tom.triggerAttackRelease("G2", 0.3, t, n.vel); break;
      case "tomH": tom.triggerAttackRelease("C3", 0.25, t, n.vel); break;
      case "rim": rim.triggerAttackRelease(0.03, t, n.vel); break;
    }
  };

  // Bass: a sine sub, the 303-style acid line, punchy offbeats and a detuned "reese".
  const mono = (opts: ConstructorParameters<typeof Tone.MonoSynth>[0]) => new Tone.MonoSynth(opts).connect(bass);
  const sub = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.9, release: 0.2 } }).connect(bass);
  const acid = mono({ oscillator: { type: "sawtooth" }, volume: -6, filter: { Q: 9, type: "lowpass" }, envelope: { attack: 0.002, decay: 0.15, sustain: 0.3, release: 0.05 }, filterEnvelope: { attack: 0.002, decay: 0.16, sustain: 0.1, baseFrequency: 180, octaves: 3.6 } });
  const pump = mono({ oscillator: { type: "square" }, volume: -8, filter: { Q: 2 }, envelope: { attack: 0.003, decay: 0.12, sustain: 0.2, release: 0.05 }, filterEnvelope: { baseFrequency: 120, octaves: 2.5, decay: 0.12, sustain: 0.1 } });
  const rubber = mono({ oscillator: { type: "fmsquare" }, volume: -10, envelope: { attack: 0.002, decay: 0.2, sustain: 0.2, release: 0.08 }, filterEnvelope: { baseFrequency: 150, octaves: 3, decay: 0.2, sustain: 0.2 } });
  const reese = mono({ oscillator: { type: "fatsawtooth", count: 3, spread: 30 }, volume: -12, filter: { Q: 1 }, envelope: { attack: 0.02, decay: 0.3, sustain: 0.8, release: 0.3 }, filterEnvelope: { baseFrequency: 90, octaves: 2, decay: 0.4, sustain: 0.5 } });
  const octave = mono({ oscillator: { type: "sawtooth" }, volume: -9, filter: { Q: 3 }, envelope: { attack: 0.002, decay: 0.12, sustain: 0.1, release: 0.05 }, filterEnvelope: { baseFrequency: 220, octaves: 2.8, decay: 0.1, sustain: 0.1 } });
  const pluck = mono({ oscillator: { type: "triangle" }, volume: -4, filter: { Q: 1.5 }, envelope: { attack: 0.002, decay: 0.25, sustain: 0, release: 0.1 }, filterEnvelope: { baseFrequency: 160, octaves: 3, decay: 0.18, sustain: 0 } });
  const tone = (s: Tone.Synth | Tone.MonoSynth): Play => (n, t) => s.triggerAttackRelease(n.note, sec(n.dur) * 0.95, t, n.vel);

  // Chords: polyphonic synths with different envelopes and filters.
  const poly = (opts: ConstructorParameters<typeof Tone.Synth>[0], cutoff: number, volume: number) => {
    const f = new Tone.Filter(cutoff, "lowpass").connect(chords);
    const p = new Tone.PolySynth(Tone.Synth, opts).connect(f);
    p.volume.value = volume;
    return p;
  };
  const stab = poly({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.003, decay: 0.18, sustain: 0, release: 0.08 } }, 3200, -12);
  const pad = poly({ oscillator: { type: "fatsawtooth", count: 3, spread: 20 }, envelope: { attack: 0.7, decay: 0.5, sustain: 0.8, release: 1.4 } }, 1300, -22);
  const organ = poly({ oscillator: { type: "square" }, envelope: { attack: 0.005, decay: 0.3, sustain: 0.3, release: 0.15 } }, 2600, -20);
  const strings = poly({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.45, decay: 0.3, sustain: 0.8, release: 1 } }, 2200, -22);
  const piano = poly({ oscillator: { type: "triangle" }, envelope: { attack: 0.002, decay: 0.45, sustain: 0, release: 0.2 } }, 5000, -12);
  const wash = poly({ oscillator: { type: "sine" }, envelope: { attack: 2, decay: 1, sustain: 0.9, release: 3 } }, 4000, -14);
  // Electric piano (FM, Rhodes-ish), a dub stab drowned in echo, and a plucky arpeggio.
  const keysF = new Tone.Filter(4500, "lowpass").connect(chords);
  const keys = new Tone.PolySynth(Tone.FMSynth, { harmonicity: 3, modulationIndex: 2.2, envelope: { attack: 0.003, decay: 0.9, sustain: 0.15, release: 0.6 }, modulationEnvelope: { attack: 0.002, decay: 0.4, sustain: 0, release: 0.3 } }).connect(keysF);
  keys.volume.value = -9;
  // Disco string stabs: a fast attack (the slow "strings" pad can't speak in a 16th).
  const disco = poly({ oscillator: { type: "fatsawtooth", count: 3, spread: 18 }, envelope: { attack: 0.008, decay: 0.22, sustain: 0.25, release: 0.25 } }, 5200, -8);
  const echo = new Tone.FeedbackDelay({ delayTime: 3 * sps(), feedback: 0.55, wet: 0.45 }).connect(new Tone.Filter(1800, "lowpass").connect(chords));
  const dub = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sawtooth" }, envelope: { attack: 0.004, decay: 0.15, sustain: 0, release: 0.1 } }).connect(echo);
  dub.volume.value = -14;
  const arpDelay = new Tone.FeedbackDelay({ delayTime: 2 * sps(), feedback: 0.3, wet: 0.25 }).connect(chords);
  const arp = new Tone.Synth({ oscillator: { type: "square" }, volume: -13, envelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.08 } }).connect(arpDelay);
  const chordPlay = (p: Tone.PolySynth): Play => (n, t) => p.triggerAttackRelease(n.note, sec(n.dur) * 0.95, t, n.vel);

  // Top and FX: shaker, a vowel-ish FM chop, ride, cowbell and noise sweeps.
  const shakerF = new Tone.Filter(6000, "highpass").connect(top);
  const shaker = new Tone.NoiseSynth({ noise: { type: "white" }, volume: -12, envelope: { attack: 0.003, decay: 0.05, sustain: 0 } }).connect(shakerF);
  const chop = new Tone.FMSynth({ harmonicity: 1.5, modulationIndex: 6, volume: -10, envelope: { attack: 0.005, decay: 0.15, sustain: 0.2, release: 0.1 } }).connect(top);
  const ride = new Tone.MetalSynth({ volume: -30, envelope: { attack: 0.001, decay: 0.7, release: 0.2 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).connect(top);
  const bell = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "square" }, envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.05 } }).connect(new Tone.Filter(3000, "bandpass").connect(top));
  bell.volume.value = -16;
  // Noise sweeps: each has its own noise and filter, so a riser and a downlifter can overlap.
  // Rising sweeps fade in; falling ones start loud and fade out.
  const makeSweep = (from: number, to: number, volume = -10): Play => {
    const f = new Tone.Filter(from, "bandpass").connect(top);
    f.Q.value = 1.2;
    const noise = new Tone.NoiseSynth({ noise: { type: "white" }, volume, envelope: { attack: 1, decay: 0, sustain: 1, release: 0.05 } }).connect(f);
    const rising = to > from;
    return (n, t) => {
      const d = sec(n.dur);
      noise.envelope.attack = rising ? d * 0.9 : 0.01;
      noise.envelope.release = rising ? 0.05 : d * 0.9;
      f.frequency.cancelScheduledValues(t);
      f.frequency.setValueAtTime(from, t);
      f.frequency.exponentialRampToValueAtTime(to, t + d);
      noise.triggerAttackRelease(rising ? d : 0.02, t, n.vel);
    };
  };

  // Latin percussion, a siren and vinyl crackle.
  const conga = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 1.2, volume: -10, envelope: { attack: 0.001, decay: 0.22, sustain: 0 } }).connect(top);
  const clave = new Tone.Synth({ oscillator: { type: "sine" }, volume: -3, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 } }).connect(top);
  const tambF = new Tone.Filter(7500, "bandpass").connect(top);
  const tamb = new Tone.NoiseSynth({ noise: { type: "white" }, volume: 2, envelope: { attack: 0.002, decay: 0.09, sustain: 0 } }).connect(tambF);
  const siren = new Tone.Synth({ oscillator: { type: "sawtooth" }, volume: -12, envelope: { attack: 0.05, decay: 0, sustain: 1, release: 0.2 } }).connect(new Tone.Filter(2500, "lowpass").connect(top));
  const crackleF = new Tone.Filter(2000, "highpass").connect(top);
  const crackle = new Tone.NoiseSynth({ noise: { type: "brown" }, volume: -16, envelope: { attack: 0.001, decay: 0.012, sustain: 0 } }).connect(crackleF);
  const sirenPlay: Play = (n, t) => {
    const d = sec(n.dur), base = Tone.Frequency(n.note).toFrequency();
    siren.frequency.cancelScheduledValues(t);
    siren.triggerAttackRelease(base, d * 0.95, t, n.vel);
    // Up and down twice a bar, like a rave siren.
    for (let i = 0, step = sec(8); i * step < d; i++) {
      siren.frequency.linearRampToValueAtTime(i % 2 ? base : base * 1.6, t + (i + 1) * step);
    }
  };

  const play: Record<Inst, Play> = {
    kit, sub: tone(sub), acid: tone(acid), pump: tone(pump), rubber: tone(rubber), reese: tone(reese), octave: tone(octave), pluck: tone(pluck),
    stab: chordPlay(stab), pad: chordPlay(pad), organ: chordPlay(organ), strings: chordPlay(strings), piano: chordPlay(piano), wash: chordPlay(wash),
    keys: chordPlay(keys), dub: chordPlay(dub), arp: tone(arp),
    conga: (n, t) => conga.triggerAttackRelease(n.note, 0.2, t, n.vel),
    clave: (n, t) => clave.triggerAttackRelease("D7", 0.04, t, n.vel),
    tamb: (n, t) => tamb.triggerAttackRelease(0.08, t, n.vel),
    fall: makeSweep(9000, 200, 0),
    disco: chordPlay(disco),
    siren: sirenPlay,
    crackle: (n, t) => crackle.triggerAttackRelease(0.012, t, n.vel),
    shaker: (n, t) => shaker.triggerAttackRelease(0.05, t, n.vel),
    chop: tone(chop as unknown as Tone.Synth),
    ride: (n, t) => ride.triggerAttackRelease("C4", 0.6, t, n.vel),
    cowbell: (n, t) => bell.triggerAttackRelease(["C#5", "G#5"], 0.08, t, n.vel),
    riser: makeSweep(300, 9000),
    swell: makeSweep(2000, 12000),
  };
  return { play, synced: [{ node: echo, steps: 3 }, { node: arpDelay, steps: 2 }] };
}

/** Crate instruments wired to one output (a lane, or the previews' four channels). */
type InstrumentSet = { play: Record<Inst, Play>; synced: Synced[]; bus?: Tone.Gain };

export class AudioEngine {
  private ready: Promise<void> | null = null;
  /** Seconds per 16th at the project tempo (F10). */
  private sps = secondsPerStep(DEFAULT_BPM);
  private master!: Tone.Filter;
  private mixer: LaneMixer | null = null;
  /** The previews' channels, at the old lanes' levels and never muted (a muted lane's loop can
   *  still be auditioned in the crate). */
  private previewChannels: Tone.Channel[] = [];
  private previewSet: InstrumentSet | null = null;
  /** Crate instruments per lane, built the first time a lane holds a crate loop (S5): each lane
   *  pans and mutes on its own, and two lanes of one kind never share a mono synth. */
  private laneSets = new Map<string, InstrumentSet>();
  /** The open track's length in 16th steps (64 bars unless a template set its own). */
  private steps = STEPS;
  private regions: Region[] = [];
  private lanes: Lane[] = lanesOf({ muted: [false, false, false, false] });
  private audible = new Set(this.lanes.map((l) => l.id));
  /** Per lane: crate notes and the track's own sounds by the step they start on. */
  private laneIndex: { lane: string; crate: Map<number, Hit[]>; sounds: Map<number, SoundHit[]> }[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  // The clock: step `nextStep` sounds at audio time `nextTime`.
  private nextStep = 0;
  private nextTime = 0;
  private originStep = 0;
  private originTime = 0;
  private playing = false;
  private preview: string | null = null;

  // The track's own sounds (S3/S4): synth and kit voices per sound and lane, AI loop audio per
  // stored loop, library blocks as rendered passes (S5).
  private sounds: Sound[] = [];
  private key = "A";
  private scale: Scale = "minor";
  private bpm = DEFAULT_BPM;
  /** Voices by `${soundId}@${laneId}` (or `@preview` for the drawer's Listen). */
  private voices = new Map<string, { soundId: string; sig: string; voice: SynthVoice | KitVoice }>();
  private kits = new Map<KitId, LoadedKit>();
  private aiAudio = new Map<string, Tone.ToneAudioBuffer | "loading" | "failed">();
  private aiPlaying = new Set<Tone.ToneBufferSource>();
  private previewSound: Sound | null = null;
  private code = "";
  /** Library blocks (S5): one rendered, level-matched pass per sound, in the track's key and tempo. */
  private libPasses = new Map<string, { sig: string; buf: Tone.ToneAudioBuffer }>();

  /** Start the audio context; browsers only allow this after a click or key press. */
  start() {
    this.ready ??= (async () => {
      await Tone.start();
      const limiter = new Tone.Limiter(-1).toDestination();
      // The master filter stays fully open (the Filter knob went in S5, L200); kept so the sound is as before.
      this.master = new Tone.Filter({ type: "lowpass", frequency: 20000, Q: 1 }).connect(limiter);
      this.mixer = new LaneMixer(this.master);
      this.mixer.sync(this.lanes);
      this.previewChannels = TRACK_DB.map((db) => new Tone.Channel({ volume: db }).connect(this.master));
      this.previewSet = makeInstruments(this.previewChannels, () => this.sps);
      this.prepare();
    })();
    return this.ready;
  }

  /** Change the tempo, also mid-play: the clock restarts from where the music is, so nothing jumps. */
  setTempo(bpm: number) {
    const next = secondsPerStep(clampBpm(bpm));
    if (next === this.sps) return;
    // Steps already booked (up to ~120 ms ahead) keep their time; from the next unbooked step
    // on, the clock runs at the new tempo. The playhead counts from that step.
    if (this.timer) {
      this.originStep = this.nextStep;
      this.originTime = this.nextTime;
    }
    this.sps = next;
    this.bpm = clampBpm(bpm);
    for (const set of this.sets()) set.synced.forEach((d) => d.node.delayTime.rampTo(d.steps * next, 0.05));
    this.warmLib();
  }

  setRegions(regions: Region[]) {
    this.regions = regions;
    this.reindex();
  }

  /** The track's lanes (S5): their mix is heard at once; blocks follow their lane. */
  setLanes(lanes: Lane[]) {
    this.lanes = lanes;
    const mix = laneMix(lanes);
    this.audible = new Set(mix.filter((m) => m.audible).map((m) => m.id));
    this.mixer?.sync(lanes);
    for (const [id, set] of this.laneSets) {
      if (lanes.some((l) => l.id === id)) continue;
      // shortcut: a removed lane's instruments are cut loose (bus disposed) for the GC, not disposed one by one; fine for a few lanes a session.
      set.bus?.dispose();
      this.laneSets.delete(id);
    }
    this.reindex();
  }

  /** The track's own sounds; a changed sound (knobs, pattern) applies from its next note. */
  setSounds(sounds: Sound[]) {
    this.sounds = sounds;
    const keep = new Set([...sounds.map((x) => x.id), this.previewSound?.id]);
    for (const [k, v] of this.voices) if (!keep.has(v.soundId)) { v.voice.dispose(); this.voices.delete(k); }
    for (const id of this.libPasses.keys()) if (!keep.has(id)) this.libPasses.delete(id);
    for (const x of sounds) for (const [k, v] of this.voices) if (v.soundId === x.id) this.refreshVoice(x, k);
    this.reindex();
    this.warmLib();
  }

  /** The track's key: synth patterns are rendered in it (A minor when the track has none). */
  setKey(key: string, scale: Scale) {
    this.key = key;
    this.scale = scale;
    this.reindex();
    this.warmLib();
  }

  /** The access code, for fetching stored AI loops' audio. */
  setAccessCode(code: string) { this.code = code; }

  /** Hand over a just-generated AI loop's audio so it plays without a fetch. */
  async addAiAudio(aiId: string, bytes: ArrayBuffer) {
    try {
      const decoded = await Tone.getContext().decodeAudioData(bytes);
      this.aiAudio.set(aiId, new Tone.ToneAudioBuffer(decoded));
    } catch { this.aiAudio.set(aiId, "failed"); }
  }

  /** Loop one sound alone (the sound drawer's Listen, a library card), or null to stop. */
  async setPreviewSound(sound: Sound | null) {
    const was = this.previewSound;
    this.previewSound = sound;
    if (was && was.id !== sound?.id) this.dropVoice(`${was.id}@preview`);
    if (!sound) { if (!this.playing && !this.preview) this.halt(); return; }
    await this.start();
    if (sound.source === "ai") this.loadAi(sound.aiId);
    else if (sound.source === "lib") this.libPass(sound);
    else this.voiceFor(sound, null);
    // An AI loop starts on its first beat, so wait for its audio before the clock starts.
    if (sound.source === "ai") await this.aiLoads.get(sound.aiId);
    if (this.previewSound?.id !== sound.id) return;
    if (!this.timer) this.resetClock(0);
  }

  /** The track's length in bars: playback wraps there. */
  setBars(bars: number) {
    const steps = Math.max(16, Math.round(bars) * 16);
    if (steps === this.steps) return;
    this.steps = steps;
    this.reindex();
  }

  async playFrom(bar: number) {
    await this.start();
    this.playing = true;
    this.resetClock(stepOfBar(bar, this.steps));
  }

  stop() {
    this.playing = false;
    this.stopAi();
    if (!this.preview && !this.previewSound) this.halt();
  }

  async setPreview(loopId: string | null) {
    this.preview = loopId;
    if (!loopId) { if (!this.playing && !this.previewSound) this.halt(); return; }
    await this.start();
    if (!this.timer) this.resetClock(0);
  }

  /** Where the music is now, in bars (1 = the start), or null when the track isn't playing. */
  position(): number | null {
    if (!this.playing) return null;
    const step = this.originStep + (Tone.immediate() - this.originTime) / this.sps;
    return (((step % this.steps) + this.steps) % this.steps) / 16 + 1;
  }

  private *sets() {
    if (this.previewSet) yield this.previewSet;
    yield* this.laneSets.values();
  }

  /** Rebuild the per-lane note index, then make sure every lane has what it needs to play. */
  private reindex() {
    const byLane = new Map<string, Region[]>();
    for (const r of this.regions) {
      const lane = laneOfRegion(r, this.lanes);
      if (!lane) continue;
      byLane.set(lane.id, [...(byLane.get(lane.id) ?? []), r]);
    }
    this.laneIndex = this.lanes.map((l) => {
      const rs = byLane.get(l.id) ?? [];
      return { lane: l.id, crate: buildIndex(rs, RECIPES, this.steps), sounds: buildSoundIndex(rs, this.sounds, this.key, this.scale, this.steps) };
    });
    this.prepare();
  }

  /** Before the music needs them: crate instruments for every lane with a crate loop, voices for
   *  every sound on its lane, kits and AI audio loading. Nothing until the audio has started. */
  private prepare() {
    if (!this.mixer) return;
    const byId = new Map(this.sounds.map((x) => [x.id, x]));
    for (const r of this.regions) {
      const lane = laneOfRegion(r, this.lanes);
      if (!lane) continue;
      const x = byId.get(r.loopId);
      if (!x) { if (RECIPES[r.loopId]) this.laneSet(lane.id); continue; }
      if (x.source === "ai") this.loadAi(x.aiId);
      else if (x.source !== "lib") this.voiceFor(x, lane.id);
    }
  }

  /** A lane's crate instruments, built on first use into its channel. */
  private laneSet(laneId: string): InstrumentSet | null {
    const have = this.laneSets.get(laneId);
    if (have) return have;
    const input = this.mixer?.input(laneId);
    if (!input) return null;
    const bus = new Tone.Gain(1).connect(input);
    // All four kinds of crate instrument go to this lane's one bus.
    const built = makeInstruments([bus, bus, bus, bus], () => this.sps);
    const set = { ...built, bus };
    this.laneSets.set(laneId, set);
    return set;
  }

  private resetClock(step: number) {
    this.halt();
    this.stopAi();
    this.originStep = this.nextStep = step;
    this.originTime = this.nextTime = Tone.immediate() + 0.05;
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.tick();
  }

  private halt() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private tick() {
    const until = Tone.immediate() + LOOKAHEAD;
    while (this.nextTime < until) {
      const k = this.nextStep, t = this.nextTime;
      if (this.playing) for (const b of this.booked(k)) b.play(t);
      if (this.preview) {
        const recipe = RECIPES[this.preview], loop = loopById(this.preview);
        if (recipe && loop && this.previewSet) for (const note of previewHits(recipe, loop.bars, k)) this.sound(this.previewSet, this.preview, note, t);
      }
      if (this.previewSound) {
        for (const hit of previewSoundHits(this.previewSound, this.key, this.scale, k)) this.playSound(hit, t, null);
      }
      this.nextStep = k + 1;
      this.nextTime = t + this.sps;
    }
  }

  /** What the track books on step k, lane by lane (a silent lane books nothing), each with where it
   *  goes; tick plays them, and the dev-only schedule dump describes them (S5 before/after check). */
  private booked(k: number): { play: (t: number) => void; what: unknown[] }[] {
    const out: { play: (t: number) => void; what: unknown[] }[] = [];
    const gain = new Map(laneMix(this.lanes).map((m) => [m.id, m.gainDb]));
    for (const li of this.laneIndex) {
      if (!this.audible.has(li.lane)) continue;
      const db = gain.get(li.lane);
      for (const hit of li.crate.get(k % this.steps) ?? []) {
        out.push({ play: (t) => { const set = this.laneSet(li.lane); if (set) this.sound(set, hit.loopId, hit.note, t); }, what: [k, hit.loopId, hit.note, db] });
      }
      for (const hit of li.sounds.get(k % this.steps) ?? []) {
        out.push({ play: (t) => this.playSound(hit, t, li.lane), what: [k, hit.soundId, { ...hit, track: undefined, soundId: undefined }, db] });
      }
    }
    return out;
  }

  /** Dev only: a level meter on the master bus (before the limiter), for before/after level checks. */
  devMeter() { const m = new Tone.Meter({ smoothing: 0 }); this.master.connect(m); return m; }

  /** Dev only: every note the open track books over its whole length, as plain data. */
  devSchedule(): unknown[][] {
    const out: unknown[][] = [];
    for (let k = 0; k < this.steps; k++) for (const b of this.booked(k)) out.push(b.what);
    return out;
  }

  /** Play one note. A loop the engine doesn't know, or an instrument that throws, is skipped
   *  (and reported once) so one bad sound can never stop the music. */
  private failed = new Set<string>();
  private sound(set: InstrumentSet, loopId: string, note: Note, t: number) {
    const play = set.play[RECIPES[loopId]?.inst];
    try {
      if (!play) throw new Error("no recipe or instrument");
      play(note, t);
    } catch (e) {
      if (!this.failed.has(loopId)) {
        this.failed.add(loopId);
        console.error(`[six-am] couldn't play "${loopId}":`, e);
      }
    }
  }

  /** Where a sound plays: its lane's channel, or (laneId null) the previews' channel of its old lane. */
  private dest(x: Sound, laneId: string | null): Tone.InputNode | undefined {
    return laneId ? this.mixer?.input(laneId) : this.previewChannels[x.lane];
  }

  /** A synth or kit sound's voice on a lane (null = preview), built the first time it's needed. */
  private voiceFor(x: Sound, laneId: string | null): SynthVoice | KitVoice | undefined {
    const key = `${x.id}@${laneId ?? "preview"}`;
    if (!this.voices.has(key)) this.refreshVoice(x, key);
    return this.voices.get(key)?.voice;
  }

  private dropVoice(key: string) {
    this.voices.get(key)?.voice.dispose();
    this.voices.delete(key);
  }

  /** Build (or re-knob) a sound's voice. Same preset → knobs glide; another preset or kit → a new voice. */
  private refreshVoice(x: Sound, key: string) {
    if (x.source === "lib" || x.source === "ai") return; // played from audio, no voice
    if (!this.mixer) { if (x.source === "kit") this.loadKitOnce(x.kit); return; }
    const laneId = key.slice(key.lastIndexOf("@") + 1);
    const dest = this.dest(x, laneId === "preview" ? null : laneId);
    if (!dest) return;
    const sig = x.source === "kit" ? `kit:${x.kit}` : `synth:${x.preset}`;
    const have = this.voices.get(key);
    if (have && have.sig === sig) {
      if (x.source === "synth") (have.voice as SynthVoice).setKnobs(x.knobs);
      return;
    }
    this.dropVoice(key);
    if (x.source === "synth") {
      this.voices.set(key, { soundId: x.id, sig, voice: createSynthVoice(x.preset, x.knobs, dest) });
    } else {
      const kit = this.kits.get(x.kit);
      if (kit) this.voices.set(key, { soundId: x.id, sig, voice: createKitVoice(kit, dest) });
      else this.loadKitOnce(x.kit);
    }
  }

  private kitLoads = new Set<KitId>();
  private loadKitOnce(id: KitId) {
    if (this.kitLoads.has(id)) return;
    this.kitLoads.add(id);
    loadKit(id).then((k) => {
      this.kits.set(id, k);
      this.prepare();
      if (this.previewSound?.source === "kit" && this.previewSound.kit === id) this.voiceFor(this.previewSound, null);
    }).catch((e) => { this.kitLoads.delete(id); console.error(`[six-am] couldn't load the ${id} kit:`, e); });
  }

  private aiLoads = new Map<string, Promise<void>>();
  private loadAi(aiId: string) {
    if (this.aiAudio.has(aiId) || !this.code) return;
    this.aiAudio.set(aiId, "loading");
    const p = fetch(`/api/loops/${aiId}`, { headers: { "x-access-code": this.code } })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
      .then((b) => this.addAiAudio(aiId, b))
      .catch((e) => { this.aiAudio.set(aiId, "failed"); console.error("[six-am] couldn't load an AI loop:", e); });
    this.aiLoads.set(aiId, p);
  }

  private stopAi() {
    const now = Tone.immediate();
    for (const src of this.aiPlaying) { try { src.stop(now); } catch { /* already stopped */ } }
    this.aiPlaying.clear();
  }

  /** A library block's pass in the track's key and tempo, level-matched to the crate (LIB_LEVEL_DB),
   *  rendered on first use and again when the sound, key or tempo changes. */
  // shortcut: renders on the main thread (23 ms for a 4-bar acid pass, measured S5; again on each tempo or key change); move to make.worker.ts if tempo drags stutter.
  private libPass(x: LibLoop): Tone.ToneAudioBuffer | null {
    if (!this.mixer) return null;
    const track = { key: this.key, scale: this.scale, bpm: this.bpm };
    const sig = passSignature(x, track);
    const have = this.libPasses.get(x.id);
    if (have?.sig === sig) return have.buf;
    const r = levelled(renderLibPass(x, track, Tone.getContext().sampleRate));
    const buf = Tone.ToneAudioBuffer.fromArray([r.left, r.right]);
    this.libPasses.set(x.id, { sig, buf });
    return buf;
  }

  /** Render the track's library blocks ahead of the scheduler, so the first hit doesn't wait. */
  private warmLib() {
    for (const x of this.sounds) if (x.source === "lib") this.libPass(x);
  }

  /** Play one hit of a track sound on a lane (null = preview); like sound(), a failure is reported once and skipped. */
  private playSound(hit: SoundHit, t: number, laneId: string | null) {
    const x = laneId === null ? this.previewSound : this.sounds.find((s) => s.id === hit.soundId);
    if (!x || x.id !== hit.soundId) return;
    try {
      if ((hit.kind === "ai" && x.source === "ai") || (hit.kind === "lib" && x.source === "lib")) {
        const dest = this.dest(x, laneId);
        if (!dest) return;
        let buf: Tone.ToneAudioBuffer | null;
        let rate = 1, gain = 1;
        if (x.source === "ai") {
          const a = this.aiAudio.get(x.aiId);
          if (!a) this.loadAi(x.aiId);
          buf = a instanceof Tone.ToneAudioBuffer ? a : null;
          // One pass is exactly `bars` bars at the tempo it was made at; another tempo resamples it.
          // shortcut: playbackRate changes pitch with tempo; time-stretch if tracks move far from the loop's tempo.
          rate = this.bpm / x.bpm;
          gain = 0.35; // -9 dB: a full template mix stays under 0 dBFS (X3 F3)
        } else {
          // Rendered at the track's tempo, so it plays at its own rate and stays on the grid.
          buf = this.libPass(x);
        }
        if (!buf) return;
        const src = new Tone.ToneBufferSource({ url: buf, playbackRate: rate }).connect(dest);
        src.onended = () => { this.aiPlaying.delete(src); src.dispose(); };
        src.start(t, 0, undefined, gain);
        src.stop(t + hit.dur * this.sps);
        this.aiPlaying.add(src);
        return;
      }
      const v = this.voiceFor(x, laneId);
      if (!v) return;
      if (hit.kind === "synth") (v as SynthVoice).play(hit.note, t, this.sps);
      else if (hit.kind === "kit") (v as KitVoice).play(hit.hit, t);
    } catch (e) {
      if (!this.failed.has(x.id)) {
        this.failed.add(x.id);
        console.error(`[six-am] couldn't play sound "${x.name}":`, e);
      }
    }
  }
}
