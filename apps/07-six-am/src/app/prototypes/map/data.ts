// Prototype data for the arrangement map (Phase 3 Discover). A plausible house track:
// 124 BPM, 4 beats a bar → 1.935 s a bar; 7:44 (464 s) → 240 bars.
export const TRACK = {
  title: "Lost in The Loop",
  uploader: "Cărbune Adrian",
  bpm: 124,
  key: "A minor",
  seconds: 464,
  bars: 240,
};

export const SEC_PER_BAR = (4 * 60) / TRACK.bpm;

export type Level = 1 | 2 | 3; // 1 maybe, 2 likely, 3 clearly
export type Span = { from: number; to: number; level: Level }; // bars, from inclusive, to exclusive
export type Section = { name: string; from: number; to: number };
export type Layer = { id: string; name: string; color: string; spans: Span[] };

export const SECTIONS: Section[] = [
  { name: "Intro", from: 1, to: 33 },
  { name: "Build", from: 33, to: 65 },
  { name: "Drop", from: 65, to: 97 },
  { name: "Breakdown", from: 97, to: 129 },
  { name: "Build", from: 129, to: 145 },
  { name: "Drop", from: 145, to: 209 },
  { name: "Outro", from: 209, to: 241 },
];

const s = (from: number, to: number, level: Level): Span => ({ from, to, level });

export const LAYERS: Layer[] = [
  { id: "kick", name: "Kick", color: "#f2b134", spans: [s(1, 97, 3), s(137, 145, 2), s(145, 233, 3), s(233, 241, 2)] },
  { id: "bass", name: "Bass", color: "#ef5b37", spans: [s(17, 33, 2), s(33, 97, 3), s(145, 225, 3), s(225, 233, 1)] },
  { id: "chords", name: "Chords", color: "#23b3a5", spans: [s(33, 65, 2), s(65, 97, 2), s(97, 129, 3), s(129, 145, 2), s(145, 209, 2)] },
  { id: "hats", name: "Hats", color: "#a9c95a", spans: [s(9, 33, 2), s(33, 97, 3), s(113, 129, 1), s(129, 145, 2), s(145, 225, 3), s(225, 241, 2)] },
  { id: "vocals", name: "Vocals", color: "#cdbfa8", spans: [s(49, 65, 1), s(65, 97, 2), s(105, 129, 3), s(145, 177, 2), s(177, 209, 1)] },
];

export const LEVEL_WORD: Record<Level, string> = { 1: "maybe", 2: "likely", 3: "clearly" };

/** Bar number (1-based) → "m:ss" at the bar's start. */
export function barTime(bar: number) {
  const t = Math.round((bar - 1) * SEC_PER_BAR);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

export function levelAt(layer: Layer, bar: number): 0 | Level {
  for (const sp of layer.spans) if (bar >= sp.from && bar < sp.to) return sp.level;
  return 0;
}

/** Clip everything to what has been heard so far (listening state). */
export function heardData(heard: number) {
  const sections = SECTIONS.filter((x) => x.from <= heard).map((x) => ({ ...x, to: Math.min(x.to, heard + 1) }));
  const layers = LAYERS.map((l) => ({
    ...l,
    spans: l.spans.filter((sp) => sp.from <= heard).map((sp) => ({ ...sp, to: Math.min(sp.to, heard + 1) })),
  }));
  return { sections, layers };
}

/** Changes in plain words: which layers come in or go out at each bar. */
export function events(layers: Layer[]) {
  const out = new Map<number, { in: string[]; out: string[] }>();
  const add = (bar: number, k: "in" | "out", name: string) => {
    if (bar > TRACK.bars) return;
    const e = out.get(bar) ?? { in: [], out: [] };
    e[k].push(name);
    out.set(bar, e);
  };
  for (const l of layers) {
    let prev = 0;
    for (let b = 1; b <= TRACK.bars + 1; b++) {
      const on = b <= TRACK.bars ? (levelAt(l, b) > 0 ? 1 : 0) : 0;
      if (on !== prev) add(b, on ? "in" : "out", l.name.toLowerCase());
      prev = on;
    }
  }
  return [...out.entries()].sort((a, b) => a[0] - b[0]);
}

export const MENTOR = [
  "It takes 64 bars to reach the first drop at bar 65: kick and hats open, the bass joins at 17 and the chords at 33.",
  "The breakdown at bar 97 takes the kick and bass away for 32 bars, so when they return at the second drop (bar 145) it lands harder.",
  "That's read from the map's estimates, not from the stems.",
];
