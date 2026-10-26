// What the Lab's Listen map draws from a saved TrackMap (S1, L154, T81): four parts (drums, bass,
// other, vocals) with the map's layer ESTIMATES as their sub-layers, sections with display names
// ("Drop 1", "Drop 2"), and the chord lane's 8-bar cells. Pure.
import { BARS_PER_CHORD } from "./chords";
import type { PartName } from "./live";
import { layerBlocks, viewSections, type Block, type ViewSection } from "@/lib/map/view";
import type { TrackMap } from "@/lib/map/types";

export const PART_COLORS: Record<PartName, string> = { drums: "#f2b134", bass: "#ef5b37", other: "#23b3a5", vocals: "#cdbfa8" };
const NAMES: Record<PartName, string> = { drums: "Drums", bass: "Bass", other: "Other", vocals: "Vocals" };

export type LabSub = { name: string; blocks: Block[] };
/** One part lane: its clips when it has no sub-layers, else one row per estimated sub-layer. */
export type LabPart = { id: PartName; name: string; color: string; blocks: Block[]; subs: LabSub[]; hint: string };

/** What a part without estimated sub-layers holds, in plain words (LS1-1). */
export const PART_HINTS: Record<PartName, string> = { drums: "kick, hats, claps", bass: "the low line", other: "synths, keys, pads", vocals: "singing, chops" };
export type LabSection = ViewSection & { label: string };
export type ChordCell = { from: number; to: number; name: string };

/**
 * Touching blocks as one clip (the map's "likely" and "maybe" bars split a run into slivers); a
 * clip is "maybe" only when none of it is likely.
 */
export function clips(values: number[]): Block[] {
  const out: Block[] = [];
  for (const b of layerBlocks(values)) {
    const last = out.at(-1);
    if (last && last.to === b.from) { last.to = b.to; if (b.level === "likely") last.level = "likely"; }
    else out.push({ ...b });
  }
  return out;
}

/**
 * The map's five layer estimates under the four separated parts: kick and hats → Drums (two
 * sub-layers), bass → Bass, chords → Other, vocals → Vocals. Only layers the map estimates; none
 * invented.
 */
export function labParts(m: Pick<TrackMap, "layers">): LabPart[] {
  const L = m.layers;
  const drums = L.kick.map((k, i) => Math.max(k, L.hats[i] ?? 0));
  const part = (id: PartName, values: number[], subs: LabSub[] = []): LabPart => ({ id, name: NAMES[id], color: PART_COLORS[id], blocks: clips(values), subs, hint: PART_HINTS[id] });
  return [
    part("drums", drums, [{ name: "kick", blocks: clips(L.kick) }, { name: "hats", blocks: clips(L.hats) }]),
    part("bass", L.bass),
    part("other", L.chords),
    part("vocals", L.vocals),
  ];
}

const mean = (a: number[], from: number, to: number) => { let t = 0, n = 0; for (let i = Math.max(0, from); i < Math.min(a.length, to); i++) { t += a[i]; n++; } return n ? t / n : 0; };

/**
 * A name by role for a section the map's rules left as "section" (LS1-11), from its own numbers:
 * no kick → "Break"; rising into a drop → "Build"; kick and energy up → "Groove"; else "Part A/B…"
 * (the same letter for sections that look alike in kick and energy).
 */
function roleNames(m: Pick<TrackMap, "sections" | "energy" | "layers">, v: ViewSection[]): string[] {
  const parts: { kick: number; energy: number }[] = [];
  return v.map((x, i) => {
    if (x.name.toLowerCase() !== "section") return x.name;
    const a = x.from - 1, b = x.to - 1, third = Math.max(1, Math.floor((b - a) / 3));
    const kick = mean(m.layers.kick, a, b), energy = mean(m.energy, a, b);
    const rise = mean(m.energy, b - third, b) - mean(m.energy, a, a + third);
    if (kick < 0.3) return "Break";
    if (v[i + 1]?.name.toLowerCase() === "drop" && rise > 0.12) return "Build";
    if (kick >= 0.5 && energy >= 0.5) return "Groove";
    let k = parts.findIndex((q) => Math.abs(q.kick - kick) < 0.15 && Math.abs(q.energy - energy) < 0.15);
    if (k < 0) { parts.push({ kick, energy }); k = parts.length - 1; }
    return `Part ${String.fromCharCode(65 + Math.min(25, k))}`;
  });
}

/** Sections with the name people read: a name that repeats gets its number ("Drop 1", "Drop 2"). */
export function labSections(m: Pick<TrackMap, "sections" | "energy" | "layers">): LabSection[] {
  const names = roleNames(m, viewSections(m));
  const v = viewSections(m).map((x, i) => ({ ...x, name: names[i] }));
  return v.map((x) => {
    const same = v.filter((y) => y.name === x.name);
    return { ...x, label: same.length > 1 ? `${x.name} ${same.indexOf(x) + 1}` : x.name };
  });
}

/** The section a (1-based, fractional) bar is in; the first before it starts, the last past the end. */
export function sectionAt<T extends { from: number; to: number }>(sections: T[], bar: number): T | null {
  if (!sections.length) return null;
  return sections.find((x) => bar >= x.from && bar < x.to) ?? (bar < sections[0].from ? sections[0] : sections[sections.length - 1]);
}

/** Chord cells to draw: one per 8 bars that has been heard (null cells are left out). */
export function chordCells(chords: (string | null)[], bars: number): ChordCell[] {
  const out: ChordCell[] = [];
  chords.forEach((name, i) => {
    if (name === null) return;
    const from = 1 + i * BARS_PER_CHORD;
    if (from > bars) return;
    out.push({ from, to: Math.min(from + BARS_PER_CHORD, bars + 1), name });
  });
  return out;
}

/** "3:06" from track ms. */
export const clockMs = (ms: number) => { const t = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
