// Make for drums (Phase 5, P3, L216, T124): three rows (kick, clap & snare, hats), each its own
// pure-TS drum voice with 4 presets and 3–4 knobs (the TR-909's own controls, sound-check.md).
// Like render.ts for the bass: plain TS sample by sample, no Web Audio, so the same code renders
// "Mine" in Make's worker, a library block in the Studio and the unit tests. Noise is seeded per hit,
// so a pattern renders sample for sample the same every time (a saved sound after a reload).
// A pass wraps round (a tail at the end sounds at the start), as the loop does.
import type { DrumRow } from "./drums-read";
import { secondsPer16th, type Rendered } from "./render";

export type { DrumRow };
export const DRUM_ROWS: DrumRow[] = ["kick", "clap", "hats"];
export const DRUM_ROW_NAMES: Record<DrumRow, string> = { kick: "Kick", clap: "Clap & snare", hats: "Hats" };
/** General MIDI drum notes, so a saved pattern reads like any drum pattern. */
export const ROW_MIDI: Record<DrumRow, number> = { kick: 36, clap: 39, hats: 42 };

export type DrumKnobId = "tune" | "decay" | "click" | "drive" | "tone" | "snap" | "room" | "length" | "width";
export type DrumMacros = Partial<Record<DrumKnobId, number>>;
/** T124: Kick Tune/Decay/Click/Drive (909 kick plus Drive); Clap & snare Tone/Decay/Snap/Room; Hats Tone/Length/Width. */
export const ROW_KNOBS: Record<DrumRow, DrumKnobId[]> = { kick: ["tune", "decay", "click", "drive"], clap: ["tone", "decay", "snap", "room"], hats: ["tone", "length", "width"] };

export type DrumPresetId =
  | "kick-deep-909" | "kick-punch" | "kick-round-808" | "kick-tight"
  | "clap-wide" | "clap-snap" | "clap-rim" | "clap-tight-snare"
  | "hats-open-909" | "hats-closed-tick" | "hats-shaker" | "hats-ride";

type KickVoice = { kind: "kick"; hz: [number, number]; bend: number; bendS: number; decayS: [number, number]; click: number; gainDb: number };
type ClapVoice = { kind: "clap" | "snap" | "rim" | "snare"; hz: [number, number]; q: number; bursts: number; gapS: number; decayS: [number, number]; snap: number; wide: number; bodyHz?: number; gainDb: number };
type HatVoice = { kind: "metal" | "noise"; hp: [number, number]; ratio: number; metal: number; lenS: [number, number]; attackS: number; gainDb: number };

const isHat = (v: KickVoice | ClapVoice | HatVoice): v is HatVoice => v.kind === "metal" || v.kind === "noise";

export type DrumPreset = { id: DrumPresetId; row: DrumRow; name: string; tags: string[]; about: string; macros: DrumMacros; voice: KickVoice | ClapVoice | HatVoice };

