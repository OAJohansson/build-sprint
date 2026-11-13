// Make for melody / chords (Phase 5 slice 2, P4, sound-check.md): a pure-TS poly synth with four
// presets (Stab, Pluck, Pad, Keys) and six knobs (Tone = the filter, Length and Attack = the envelope,
// Detune, Width, Space = the reverb), the same in Make's worker, the Studio and the tests. Two rows
// use it: Chords and Lead; a preset id carries its row ("chords-stab", "lead-pluck"), so a saved
// sound knows its lane. Plain TS, no noise: the same notes always render sample for sample the same.
import { midiToHz } from "@/lib/synths/theory";
import { secondsPer16th, type Rendered } from "./render";

export type MelodyRow = "chords" | "lead";
export const MELODY_ROWS: MelodyRow[] = ["chords", "lead"];
export const MELODY_ROW_NAMES: Record<MelodyRow, string> = { chords: "Chords", lead: "Lead" };

export type PolyKind = "stab" | "pluck" | "pad" | "keys";
export const POLY_KINDS: PolyKind[] = ["stab", "pluck", "pad", "keys"];
export type MelodyPresetId = `${MelodyRow}-${PolyKind}`;
export type PolyKnobId = "tone" | "length" | "attack" | "detune" | "width" | "space";
export const POLY_KNOBS: PolyKnobId[] = ["tone", "length", "attack", "detune", "width", "space"];
export type PolyMacros = Partial<Record<PolyKnobId, number>>;

type Voice = {
  /** Oscillator: sawtooth, or additive "keys" (an e-piano/organ-like sum of decaying sines). */
  wave: "saw" | "keys";
  voices: number;
  /** Filter cutoff (Hz) at Tone 0 and 1; octaves the filter opens on each note, closing over `fDecayS`. */
  tone: [number, number]; fEnvOct: number; fDecayS: number; resonance: number;
  /** Amplitude: attack range (s), decay to `sustain`, release (s). */
  attackS: [number, number]; decayS: number; sustain: number; releaseS: number;
  /** Detune range (cents between the outer voices), Space's room size, level. */
  maxDetune: number; roomFb: number; gainDb: number;
};

export type PolyPreset = { kind: PolyKind; name: string; tags: string[]; about: string; macros: Required<PolyMacros>; voice: Voice };

