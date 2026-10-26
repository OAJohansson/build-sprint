// Mock data for the Studio lane directions (S5, L159; dev only). One track at 124 BPM, A minor,
// 128 bars, 8 lanes in use, 3 sounds in My sounds (L158: sound + loop, linked, tagged).

export type FamilyId = "drums" | "bass" | "harmony" | "melody" | "vocals" | "fx" | "texture";
export type TypeId = "kick" | "clap" | "hats" | "perc" | "bass" | "chords" | "pads" | "lead" | "vocals" | "fx" | "texture";

export const FAMILIES: { id: FamilyId; name: string; color: string }[] = [
  { id: "drums", name: "Drums", color: "#f2b134" },
  { id: "bass", name: "Bass", color: "#ef5b37" },
  { id: "harmony", name: "Harmony", color: "#23b3a5" },
  { id: "melody", name: "Melody", color: "#7fa7e6" },
  { id: "vocals", name: "Vocals", color: "#e48aa9" },
  { id: "fx", name: "FX", color: "#a9c95a" },
  { id: "texture", name: "Texture", color: "#b49be0" },
];

export const TYPES: { id: TypeId; name: string; family: FamilyId; hint: string }[] = [
  { id: "kick", name: "Kick", family: "drums", hint: "the four on the floor" },
  { id: "clap", name: "Claps & snares", family: "drums", hint: "on 2 and 4" },
  { id: "hats", name: "Hats", family: "drums", hint: "the ticking on top" },
  { id: "perc", name: "Percussion", family: "drums", hint: "shakers, congas, rims" },
  { id: "bass", name: "Bass", family: "bass", hint: "the low line" },
  { id: "chords", name: "Chords", family: "harmony", hint: "stabs and keys" },
  { id: "pads", name: "Pads", family: "harmony", hint: "long held chords" },
  { id: "lead", name: "Lead", family: "melody", hint: "the hook you hum" },
  { id: "vocals", name: "Vocals", family: "vocals", hint: "singing, chops" },
  { id: "fx", name: "FX", family: "fx", hint: "risers, sweeps, impacts" },
  { id: "texture", name: "Texture", family: "texture", hint: "noise, vinyl, room" },
];

export const type = (id: TypeId) => TYPES.find((t) => t.id === id)!;
export const family = (id: FamilyId) => FAMILIES.find((f) => f.id === id)!;
export const colorOf = (t: TypeId) => family(type(t).family).color;

export const BARS = 128;
export const TRACK = { name: "Night bus home", bpm: 124, key: "Am" };
export const SECTIONS = [
  { bar: 1, name: "Intro" }, { bar: 17, name: "Build" }, { bar: 33, name: "Drop 1" },
  { bar: 65, name: "Break" }, { bar: 81, name: "Drop 2" }, { bar: 113, name: "Outro" },
];
export const PLAYHEAD = 41;
/** Where a held library sound lands in the drop state: the Break, where the Bass lane is empty. */
export const DROP_BAR = 65;

export type Block = { start: number; len: number; name: string };
export type Lane = { id: string; type: TypeId; name: string; vol: number; pan: number; mute: boolean; solo: boolean; blocks: Block[] };

const b = (start: number, len: number, name: string): Block => ({ start, len, name });

export const LANES: Lane[] = [
  { id: "l1", type: "kick", name: "Kick", vol: 0, pan: 0, mute: false, solo: false, blocks: [b(1, 64, "909 Kick"), b(81, 48, "909 Kick")] },
  { id: "l2", type: "clap", name: "Clap", vol: -3, pan: 0, mute: false, solo: false, blocks: [b(17, 48, "Warehouse Clap"), b(81, 32, "Warehouse Clap")] },
  { id: "l3", type: "hats", name: "Open hats", vol: -6, pan: 15, mute: false, solo: false, blocks: [b(33, 32, "Offbeat Open Hat"), b(81, 40, "Offbeat Open Hat")] },
  { id: "l4", type: "bass", name: "Sub", vol: -1, pan: 0, mute: false, solo: false, blocks: [b(33, 32, "Deep Sub"), b(81, 32, "Deep Sub")] },
  { id: "l5", type: "chords", name: "Stabs", vol: -4, pan: -10, mute: false, solo: false, blocks: [b(17, 16, "Rhodes Stab"), b(65, 16, "Rhodes Stab"), b(97, 16, "Rhodes Stab")] },
  { id: "l6", type: "lead", name: "Acid line", vol: -5, pan: 0, mute: true, solo: false, blocks: [b(49, 16, "303 Acid"), b(97, 16, "303 Acid")] },
  { id: "l7", type: "vocals", name: "Vocal chop", vol: -2, pan: 0, mute: false, solo: false, blocks: [b(65, 16, "“Let it go” chop")] },
  { id: "l8", type: "fx", name: "Riser", vol: -8, pan: 0, mute: false, solo: false, blocks: [b(25, 8, "White-noise riser"), b(73, 8, "White-noise riser")] },
];