export const DRUM_PRESETS: Record<DrumPresetId, DrumPreset> = {
  "kick-deep-909": { id: "kick-deep-909", row: "kick", name: "Deep 909", tags: ["deep", "909"], about: "The TR-909's kick: a sine that drops fast in pitch onto a low note, with a soft click on top.",
    macros: { tune: 0.38, decay: 0.42, click: 0.25, drive: 0.2 }, voice: { kind: "kick", hz: [40, 90], bend: 2.6, bendS: 0.022, decayS: [0.05, 0.5], click: 0.5, gainDb: -2 } },
  "kick-punch": { id: "kick-punch", row: "kick", name: "Punch", tags: ["punchy", "hard"], about: "A short, hard kick: a big fast pitch drop and a loud click, pushed into clipping.",
    macros: { tune: 0.45, decay: 0.3, click: 0.6, drive: 0.45 }, voice: { kind: "kick", hz: [45, 100], bend: 4, bendS: 0.012, decayS: [0.04, 0.35], click: 0.8, gainDb: -3 } },
  "kick-round-808": { id: "kick-round-808", row: "kick", name: "Round 808", tags: ["808", "boomy"], about: "The TR-808's kick: a round sine with a gentle pitch drop and a long, booming tail.",
    macros: { tune: 0.35, decay: 0.55, click: 0.1, drive: 0.1 }, voice: { kind: "kick", hz: [35, 80], bend: 0.7, bendS: 0.05, decayS: [0.12, 1.2], click: 0.25, gainDb: -2 } },
  "kick-tight": { id: "kick-tight", row: "kick", name: "Tight", tags: ["tight", "short"], about: "A short, higher kick that gets out of the bass's way: a quick thump and a tick.",
    macros: { tune: 0.5, decay: 0.25, click: 0.4, drive: 0.2 }, voice: { kind: "kick", hz: [50, 110], bend: 3, bendS: 0.01, decayS: [0.025, 0.2], click: 0.6, gainDb: -2 } },
  "clap-wide": { id: "clap-wide", row: "clap", name: "Wide clap", tags: ["clap", "wide"], about: "The 909 clap: several hands a few milliseconds apart (noise bursts), spread left and right, then a short tail.",
    macros: { tone: 0.55, decay: 0.35, snap: 0.45, room: 0.3 }, voice: { kind: "clap", hz: [700, 2600], q: 1.4, bursts: 4, gapS: 0.0105, decayS: [0.05, 0.45], snap: 0.6, wide: 0.6, gainDb: -4 } },
  "clap-snap": { id: "clap-snap", row: "clap", name: "Snap", tags: ["snap", "dry"], about: "A finger snap: one bright, short crack of noise.",
    macros: { tone: 0.6, decay: 0.2, snap: 0.6, room: 0.15 }, voice: { kind: "snap", hz: [1400, 4200], q: 1.8, bursts: 1, gapS: 0, decayS: [0.02, 0.2], snap: 0.8, wide: 0.1, gainDb: -4 } },
  "clap-rim": { id: "clap-rim", row: "clap", name: "Rim", tags: ["rim", "click"], about: "A rimshot: a short wooden knock (two tones) with a tick of noise.",
    macros: { tone: 0.5, decay: 0.2, snap: 0.3, room: 0.1 }, voice: { kind: "rim", hz: [1100, 2400], q: 3, bursts: 1, gapS: 0, decayS: [0.01, 0.09], snap: 0.4, wide: 0, bodyHz: 480, gainDb: -6 } },
  "clap-tight-snare": { id: "clap-tight-snare", row: "clap", name: "Tight snare", tags: ["snare", "tight"], about: "The 909 snare: a tuned drum body plus the snare wires' noise (Snap), short and tight.",
    macros: { tone: 0.5, decay: 0.3, snap: 0.55, room: 0.2 }, voice: { kind: "snare", hz: [1500, 6000], q: 0.7, bursts: 1, gapS: 0, decayS: [0.04, 0.35], snap: 1, wide: 0.1, bodyHz: 190, gainDb: -4 } },
  "hats-open-909": { id: "hats-open-909", row: "hats", name: "Open 909", tags: ["open", "909"], about: "Metallic hats (six square waves plus noise, high-passed) that ring open; the next hat cuts the last, as on a 909.",
    macros: { tone: 0.7, length: 0.5, width: 0.2 }, voice: { kind: "metal", hp: [4500, 11000], ratio: 1.7, metal: 0.5, lenS: [0.02, 0.5], attackS: 0.0005, gainDb: -6 } },
  "hats-closed-tick": { id: "hats-closed-tick", row: "hats", name: "Closed tick", tags: ["closed", "tick"], about: "A short, closed hat: a bright tick of metal and noise.",
    macros: { tone: 0.65, length: 0.25, width: 0.15 }, voice: { kind: "metal", hp: [5000, 12000], ratio: 1.9, metal: 0.4, lenS: [0.008, 0.15], attackS: 0.0003, gainDb: -6 } },
  "hats-shaker": { id: "hats-shaker", row: "hats", name: "Shaker", tags: ["shaker", "soft"], about: "A shaker: band-passed noise that swells in a few milliseconds, softer than a hat.",
    macros: { tone: 0.5, length: 0.35, width: 0.3 }, voice: { kind: "noise", hp: [3500, 9000], ratio: 1, metal: 0, lenS: [0.02, 0.25], attackS: 0.008, gainDb: -5 } },
  "hats-ride": { id: "hats-ride", row: "hats", name: "Ride", tags: ["ride", "long"], about: "A ride cymbal: lower metal that rings long under the beat.",
    macros: { tone: 0.45, length: 0.6, width: 0.35 }, voice: { kind: "metal", hp: [2500, 7000], ratio: 1.15, metal: 0.7, lenS: [0.2, 1.6], attackS: 0.001, gainDb: -8 } },
};
export const DRUM_PRESET_IDS = Object.keys(DRUM_PRESETS) as DrumPresetId[];
export const ROW_PRESETS: Record<DrumRow, DrumPresetId[]> = {
  kick: DRUM_PRESET_IDS.filter((id) => DRUM_PRESETS[id].row === "kick"),
  clap: DRUM_PRESET_IDS.filter((id) => DRUM_PRESETS[id].row === "clap"),
  hats: DRUM_PRESET_IDS.filter((id) => DRUM_PRESETS[id].row === "hats"),
};
export const isDrumPreset = (v: unknown): v is DrumPresetId => typeof v === "string" && Object.prototype.hasOwnProperty.call(DRUM_PRESETS, v);
export const rowOf = (id: DrumPresetId): DrumRow => DRUM_PRESETS[id].row;