/** The four sounds; each row starts from its own default (Chords: Stab; Lead: Pluck). */
export const POLY_PRESETS: Record<PolyKind, PolyPreset> = {
  stab: { kind: "stab", name: "Stab", tags: ["stab", "short"], about: "A bright sawtooth chord whose filter snaps open and shuts: the short house stab on the off-beat.",
    macros: { tone: 0.45, length: 0.2, attack: 0.05, detune: 0.3, width: 0.55, space: 0.4 },
    voice: { wave: "saw", voices: 2, tone: [350, 6000], fEnvOct: 2, fDecayS: 0.12, resonance: 1.1, attackS: [0.001, 0.3], decayS: 0.18, sustain: 0.5, releaseS: 0.06, maxDetune: 30, roomFb: 0.8, gainDb: -16 } },
  pluck: { kind: "pluck", name: "Pluck", tags: ["pluck", "bouncy"], about: "A short plucked sawtooth: the filter and the level both fall fast, like a plucked string.",
    macros: { tone: 0.5, length: 0.4, attack: 0, detune: 0.15, width: 0.3, space: 0.3 },
    voice: { wave: "saw", voices: 2, tone: [300, 5000], fEnvOct: 3, fDecayS: 0.08, resonance: 1.4, attackS: [0.001, 0.2], decayS: 0.25, sustain: 0, releaseS: 0.08, maxDetune: 25, roomFb: 0.78, gainDb: -14 } },
  pad: { kind: "pad", name: "Pad", tags: ["pad", "long"], about: "Three detuned sawtooths, filtered warm, swelling in and held, with a long room: the bed of long chords.",
    macros: { tone: 0.35, length: 0.9, attack: 0.55, detune: 0.55, width: 0.7, space: 0.6 },
    voice: { wave: "saw", voices: 3, tone: [200, 3500], fEnvOct: 0.3, fDecayS: 0.6, resonance: 0.8, attackS: [0.005, 0.8], decayS: 0.6, sustain: 0.9, releaseS: 0.5, maxDetune: 40, roomFb: 0.86, gainDb: -18 } },
  keys: { kind: "keys", name: "Keys", tags: ["keys", "piano"], about: "An electric-piano/organ voice: a few sine partials that ring and fade, the chords of deep and jazzy house.",
    macros: { tone: 0.5, length: 0.6, attack: 0.02, detune: 0.1, width: 0.3, space: 0.35 },
    voice: { wave: "keys", voices: 1, tone: [800, 9000], fEnvOct: 0.5, fDecayS: 0.3, resonance: 0.7, attackS: [0.001, 0.25], decayS: 0.7, sustain: 0.3, releaseS: 0.15, maxDetune: 15, roomFb: 0.82, gainDb: -12 } },
};
export const ROW_DEFAULT: Record<MelodyRow, PolyKind> = { chords: "stab", lead: "pluck" };
export const presetId = (row: MelodyRow, kind: PolyKind): MelodyPresetId => `${row}-${kind}`;
export const melodyPresetIds = (row: MelodyRow): MelodyPresetId[] => POLY_KINDS.map((k) => presetId(row, k));
export const MELODY_PRESET_IDS: MelodyPresetId[] = MELODY_ROWS.flatMap(melodyPresetIds);
export const isMelodyPreset = (v: unknown): v is MelodyPresetId => typeof v === "string" && (MELODY_PRESET_IDS as string[]).includes(v);
export const melodyRowOf = (id: MelodyPresetId): MelodyRow => id.split("-")[0] as MelodyRow;
export const kindOf = (id: MelodyPresetId): PolyKind => id.split("-")[1] as PolyKind;
export const melodyPreset = (id: MelodyPresetId) => POLY_PRESETS[kindOf(id)];

const clamp01 = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null);
/** All six knobs 0–1; missing or junk values get the preset's own. */
export function clampPolyMacros(id: MelodyPresetId, v: Partial<Record<string, unknown>> | undefined): Required<PolyMacros> {
  const home = melodyPreset(id).macros, out = { ...home };
  for (const k of POLY_KNOBS) { const x = clamp01(v?.[k]); if (x !== null) out[k] = x; }
  return out;
}

// ── Knobs: what each value means, and its word ───────────────────────────────────────────────────

const lerpExp = ([lo, hi]: [number, number], v: number) => lo * Math.pow(hi / lo, v);
/** Length 0–1 → the longest a note may sound, in 16ths: 1/32 (0.5) … 16 (a bar), "as read" past that. */
export const polyLengthSteps = (v: number) => Math.pow(2, 5 * v - 1);
export const POLY_KNOB_SPECS: Record<PolyKnobId, { name: string; explain: string }> = {
  tone: { name: "Tone", explain: "The filter: low is dark and soft, high lets the buzz through and sounds bright." },
  length: { name: "Length", explain: "How long each note may sound, from a 1/32 blip to a whole bar: short stabs leave room between the kicks." },
  attack: { name: "Attack", explain: "How fast a note starts: hard and immediate, or swelling in like a pad." },
  detune: { name: "Detune", explain: "Voices a few cents apart, beating against each other: thicker and more alive." },
  width: { name: "Width", explain: "Spreads the voices between the speakers." },
  space: { name: "Space", explain: "A room around the notes (reverb): dry and close, then a bigger space." },
};
const FRACTIONS: [number, string][] = [[0.5, "1/32"], [1, "1/16"], [2, "1/8"], [4, "1/4"], [8, "1/2"], [16, "1 bar"]];

