// The Mentor's line under Make's knobs (S3, handoff §Make 6, T85): which knobs to move towards the
// gold ticks ("Suggest settings", local patch matching) and what the original measures that way.
// Local and free: no model call; the words come from the measured difference only. Pure, tested.
import { MACRO_IDS, MACRO_SPECS, type MacroId, type Macros } from "./presets";

/** A tick this close to the knob counts as reached. */
export const TICK_REACHED = 0.08;


/** The knobs furthest from their ticks (at most `n`), biggest move first. */
export function movesTo(current: Macros, ticks: Macros, n = 2): { id: MacroId; up: boolean; by: number }[] {
  return MACRO_IDS.map((id) => ({ id, up: ticks[id] > current[id], by: Math.abs(ticks[id] - current[id]) }))
    .filter((x) => x.by >= TICK_REACHED)
    .sort((a, b) => b.by - a.by)
    .slice(0, n);
}

/** U7-4: what each move makes the sound, said as the target ("shorter", "more pitch drop"). */
const TARGET: Record<MacroId, [string, string]> = {
  tone: ["darker", "brighter"], length: ["shorter", "longer"], pitchDrop: ["less pitch drop", "more pitch drop"],
  drive: ["cleaner", "dirtier"], wobble: ["steadier", "more wobble"], width: ["narrower", "wider"], sub: ["less sub", "more sub"], weight: ["lighter", "heavier"],
};

/**
 * U7-4 (slice 1 user test): the tip says the target, never a knob word that can read backwards
 * ("Length down to 1/16"): "Make it shorter (Length) and more pitch drop (Pitch drop), like the original bass."
 */
export function suggestLine(current: Macros, ticks: Macros, partName = "bass"): string {
  const moves = movesTo(current, ticks);
  if (!moves.length) return `You're on the gold ticks. Switch A/B to judge the rest by ear.`;
  const say = moves.map(({ id, up, by }) => `${by < 0.2 ? "a bit " : ""}${TARGET[id][up ? 1 : 0]} (${MACRO_SPECS[id].name})`);
  return `Make it ${say.join(" and ")}, like the original ${partName}.`;
}

/** After "Suggest settings" (S3-2): which ticks moved, briefly. */
export function ticksMoved(before: Macros | null, after: Macros): string {
  if (!before) return "Gold ticks mark those.";
  const moved = MACRO_IDS.filter((id) => Math.abs(after[id] - before[id]) >= 0.05).map((id) => MACRO_SPECS[id].name);
  return moved.length ? `Ticks moved: ${moved.join(", ")}.` : "The ticks stayed where they were.";
}