const clamp01 = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null);
/** The row's knobs only, 0–1; missing or junk values get the preset's own. */
export function clampDrumMacros(preset: DrumPresetId, v: Partial<Record<string, unknown>> | undefined): DrumMacros {
  const p = DRUM_PRESETS[preset], out: DrumMacros = {};
  for (const id of ROW_KNOBS[p.row]) out[id] = clamp01(v?.[id]) ?? p.macros[id] ?? 0.5;
  return out;
}

// ── Knob words (T82: the word under a knob) ─────────────────────────────────────────────────────

export const DRUM_KNOB_SPECS: Record<DrumKnobId, { name: string; explain: string }> = {
  tune: { name: "Tune", explain: "The kick's note: where its body sits, from a deep sub thump to a higher, tighter knock." },
  decay: { name: "Decay", explain: "How long the hit rings before it dies away." },
  click: { name: "Click", explain: "The click at the start of the kick (the 909's Attack): soft is a round thump, up is a hard tick that cuts through." },
  drive: { name: "Drive", explain: "Soft clipping: warmer and louder, then gritty." },
  tone: { name: "Tone", explain: "How bright the hit is: low is dark and thick, high is thin and crisp." },
  snap: { name: "Snap", explain: "How much noise crack there is (the 909 snare's Snappy, the snare wires; a clap's sharp edge)." },
  room: { name: "Room", explain: "A short room around the hit: dry up close, then a bigger space." },
  length: { name: "Length", explain: "How long each hat rings: a closed tick, up to an open hat. The next hat always cuts the last." },
  width: { name: "Width", explain: "Spreads the hats between the speakers." },
};

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteOf = (hz: number) => { const m = Math.round(69 + 12 * Math.log2(hz / 440)); return `${NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`; };
const lerpExp = ([lo, hi]: [number, number], v: number) => lo * Math.pow(hi / lo, v);
/** The kick's note in Hz at Tune `v` on this preset. */
export const kickHz = (preset: DrumPresetId, v: number) => { const x = DRUM_PRESETS[preset].voice; return x.kind === "kick" ? lerpExp(x.hz, v) : 0; };
const FRACTIONS: [number, string][] = [[0.5, "1/32"], [1, "1/16"], [2, "1/8"], [4, "1/4"], [8, "1/2"]];