/** The word under a knob, fine enough that every drag shows a change (as drums, U5). */
export function polyKnobWord(id: MelodyPresetId, k: PolyKnobId, v: number): string {
  const p = melodyPreset(id).voice, pct = Math.round(v * 100);
  const ms = (s: number) => (s >= 1 ? `${(Math.round(s * 10) / 10).toFixed(1)} s` : `${Math.max(1, Math.round(s * 1000))} ms`);
  switch (k) {
    case "tone": { const f = lerpExp(p.tone, v); return `${v < 0.34 ? "dark" : v < 0.5 ? "warm" : "bright"} · ${f >= 1000 ? `${(Math.round(f / 100) / 10).toFixed(1)} kHz` : `${Math.round(f)} Hz`}`; }
    case "length": {
      const s = polyLengthSteps(v);
      if (v >= 0.98) return "as read";
      const near = FRACTIONS.reduce((a, b) => (Math.abs(Math.log2(b[0] / s)) < Math.abs(Math.log2(a[0] / s)) ? b : a));
      return Math.abs(Math.log2(near[0] / s)) < 0.15 ? near[1] : `${(Math.round(s * 10) / 10).toString()} 16ths`;
    }
    case "attack": return `${v < 0.15 ? "hard" : v < 0.5 ? "soft" : "swelling"} · ${ms(lerpExp(p.attackS, v))}`;
    case "detune": return `${v < 0.1 ? "none" : v < 0.45 ? "a little" : "thick"} · ${(Math.round(v * p.maxDetune * 10) / 10).toFixed(1)} ct`;
    case "width": return `${v < 0.3 ? "narrow" : v < 0.7 ? "wide" : "very wide"} · ${pct}`;
    case "space": return `${v < 0.15 ? "dry" : v < 0.5 ? "room" : "hall"} · ${pct}`;
  }
}

// ── Rendering ───────────────────────────────────────────────────────────────────────────────────

/** A note to play: `t` seconds into the pass, `dur` seconds (as read), MIDI pitch, velocity 0–1. */
export type PolyNote = { t: number; dur: number; midi: number; vel: number };

/** PolyBLEP: smooths the saw's jump so it doesn't alias. */
function blep(t: number, dt: number) {
  if (t < dt) { const x = t / dt; return x + x - x * x - 1; }
  if (t > 1 - dt) { const x = (t - 1) / dt; return x * x + x + x + 1; }
  return 0;
}

/** Freeverb-style room, run twice round the pass so the tail wraps (as the drums' clap room). */
function space(L: Float32Array, R: Float32Array, amount: number, fbTop: number, rate: number, wrap: boolean) {
  if (amount <= 0.01 || L.length === 0) return;
  const s = rate / 44100, fb = 0.6 + (fbTop - 0.6) * amount, damp = 0.35, wet = 0.6 * amount;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491], aps = [556, 441, 341];
  for (const [x, off] of [[L, 0], [R, 23]] as [Float32Array, number][]) {
    const cb = combs.map((n) => ({ buf: new Float32Array(Math.max(1, Math.round((n + off) * s))), i: 0, lp: 0 }));
    const ab = aps.map((n) => ({ buf: new Float32Array(Math.max(1, Math.round((n + off) * s))), i: 0 }));
    const out = new Float32Array(x.length);
    for (let pass = wrap ? 0 : 1; pass < 2; pass++) for (let i = 0; i < x.length; i++) {
      const inp = x[i] * 0.15;
      let y = 0;
      for (const c of cb) { const o = c.buf[c.i]; c.lp = o * (1 - damp) + c.lp * damp; c.buf[c.i] = inp + c.lp * fb; c.i = (c.i + 1) % c.buf.length; y += o; }
      for (const a of ab) { const o = a.buf[a.i]; const v = y + o * 0.5; a.buf[a.i] = v; y = o - v * 0.5; a.i = (a.i + 1) % a.buf.length; }
      if (pass === 1) out[i] = y;
    }
    for (let i = 0; i < x.length; i++) x[i] += out[i] * wet;
  }
}

