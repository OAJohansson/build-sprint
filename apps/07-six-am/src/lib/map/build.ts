// From a whole track's frame features to its map: refine the tempo, find the beat and the first
// downbeat, read every bar, find and label the sections. Pure (no DOM): the client runs it once the
// listen is done.
import { barRaws, barFeatures, meanRow, type BarRaw, type FrameSeries } from "./bars";
import { CH, CHANNELS } from "./frames";
import { firstDownbeat, gridTempo, pickDownbeat, trackTempo, wholeBars } from "./grid";
import { detectSections } from "./sections";
import { BEATS_PER_BAR, MAP_VERSION, type TrackMap } from "./types";

export type MapMeta = { id: string; title: string; uploader: string; durationSec: number; earsBpm: number; key: string; scale: string; heardSec: number };

/** The onset curve the grid is fitted to: kick-band rises, plus half of all rises, standardised. */
export function onsetCurve(s: FrameSeries): Float32Array {
  const pick = (ch: number) => { const a = new Float32Array(s.n); for (let i = 0; i < s.n; i++) a[i] = s.data[i * CHANNELS + ch]; return a; };
  const std = (a: Float32Array) => {
    let m = 0; for (const x of a) m += x; m /= Math.max(1, a.length);
    let v = 0; for (const x of a) v += (x - m) ** 2;
    const sd = Math.sqrt(v / Math.max(1, a.length)) || 1;
    return a.map((x) => (x - m) / sd);
  };
  const sub = std(pick(CH.subFlux)), all = std(pick(CH.flux));
  return sub.map((x, i) => Math.max(0, x + 0.5 * all[i]));
}

/** First time the track is clearly sounding (within 40 dB of its loud parts). */
function soundStart(s: FrameSeries): number {
  const tot: number[] = [];
  for (let i = 0; i < s.n; i++) tot.push(s.data[i * CHANNELS + CH.total]);
  const loud = [...tot].sort((a, b) => a - b)[Math.floor(tot.length * 0.95)] ?? 0;
  const i = tot.findIndex((x) => x > loud - 40);
  return s.t0 + Math.max(0, i) / s.fps;
}

export function buildMap(s: FrameSeries, meta: MapMeta, now = new Date()): { map: TrackMap; raws: BarRaw[]; downbeatScores: number[] } {
  const guess = gridTempo(meta.earsBpm);
  if (!guess) throw new Error("No tempo to build the bar grid on: analyse the track first.");
  const onset = onsetCurve(s);
  const fit = trackTempo(onset, s.fps, guess);
  // A fit far from Ears' reading means the comb locked onto something else: keep Ears' tempo.
  const bpm = Math.abs(fit.bpm / guess - 1) <= 0.015 && fit.coherence > 0 ? fit.bpm : guess;
  const beatSec = s.t0 + fit.beatSec;
  const durationSec = meta.durationSec || s.t0 + s.n / s.fps;
  const rowChannels = [CH.low, CH.mid, CH.high, CH.voc, CH.total];
  const down = pickDownbeat(beatSec, bpm, durationSec, (a, b) => meanRow(s, a, b, rowChannels));
  const originSec = firstDownbeat(beatSec, down.phase, bpm, soundStart(s));
  const bars = wholeBars(durationSec, bpm, originSec);
  const raws = barRaws(s, bpm, originSec, bars);
  const feats = barFeatures(raws);
  const sections = detectSections(feats.bars, bpm, originSec);
  const map: TrackMap = {
    version: MAP_VERSION,
    id: meta.id,
    title: meta.title,
    uploader: meta.uploader,
    durationSec: Math.round(durationSec * 100) / 100,
    bpm: Math.round(bpm * 100) / 100,
    tempo: { earsBpm: meta.earsBpm, refined: bpm !== guess, coherence: fit.coherence },
    key: meta.key,
    scale: meta.scale,
    beatsPerBar: BEATS_PER_BAR,
    originSec,
    downbeat: { method: "bar-change", confidence: down.confidence },
    bars,
    energy: feats.energy,
    layers: feats.layers,
    sections,
    heardSec: Math.round(meta.heardSec * 10) / 10,
    coverage: durationSec > 0 ? Math.round(Math.min(1, meta.heardSec / durationSec) * 100) / 100 : 0,
    mappedAt: now.toISOString(),
  };
  return { map, raws, downbeatScores: down.scores };
}
