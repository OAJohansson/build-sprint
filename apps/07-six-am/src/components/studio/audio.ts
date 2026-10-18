"use client";

// The sound engine (decision 0019): synthesised instruments, one channel per track, a master
// filter, and a lookahead scheduler on the audio clock. Every 25 ms it books the notes that fall
// in the next 120 ms at their exact time ("A Tale of Two Clocks", Chris Wilson), so timing never
// depends on the screen.
import * as Tone from "tone";
import { RECIPES, type Inst, type Note } from "@/lib/recipes";
import { SECONDS_PER_STEP, STEPS, buildIndex, previewHits, stepOfBar, type Hit } from "@/lib/schedule";
import { loopById, type Region } from "@/lib/timeline";

const LOOKAHEAD = 0.12, TICK_MS = 25;
const TRACK_DB = [0, -3, -7, -9]; // drums, bass, chords, top/FX

type Play = (note: Note, time: number) => void;

/** Build every instrument once, each wired into its track's channel. */
function makeInstruments(channels: Tone.Channel[]): Record<Inst, Play> {
  const [drums, bass, chords, top] = channels;
  const sec = (steps: number) => steps * SECONDS_PER_STEP;

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
  const kit: Play = (n, t) => {
    switch (n.note) {
      case "kick": kick.triggerAttackRelease("A0", 0.3, t, n.vel); break;
      case "rumble": rumble.triggerAttackRelease("A1", sec(n.dur), t, n.vel); break;
      case "hat": hat.triggerAttackRelease(0.04, t, n.vel); break;
      case "ohat": ohat.triggerAttackRelease(0.15, t, n.vel); break;
      case "clap": clap.triggerAttackRelease(0.15, t, n.vel); break;
      case "snare": snare.triggerAttackRelease(0.1, t, n.vel); break;
    }
  };

  // Bass: a sine sub, the 303-style acid line, punchy offbeats and a detuned "reese".
  const mono = (opts: ConstructorParameters<typeof Tone.MonoSynth>[0]) => new Tone.MonoSynth(opts).connect(bass);
  const sub = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.9, release: 0.2 } }).connect(bass);
  const acid = mono({ oscillator: { type: "sawtooth" }, volume: -6, filter: { Q: 9, type: "lowpass" }, envelope: { attack: 0.002, decay: 0.15, sustain: 0.3, release: 0.05 }, filterEnvelope: { attack: 0.002, decay: 0.16, sustain: 0.1, baseFrequency: 180, octaves: 3.6 } });
  const pump = mono({ oscillator: { type: "square" }, volume: -8, filter: { Q: 2 }, envelope: { attack: 0.003, decay: 0.12, sustain: 0.2, release: 0.05 }, filterEnvelope: { baseFrequency: 120, octaves: 2.5, decay: 0.12, sustain: 0.1 } });
  const rubber = mono({ oscillator: { type: "fmsquare" }, volume: -10, envelope: { attack: 0.002, decay: 0.2, sustain: 0.2, release: 0.08 }, filterEnvelope: { baseFrequency: 150, octaves: 3, decay: 0.2, sustain: 0.2 } });
  const reese = mono({ oscillator: { type: "fatsawtooth", count: 3, spread: 30 }, volume: -12, filter: { Q: 1 }, envelope: { attack: 0.02, decay: 0.3, sustain: 0.8, release: 0.3 }, filterEnvelope: { baseFrequency: 90, octaves: 2, decay: 0.4, sustain: 0.5 } });
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
  const chordPlay = (p: Tone.PolySynth): Play => (n, t) => p.triggerAttackRelease(n.note, sec(n.dur) * 0.95, t, n.vel);

  // Top and FX: shaker, a vowel-ish FM chop, ride, cowbell and noise sweeps.
  const shakerF = new Tone.Filter(6000, "highpass").connect(top);
  const shaker = new Tone.NoiseSynth({ noise: { type: "white" }, volume: -12, envelope: { attack: 0.003, decay: 0.05, sustain: 0 } }).connect(shakerF);
  const chop = new Tone.FMSynth({ harmonicity: 1.5, modulationIndex: 6, volume: -10, envelope: { attack: 0.005, decay: 0.15, sustain: 0.2, release: 0.1 } }).connect(top);
  const ride = new Tone.MetalSynth({ volume: -30, envelope: { attack: 0.001, decay: 0.7, release: 0.2 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).connect(top);
  const bell = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "square" }, envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.05 } }).connect(new Tone.Filter(3000, "bandpass").connect(top));
  bell.volume.value = -16;
  const sweepF = new Tone.Filter(300, "bandpass").connect(top);
  sweepF.Q.value = 1.2;
  const sweep = new Tone.NoiseSynth({ noise: { type: "white" }, volume: -10, envelope: { attack: 1, decay: 0, sustain: 1, release: 0.05 } }).connect(sweepF);
  const sweepPlay = (from: number, to: number): Play => (n, t) => {
    const d = sec(n.dur);
    sweep.envelope.attack = d * 0.9;
    sweepF.frequency.cancelScheduledValues(t);
    sweepF.frequency.setValueAtTime(from, t);
    sweepF.frequency.exponentialRampToValueAtTime(to, t + d);
    sweep.triggerAttackRelease(d, t, n.vel);
  };

  return {
    kit, sub: tone(sub), acid: tone(acid), pump: tone(pump), rubber: tone(rubber), reese: tone(reese),
    stab: chordPlay(stab), pad: chordPlay(pad), organ: chordPlay(organ), strings: chordPlay(strings), piano: chordPlay(piano), wash: chordPlay(wash),
    shaker: (n, t) => shaker.triggerAttackRelease(0.05, t, n.vel),
    chop: tone(chop as unknown as Tone.Synth),
    ride: (n, t) => ride.triggerAttackRelease("C4", 0.6, t, n.vel),
    cowbell: (n, t) => bell.triggerAttackRelease(["C#5", "G#5"], 0.08, t, n.vel),
    riser: sweepPlay(300, 9000),
    swell: sweepPlay(2000, 12000),
  };
}

