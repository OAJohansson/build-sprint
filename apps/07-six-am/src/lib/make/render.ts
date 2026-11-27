// The Make synth (S3): a monophonic bass voice rendered sample by sample from a preset's synth
// parameters and a note pattern. Plain TS, no Web Audio, so the same code renders "Mine" in the
// browser (into an AudioBuffer that loops beside the original part) and in unit tests (patch
// matching renders candidates and compares them). Notes start exactly on their 16th.
import { midiToHz } from "@/lib/synths/theory";
import { getKitSample, type KitSample } from "./kit-samples";
import type { SynthParams } from "./presets";

/** One note on the 16th grid: start step, MIDI pitch, length in 16ths, velocity 0–1; `off`: a drum
 *  hit's timing offset in 16ths (swing, Phase 5), never set on a bass note. */
export type MakeNote = { step: number; midi: number; dur: number; vel: number; off?: number };

export type Rendered = { left: Float32Array<ArrayBuffer>; right: Float32Array<ArrayBuffer>; rate: number };

/** Sub at full: the sine's peak against the voice's (≈ 1); Weight at full: the body copy's level. */
export const SUB_LEVEL = 0.9;
export const WEIGHT_LEVEL = 5;
export const WEIGHT_LP_HZ = 250;
export const WEIGHT_HP_HZ = 60;

export const secondsPer16th = (bpm: number) => 60 / bpm / 4;

/** PolyBLEP: smooths the saw's jump so it doesn't alias into a whine. */
function blep(t: number, dt: number) {
  if (t < dt) { const x = t / dt; return x + x - x * x - 1; }
  if (t > 1 - dt) { const x = (t - 1) / dt; return x * x + x + x + 1; }
  return 0;
}

/**
 * Renders `steps` 16ths at `bpm`: the notes (monophonic: a note ends where the next begins) with
 * the preset's parameters. Stereo: left and right differ only by the Width layer (mid/side).
 */
