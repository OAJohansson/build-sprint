// What a group's tracks share, in one line from their own numbers (F7: a split part gets its own
// reason instead of the old group's). Pure.
import { bpmChoice } from "@/lib/ears/bpm-choice";
import { brightnessLabel, energyLabel, namedStyles } from "@/lib/ears/labels";
import type { EarsAnalysis } from "@/lib/ears/results";

const uniq = <T,>(xs: T[]) => [...new Set(xs)];
const ORDER = ["low", "mid", "high"];

export function sharedTraits(list: EarsAnalysis[]): string {
  if (!list.length) return "";
  const bpms = list.map((a) => Math.round(bpmChoice(a).lead));
  const lo = Math.min(...bpms), hi = Math.max(...bpms);
  const parts = [lo === hi ? `${lo} BPM` : `${lo}–${hi} BPM`];
  const tops = list.map((a) => namedStyles(a)[0]?.name).filter((x): x is string => !!x);
  const best = uniq(tops).map((s) => ({ s, n: tops.filter((x) => x === s).length })).sort((a, b) => b.n - a.n)[0];
  if (best) parts.push(best.n === list.length ? `${best.s} on top` : `${best.s} on top in ${best.n} of ${list.length}`);
  const energy = uniq(list.map((a) => energyLabel(a.energy))).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  parts.push(`${energy.length > 1 ? `${energy[0]} to ${energy[energy.length - 1]}` : energy[0]} energy`);
  const tone = uniq(list.map((a) => brightnessLabel(a.brightness)));
  parts.push(tone.length === 1 ? `${tone[0]} tone` : `${tone.join(" and ")} tones`);
  return parts.join(", ");
}
