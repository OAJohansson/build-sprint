// Make for FX (Phase 5 slice 3, P5, sound-check.md "FX", T124): the sounds that mark the joins of a
// song, not notes or beats. Three rows, each a pure-TS generator timed to the section (nothing is
// read note by note): Impact on the drop's first beat, Downlifter falling after it, Riser over the
// last bars into the next section. Pitched presets play in the track's key (the root). The same in
// Make's worker, the Studio and the tests; noise is seeded, so a sound renders the same every time.
import { midiToHz, pitchClass } from "@/lib/synths/theory";
import { secondsPer16th, type Rendered } from "./render";

export type FxRow = "impact" | "down" | "riser";
export const FX_ROWS: FxRow[] = ["impact", "down", "riser"];
export const FX_ROW_NAMES: Record<FxRow, string> = { impact: "Impact", down: "Downlifter", riser: "Noise riser" };
/** FX-F2: what each row does, in one plain line (sound-check.md "FX"). */
export const FX_ROW_ABOUT: Record<FxRow, string> = { impact: "a hit that marks the drop's first beat", down: "falls after the hit to let the energy down", riser: "builds tension into the next part" };
/** FX-F3: a typical house-drop start for each row when nothing clear is measured. */
export const FX_TYPICAL: Record<FxRow, { preset: FxPresetId; macros: FxMacros; say: string }> = {
  impact: { preset: "fx-impact-subdrop", macros: { size: 0.7, tone: 0.4, tail: 0.25 }, say: "a Sub drop with a 1-bar tail" },
  down: { preset: "fx-down-dark", macros: { drop: 0.4, tone: 0.5, length: 0.5 }, say: "a Dark fall over 2 bars" },
  riser: { preset: "fx-riser-noise", macros: { rise: 0.5, tone: 0.7, width: 0.5 }, say: "a Bright noise riser over the last 2 bars" },
};
/** FX-F4: an event's length as the knob shows it ("2.6 bars"), for tags and labels. */
export const fxLengthWord = (id: FxPresetId, m: FxMacros) => { const r = FX_PRESETS[id].row, k = r === "impact" ? "tail" : r === "down" ? "length" : "rise"; return fxKnobWord(id, k, clampFxMacros(id, m)[k] ?? 0.5).split(" · ")[0]; };

/** What the save button and names call a row's sound. */
export const FX_NOUN: Record<FxRow, string> = { impact: "impact", down: "downlifter", riser: "riser" };

export type FxKnobId = "size" | "tone" | "tail" | "drop" | "length" | "rise" | "width";
export const FX_KNOBS: Record<FxRow, FxKnobId[]> = { impact: ["size", "tone", "tail"], down: ["drop", "tone", "length"], riser: ["rise", "tone", "width"] };
export type FxMacros = Partial<Record<FxKnobId, number>>;

