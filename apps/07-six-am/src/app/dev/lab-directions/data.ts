// Mock data for the Lab directions (dev only). "Lost in The Loop", 124 BPM, A minor, 7:44, 240 bars.
export type PartId = "drums" | "bass" | "other" | "vocals";
export type Part = { id: PartId; name: string; color: string; blocks: [number, number][] };

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
  { id: "drums", name: "Drums", color: "#f2b134", blocks: [[1, 57], [65, 129], [153, 225], [225, 241]] },
  { id: "bass", name: "Bass", color: "#ef5b37", blocks: [[17, 57], [65, 129], [161, 225]] },
  { id: "other", name: "Other", color: "#23b3a5", blocks: [[33, 65], [81, 129], [129, 161], [177, 225]] },
  { id: "vocals", name: "Vocals", color: "#cdbfa8", blocks: [[97, 113], [137, 153], [193, 209]] },
];

/** What you hear now (the delayed playhead): bar 97, in the first Drop. */
export const NOW = { bar: 97, clock: "3:06", section: "Drop" };
export const SOLO: PartId = "bass";

export const MENTOR =
  "The bass sits around A1 (55 Hz) and lands between the kicks: short notes, about an eighth long, with the energy gone before the next kick. That gap is what makes it bounce. I can only measure pitch, timing and loudness, not the tone itself, so start from a sine with a fast pitch drop.";
export const MENTOR_SHORT = "Short A1 notes between the kicks, gone before the next one. That gap is the bounce.";

export const KNOBS = [
  { name: "Tone", value: 0.25, hint: "dark" },
  { name: "Length", value: 0.35, hint: "1/8" },
  { name: "Drop", value: 0.7, hint: "fast" },
];

export const LIBRARY = [
  { name: "rubber sub", tags: ["bass", "A1"], made: "Tonight" },
  { name: "dusty stab", tags: ["chord", "Am7"], made: "Fri" },
  { name: "warehouse kick", tags: ["drums"], made: "Thu" },
];

export const pct = (bar: number) => `${((bar - 1) / TRACK.bars) * 100}%`;
export const w = (from: number, to: number) => `${((to - from) / TRACK.bars) * 100}%`;
