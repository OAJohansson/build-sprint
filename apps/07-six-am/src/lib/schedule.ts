// Turns the timeline into notes on one 16th-note grid (64 bars = 1024 steps by default; a
// template track sets its own length), so the audio
// scheduler only has to ask "what plays on step k?". Pure, so it's unit tested.
import { BARS, loopById, type Region } from "./timeline";
import type { Note, Recipe } from "./recipes";

// Step length depends on the project tempo: see secondsPerStep in tempo.ts.
export const STEPS = BARS * 16;

export type Hit = { track: number; loopId: string; note: Note };

/** Every note of every region, repeats included, keyed by the absolute step it starts on. */
export function buildIndex(regions: Region[], recipes: Record<string, Recipe>, steps = STEPS): Map<number, Hit[]> {
  const index = new Map<number, Hit[]>();
  for (const r of regions) {
    const recipe = recipes[r.loopId];
    if (!recipe) continue;
    const loopSteps = loopById(r.loopId).bars * 16;
    const start = (r.start - 1) * 16, end = start + r.length * 16;
    for (let rep = start; rep < end; rep += loopSteps) {
      for (const note of recipe.notes) {
        const step = rep + note.step;
        if (step >= end || step >= steps) continue;
        // A note never rings past its region, so a cut-short loop stays clean.
        const dur = Math.min(note.dur, end - step);
        const list = index.get(step) ?? [];
        list.push({ track: r.track, loopId: r.loopId, note: { ...note, dur } });
        index.set(step, list);
      }
    }
  }
  return index;
}

/** The step a bar starts on, for starting playback anywhere: bar 1 → step 0. */
export const stepOfBar = (bar: number, steps = STEPS) => Math.max(0, Math.min(steps - 1, Math.round((bar - 1) * 16)));

/** Notes of one loop on step k when previewing it alone: it simply loops. */
export function previewHits(recipe: Recipe, loopBars: number, k: number): Note[] {
  const at = k % (loopBars * 16);
  return recipe.notes.filter((x) => x.step === at);
}