export type FxPresetId = "fx-impact-big" | "fx-impact-subdrop" | "fx-impact-crash" | "fx-down-dark" | "fx-down-noise" | "fx-riser-noise" | "fx-riser-revcrash" | "fx-riser-synth";
type FxPreset = { id: FxPresetId; row: FxRow; name: string; tags: string[]; about: string; macros: FxMacros; gainDb: number };
export const FX_PRESETS: Record<FxPresetId, FxPreset> = {
  "fx-impact-big": { id: "fx-impact-big", row: "impact", name: "Big hit", tags: ["impact", "hit"], about: "A wide hit on the drop's first beat: a burst of noise, a low thump and a room that rings out.", macros: { size: 0.7, tone: 0.5, tail: 0.5 }, gainDb: -6 },
  "fx-impact-subdrop": { id: "fx-impact-subdrop", row: "impact", name: "Sub drop", tags: ["impact", "sub drop"], about: "A low boom that falls in pitch under the drop's first beat, landing on the track's root.", macros: { size: 0.7, tone: 0.4, tail: 0.6 }, gainDb: -4 },
  "fx-impact-crash": { id: "fx-impact-crash", row: "impact", name: "Crash", tags: ["impact", "crash"], about: "A crash cymbal on the drop's first beat: bright metal that rings and fades.", macros: { size: 0.5, tone: 0.65, tail: 0.55 }, gainDb: -10 },
  "fx-down-dark": { id: "fx-down-dark", row: "down", name: "Dark fall", tags: ["downlifter", "dark"], about: "A dark sweep that falls after the hit: filtered noise and a tone dropping from the root, letting the energy down.", macros: { drop: 0.4, tone: 0.5, length: 0.5 }, gainDb: -10 },
  "fx-down-noise": { id: "fx-down-noise", row: "down", name: "Noise fall", tags: ["downlifter", "noise"], about: "White noise whose filter closes as it fades: a plain falling sweep.", macros: { drop: 0.5, tone: 0.6, length: 0.5 }, gainDb: -12 },
  "fx-riser-noise": { id: "fx-riser-noise", row: "riser", name: "Bright noise", tags: ["riser", "noise"], about: "White noise whose filter opens and level climbs into the next section: the classic build.", macros: { rise: 0.5, tone: 0.7, width: 0.5 }, gainDb: -12 },
  "fx-riser-revcrash": { id: "fx-riser-revcrash", row: "riser", name: "Reverse crash", tags: ["riser", "reverse crash"], about: "A crash cymbal played backwards: a swell that sucks into the next beat, the organic riser.", macros: { rise: 0.35, tone: 0.6, width: 0.4 }, gainDb: -10 },
  "fx-riser-synth": { id: "fx-riser-synth", row: "riser", name: "Synth riser", tags: ["riser", "synth"], about: "A sawtooth rising an octave from the track's root, its filter opening into the next section.", macros: { rise: 0.5, tone: 0.5, width: 0.4 }, gainDb: -16 },
};
export const FX_PRESET_IDS = Object.keys(FX_PRESETS) as FxPresetId[];
export const fxRowPresets = (row: FxRow) => FX_PRESET_IDS.filter((id) => FX_PRESETS[id].row === row);
export const FX_ROW_DEFAULT: Record<FxRow, FxPresetId> = { impact: "fx-impact-subdrop", down: "fx-down-dark", riser: "fx-riser-noise" };
export const isFxPreset = (v: unknown): v is FxPresetId => typeof v === "string" && Object.prototype.hasOwnProperty.call(FX_PRESETS, v);
export const fxRowOf = (id: FxPresetId): FxRow => FX_PRESETS[id].row;

const clamp01 = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null);
export function clampFxMacros(id: FxPresetId, v: Partial<Record<string, unknown>> | undefined): Required<Pick<FxMacros, FxKnobId>> & FxMacros {
  const p = FX_PRESETS[id], out: FxMacros = {};
  for (const k of FX_KNOBS[p.row]) out[k] = clamp01(v?.[k]) ?? p.macros[k] ?? 0.5;
  return out as Required<Pick<FxMacros, FxKnobId>> & FxMacros;
}

// ── Knobs ───────────────────────────────────────────────────────────────────────────────────────

/** Bars for Rise, Length and Tail: ½ bar … 8 bars, doubling every quarter of the knob. */
export const fxBars = (v: number) => Math.pow(2, 4 * v - 1);
/** Octaves the Downlifter falls: ½ … 3. */
export const fxDropOct = (v: number) => 0.5 + 2.5 * v;
const fmtBars = (b: number) => (b < 0.75 ? "½ bar" : b < 1.4 ? "1 bar" : `${Math.round(b * 10) / 10} bars`);

export const FX_KNOB_SPECS: Record<FxKnobId, { name: string; explain: string }> = {
  size: { name: "Size", explain: "How big the hit is: a tap, up to a wall of sound with a big room." },
  tone: { name: "Tone", explain: "How bright it is: dark and muffled, up to bright and airy." },
  tail: { name: "Tail", explain: "How long the hit rings out, from half a bar to several bars." },
  drop: { name: "Drop", explain: "How far the fall goes, in octaves." },
  length: { name: "Length", explain: "How many bars the fall takes after the hit." },
  rise: { name: "Rise", explain: "How many bars the build takes before the next section." },
  width: { name: "Width", explain: "Spreads the sound between the speakers." },
};