/** The word under a drum knob: what the value sounds like ("A1 · 55 Hz", "1/8", "crisp"). */
export function drumKnobWord(preset: DrumPresetId, id: DrumKnobId, v: number, bpm = 124): string {
  const p = DRUM_PRESETS[preset];
  switch (id) {
    case "tune": { const hz = kickHz(preset, v); return `${noteOf(hz)} · ${Math.round(hz)} Hz`; }
    case "decay": {
      if (p.row !== "kick") return v < 0.34 ? "short" : v < 0.67 ? "medium" : "long";
      const x = p.voice as KickVoice, heard = lerpExp(x.decayS, v) * 3.5, steps = heard / secondsPer16th(bpm);
      return FRACTIONS.reduce((a, b) => (Math.abs(Math.log2(b[0] / steps)) < Math.abs(Math.log2(a[0] / steps)) ? b : a))[1];
    }
    case "click": return v < 0.3 ? "soft" : v < 0.7 ? "snappy" : "hard";
    case "drive": return v < 0.1 ? "clean" : v < 0.55 ? "warm" : "dirty";
    case "tone": return v < 0.34 ? "dark" : v < 0.5 ? "warm" : "bright";
    case "snap": return v < 0.3 ? "soft" : v < 0.7 ? "crisp" : "sharp";
    case "room": return v < 0.15 ? "dry" : v < 0.5 ? "small" : "big";
    case "length": return v < 0.3 ? "closed" : v < 0.45 ? "half-open" : "open";
    case "width": return v < 0.3 ? "narrow" : v < 0.7 ? "wide" : "very wide";
  }
}

// ── Rendering ───────────────────────────────────────────────────────────────────────────────────

/** A seeded PRNG (mulberry32) giving −1…1, so noise is the same on every render. */
function noise(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

type Bq = { b0: number; b1: number; b2: number; a1: number; a2: number; x1: number; x2: number; y1: number; y2: number };
function biquad(type: "hp" | "bp", f: number, q: number, rate: number): Bq {
  const w0 = (2 * Math.PI * Math.min(f, rate * 0.45)) / rate, al = Math.sin(w0) / (2 * q), c = Math.cos(w0), a0 = 1 + al;
  const [b0, b1, b2] = type === "hp" ? [(1 + c) / 2, -(1 + c), (1 + c) / 2] : [al, 0, -al];
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * c) / a0, a2: (1 - al) / a0, x1: 0, x2: 0, y1: 0, y2: 0 };
}
const step = (f: Bq, x: number) => {
  const y = f.b0 * x + f.b1 * f.x1 + f.b2 * f.x2 - f.a1 * f.y1 - f.a2 * f.y2;
  f.x2 = f.x1; f.x1 = x; f.y2 = f.y1; f.y1 = y;
  return y;
};

/** The six square-wave frequencies of the 808/909 metal (Hz), times the preset's ratio. */
const METAL = [205.3, 304.4, 369.6, 522.7, 540, 800];

