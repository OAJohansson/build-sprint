// Mock data for the Lab directions, round 2 (dev only). Copied from round 1 and extended with the
// agreed jobs (L153–L161): sub-layers, chord lane, transport, a bass preset with macros, save name.
export type PartId = "drums" | "bass" | "other" | "vocals";
export type Sub = { name: string; blocks: [number, number][] };
export type Part = { id: PartId; name: string; color: string; blocks: [number, number][]; subs: Sub[] };

export const TRACK = { title: "Lost in The Loop", artist: "Mason Flint", bpm: 124, key: "A minor", length: "7:44", bars: 240 };

export const SECTIONS = [
  { name: "Intro", from: 1, to: 33 },
  { name: "Build", from: 33, to: 65 },
  { name: "Drop", from: 65, to: 129 },
  { name: "Breakdown", from: 129, to: 161 },
  { name: "Drop", from: 161, to: 225 },
  { name: "Outro", from: 225, to: 241 },
];

export const PARTS: Part[] = [
  {
    id: "drums", name: "Drums", color: "#f2b134", blocks: [[1, 57], [65, 129], [153, 225], [225, 241]],
    subs: [
      { name: "kick", blocks: [[1, 57], [65, 129], [161, 225], [225, 241]] },
      { name: "hats", blocks: [[17, 57], [65, 129], [153, 225]] },
      { name: "clap", blocks: [[65, 129], [161, 225]] },
    ],
  },
  {
    id: "bass", name: "Bass", color: "#ef5b37", blocks: [[17, 57], [65, 129], [161, 225]],
    subs: [
      { name: "sub", blocks: [[17, 57], [65, 129], [161, 225]] },
      { name: "pluck", blocks: [[81, 129], [177, 225]] },
    ],
  },
  {
    id: "other", name: "Other", color: "#23b3a5", blocks: [[33, 65], [81, 129], [129, 161], [177, 225]],
    subs: [
      { name: "pad", blocks: [[33, 65], [129, 161]] },
      { name: "stab", blocks: [[81, 129], [177, 225]] },
      { name: "lead", blocks: [[97, 129], [193, 225]] },
    ],
  },
  {
    id: "vocals", name: "Vocals", color: "#cdbfa8", blocks: [[97, 113], [137, 153], [193, 209]],
    subs: [
      { name: "lead", blocks: [[97, 113], [193, 209]] },
      { name: "chops", blocks: [[137, 153]] },
    ],
  },
];

/** Chords per 8 bars (estimated). Am F C G in the drops, Dm Am in the breakdown. */
export const CHORDS: { from: number; to: number; name: string }[] = (() => {
  const out: { from: number; to: number; name: string }[] = [];
  const main = ["Am", "F", "C", "G"], bd = ["Dm", "Am", "F", "E"];
  for (let b = 1, i = 0; b < 241; b += 8, i++) {
    if (b < 33) continue; // the intro is drums only: no chords
    out.push({ from: b, to: Math.min(b + 8, 241), name: (b >= 129 && b < 161 ? bd : main)[i % 4] });
  }
  return out;
})();

/** What you hear now (the delayed playhead): bar 97, in the first Drop, which is looping. */
export const NOW = { bar: 97, clock: "3:06", section: "Drop", chord: "Am" };
export const LOOP = { from: 65, to: 129, name: "Drop 1" };
export const SOLO: PartId = "bass";

export const ASK = "What's this bass doing?";
export const MENTOR =
  "In this Drop it sits on A1 (55 Hz) and plays short notes, about an eighth long, between the kicks. Each note is gone before the next kick: that gap is the bounce. I can measure pitch, timing and loudness, not the tone itself, so start from a round sub and shorten it.";
export const MENTOR_SHORT = "Short A1 notes between the kicks, gone before the next one. That gap is the bounce.";
export const MEASURED = ["A1 · 55 Hz", "notes ≈ 1/8", "off the kick", "−11 LUFS"];
export const SUGGEST = "Try Length down to 1/8 and Pitch drop up: that's the bounce.";

export const PRESET = { name: "Round sub", tags: ["bass", "sub", "clean"] };
export const PRESETS = [
  { name: "Round sub", tags: ["bass", "sub"] },
  { name: "Rubber pluck", tags: ["bass", "short"] },
  { name: "Reese", tags: ["bass", "wide"] },
  { name: "Acid line", tags: ["bass", "squelch"] },
];

/** 6 macros. `sug` is the Mentor's suggested value, shown as a quiet tick. */
export const MACROS = [
  { name: "Tone", value: 0.3, hint: "dark" },
  { name: "Length", value: 0.55, hint: "1/4", sug: 0.3 },
  { name: "Pitch drop", value: 0.35, hint: "slow", sug: 0.75 },
  { name: "Drive", value: 0.2, hint: "clean" },
  { name: "Wobble", value: 0.05, hint: "off" },
  { name: "Width", value: 0.1, hint: "mono" },
];

export const SAVE_NAME = "Rubbery bass, from Lost in The Loop";
export const SAVE_TAGS = ["bass", "A minor", "124 BPM", "Lost in The Loop"];

export const LIBRARY = [
  { name: "Dusty stab", tags: ["chords", "Am7"], made: "Fri" },
  { name: "Warehouse kick", tags: ["drums"], made: "Thu" },
];

export const pct = (bar: number) => `${((bar - 1) / TRACK.bars) * 100}%`;
export const w = (from: number, to: number) => `${((to - from) / TRACK.bars) * 100}%`;
/** Positions inside the loop (for zoomed views of the looping section). */
export const lpct = (bar: number) => `${((bar - LOOP.from) / (LOOP.to - LOOP.from)) * 100}%`;
export const lw = (from: number, to: number) => `${((to - from) / (LOOP.to - LOOP.from)) * 100}%`;