/** The word under an FX knob, fine enough that a drag shows a change. */
export function fxKnobWord(id: FxPresetId, k: FxKnobId, v: number): string {
  void id;
  const pct = Math.round(v * 100);
  switch (k) {
    case "size": return `${v < 0.34 ? "small" : v < 0.67 ? "medium" : "big"} · ${pct}`;
    case "tone": return `${v < 0.34 ? "dark" : v < 0.67 ? "mid" : "bright"} · ${pct}`;
    case "tail": case "length": case "rise": { const b = fxBars(v); return `${fmtBars(b)} · ${pct}`; }
    case "drop": { const o = fxDropOct(v); return `${o < 0.75 ? "½ octave" : o < 1.25 ? "1 octave" : `${Math.round(o * 10) / 10} octaves`} · ${pct}`; }
    case "width": return `${v < 0.3 ? "narrow" : v < 0.7 ? "wide" : "very wide"} · ${pct}`;
  }
}

// ── Timing: where each row sits in the loop (P5, nothing read note by note) ────────────────────

export type FxPlace = { atBar: number; bars: number; label: string };
export type FxPlan = Record<FxRow, FxPlace>;

/**
 * Each row's place in a loop of `loopBars` starting at track bar `from` (1-based), from the map's
 * section starts (1-based bars): the Impact on the first section start in the loop (the drop's first
 * beat; the loop's first bar when none), the Downlifter from there, the Riser ending where the next
 * section starts inside or right after the loop (the loop's end otherwise). Lengths from the knobs.
 */
export function fxPlan(from: number, loopBars: number, sectionStarts: number[], m: Record<FxRow, FxMacros>): FxPlan {
  const to = from + loopBars; // the bar after the loop
  const startIn = sectionStarts.find((b) => b >= from && b < to);
  const hit = (startIn ?? from) - from;
  const nextIn = sectionStarts.find((b) => b > from && b <= to) ?? to;
  const end = nextIn - from;
  const tail = Math.min(loopBars - hit, Math.max(0.5, fxBars(m.impact.tail ?? 0.5)));
  const fall = Math.min(loopBars - hit, Math.max(0.5, fxBars(m.down.length ?? 0.5)));
  const rise = Math.min(end, Math.max(0.5, fxBars(m.riser.rise ?? 0.5)));
  const lab = (a: number, b: number) => (b - a <= 1 ? `bar ${from + a}` : `bars ${from + a}–${from + Math.ceil(b) - 1}`);
  return {
    impact: { atBar: hit, bars: tail, label: lab(hit, hit + 1) },
    down: { atBar: hit, bars: fall, label: lab(hit, hit + fall) },
    riser: { atBar: end - rise, bars: rise, label: lab(Math.floor(end - rise), end) },
  };
}

// ── Rendering ───────────────────────────────────────────────────────────────────────────────────

function noise(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1; };
}
/** A state-variable filter (Cytomic), mode lp/bp/hp, cutoff set per sample. */
function svf() {
  let ic1 = 0, ic2 = 0;
  return (x: number, fc: number, q: number, rate: number, mode: "lp" | "bp" | "hp") => {
    const g = Math.tan((Math.PI * Math.min(rate * 0.45, Math.max(20, fc))) / rate), k = 1 / q;
    const a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2;
    const v3 = x - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2;
    return mode === "lp" ? v2 : mode === "bp" ? v1 : x - k * v1 - v2;
  };
}
const METAL = [205.3, 304.4, 369.6, 522.7, 540, 800].map((f) => f * 2.4);

/**
 * One FX event of `lenS` seconds, as a stereo pair. `rootMidi`: the track's root (pitched presets).
 * Seeded per preset, so it renders the same every time.
 */
