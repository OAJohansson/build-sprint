// The Make synth (S3): a monophonic bass voice rendered sample by sample from a preset's synth
// parameters and a note pattern. Plain TS, no Web Audio, so the same code renders "Mine" in the
// browser (into an AudioBuffer that loops beside the original part) and in unit tests (patch
// matching renders candidates and compares them). Notes start exactly on their 16th.
import { midiToHz } from "@/lib/synths/theory";
import type { SynthParams } from "./presets";

/** One note on the 16th grid: start step, MIDI pitch, length in 16ths, velocity 0–1. */
export type MakeNote = { step: number; midi: number; dur: number; vel: number };

export type Rendered = { left: Float32Array<ArrayBuffer>; right: Float32Array<ArrayBuffer>; rate: number };

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
  const ic1 = [0, 0], ic2 = [0, 0];
  const out = [left, right];
  const gain = Math.pow(10, p.gainDb / 20);
  const relCoef = Math.exp(-3 / Math.max(1e-4, p.releaseS * rate));
  const dg = 1 + 9 * p.drive, dNorm = Math.tanh(dg);
  const wobbleHz = (p.wobblePerBeat * o.bpm) / 60;
  const k = 1 / Math.max(0.5, p.resonance);
  let a1 = 0, a2 = 0, a3 = 0;
  let ni = -1, env = 0, env0 = 0;

  for (let i = 0; i < n; i++) {
    while (ni + 1 < sorted.length && starts[ni + 1] <= i) { ni++; env0 = env; }
    const t = i / rate;
    let f0 = 55, tn = 0;
    if (ni >= 0) {
      const note = sorted[ni];
      tn = (i - starts[ni]) / rate;
      if (tn < p.attackS) env = env0 + (note.vel - env0) * (tn / p.attackS);
      else if (tn < gates[ni]) env = note.vel;
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
    for (let l = 0; l < layers.length; l++) {
      let x = 0;
      for (let v = 0; v < voices; v++) {
        const dt = (f0 * ratios[l][v]) / rate;
        let ph = phase[l][v];
        if (p.wave === "sine") x += Math.sin(2 * Math.PI * ph);
        else if (p.wave === "triangle") x += 4 * Math.abs(ph - 0.5) - 1;
        else x += 2 * ph - 1 - blep(ph, dt);
        ph += dt;
        if (ph >= 1) ph -= 1;
        phase[l][v] = ph;
      }
      layer[l] = x / Math.sqrt(voices);
    }
    for (let s = 0; s < 2; s++) {
      const x = layers.length > 1 ? layer[0] + (s === 0 ? 1 : -1) * p.width * layer[1] : layer[0];
      // Cytomic SVF lowpass.
      const v3 = x - ic2[s], v1 = a1 * ic1[s] + a2 * v3, v2 = ic2[s] + a2 * ic1[s] + a3 * v3;
      ic1[s] = 2 * v1 - ic1[s]; ic2[s] = 2 * v2 - ic2[s];
      const y = p.drive > 0 ? Math.tanh(v2 * env * dg) / dNorm : v2 * env;
      out[s][i] = y * gain;
    }
  }
  return { left, right, rate };
}
