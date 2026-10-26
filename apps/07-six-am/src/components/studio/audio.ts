"use client";

// The sound engine (decision 0019): synthesised instruments, one channel per track, a master
// filter, and a lookahead scheduler on the audio clock. Every 25 ms it books the notes that fall
// in the next 120 ms at their exact time ("A Tale of Two Clocks", Chris Wilson), so timing never
// depends on the screen.
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

const LOOKAHEAD = 0.12, TICK_MS = 25;
const TRACK_DB = [0, -3, -7, -9]; // drums, bass, chords, top/FX

type Play = (note: Note, time: number) => void;

/** Tempo-synced echoes: their delay is a number of 16ths, so it follows the project tempo. */
type Synced = { node: Tone.FeedbackDelay; steps: number };

/** Build every instrument once, each wired into its track's channel. `sps` is the current 16th length. */
function makeInstruments(channels: Tone.Channel[], sps: () => number): { play: Record<Inst, Play>; synced: Synced[] } {
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

export class AudioEngine {
  private ready: Promise<void> | null = null;
  private play!: Record<Inst, Play>;
  private synced: Synced[] = [];
  /** Seconds per 16th at the project tempo (F10). */
  private sps = secondsPerStep(DEFAULT_BPM);
  private channels: Tone.Channel[] = [];
  private master!: Tone.Filter;
  private index = new Map<number, Hit[]>();
  /** The open track's length in 16th steps (64 bars unless a template set its own). */
  private steps = STEPS;
  private regions: Region[] = [];
  private muted = [false, false, false, false];
  private timer: ReturnType<typeof setInterval> | null = null;
  // The clock: step `nextStep` sounds at audio time `nextTime`.
  private nextStep = 0;
  private nextTime = 0;
  private originStep = 0;
  private originTime = 0;
  private playing = false;
  private preview: string | null = null;
  private filter = 1;

  // The track's own sounds (S3/S4): synth and kit voices per sound, AI loop audio per stored loop.
  private sounds: Sound[] = [];
  private key = "A";
  private scale: Scale = "minor";
  private bpm = DEFAULT_BPM;
  private soundIndex = new Map<number, SoundHit[]>();
  private voices = new Map<string, { sig: string; voice: SynthVoice | KitVoice }>();
  private kits = new Map<KitId, LoadedKit>();
  private aiAudio = new Map<string, Tone.ToneAudioBuffer | "loading" | "failed">();
  private aiPlaying = new Set<Tone.ToneBufferSource>();
  private previewSound: Sound | null = null;
  private code = "";

  /** Start the audio context; browsers only allow this after a click or key press. */
  start() {
    this.ready ??= (async () => {
      await Tone.start();
      const limiter = new Tone.Limiter(-1).toDestination();
      this.master = new Tone.Filter({ type: "lowpass", frequency: this.cutoff(), Q: 1 }).connect(limiter);
      this.channels = TRACK_DB.map((db) => new Tone.Channel({ volume: db }).connect(this.master));
      this.channels.forEach((c, i) => (c.mute = this.muted[i]));
      const built = makeInstruments(this.channels, () => this.sps);
      this.play = built.play;
      this.synced = built.synced;
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
    this.synced.forEach((d) => d.node.delayTime.rampTo(d.steps * next, 0.05));
  }

  setRegions(regions: Region[]) {
    this.regions = regions;
    this.index = buildIndex(regions, RECIPES, this.steps);
    this.soundIndex = buildSoundIndex(regions, this.sounds, this.key, this.scale, this.steps);
  }

  /** The track's own sounds; a changed sound (knobs, pattern) applies from its next note. */
  setSounds(sounds: Sound[]) {
    this.sounds = sounds;
    for (const x of sounds) this.refreshVoice(x);
    const keep = new Set([...sounds.map((x) => x.id), this.previewSound?.id]);
    for (const [id, v] of this.voices) if (!keep.has(id)) { v.voice.dispose(); this.voices.delete(id); }
    this.setRegions(this.regions);
  }

  /** The track's key: synth patterns are rendered in it (A minor when the track has none). */
  setKey(key: string, scale: Scale) {
    this.key = key;
    this.scale = scale;
    this.setRegions(this.regions);
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

  /** Loop one sound alone (the sound drawer's Listen), or null to stop. */
  async setPreviewSound(sound: Sound | null) {
    const was = this.previewSound;
    this.previewSound = sound;
    if (was && was.id !== sound?.id && !this.sounds.some((x) => x.id === was.id)) {
      this.voices.get(was.id)?.voice.dispose();
      this.voices.delete(was.id);
    }
    if (!sound) { if (!this.playing && !this.preview) this.halt(); return; }
    await this.start();
    this.refreshVoice(sound);
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
    this.setRegions(this.regions);
  }

  setMuted(muted: boolean[]) {
    this.muted = muted;
    this.channels.forEach((c, i) => (c.mute = muted[i]));
  }

  setFilter(v: number) {
    this.filter = v;
    this.master?.frequency.rampTo(this.cutoff(), 0.05);
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

  private cutoff() { return 120 * Math.pow(20000 / 120, this.filter); }

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
      if (this.playing) {
        for (const hit of this.index.get(k % this.steps) ?? []) {
          if (!this.muted[hit.track]) this.sound(hit.loopId, hit.note, t);
        }
      }
      if (this.playing) {
        for (const hit of this.soundIndex.get(k % this.steps) ?? []) {
          if (!this.muted[hit.track]) this.playSound(hit, t);
        }
      }
      if (this.preview) {
        const recipe = RECIPES[this.preview], loop = loopById(this.preview);
        if (recipe && loop) for (const note of previewHits(recipe, loop.bars, k)) this.sound(this.preview, note, t);
      }
      if (this.previewSound) {
        for (const hit of previewSoundHits(this.previewSound, this.key, this.scale, k)) this.playSound(hit, t);
      }
      this.nextStep = k + 1;
      this.nextTime = t + this.sps;
    }
  }

  /** Play one note. A loop the engine doesn't know, or an instrument that throws, is skipped
   *  (and reported once) so one bad sound can never stop the music. */
  private failed = new Set<string>();
  private sound(loopId: string, note: Note, t: number) {
    const play = this.play[RECIPES[loopId]?.inst];
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

  /** Build (or re-knob) a sound's voice. Same preset → knobs glide; another preset or kit → a new voice. */
  private refreshVoice(x: Sound) {
    if (!this.channels.length || x.source === "ai") { if (x.source === "ai") this.loadAi(x.aiId); else if (x.source === "kit") this.loadKitOnce(x.kit); return; }
    const sig = x.source === "kit" ? `kit:${x.kit}` : `synth:${x.preset}`;
    const have = this.voices.get(x.id);
    if (have && have.sig === sig) {
      if (x.source === "synth") (have.voice as SynthVoice).setKnobs(x.knobs);
      return;
    }
    have?.voice.dispose();
    this.voices.delete(x.id);
    if (x.source === "synth") {
      this.voices.set(x.id, { sig, voice: createSynthVoice(x.preset, x.knobs, this.channels[x.lane]) });
    } else {
      const kit = this.kits.get(x.kit);
      if (kit) this.voices.set(x.id, { sig, voice: createKitVoice(kit, this.channels[x.lane]) });
      else this.loadKitOnce(x.kit);
    }
  }

  private kitLoads = new Set<KitId>();
  private loadKitOnce(id: KitId) {
    if (this.kitLoads.has(id)) return;
    this.kitLoads.add(id);
    loadKit(id).then((k) => {
      this.kits.set(id, k);
      for (const x of [...this.sounds, ...(this.previewSound ? [this.previewSound] : [])]) if (x.source === "kit" && x.kit === id) this.refreshVoice(x);
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

  /** Play one hit of a track sound; like sound(), a failure is reported once and skipped. */
  private playSound(hit: SoundHit, t: number) {
    const x = hit.soundId === this.previewSound?.id ? this.previewSound : this.sounds.find((s) => s.id === hit.soundId);
    if (!x) return;
    try {
      if (hit.kind === "ai" && x.source === "ai") {
        const buf = this.aiAudio.get(x.aiId);
        if (!buf) this.loadAi(x.aiId);
        if (!(buf instanceof Tone.ToneAudioBuffer)) return;
        // One pass is exactly `bars` bars at the tempo it was made at; another tempo resamples it.
        // shortcut: playbackRate changes pitch with tempo; time-stretch if tracks move far from the loop's tempo.
        const src = new Tone.ToneBufferSource({ url: buf, playbackRate: this.bpm / x.bpm }).connect(this.channels[x.lane]);
        src.onended = () => { this.aiPlaying.delete(src); src.dispose(); };
        src.start(t, 0, undefined, 0.35); // -9 dB: a full template mix stays under 0 dBFS (X3 F3)
        src.stop(t + hit.dur * this.sps);
        this.aiPlaying.add(src);
        return;
      }
      if (!this.voices.has(x.id)) this.refreshVoice(x);
      const v = this.voices.get(x.id)?.voice;
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
