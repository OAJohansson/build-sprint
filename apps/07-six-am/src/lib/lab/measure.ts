// Simple numbers about the focus part while a loop holds it in memory (S2, B6; L161): its level,
// and for the bass its note pattern (range, length, notes a bar) via Make's readPart. The arrays
// are the transport's own; only these numbers come out, for the Mentor (L143: never audio). Pure.
import { readPart } from "@/lib/make/from-part";
import type { PartMeasure } from "@/lib/mentor/lab";
import type { Scale } from "@/lib/synths/theory";
import type { PartName } from "./live";

export type HeldPart = { left: Float32Array; right: Float32Array; rate: number };

/** RMS level of a stereo part, dB (−120 for silence). */
export function levelDbOf(p: HeldPart): number {
  const n = Math.min(p.left.length, p.right.length);
  let e = 0;
  for (let i = 0; i < n; i++) { const m = (p.left[i] + p.right[i]) / 2; e += m * m; }
  return n ? Math.max(-120, 10 * Math.log10(e / n + 1e-12)) : -120;
}

/**
 * The focus part's numbers over the loop (1-based bars, `to` exclusive). Pitch only for the bass:
 * a single low line the pattern reader can follow; drums, other and vocals get the level only.
 */
export function measurePart(part: PartName, held: HeldPart, loop: { from: number; to: number }, bpm: number, key: string, scale: string): PartMeasure {
  const out: PartMeasure = { from: loop.from, to: loop.to, levelDb: Math.round(levelDbOf(held)) };
  if (part !== "bass" || out.levelDb <= -70 || (scale !== "major" && scale !== "minor") || !key) return out;
  try {
    const r = readPart(held.left, held.right, held.rate, bpm, key, scale as Scale);
    if (!r) return out;
    // shortcut: the pattern reader sometimes takes kick bleed or a harmonic for a note (a G4 in a
    // bassline); notes more than an octave from the median are left out of the range. Gate by the
    // note's pitch confidence once the reader reports one.
    const midis = r.pattern.notes.map((n) => n.midi).sort((a, b) => a - b);
    const med = midis[Math.floor(midis.length / 2)];
    const kept = midis.filter((m) => Math.abs(m - med) <= 12);
    out.lowMidi = kept[0];
    out.highMidi = kept[kept.length - 1];
    out.notesPerBar = Math.round((r.pattern.notes.length / r.pattern.bars) * 10) / 10;
    out.patternBars = r.pattern.bars;
    if (r.features.lengthSteps > 0) out.lengthSteps = Math.round(r.features.lengthSteps * 10) / 10;
  } catch { /* no pattern: the level alone */ }
  return out;
}
