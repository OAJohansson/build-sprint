// "Suggest settings" (L157, T85): local patch matching. Given the features of the original part
// (measured in memory, features.ts) and the note pattern "Mine" plays, search the preset's macros
// for the render that measures closest: analysis by synthesis, like Synplant's Genopatch, on the
// Mac only. The result is the gold ticks; it never turns a knob and never stores or sends audio.
import { featureDistance, measureFeatures, type PartFeatures } from "./features";
import { MACRO_IDS, MAKE_PRESETS, clampMacros, synthParams, type MacroId, type Macros, type MakePresetId } from "./presets";
import { renderBass, type MakeNote } from "./render";

export type Suggestion = {
  macros: Macros;
  /** Distance of the suggestion and of the preset's own settings to the target (lower = closer). */
  distance: number;
  presetDistance: number;
  renders: number;
};

/** Renders the pattern with these macros and measures it. */
export function featuresOf(preset: MakePresetId, m: Macros, notes: MakeNote[], bpm: number, steps: number, rate = 22050): PartFeatures {
  const r = renderBass(notes, synthParams(preset, m), { bpm, steps, rate });
  return measureFeatures(r.left, r.right, rate, bpm, notes.map((x) => x.step));
}

/**
 * Macro values for `preset` whose render of `notes` (one pass of `steps` 16ths) measures closest to
 * `target`. Coordinate search from the preset's own settings: a coarse sweep of each macro, then a
 * finer one around the best. `fixed` keeps some macros where they are.
 */
// shortcut: ~50 renders on the main thread (0.3–0.7 s for a 1–4 bar pattern on the owner's Mac);
// move into a worker when the Make UI calls it, so the page doesn't stall.
export function suggestMacros(target: PartFeatures, preset: MakePresetId, notes: MakeNote[], bpm: number, steps: number, o: { start?: Partial<Macros>; fixed?: MacroId[]; rate?: number } = {}): Suggestion {
  let renders = 0;
  const cost = (m: Macros) => { renders++; return featureDistance(featuresOf(preset, m, notes, bpm, steps, o.rate), target); };
  const presetDistance = cost(clampMacros(preset, MAKE_PRESETS[preset].macros));
  let best = clampMacros(preset, { ...MAKE_PRESETS[preset].macros, ...o.start });
  let bestCost = o.start ? cost(best) : presetDistance;
  const free = MACRO_IDS.filter((id) => !o.fixed?.includes(id));
  for (const grid of [[0, 0.2, 0.4, 0.6, 0.8, 1], [-0.1, -0.05, 0.05, 0.1]]) {
    for (const id of free) {
      const base = best[id];
      for (const g of grid) {
        const v = grid.length === 6 ? g : Math.min(1, Math.max(0, base + g));
        if (Math.abs(v - best[id]) < 1e-6) continue;
        const cand = { ...best, [id]: v };
        const c = cost(cand);
        if (c < bestCost) { best = cand; bestCost = c; }
      }
    }
  }
  const round = (m: Macros) => Object.fromEntries(MACRO_IDS.map((k) => [k, Math.round(m[k] * 100) / 100])) as Macros;
  return { macros: round(best), distance: bestCost, presetDistance, renders };
}