const KEYS_PARTIALS: [number, number, number][] = [[1, 1, 1.6], [2, 0.45, 0.9], [3, 0.2, 0.5], [4, 0.12, 0.35], [6, 0.05, 0.2]]; // [ratio, level, decay s]

/**
 * Renders notes over a pass of `lenS` seconds with a preset at these knob values. Polyphonic: every
 * note its own voice, held for min(its read length, Length) and then released. `wrap`: the pass
 * loops, so tails past the end come round to the start (Make's loop, a Studio block).
 */
export function renderPoly(id: MelodyPresetId, macros: PolyMacros, notes: PolyNote[], o: { lenS: number; rate?: number; wrap?: boolean; bpm: number }): Rendered {
  const rate = o.rate ?? 44100, wrap = o.wrap ?? true, m = clampPolyMacros(id, macros), p = melodyPreset(id).voice;
  const n = Math.max(1, Math.round(o.lenS * rate));
  const left = new Float32Array(n), right = new Float32Array(n);
  const sps = secondsPer16th(o.bpm);
  const capS = m.length >= 0.98 ? Infinity : polyLengthSteps(m.length) * sps;
  const attack = lerpExp(p.attackS, m.attack), cutoff = lerpExp(p.tone, m.tone);
  const voices = Math.max(1, p.voices + (m.detune > 0.05 && p.voices === 1 ? 1 : 0));
  const cents = m.detune * p.maxDetune;
  const spread = voices === 1 ? [0] : Array.from({ length: voices }, (_, v) => (v / (voices - 1)) * 2 - 1);
  const k = 1 / Math.max(0.5, p.resonance), gain = Math.pow(10, p.gainDb / 20);
  const relCoef = Math.exp(-3 / Math.max(1e-4, p.releaseS * rate));
  for (const note of notes) {
    const start = Math.round(note.t * rate);
    const holdS = Math.max(0.02, Math.min(note.dur, capS));
    const len = Math.min(wrap ? n : n - start, Math.round((holdS + p.releaseS * 1.5) * rate));
    if (len <= 0 || (!wrap && start >= n)) continue;
    const f0 = midiToHz(note.midi), g = gain * (0.3 + 0.7 * note.vel);
    const ph = spread.map((_, v) => (v * 0.31 + (note.midi % 7) * 0.13) % 1);
    const kp = KEYS_PARTIALS.map(() => 0);
    const ic = [[0, 0], [0, 0]];
    let env = 0, a1 = 0, a2 = 0, a3 = 0;
    for (let i = 0; i < len; i++) {
      const t = i / rate;
      if (t < attack) env = t / attack;
      else if (t < holdS) env = p.sustain + (1 - p.sustain) * Math.exp(-(t - attack) / p.decayS);
      else env *= relCoef;
      if ((i & 15) === 0) {
        const fc = Math.min(rate * 0.45, Math.max(30, cutoff * Math.pow(2, p.fEnvOct * Math.exp(-t / p.fDecayS))));
        const gg = Math.tan((Math.PI * fc) / rate);
        a1 = 1 / (1 + gg * (gg + k)); a2 = gg * a1; a3 = gg * a2;
      }
      let l = 0, r = 0;
      if (p.wave === "keys") {
        let x = 0;
        for (let q = 0; q < KEYS_PARTIALS.length; q++) {
          const [ratio, lvl, dec] = KEYS_PARTIALS[q];
          kp[q] += (f0 * ratio * (1 + (q % 2 ? 1 : -1) * cents / 2400)) / rate; if (kp[q] >= 1) kp[q] -= 1;
          x += lvl * Math.exp(-t / dec) * Math.sin(2 * Math.PI * kp[q]);
        }
        l = r = x;
        if (m.width > 0) { const sd = m.width * 0.3 * Math.sin(2 * Math.PI * (kp[1] + 0.25)) * Math.exp(-t / 0.9); l += sd; r -= sd; }
      } else {
        for (let v = 0; v < voices; v++) {
          const dt = (f0 * Math.pow(2, (spread[v] * cents) / 2400)) / rate;
          const s = 2 * ph[v] - 1 - blep(ph[v], dt);
          ph[v] += dt; if (ph[v] >= 1) ph[v] -= 1;
          // Width: the outer voices go left and right; the centre stays.
          const pan = spread[v] * m.width;
          l += s * (1 - pan * 0.8); r += s * (1 + pan * 0.8);
        }
        l /= Math.sqrt(voices); r /= Math.sqrt(voices);
      }
      // Cytomic SVF lowpass per side.
      const outs = [l, r].map((x, c) => {
        const v3 = x - ic[c][1], v1 = a1 * ic[c][0] + a2 * v3, v2 = ic[c][1] + a2 * ic[c][0] + a3 * v3;
        ic[c][0] = 2 * v1 - ic[c][0]; ic[c][1] = 2 * v2 - ic[c][1];
        return v2;
      });
      const q = wrap ? (((start + i) % n) + n) % n : start + i;
      left[q] += outs[0] * env * g; right[q] += outs[1] * env * g;
    }
  }
  space(left, right, m.space, p.roomFb, rate, wrap);
  return { left, right, rate };
}

