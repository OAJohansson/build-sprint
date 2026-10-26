// What the map view draws from a TrackMap (design: L114, T54–T58): sections as 1-based bar ranges,
// each layer's 0–1 estimates as "likely" and "maybe" blocks, ruler steps. Pure.
import { LAYERS, type LayerName, type TrackMap } from "./types";

export const LAYER_COLOURS: Record<LayerName, string> = { kick: "#f2b134", bass: "#ef5b37", chords: "#23b3a5", hats: "#a9c95a", vocals: "#cdbfa8" };
/** At or above: drawn solid ("likely"). Between MAYBE and LIKELY: hatched ("maybe"). Below: nothing. */
export const LIKELY = 0.6;
export const MAYBE = 0.35;

/** A drawn block: bars 1-based, `to` exclusive (bar 1 = the first downbeat, as in the Studio). */
export type Block = { from: number; to: number; level: "likely" | "maybe" };
export type ViewSection = { name: string; from: number; to: number; startSec: number; endSec: number };

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
/** A section's name as people see it, in proper case: "intro" → "Intro" (L142). */
export const sectionName = cap;

export function viewSections(m: Pick<TrackMap, "sections">): ViewSection[] {
  return m.sections.map((s) => ({ name: cap(s.label), from: s.startBar + 1, to: s.endBar + 1, startSec: s.startSec, endSec: s.endSec }));
}

/**
 * One layer's estimates → blocks. Each bar is likely, maybe or off; a lone off bar between two on
 * bars is bridged (a fill or a gap in the estimate, not the layer leaving), a lone on bar is dropped,
 * and neighbouring bars that look the same become one block.
 */
export function layerBlocks(values: number[]): Block[] {
  const lv: number[] = values.map((v) => (v >= LIKELY ? 2 : v >= MAYBE ? 1 : 0));
  for (let i = 1; i < lv.length - 1; i++) if (lv[i] === 0 && lv[i - 1] && lv[i + 1]) lv[i] = Math.min(lv[i - 1], lv[i + 1]);
  for (let i = 0; i < lv.length; i++) if (lv[i] && !lv[i - 1] && !lv[i + 1]) lv[i] = 0;
  const out: Block[] = [];
  lv.forEach((l, i) => {
    if (!l) return;
    const level = l === 2 ? "likely" : "maybe";
    const last = out.at(-1);
    if (last && last.to === i + 1 && last.level === level) last.to = i + 2;
    else out.push({ from: i + 1, to: i + 2, level });
  });
  return out;
}

export const viewLayers = (m: Pick<TrackMap, "layers">) =>
  LAYERS.map((id) => ({ id, name: cap(id), color: LAYER_COLOURS[id], blocks: layerBlocks(m.layers[id]) }));

/** Bar-number step so ruler labels sit at least ~56 px apart on a ruler `px` wide. */
export function rulerStep(bars: number, px: number) {
  for (const st of [8, 16, 32, 64]) if ((st / Math.max(1, bars)) * px >= 56) return st;
  return 128;
}

export const clock = (sec: number) => { const t = Math.max(0, Math.round(sec)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