export class AudioEngine {
  private ready: Promise<void> | null = null;
  private play!: Record<Inst, Play>;
  private channels: Tone.Channel[] = [];
  private master!: Tone.Filter;
  private index = new Map<number, Hit[]>();
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

  /** Start the audio context; browsers only allow this after a click or key press. */
  start() {
    this.ready ??= (async () => {
      await Tone.start();
      const limiter = new Tone.Limiter(-1).toDestination();
      this.master = new Tone.Filter({ type: "lowpass", frequency: this.cutoff(), Q: 1 }).connect(limiter);
      this.channels = TRACK_DB.map((db) => new Tone.Channel({ volume: db }).connect(this.master));
      this.channels.forEach((c, i) => (c.mute = this.muted[i]));
      this.play = makeInstruments(this.channels);
    })();
    return this.ready;
  }

  setRegions(regions: Region[]) { this.index = buildIndex(regions, RECIPES); }

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
    this.resetClock(stepOfBar(bar));
  }

  stop() {
    this.playing = false;
    if (!this.preview) this.halt();
  }

  async setPreview(loopId: string | null) {
    this.preview = loopId;
    if (!loopId) { if (!this.playing) this.halt(); return; }
    await this.start();
    if (!this.timer) this.resetClock(0);
  }

  /** Where the music is now, in bars (1 = the start), or null when the track isn't playing. */
  position(): number | null {
    if (!this.playing) return null;
    const step = this.originStep + (Tone.immediate() - this.originTime) / SECONDS_PER_STEP;
    return (((step % STEPS) + STEPS) % STEPS) / 16 + 1;
  }

  private cutoff() { return 120 * Math.pow(20000 / 120, this.filter); }

  private resetClock(step: number) {
    this.halt();
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
        for (const hit of this.index.get(k % STEPS) ?? []) {
          if (!this.muted[hit.track]) this.play[RECIPES[hit.loopId].inst](hit.note, t);
        }
      }
      if (this.preview) {
        const recipe = RECIPES[this.preview];
        for (const note of previewHits(recipe, loopById(this.preview).bars, k)) this.play[recipe.inst](note, t);
      }
      this.nextStep = k + 1;
      this.nextTime = t + SECONDS_PER_STEP;
    }
  }
}