/** One hit as a stereo pair, `len` samples (cut with a 3 ms fade when `choke` is set). */
function renderHit(p: DrumPreset, m: DrumMacros, vel: number, len: number, rate: number, seed: number, choke: boolean): [Float32Array, Float32Array] {
  const L = new Float32Array(len), R = new Float32Array(len);
  const rnd = noise(seed), rnd2 = noise(seed ^ 0x9e3779b9);
  const g = Math.pow(10, p.voice.gainDb / 20) * (0.25 + 0.75 * vel);
  const v = p.voice;
  if (v.kind === "kick") {
    const f0 = lerpExp(v.hz, m.tune ?? 0.5), tau = lerpExp(v.decayS, m.decay ?? 0.5), click = (m.click ?? 0.3) * v.click, drive = m.drive ?? 0;
    const dg = 1 + 6 * drive, dn = Math.tanh(dg), hp = biquad("hp", 2500, 0.7, rate);
    let ph = 0;
    for (let i = 0; i < len; i++) {
      const t = i / rate;
      ph += (f0 * (1 + v.bend * Math.exp(-t / v.bendS))) / rate;
      const env = Math.min(1, t / 0.0015) * Math.exp(-t / tau);
      const c = click * 1.4 * Math.exp(-t / 0.0035) * step(hp, rnd()) + click * 0.5 * Math.exp(-t / 0.002) * Math.sin(2 * Math.PI * 1800 * t);
      let x = Math.sin(2 * Math.PI * ph) * env + c;
      if (drive > 0) x = Math.tanh(x * dg) / dn;
      L[i] = R[i] = x * g;
    }
  } else if (isHat(v)) {
    const fc = lerpExp(v.hp, m.tone ?? 0.5), tau = lerpExp(v.lenS, m.length ?? 0.5), w = m.width ?? 0;
    const f1 = biquad(v.kind === "noise" ? "bp" : "hp", fc, v.kind === "noise" ? 1.1 : 0.9, rate), f2 = biquad(v.kind === "noise" ? "bp" : "hp", fc, v.kind === "noise" ? 1.1 : 0.9, rate);
    const f1b = biquad("hp", fc * 0.8, 0.7, rate), f2b = biquad("hp", fc * 0.8, 0.7, rate);
    const fr = METAL.map((f) => (f * v.ratio) / rate), ph = METAL.map((_, k) => (k * 0.17) % 1), ph2 = METAL.map((_, k) => (k * 0.41) % 1);
    for (let i = 0; i < len; i++) {
      const t = i / rate;
      const env = Math.min(1, t / v.attackS) * Math.exp(-t / tau);
      let mt = 0, mt2 = 0;
      if (v.metal > 0) for (let k = 0; k < 6; k++) {
        ph[k] += fr[k]; if (ph[k] >= 1) ph[k] -= 1; mt += ph[k] < 0.5 ? 1 : -1;
        ph2[k] += fr[k] * 1.013; if (ph2[k] >= 1) ph2[k] -= 1; mt2 += ph2[k] < 0.5 ? 1 : -1;
      }
      const mid = step(f1b, step(f1, (v.metal * mt) / 6 + (1 - v.metal) * rnd()));
      const side = w > 0 ? step(f2b, step(f2, (v.metal * mt2) / 6 + (1 - v.metal) * rnd2())) : 0;
      L[i] = (mid + w * side) * env * g;
      R[i] = (mid - w * side) * env * g;
    }
  } else {
    // Clap, snap, rim, snare.
    const tone = m.tone ?? 0.5, fc = lerpExp(v.hz, tone), tau = lerpExp(v.decayS, m.decay ?? 0.5), snap = (m.snap ?? 0.5) * v.snap;
    const bpL = biquad("bp", fc, v.q, rate), bpR = biquad("bp", fc, v.q, rate), crack = biquad("hp", 3500, 0.7, rate);
    const last = (v.bursts - 1) * v.gapS;
    const bodyHz = (v.bodyHz ?? 200) * Math.pow(2, (tone - 0.5) * 0.8);
    for (let i = 0; i < len; i++) {
      const t = i / rate;
      let env: number;
      if (v.kind === "clap" && t < last) env = Math.exp(-(t % v.gapS) / 0.0032);
      else env = Math.min(1, t / 0.0006) * Math.exp(-(t - last) / tau);
      const k = v.kind === "clap" && t < last ? Math.floor(t / v.gapS) : -1;
      const pan = k >= 0 ? (k % 2 ? 1 : -1) * v.wide * 0.5 : 0;
      const n1 = rnd(), n2 = v.wide > 0 ? rnd2() * v.wide + n1 * (1 - v.wide) : n1;
      const cr = snap * 0.9 * Math.exp(-t / 0.0028) * step(crack, n1);
      let l: number, r: number;
      if (v.kind === "rim" || v.kind === "snare") {
        const bd = v.kind === "rim"
          ? (Math.sin(2 * Math.PI * bodyHz * t) * 0.6 + Math.sin(2 * Math.PI * fc * t) * 0.5) * Math.exp(-t / (tau * 0.7))
          : Math.sin(2 * Math.PI * bodyHz * (t + 0.004 * (1 - Math.exp(-t / 0.004)))) * Math.exp(-t / (tau * 0.45)) * 0.9;
        const wires = (v.kind === "snare" ? snap : snap * 0.4) * env;
        l = bd + wires * step(bpL, n1) * 2.2 + cr;
        r = bd + wires * step(bpR, n2) * 2.2 + cr;
      } else {
        l = env * step(bpL, n1) * 2.5 * (1 - pan) + cr;
        r = env * step(bpR, n2) * 2.5 * (1 + pan) + cr;
      }
      L[i] = l * g; R[i] = r * g;
    }
  }
  if (choke) {
    const f = Math.min(len, Math.round(rate * 0.003));
    for (let i = 0; i < f; i++) { const k = len - f + i, a = 1 - (i + 1) / f; L[k] *= a; R[k] *= a; }
  }
  return [L, R];
}