export function renderFxEvent(id: FxPresetId, macros: FxMacros, lenS: number, rootMidi: number, rate: number): [Float32Array, Float32Array] {
  const m = clampFxMacros(id, macros), p = FX_PRESETS[id];
  const n = Math.max(1, Math.round(lenS * rate));
  const L = new Float32Array(n), R = new Float32Array(n);
  const rnd = noise(0x5eed + FX_PRESET_IDS.indexOf(id) * 977), rnd2 = noise(0xbeef + FX_PRESET_IDS.indexOf(id) * 131);
  const fL = svf(), fR = svf(), f2 = svf();
  const g = Math.pow(10, p.gainDb / 20), tone = m.tone ?? 0.5;
  let ph = 0, ph2 = 0;
  const mp = METAL.map((_, i) => (i * 0.29) % 1);
  for (let i = 0; i < n; i++) {
    const t = i / rate, u = t / lenS; // u: 0 → 1 over the event
    let l = 0, r = 0;
    if (p.row === "impact") {
      const size = m.size ?? 0.6, tau = lenS / 4;
      if (id === "fx-impact-subdrop") {
        const f = midiToHz(rootMidi + 24) * Math.pow(2, -2 * Math.min(1, t / (lenS * 0.6)));
        ph += f / rate;
        const env = Math.min(1, t / 0.004) * Math.exp(-t / tau);
        const x = Math.tanh(Math.sin(2 * Math.PI * ph) * (1 + 3 * tone)) * env * (0.5 + 0.5 * size);
        l = r = x;
      } else if (id === "fx-impact-crash") {
        let mt = 0;
        for (let k = 0; k < 6; k++) { mp[k] += METAL[k] / rate; if (mp[k] >= 1) mp[k] -= 1; mt += mp[k] < 0.5 ? 1 : -1; }
        const env = Math.min(1, t / 0.002) * Math.exp(-t / tau);
        const fc = 2000 + 8000 * tone;
        l = fL(mt / 6 * 0.5 + rnd() * 0.5, fc, 0.7, rate, "hp") * env * (0.5 + 0.5 * size);
        r = fR(mt / 6 * 0.5 + rnd2() * 0.5, fc, 0.7, rate, "hp") * env * (0.5 + 0.5 * size);
      } else {
        const env = Math.min(1, t / 0.002) * Math.exp(-t / tau);
        const fc = 600 * Math.pow(20, tone);
        const thump = Math.sin(2 * Math.PI * (55 * t + 40 * 0.04 * (1 - Math.exp(-t / 0.04)))) * Math.exp(-t / 0.25);
        l = (fL(rnd(), fc, 0.7, rate, "lp") * env * size + thump * size * 0.8);
        r = (fR(rnd2(), fc, 0.7, rate, "lp") * env * size + thump * size * 0.8);
      }
    } else if (p.row === "down") {
      const oct = fxDropOct(m.drop ?? 0.5), amp = Math.pow(1 - u, 1.5);
      const fc = 400 * Math.pow(20, tone) * Math.pow(2, -oct * u);
      const nz = fL(rnd(), fc, id === "fx-down-dark" ? 2 : 0.7, rate, id === "fx-down-dark" ? "bp" : "lp");
      const nz2 = fR(rnd2(), fc, id === "fx-down-dark" ? 2 : 0.7, rate, id === "fx-down-dark" ? "bp" : "lp");
      let tonal = 0;
      if (id === "fx-down-dark") { ph += (midiToHz(rootMidi + 36) * Math.pow(2, -oct * u)) / rate; tonal = Math.sin(2 * Math.PI * ph) * 0.35; }
      l = (nz * 1.5 + tonal) * amp; r = (nz2 * 1.5 + tonal) * amp;
    } else {
      const w = m.width ?? 0.4, amp = id === "fx-riser-revcrash" ? Math.exp(-(1 - u) * 6) : Math.pow(u, 2);
      if (id === "fx-riser-synth") {
        const f = midiToHz(rootMidi + 36) * Math.pow(2, u);
        ph += f / rate; ph2 += (f * (1 + 0.006 * w)) / rate;
        const saw = ((ph % 1) * 2 - 1), saw2 = ((ph2 % 1) * 2 - 1);
        const fc = 300 * Math.pow(2, 4 * u) * Math.pow(4, tone);
        const c = f2(saw + saw2, fc, 1.2, rate, "lp") * 0.5;
        l = (c + w * 0.3 * (saw - saw2)) * amp; r = (c - w * 0.3 * (saw - saw2)) * amp;
      } else if (id === "fx-riser-revcrash") {
        let mt = 0;
        for (let k = 0; k < 6; k++) { mp[k] += METAL[k] / rate; if (mp[k] >= 1) mp[k] -= 1; mt += mp[k] < 0.5 ? 1 : -1; }
        const fc = 2000 + 8000 * tone, a = rnd(), b = rnd2();
        l = fL(mt / 6 * 0.5 + (a * (1 - w * 0.5) + b * w * 0.5) * 0.5, fc, 0.7, rate, "hp") * amp;
        r = fR(mt / 6 * 0.5 + (b * (1 - w * 0.5) + a * w * 0.5) * 0.5, fc, 0.7, rate, "hp") * amp;
      } else {
        const fc = 200 * Math.pow(2, 5 * u) * Math.pow(3, tone);
        const a = rnd(), b = rnd2();
        l = fL(a * (1 - w * 0.5) + b * w * 0.5, fc, 1.4, rate, "bp") * amp * 1.6;
        r = fR(b * (1 - w * 0.5) + a * w * 0.5, fc, 1.4, rate, "bp") * amp * 1.6;
      }
    }
    // A 5 ms fade at the end so a cut tail never clicks.
    const fade = Math.min(1, (n - i) / (rate * 0.005));
    L[i] = l * g * fade; R[i] = r * g * fade;
  }
  return [L, R];
}

