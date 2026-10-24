// The map as the Mentor reads it (A4): sections with bars and times, and when each estimated layer
// plays, in plain lines; plus the whitelist parser for maps arriving from the browser. Pure.
import { BEATS_PER_BAR, LAYERS, MAP_VERSION, SECTION_LABELS, type LayerName, type Section, type SectionLabel, type TrackMap } from "./types";

const clock = (sec: number) => { const t = Math.max(0, Math.round(sec)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };

/** Bar spans (0-based, end exclusive) where a layer estimate is on: above 0.5, gaps of ≤ 2 bars
 *  bridged, spans under 2 bars dropped. */
export function layerSpans(values: number[], on = 0.5): { start: number; end: number }[] {
  const spans: { start: number; end: number }[] = [];
  let start = -1;
  values.forEach((v, i) => {
    if (v >= on && start < 0) start = i;
    if (v < on && start >= 0) { spans.push({ start, end: i }); start = -1; }
  });
  if (start >= 0) spans.push({ start, end: values.length });
  const merged: { start: number; end: number }[] = [];
  for (const s of spans) {
    const prev = merged.at(-1);
    if (prev && s.start - prev.end <= 2) prev.end = s.end;
    else merged.push({ ...s });
  }
  return merged.filter((s) => s.end - s.start >= 2);
}

/** "bars 1–16" in the Studio's 1-based bars. */
const bars = (a: number, b: number) => (b - a <= 1 ? `bar ${a + 1}` : `bars ${a + 1}–${b}`);

/** The map's facts for the prompt, each line labelled [ears]. Layers are said to be estimates. */
export function mapContext(m: TrackMap): string {
  const sections = m.sections.map((s) => `${s.label} ${bars(s.startBar, s.endBar)} (${clock(s.startSec)}–${clock(s.endSec)})`).join("; ");
  const layers = LAYERS.map((k) => {
    const spans = layerSpans(m.layers[k]);
    return `${k}: ${spans.length ? spans.map((s) => bars(s.start, s.end)).join(", ") : "not detected"}`;
  }).join(" | ");
  return [
    `[ears] Arrangement map: Ears measured the whole track (${Math.round(m.coverage * 100)}% heard) in the person's browser. Grid: ${m.bpm} BPM, ${m.beatsPerBar} beats a bar, bar 1 at ${clock(m.originSec)}, ${m.bars} bars.`,
    `[ears] Sections (measured from changes in the bars' loudness and layers, snapped to 4/8-bar phrases): ${sections || "none found"}.`,
    `[ears] Layer ESTIMATES (read from frequency bands of the full mix, not separated parts; vocals are the roughest; say "Ears estimates"): ${layers}.`,
  ].join("\n");
}

// ── Parser (whitelist; the browser sends the map) ────────────────────────────────────────────────

const num = (v: unknown, lo = -Infinity, hi = Infinity) => (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : null);
const str = (v: unknown, max = 300) => (typeof v === "string" ? v.slice(0, max) : "");
const MAX_BARS = 1024;
const unitArray = (v: unknown, len: number) =>
  Array.isArray(v) && v.length === len && v.every((x) => num(x, 0, 1) !== null) ? (v as number[]).map((x) => Math.round(x * 1000) / 1000) : null;

/** A map we can trust, or null: known fields only, numbers in range, arrays one value per bar. */
export function parseMap(raw: unknown): TrackMap | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id, 600);
  const bpm = num(r.bpm, 30, 300), barsN = num(r.bars, 1, MAX_BARS), origin = num(r.originSec, 0, 3600), duration = num(r.durationSec, 1, 7200);
  if (!/^https:\/\/(on\.|m\.)?soundcloud\.com\/\S+$/i.test(id) || bpm === null || barsN === null || !Number.isInteger(barsN) || origin === null || duration === null) return null;
  const energy = unitArray(r.energy, barsN);
  const lr = (r.layers ?? {}) as Record<string, unknown>;
  const layerVals = Object.fromEntries(LAYERS.map((k) => [k, unitArray(lr[k], barsN)])) as Record<LayerName, number[] | null>;
  if (!energy || LAYERS.some((k) => !layerVals[k])) return null;
  const sections: Section[] = [];
  for (const x of Array.isArray(r.sections) ? r.sections.slice(0, 64) : []) {
    const s = (x ?? {}) as Record<string, unknown>;
    const a = num(s.startBar, 0, barsN), b = num(s.endBar, 0, barsN);
    if (!SECTION_LABELS.includes(s.label as SectionLabel) || a === null || b === null || !Number.isInteger(a) || !Number.isInteger(b) || b <= a) return null;
    sections.push({ label: s.label as SectionLabel, startBar: a, endBar: b, startSec: num(s.startSec, 0, 7200) ?? 0, endSec: num(s.endSec, 0, 7200) ?? 0 });
  }
  const tempo = (r.tempo ?? {}) as Record<string, unknown>;
  const down = (r.downbeat ?? {}) as Record<string, unknown>;
  return {
    version: MAP_VERSION,
    id,
    title: str(r.title),
    uploader: str(r.uploader, 120),
    durationSec: duration,
    bpm,
    tempo: { earsBpm: num(tempo.earsBpm, 0, 400) ?? 0, refined: tempo.refined === true, coherence: num(tempo.coherence, 0, 1) ?? 0 },
    key: str(r.key, 4),
    scale: str(r.scale, 8),
    beatsPerBar: BEATS_PER_BAR,
    originSec: origin,
    downbeat: { method: "bar-change", confidence: num(down.confidence, 0, 1) ?? 0 },
    bars: barsN,
    energy,
    layers: { kind: "estimate", method: str(lr.method, 200) || "frequency bands of the full mix, not separated parts", ...(layerVals as Record<LayerName, number[]>) },
    sections,
    heardSec: num(r.heardSec, 0, 7200) ?? 0,
    coverage: num(r.coverage, 0, 1) ?? 0,
    mappedAt: typeof r.mappedAt === "string" && !Number.isNaN(Date.parse(r.mappedAt)) ? r.mappedAt : new Date(0).toISOString(),
  };
}