export function renderBass(notes: MakeNote[], p: SynthParams, o: { bpm: number; steps: number; rate?: number }): Rendered {
  const rate = o.rate ?? 44100;
  const sps = secondsPer16th(o.bpm);
  const n = Math.round(o.steps * sps * rate);
  const left = new Float32Array(n), right = new Float32Array(n);
  const sorted = [...notes].filter((x) => x.step >= 0 && x.step < o.steps).sort((a, b) => a.step - b.step);
  const starts = sorted.map((x) => Math.round(x.step * sps * rate));
  const gates = sorted.map((x, i) => {
    const room = (sorted[i + 1]?.step ?? o.steps) - x.step;
    return Math.min(x.dur, p.lengthSteps, room) * sps;
  });
  const voices = Math.max(1, Math.round(p.voices));
  const spread = voices === 1 ? [0] : Array.from({ length: voices }, (_, v) => (v / (voices - 1) * 2 - 1) * p.detuneCents);
  // Layer 0 is the centre; layer 1 is the Width copy, detuned, + on the left and − on the right.
  const layers = p.width > 0 ? [0, p.stereoCents] : [0];
  const ratios = layers.map((s) => spread.map((c) => Math.pow(2, (c + s) / 1200)));
  const phase = layers.map((_, l) => spread.map((_, v) => (v * 0.37 + l * 0.21) % 1));
  const layer = [0, 0];
  // Phase 7 (L266): the new sources. FM: a sine modulator per oscillator at `fm.ratio`, its depth
  // falling from `fm.index` over `fm.decayS` to `fm.sustain`. Organ: drawbar harmonics. Sample: a
  // recording (the nearest of `samples` to the note, kit-samples.ts) played at the note's speed.
  const fm = p.wave === "fm" ? p.fm ?? { ratio: 1, index: 2, decayS: 0.1, sustain: 0.2 } : null;
  const mph = fm ? layers.map(() => spread.map(() => 0)) : null;
  const organ = p.wave === "organ" ? p.organ ?? [1] : null;
  const organNorm = organ ? 1 / organ.reduce((a, b) => a + Math.abs(b), 0) : 0;
  const samples = p.wave === "sample" ? (p.samples ?? []).map((x) => ({ midi: x.midi, s: getKitSample(x.id) })).filter((x): x is { midi: number; s: KitSample } => !!x.s) : null;
  let smp: { midi: number; s: KitSample } | null = null;
  const spos = layers.map(() => 0);
  const toneDrive = (p.toneDrive ?? 0) * 8 * (p.toneV ?? 0), tdNorm = toneDrive > 0 ? Math.tanh(1 + toneDrive) : 1;
  const ic1 = [0, 0], ic2 = [0, 0];
  const out = [left, right];
  const gain = Math.pow(10, p.gainDb / 20);
  const relCoef = Math.exp(-3 / Math.max(1e-4, p.releaseS * rate));
  const dg = 1 + 9 * p.drive, dNorm = Math.tanh(dg);
  const wobbleHz = (p.wobblePerBeat * o.bpm) / 60;
  const k = 1 / Math.max(0.5, p.resonance);
  let a1 = 0, a2 = 0, a3 = 0;
  let ni = -1, env = 0, env0 = 0;
  // L209 Sub and Weight (both 0 = the sound as before, untouched).
  const sub = (p.sub ?? 0) * SUB_LEVEL, weight = (p.weight ?? 0) * WEIGHT_LEVEL;
  const wc = Math.exp((-2 * Math.PI * WEIGHT_LP_HZ) / rate);
  const wa = [0, 0], wb = [0, 0], wh = [0, 0], wx = [0, 0], wh2 = [0, 0], wx2 = [0, 0];
  const hc = Math.exp((-2 * Math.PI * WEIGHT_HP_HZ) / rate);
  let subPh = 0;
  // The fundamental of each wave as a function of its phase: saw −sin, triangle cos, sine sin.
  const subWave = p.wave === "saw" ? (ph: number) => -Math.sin(2 * Math.PI * ph) : p.wave === "triangle" ? (ph: number) => Math.cos(2 * Math.PI * ph) : (ph: number) => Math.sin(2 * Math.PI * ph);

  for (let i = 0; i < n; i++) {
    while (ni + 1 < sorted.length && starts[ni + 1] <= i) {
      ni++; env0 = env;
      if (samples) {
        // A sampled bass starts its recording again on each note, from the sample nearest the note.
        const m = sorted[ni].midi;
        smp = samples.reduce<{ midi: number; s: KitSample } | null>((a, b) => (!a || Math.abs(b.midi - m) < Math.abs(a.midi - m) ? b : a), null);
        spos.fill(0);
      }
    }
    const t = i / rate;
    let f0 = 55, tn = 0;
    if (ni >= 0) {
      const note = sorted[ni];
      tn = (i - starts[ni]) / rate;
      if (tn < p.attackS) env = env0 + (note.vel - env0) * (tn / p.attackS);
      else if (tn < gates[ni]) env = p.decayS ? note.vel * Math.exp(-(tn - p.attackS) / p.decayS) : note.vel;
      else env *= relCoef;
      f0 = midiToHz(note.midi + p.dropSemis * Math.exp(-tn / Math.max(1e-3, p.dropS)));
    }
    if ((i & 15) === 0) {
      let fc = p.cutoffHz * Math.pow(2, p.filterEnvOct * Math.exp(-tn / Math.max(1e-3, p.filterDecayS)));
      if (wobbleHz > 0) fc *= Math.pow(2, p.wobbleOct * 0.5 * (Math.sin(2 * Math.PI * wobbleHz * t) - 1));
      fc = Math.min(rate * 0.45, Math.max(20, fc));
      const g = Math.tan((Math.PI * fc) / rate);
      a1 = 1 / (1 + g * (g + k)); a2 = g * a1; a3 = g * a2;
    }
    if (env < 1e-6 && ni >= 0 && i - starts[ni] > rate) continue; // long silence: skip the work
    subPh = phase[0][0];
    for (let l = 0; l < layers.length; l++) {
      let x = 0;
      for (let v = 0; v < voices; v++) {
        const dt = (f0 * ratios[l][v]) / rate;
        let ph = phase[l][v];
        if (p.wave === "sine") x += Math.sin(2 * Math.PI * ph);
        else if (p.wave === "triangle") x += 4 * Math.abs(ph - 0.5) - 1;
        else if (p.wave === "saw") x += 2 * ph - 1 - blep(ph, dt);
        else if (p.wave === "square") { let q = ph + 0.5; if (q >= 1) q -= 1; x += (ph < 0.5 ? 1 : -1) + blep(ph, dt) - blep(q, dt); }
        else if (fm && mph) {
          const idx = fm.sustain + (fm.index - fm.sustain) * Math.exp(-tn / Math.max(1e-3, fm.decayS));
          x += Math.sin(2 * Math.PI * ph + idx * Math.sin(2 * Math.PI * mph[l][v]));
          mph[l][v] += dt * fm.ratio; if (mph[l][v] >= 1) mph[l][v] -= Math.floor(mph[l][v]);
        } else if (organ) { let o = 0; for (let h = 0; h < organ.length; h++) o += organ[h] * Math.sin(2 * Math.PI * (h + 1) * ph); x += o * organNorm; }
        else if (smp) {
          const d = smp.s.data, sp = spos[l], k = Math.floor(sp);
          if (v === 0) { x += k + 1 < d.length ? d[k] + (d[k + 1] - d[k]) * (sp - k) : 0; spos[l] += (f0 * ratios[l][v] / midiToHz(smp.midi)) * (smp.s.rate / rate); }
        }
        ph += dt;
        if (ph >= 1) ph -= 1;
        phase[l][v] = ph;
      }
      layer[l] = x / Math.sqrt(voices);
    }
    // The sub follows the voice's own phase, so it adds to the voice's fundamental (a sine on its own
    // phase cancelled a sawtooth's fundamental: the sound got thinner, not deeper).
    let subX = 0;
    if (sub > 0) subX = sub * env * subWave(subPh);
    for (let s = 0; s < 2; s++) {
      let x = layers.length > 1 ? layer[0] + (s === 0 ? 1 : -1) * p.width * layer[1] : layer[0];
      // Phase 7: a clean wave gets overtones as Tone goes up (toneDrive), so Tone is heard on a sub too.
      if (toneDrive > 0) x = Math.tanh(x * (1 + toneDrive)) / tdNorm;
      // Cytomic SVF lowpass.
      const v3 = x - ic2[s], v1 = a1 * ic1[s] + a2 * v3, v2 = ic2[s] + a2 * ic1[s] + a3 * v3;
      ic1[s] = 2 * v1 - ic1[s]; ic2[s] = 2 * v2 - ic2[s];
      let y = p.drive > 0 ? Math.tanh(v2 * env * dg) / dNorm : v2 * env;
      if (weight > 0) {
        // Weight (closeness test, 27 Oct): the original basses carry their body at the octave above the
        // note (≈ 100 Hz for G1), not at the odd harmonics. A rectified copy of the voice makes that
        // octave; a high-pass takes out its DC and the note itself, two low-passes keep it below ~250 Hz.
        const oct = Math.abs(Math.tanh(v2 * env * 2));
        const hp1 = hc * (wh[s] + oct - wx[s]); wx[s] = oct; wh[s] = hp1;
        const hp = hc * (wh2[s] + hp1 - wx2[s]); wx2[s] = hp1; wh2[s] = hp;
        wa[s] = (1 - wc) * hp + wc * wa[s]; wb[s] = (1 - wc) * wa[s] + wc * wb[s];
        y += weight * wb[s];
      }
      out[s][i] = (y + subX) * gain;
    }
  }
  return { left, right, rate };
}
