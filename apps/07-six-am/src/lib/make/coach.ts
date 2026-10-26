// The Mentor's line under Make's knobs (S3, handoff §Make 6, T85): which knobs to move towards the
// gold ticks ("Suggest settings", local patch matching) and what the original measures that way.
// Local and free: no model call; the words come from the measured difference only. Pure, tested.
import { MACRO_IDS, MACRO_SPECS, macroWord, type MacroId, type Macros } from "./presets";

/** A tick this close to the knob counts as reached. */
export const TICK_REACHED = 0.08;

const MORE: Record<MacroId, [string, string]> = {
  tone: ["a darker tone", "a brighter tone"],
  length: ["shorter notes", "longer notes"],
  pitchDrop: ["less pitch drop", "more pitch drop"],
  drive: ["a cleaner sound", "more clipping"],
  wobble: ["a steadier filter", "more filter movement"],
  width: ["a narrower sound", "a wider sound"],
  sub: ["less sub", "more sub"],
  weight: ["a lighter body", "more body"],
};

/** The knobs furthest from their ticks (at most `n`), biggest move first. */
export function movesTo(current: Macros, ticks: Macros, n = 2): { id: MacroId; up: boolean; by: number }[] {
  return MACRO_IDS.map((id) => ({ id, up: ticks[id] > current[id], by: Math.abs(ticks[id] - current[id]) }))
    .filter((x) => x.by >= TICK_REACHED)
    .sort((a, b) => b.by - a.by)
    .slice(0, n);
}

/**
 * "Length down to 1/8, Pitch drop up. The original bass measures shorter notes and more pitch drop." A
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
  return `${say.join(", ")}. The original ${partName} measures ${traits.join(" and ")}.`;
}

/** After "Suggest settings" (S3-2): which ticks moved, briefly. */
export function ticksMoved(before: Macros | null, after: Macros): string {
  if (!before) return "Gold ticks mark those.";
  const moved = MACRO_IDS.filter((id) => Math.abs(after[id] - before[id]) >= 0.05).map((id) => MACRO_SPECS[id].name);
  return moved.length ? `Ticks moved: ${moved.join(", ")}.` : "The ticks stayed where they were.";
}