/** How long a hit can ring at most (s), before the next one cuts it (kick, hats) or it overlaps (clap). */
function maxLenS(p: DrumPreset, m: DrumMacros) {
  const v = p.voice;
  if (v.kind === "kick") return Math.min(2, lerpExp(v.decayS, m.decay ?? 0.5) * 7);
  if (isHat(v)) return Math.min(2.5, lerpExp(v.lenS, m.length ?? 0.5) * 7 + v.attackS);
  return Math.min(1.5, (v.bursts - 1) * v.gapS + lerpExp(v.decayS, m.decay ?? 0.5) * 7);
}

/** Freeverb-style room (4 combs, 2 allpasses per side), run twice round the pass so the tail wraps. */
function room(L: Float32Array, R: Float32Array, amount: number, rate: number) {
  if (amount <= 0.01 || L.length === 0) return;
  const s = rate / 44100, fb = 0.62 + 0.26 * amount, damp = 0.3, wet = 0.55 * amount;
  const combs = [1116, 1188, 1277, 1356], aps = [556, 441];
  for (const [x, off] of [[L, 0], [R, 23]] as [Float32Array, number][]) {
    const cb = combs.map((n) => ({ buf: new Float32Array(Math.max(1, Math.round((n + off) * s))), i: 0, lp: 0 }));
    const ab = aps.map((n) => ({ buf: new Float32Array(Math.max(1, Math.round((n + off) * s))), i: 0 }));
    const out = new Float32Array(x.length);
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < x.length; i++) {
      const inp = x[i] * 0.2;
      let y = 0;
      for (const c of cb) { const o = c.buf[c.i]; c.lp = o * (1 - damp) + c.lp * damp; c.buf[c.i] = inp + c.lp * fb; c.i = (c.i + 1) % c.buf.length; y += o; }
      for (const a of ab) { const o = a.buf[a.i]; const v = y + o * 0.5; a.buf[a.i] = v; y = o - v * 0.5; a.i = (a.i + 1) % a.buf.length; }
      if (pass === 1) out[i] = y;
    }
    for (let i = 0; i < x.length; i++) x[i] += out[i] * wet;
  }
}

/** A hit at `t` seconds into the pass, velocity 0–1 (against the row's biggest). */
export type TimedHit = { t: number; vel: number };

/**
 * Renders hits of one row over a pass of `lenS` seconds. `wrap`: the pass loops, so a hit before 0
 * or a tail past the end comes round the other side (and the next hit after the last is the first
 * one, a pass later). Kicks and hats are cut by the next hit of their row (a 909's hats choke).
 */