/** My sounds (L158): a preset + 6 macros + a note pattern, tagged part/key/BPM/source, named. */
export type MySound = { id: string; name: string; type: TypeId; key: string; bpm: number; from: string; bars: number; saved: string };
export const MY_SOUNDS: MySound[] = [
  { id: "m1", name: "Rubber sub", type: "bass", key: "A minor", bpm: 124, from: "It Just Won’t Do", bars: 4, saved: "today" },
  { id: "m2", name: "Glassy stab", type: "chords", key: "F major", bpm: 122, from: "Lost in The Loop", bars: 2, saved: "yesterday" },
  { id: "m3", name: "Hoover lead", type: "lead", key: "D minor", bpm: 140, from: "Children (hard edit)", bars: 8, saved: "24 Oct" },
];

/** The built-in sounds per type (a few names each; the crate today has 12 per group). */
export const PRESETS: Partial<Record<TypeId, { name: string; vibe: string; bars: number }[]>> = {
  kick: [{ name: "909 Kick", vibe: "punchy · classic", bars: 1 }, { name: "Deep Thud", vibe: "round · dub", bars: 1 }],
  clap: [{ name: "Warehouse Clap", vibe: "roomy", bars: 2 }, { name: "Tight Snare", vibe: "dry · crisp", bars: 2 }],
  hats: [{ name: "Offbeat Open Hat", vibe: "classic house", bars: 1 }, { name: "Shuffled 16ths", vibe: "swung", bars: 2 }],
  bass: [{ name: "Deep Sub", vibe: "deep · warm", bars: 4 }, { name: "Acid Line", vibe: "squelchy · Chicago", bars: 4 }, { name: "Offbeat Pump", vibe: "bouncy", bars: 2 }],
  chords: [{ name: "Rhodes Stab", vibe: "soulful", bars: 4 }, { name: "Organ Stab", vibe: "90s · NY", bars: 2 }],
  lead: [{ name: "303 Acid", vibe: "squelchy", bars: 4 }, { name: "Piano Riff", vibe: "euphoric", bars: 8 }],
};

export const fmtDb = (v: number) => (v === 0 ? "0 dB" : `${v > 0 ? "+" : "−"}${Math.abs(v)} dB`);
export const fmtPan = (p: number) => (p === 0 ? "C" : p < 0 ? `L ${-p}` : `R ${p}`);
export const pct = (bar: number) => `${((bar - 1) / BARS) * 100}%`;
export const wpct = (len: number) => `calc(${(len / BARS) * 100}% - 2px)`;

/** Worst case (break-ui): long names, a family with 6 lanes, a sound named at its 80-char cap. */
export const WORST_LANES: Lane[] = [
  ...LANES.slice(0, 3),
  { id: "w1", type: "perc", name: "Congas from the Larry Levan edit, chopped", vol: -12, pan: -100, mute: false, solo: false, blocks: [b(33, 32, "Conga loop")] },
  { id: "w2", type: "perc", name: "Shaker", vol: -60, pan: 100, mute: false, solo: true, blocks: [b(1, 128, "Shaker 16ths")] },
  { id: "w3", type: "perc", name: "R", vol: 6, pan: 0, mute: true, solo: false, blocks: [] },
  ...LANES.slice(3),
];
export const WORST_SOUNDS: MySound[] = [
  { id: "m1", name: "Rubbery bass that wobbles in the second drop, darker version, take 3", type: "bass", key: "F♯ minor", bpm: 172.5, from: "Tim Deluxe feat. Sam Obernik – It Just Won’t Do (Mason Flint Remix)", bars: 16, saved: "today" },
  ...MY_SOUNDS.slice(1),
];
