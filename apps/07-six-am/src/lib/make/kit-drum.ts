// Phase 7 slice 1 (L266, L273e, R2, W4): a sampled drum sound from the starter kit (kit-p7.ts),
// played from its decoded one-shot (kit-samples.ts) with four knobs: Pitch (±12 semitones, by
// playback speed, so it also gets shorter or longer), Length (under "as recorded" a fade that shortens
// the hit; over it the tail lifted, so it rings longer), Tone (darker under the middle, brighter over it: two 12 dB/oct filters) and Drive (soft
// clipping). Plain TS sample by sample, like drum-synth.ts, so Make's worker, the Studio and the
// unit tests render the same. A pass wraps round, as the loop does.
import { getKitSample } from "./kit-samples";
import { p7SoundById, type P7Row, type P7Sound } from "./kit-p7";

export type KitKnobId = "pitch" | "length" | "tone" | "drive";
export const KIT_KNOBS: KitKnobId[] = ["pitch", "length", "tone", "drive"];
/** Every sampled sound starts as recorded: pitch as is, length as recorded, tone flat, no drive. */
export const KIT_HOME: Record<KitKnobId, number> = { pitch: 0.5, length: 0.6, tone: 0.5, drive: 0 };
/** Where Length plays the hit as recorded; under it shortens, over it lengthens. */
export const LENGTH_AS_IS = 0.6;

/** T237: the kit is peak-normalised, so hats would sit as loud as kicks; each row starts at its own level. */
// shortcut: per-row levels by reasoning about a house mix (kick loudest, hats ~8 dB under), not measured (Make level-matches each row to the original anyway, so only previews use them); measure against the crate's drum loops if a sampled row sounds too loud or quiet on its own.
export const KIT_ROW_GAIN_DB: Record<P7Row, number> = { kick: -2, clap: -5, hat: -9, ohat: -9, perc: -7, ride: -11 };

export const isKitSound = (v: unknown): v is string => typeof v === "string" && !!p7SoundById(v);
export const kitSound = (id: string): P7Sound => p7SoundById(id)!;

/** Pitch 0–1 → semitones, −12 … +12, 0 at the middle. */
export const kitSemis = (v: number) => Math.round((v - 0.5) * 24 * 10) / 10;
/** Length under "as recorded" → the fade's time constant (s), 3 ms … ~1.7 s; null at or over it. */
export const kitFadeS = (v: number): number | null => (v >= LENGTH_AS_IS - 0.02 ? null : 0.003 * Math.pow(2, (v / LENGTH_AS_IS) * 9.5));
/**
 * Length over "as recorded" → how much the tail is lifted (dB, up to +24) after the first ~15 ms, so a
 * short hit rings on (a transient shaper's sustain); null at or under it.
 */
export const kitLiftDb = (v: number): number | null => (v <= LENGTH_AS_IS + 0.02 ? null : 24 * ((v - LENGTH_AS_IS) / (1 - LENGTH_AS_IS)));
/** Tone 0–1 → a low-pass (under 0.5, 20 kHz down to 250 Hz) or a high-pass (over 0.5, 20 Hz up to 3 kHz); null in the flat middle. */
export function kitFilter(v: number): { type: "lp" | "hp"; hz: number } | null {
  if (Math.abs(v - 0.5) < 0.02) return null;
  return v < 0.5 ? { type: "lp", hz: 250 * Math.pow(80, v / 0.5) } : { type: "hp", hz: 20 * Math.pow(150, (v - 0.5) / 0.5) };
}

const ladder = (v: number, words: string[]) => words[Math.max(0, Math.min(words.length - 1, Math.floor(v * words.length)))];
const ms = (s: number) => (s >= 1 ? `${(Math.round(s * 10) / 10).toFixed(1)} s` : `${Math.round((s * 1000) / 5) * 5} ms`);
const hz = (f: number) => (f >= 1000 ? `${(Math.round(f / 100) / 10).toFixed(1)} kHz` : `${Math.round(f)} Hz`);

