// From the looped part in memory to Make (S3, L157, L161): its note pattern, its features, the
// suggested settings for a preset and the A/B gain. Reads the transport's in-memory loop (which
// starts on a bar line) and keeps only numbers. Pure.
import type { Scale } from "@/lib/synths/theory";
import { measureFeatures, type PartFeatures } from "./features";
import { matchGain } from "./level";
import { suggestMacros, type Suggestion } from "./match";
import { estimatePattern, notesForLoop, type EstimatedPattern } from "./pattern";
import { synthParams, type Macros, type MakePresetId } from "./presets";
import { renderBass, secondsPer16th } from "./render";

export type PartReading = { pattern: EstimatedPattern; features: PartFeatures; loopSteps: number };

/** The part's pattern and features, or null when no pattern is found (no key, under a bar, silence). */
export function readPart(left: Float32Array, right: Float32Array, rate: number, bpm: number, key: string, scale: Scale, debug?: Parameters<typeof estimatePattern>[5]): PartReading | null {
  const mono = new Float32Array(Math.min(left.length, right.length));
  for (let i = 0; i < mono.length; i++) mono[i] = (left[i] + right[i]) / 2;
  const pattern = estimatePattern(mono, rate, bpm, key, scale, debug);
  if (!pattern || !pattern.notes.length) return null;
  const loopSteps = Math.floor(mono.length / rate / secondsPer16th(bpm) + 0.01);
  const onsets = notesForLoop(pattern, loopSteps).map((n) => n.step);
  return { pattern, features: measureFeatures(left, right, rate, bpm, onsets), loopSteps };
}

/** Suggested macros for a preset ("Suggest settings": the gold ticks). */
export function suggestFor(reading: PartReading, preset: MakePresetId, bpm: number, start?: Partial<Macros>): Suggestion {
  const steps = reading.pattern.bars * 16;
  return suggestMacros(reading.features, preset, notesForLoop(reading.pattern, steps), bpm, steps, { start });
}

/** "Mine" over the loop, at the original part's level (Y9). */
export function renderMine(reading: PartReading, preset: MakePresetId, macros: Macros, bpm: number, original: { left: Float32Array; right: Float32Array; rate: number }) {
  const r = renderBass(notesForLoop(reading.pattern, reading.loopSteps), synthParams(preset, macros), { bpm, steps: reading.loopSteps, rate: original.rate });
  const g = matchGain(original, r);
  for (let i = 0; i < r.left.length; i++) { r.left[i] *= g.gain; r.right[i] *= g.gain; }
  return { ...r, gainDb: g.db };
}