/** The track root as a MIDI note in octave 1 (A → 33), for pitched presets. */
export const rootMidiOf = (key: string) => 24 + (pitchClass(key) ?? 9);

/**
 * One pass of a saved FX row (the Studio): `steps` 16ths at `bpm`, the event anchored at its note's
 * step (the Riser ending at the pass's end, into the next block), as long as its knob says (capped
 * to the pass), on the root of `key`.
 */
export function renderFxRow(id: FxPresetId, macros: FxMacros, o: { bpm: number; steps: number; key: string; atStep?: number; rate?: number }): Rendered {
  const rate = o.rate ?? 44100, sps = secondsPer16th(o.bpm), passS = o.steps * sps, barS = 16 * sps;
  const m = clampFxMacros(id, macros), row = fxRowOf(id);
  const bars = fxBars((row === "impact" ? m.tail : row === "down" ? m.length : m.rise) ?? 0.5);
  const lenS = Math.min(passS, bars * barS);
  const startS = row === "riser" ? passS - lenS : Math.min(passS - 0.01, (o.atStep ?? 0) * sps);
  const n = Math.round(passS * rate), left = new Float32Array(n), right = new Float32Array(n);
  const [l, r] = renderFxEvent(id, m, Math.min(lenS, passS - startS), rootMidiOf(o.key), rate);
  const a = Math.round(startS * rate);
  for (let i = 0; i < l.length && a + i < n; i++) { left[a + i] = l[i]; right[a + i] = r[i]; }
  return { left, right, rate };
}

/** The bars a saved FX row's pass takes: its event's length rounded up to 1, 2, 4 or 8. */
export function fxPassBars(id: FxPresetId, macros: FxMacros): 1 | 2 | 4 | 8 {
  const m = clampFxMacros(id, macros), row = fxRowOf(id);
  const b = fxBars((row === "impact" ? m.tail : row === "down" ? m.length : m.rise) ?? 0.5);
  return ([1, 2, 4, 8] as const).find((x) => x >= b - 1e-6) ?? 8;
}