export const KIT_KNOB_SPECS: Record<KitKnobId, { name: string; explain: string }> = {
  pitch: { name: "Pitch", explain: "Plays the recording faster (higher and shorter) or slower (lower and longer), up to an octave each way." },
  length: { name: "Length", explain: "How long each hit rings: down fades it out sooner (short and tight), up lifts its tail so it rings longer; the middle mark is the hit as recorded." },
  tone: { name: "Tone", explain: "Under the middle takes the top off (darker); over the middle takes the bottom off (thinner, brighter)." },
  drive: { name: "Drive", explain: "Soft clipping: warmer and louder, then gritty and crushed." },
};

/** The word under a sampled drum's knob: what it does now, in plain words and units. */
export function kitKnobWord(id: KitKnobId, v: number): string {
  switch (id) {
    case "pitch": { const st = kitSemis(v); return Math.abs(st) < 0.3 ? "as is" : `${st < 0 ? "lower" : "higher"} · ${st > 0 ? "+" : "−"}${Math.abs(Math.round(st))} st`; }
    case "length": {
      const f = kitFadeS(v), lift = kitLiftDb(v);
      return f !== null ? `${v < 0.3 ? "short" : "shorter"} · ${ms(f * 2.3)}` : lift !== null ? `${lift < 12 ? "longer" : "long"} · tail +${Math.round(lift)} dB` : "as recorded";
    }
    case "tone": { const f = kitFilter(v); return !f ? "as is" : f.type === "lp" ? `darker · ${hz(f.hz)}` : `brighter · ${hz(f.hz)}`; }
    case "drive": return ladder(v, ["clean", "barely warm", "warm", "warmer", "hot", "gritty", "crunchy", "dirty", "dirtier", "crushed"]);
  }
}

const clamp01 = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null);
/** The four knobs only, 0–1; missing or junk values get the home values. */
export function clampKitMacros(v: Partial<Record<string, unknown>> | undefined): Record<KitKnobId, number> {
  const out = { ...KIT_HOME };
  for (const id of KIT_KNOBS) out[id] = clamp01(v?.[id]) ?? KIT_HOME[id];
  return out;
}

type Bq = { b0: number; b1: number; b2: number; a1: number; a2: number; x1: number; x2: number; y1: number; y2: number };
function biquad(type: "lp" | "hp", f: number, rate: number): Bq {
  const w0 = (2 * Math.PI * Math.min(f, rate * 0.45)) / rate, al = Math.sin(w0) / (2 * Math.SQRT1_2), c = Math.cos(w0), a0 = 1 + al;
  const [b0, b1, b2] = type === "hp" ? [(1 + c) / 2, -(1 + c), (1 + c) / 2] : [(1 - c) / 2, 1 - c, (1 - c) / 2];
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * c) / a0, a2: (1 - al) / a0, x1: 0, x2: 0, y1: 0, y2: 0 };
}
const step = (f: Bq, x: number) => {
  const y = f.b0 * x + f.b1 * f.x1 + f.b2 * f.x2 - f.a1 * f.y1 - f.a2 * f.y2;
  f.x2 = f.x1; f.x1 = x; f.y2 = f.y1; f.y1 = y;
  return y;
};

/** How many output samples one hit lasts at these knobs (the recording at its playback speed, or the fade's end). */
function hitLen(id: string, m: Record<KitKnobId, number>, rate: number): number {
  const s = getKitSample(id);
  if (!s) return 0;
  const speed = Math.pow(2, kitSemis(m.pitch) / 12) * (s.rate / rate);
  const natural = Math.floor((s.data.length - 1) / speed);
  const fade = kitFadeS(m.length);
  return fade === null ? natural : Math.min(natural, Math.ceil(fade * 7 * rate));
}
/** The lifted tail's gain at sample i: 1 for the first ~15 ms, then rising to the lift. */
function liftAt(i: number, rate: number, maxGain: number) {
  return Math.min(maxGain, Math.exp(Math.max(0, i / rate - 0.008) / 0.012));
}

