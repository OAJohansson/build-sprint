// The Mentor's line under Make's knobs (S3, handoff §Make 6, T85): which knobs to move towards the
// gold ticks ("Suggest settings", local patch matching) and what the original measures that way.
// Local and free: no model call; the words come from the measured difference only. Pure, tested.
import { MACRO_IDS, MACRO_SPECS, macroWord, type MacroId, type Macros } from "./presets";

/** A tick this close to the knob counts as reached. */
export const TICK_REACHED = 0.08;

const MORE: Record<MacroId, [string, string]> = {
  tone: ["darker", "brighter"],
  length: ["shorter", "longer"],
  pitchDrop: ["less pitch drop", "more pitch drop"],
  drive: ["cleaner", "more clipped"],
  wobble: ["steadier", "more movement"],
  width: ["narrower", "wider"],
};

/** The knobs furthest from their ticks (at most `n`), biggest move first. */
export function movesTo(current: Macros, ticks: Macros, n = 2): { id: MacroId; up: boolean; by: number }[] {
  return MACRO_IDS.map((id) => ({ id, up: ticks[id] > current[id], by: Math.abs(ticks[id] - current[id]) }))
    .filter((x) => x.by >= TICK_REACHED)
    .sort((a, b) => b.by - a.by)
    .slice(0, n);
}

/**
 * "Length down to 1/8, Pitch drop up. The original measures shorter, with more pitch drop." A
 * move names the word it lands on when the word changes ("down to 1/8"), else just the way.
 */
export function suggestLine(current: Macros, ticks: Macros, partName = "bass"): string {
  const moves = movesTo(current, ticks);
  if (!moves.length) return `You're on the gold ticks. Switch A/B to judge the rest by ear.`;
  const say = moves.map(({ id, up }) => {
    const from = macroWord(id, current[id]), to = macroWord(id, ticks[id]);
    return `${MACRO_SPECS[id].name} ${up ? "up" : "down"}${to !== from ? ` to ${to}` : ""}`;
  });
  const traits = moves.map(({ id, up }) => MORE[id][up ? 1 : 0]);
  return `${say.join(", ")}. The original ${partName} measures ${traits.join(", with ")}.`;
}