/** A note on the 16th grid (as saved): step, offset in 16ths, MIDI, length in 16ths, velocity. */
export type StepNote = { step: number; off?: number; midi: number; dur: number; vel: number };

/** One pass of `steps` 16ths at `bpm` from saved notes (the Studio, the library). */
export function renderPolyRow(id: MelodyPresetId, macros: PolyMacros, notes: StepNote[], o: { bpm: number; steps: number; rate?: number }): Rendered {
  const sps = secondsPer16th(o.bpm);
  return renderPoly(id, macros, notes.map((x) => ({ t: (x.step + (x.off ?? 0)) * sps, dur: x.dur * sps, midi: x.midi, vel: x.vel })), { lenS: o.steps * sps, rate: o.rate, bpm: o.bpm });
}

// ── The Mentor's line (as drumSuggestLine) ──────────────────────────────────────────────────────

const TRAIT: Record<PolyKnobId, [string, string]> = {
  tone: ["brighter", "darker"], length: ["longer", "shorter"], attack: ["softer to start", "harder to start"], detune: ["thicker", "plainer"], width: ["wider", "narrower"], space: ["roomier", "drier"],
};
/** The knobs furthest from their ticks (at most 2). */
export function polyMoves(current: PolyMacros, ticks: PolyMacros) {
  return POLY_KNOBS.map((id) => ({ id, up: (ticks[id] ?? 0) > (current[id] ?? 0), by: Math.abs((ticks[id] ?? 0) - (current[id] ?? 0)) }))
    .filter((x) => x.by >= 0.08).sort((a, b) => b.by - a.by).slice(0, 2);
}
/** "Length down to 1/16, Space up. The original stabs are shorter and roomier." */
export function polySuggestLine(id: MelodyPresetId, current: PolyMacros, ticks: PolyMacros, noun: string): string {
  const moves = polyMoves(current, ticks);
  if (!moves.length) return "You're on the gold ticks. Switch A/B to judge the rest by ear.";
  const say = moves.map(({ id: k, up }) => {
    const w = (v: number) => polyKnobWord(id, k, v).split(" · ")[0];
    const to = w(ticks[k] ?? 0), named = k === "length" || to !== w(current[k] ?? 0);
    return `${POLY_KNOB_SPECS[k].name} ${up ? "up" : "down"}${named ? ` to ${to}` : ""}`;
  });
  const plural = noun.endsWith("s");
  return `${say.join(", ")}. The original ${noun} ${plural ? "are" : "is"} ${moves.map(({ id: k, up }) => TRAIT[k][up ? 0 : 1]).join(" and ")}.`;
}