export function renderDrumHits(preset: DrumPresetId, macros: DrumMacros, hits: TimedHit[], o: { lenS: number; rate?: number; wrap?: boolean }): Rendered {
  const rate = o.rate ?? 44100, p = DRUM_PRESETS[preset], m = clampDrumMacros(preset, macros);
  const n = Math.max(1, Math.round(o.lenS * rate));
  const left = new Float32Array(n), right = new Float32Array(n);
  const wrap = o.wrap ?? true;
  const at = hits.map((h, j) => ({ a: wrap ? ((Math.round(h.t * rate) % n) + n) % n : Math.round(h.t * rate), vel: h.vel, j })).filter((h) => wrap || (h.a >= 0 && h.a < n)).sort((x, y) => x.a - y.a);
  const chokes = p.row !== "clap";
  const cap = Math.round(maxLenS(p, m) * rate);
  at.forEach((h, k) => {
    const next = at[k + 1]?.a ?? (wrap && at.length ? at[0].a + n : Infinity);
    const gap = chokes ? next - h.a : Infinity;
    const len = Math.max(1, Math.min(cap, gap, wrap ? n : n - h.a));
    // The seed is the hit's place in the pattern, so the same pattern always sounds the same.
    const [l, r] = renderHit(p, m, h.vel, len, rate, 0x51ed + 7919 * (h.j + 1) + DRUM_PRESET_IDS.indexOf(preset), chokes && gap <= cap);
    for (let i = 0; i < len; i++) { const q = (h.a + i) % n; left[q] += l[i]; right[q] += r[i]; }
  });
  if (p.row === "clap") room(left, right, m.room ?? 0, rate);
  return { left, right, rate };
}

/** A hit on the 16th grid: its step, its offset in 16ths (swing, a late or early hand) and velocity. */
export type StepDrum = { step: number; off?: number; vel: number };

/** One pass of `steps` 16ths at `bpm`: the hits at their steps plus offsets, in tempo (L215). */
export function renderDrumRow(preset: DrumPresetId, macros: DrumMacros, hits: StepDrum[], o: { bpm: number; steps: number; rate?: number }): Rendered {
  const sps = secondsPer16th(o.bpm);
  return renderDrumHits(preset, macros, hits.map((h) => ({ t: (h.step + (h.off ?? 0)) * sps, vel: h.vel })), { lenS: o.steps * sps, rate: o.rate });
}

// ── The Mentor's line under the drum knobs (P6, like coach.ts for the bass) ─────────────────────

/** What the original measures when a knob should go [up, down]. */
const TRAIT: Record<DrumKnobId, [string, string]> = {
  tune: ["higher", "lower"], decay: ["longer", "shorter"], click: ["snappier", "softer"], drive: ["grittier", "cleaner"],
  tone: ["brighter", "darker"], snap: ["crisper", "softer"], room: ["roomier", "drier"], length: ["longer", "shorter"], width: ["wider", "narrower"],
};
/** A tick this close to the knob counts as reached (as coach.ts). */
const REACHED = 0.08;

/** The knobs furthest from their ticks (at most 2), biggest move first. */
export function drumMoves(row: DrumRow, current: DrumMacros, ticks: DrumMacros) {
  return ROW_KNOBS[row].map((id) => ({ id, up: (ticks[id] ?? 0) > (current[id] ?? 0), by: Math.abs((ticks[id] ?? 0) - (current[id] ?? 0)) }))
    .filter((x) => x.by >= REACHED).sort((a, b) => b.by - a.by).slice(0, 2);
}

/**
 * "Tune down to A1, Click up. The original kick is lower and snappier." A move names the word it
 * lands on when the word changes (Tune always: its note). `noun`: kick, clap, snare, rim or hats.
 */
export function drumSuggestLine(preset: DrumPresetId, current: DrumMacros, ticks: DrumMacros, noun: string, bpm = 124): string {
  const moves = drumMoves(DRUM_PRESETS[preset].row, current, ticks);
  if (!moves.length) return "You're on the gold ticks. Switch A/B to judge the rest by ear.";
  const say = moves.map(({ id, up }) => {
    const from = drumKnobWord(preset, id, current[id] ?? 0, bpm), to = drumKnobWord(preset, id, ticks[id] ?? 0, bpm);
    const word = id === "tune" ? to.split(" · ")[0] : to;
    return `${DRUM_KNOB_SPECS[id].name} ${up ? "up" : "down"}${to !== from ? ` to ${word}` : ""}`;
  });
  const traits = moves.map(({ id, up }) => TRAIT[id][up ? 0 : 1]);
  return `${say.join(", ")}. The original ${noun} ${noun === "hats" ? "are" : "is"} ${traits.join(" and ")}.`;
}
