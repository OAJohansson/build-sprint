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
export type LabPart = { id: PartName; name: string; color: string; blocks: Block[]; subs: LabSub[] };
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
  const part = (id: PartName, values: number[], subs: LabSub[] = []): LabPart => ({ id, name: NAMES[id], color: PART_COLORS[id], blocks: clips(values), subs });
  return [
    part("drums", drums, [{ name: "kick", blocks: clips(L.kick) }, { name: "hats", blocks: clips(L.hats) }]),
    part("bass", L.bass),
    part("other", L.chords),
    part("vocals", L.vocals),
  ];
}

/** Sections with the name people read: a name that repeats gets its number ("Drop 1", "Drop 2"). */
export function labSections(m: Pick<TrackMap, "sections">): LabSection[] {
  const v = viewSections(m);
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