/** One hit, mono, `len` samples (a 3 ms fade at the end when `choke`d by the next hit of its row). */
function renderKitHit(id: string, m: Record<KitKnobId, number>, vel: number, len: number, rate: number, choke: boolean): Float32Array {
  const out = new Float32Array(len), s = getKitSample(id);
  if (!s || len <= 0) return out;
  const snd = kitSound(id), x = s.data;
  const speed = Math.pow(2, kitSemis(m.pitch) / 12) * (s.rate / rate);
  const fade = kitFadeS(m.length), lift = kitLiftDb(m.length), f = kitFilter(m.tone);
  const liftMax = lift === null ? 1 : Math.pow(10, lift / 20);
  const f1 = f ? biquad(f.type, f.hz, rate) : null, f2 = f ? biquad(f.type, f.hz, rate) : null;
  const drive = m.drive, dg = 1 + 14 * drive * drive + 4 * drive, dn = Math.tanh(dg);
  const g = Math.pow(10, KIT_ROW_GAIN_DB[snd.row] / 20) * (0.25 + 0.75 * vel);
  for (let i = 0; i < len; i++) {
    const p = i * speed, k = Math.floor(p);
    if (k + 1 >= x.length) break;
    let y = x[k] + (x[k + 1] - x[k]) * (p - k);
    if (fade !== null) y *= Math.exp(-i / (fade * rate));
    // A lifted tail is held under full scale by a soft clip, so the hit gets longer, not just louder.
    if (lift !== null) y = Math.tanh(y * liftAt(i, rate, liftMax));
    if (f1 && f2) y = step(f2, step(f1, y));
    if (drive > 0.005) y = Math.tanh(y * dg) / dn;
    out[i] = y * g;
  }
  if (choke) {
    const n = Math.min(len, Math.round(rate * 0.003));
    for (let i = 0; i < n; i++) out[len - n + i] *= 1 - (i + 1) / n;
  }
  return out;
}

/** Rows whose next hit cuts the last (a drum machine's kick and hats; claps, percussion and cymbals ring on). */
const CHOKES: Record<P7Row, boolean> = { kick: true, clap: false, hat: true, ohat: true, perc: false, ride: false };

/**
 * Hits of one sampled sound over a pass of `lenS` seconds, as renderDrumHits does for the synth: `wrap`
 * loops the pass (a tail at the end sounds at the start). Mono, the same in both channels.
 */
export function renderKitHits(id: string, macros: Partial<Record<string, number>>, hits: { t: number; vel: number }[], o: { lenS: number; rate?: number; wrap?: boolean }): { left: Float32Array<ArrayBuffer>; right: Float32Array<ArrayBuffer>; rate: number } {
  const rate = o.rate ?? 44100, m = clampKitMacros(macros), row = kitSound(id).row;
  const n = Math.max(1, Math.round(o.lenS * rate));
  const left = new Float32Array(n);
  const wrap = o.wrap ?? true;
  const at = hits.map((h) => ({ a: wrap ? ((Math.round(h.t * rate) % n) + n) % n : Math.round(h.t * rate), vel: h.vel })).filter((h) => wrap || (h.a >= 0 && h.a < n)).sort((x, y) => x.a - y.a);
  const cap = hitLen(id, m, rate), chokes = CHOKES[row];
  at.forEach((h, k) => {
    const next = at[k + 1]?.a ?? (wrap && at.length ? at[0].a + n : Infinity);
    const gap = chokes ? next - h.a : Infinity;
    const len = Math.max(0, Math.min(cap, gap, wrap ? n : n - h.a));
    const x = renderKitHit(id, m, h.vel, len, rate, chokes && gap < cap);
    for (let i = 0; i < len; i++) left[(h.a + i) % n] += x[i];
  });
  return { left, right: left.slice(), rate };
}
