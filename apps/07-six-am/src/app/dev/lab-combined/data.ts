// Mock data for the combined Lab prototype (dev only): the demo track and a worst case (break-ui:
// long names, 512 bars, a part with no sub-layers, 12 notes, a very long answer). ?data=worst.
export type PartId = "drums" | "bass" | "other" | "vocals";
export type Span = [number, number];
export type Sub = { name: string; blocks: Span[] };
export type Part = { id: PartId; name: string; color: string; blocks: Span[]; subs: Sub[] };
export type Section = { name: string; from: number; to: number };
export type Note = { n: number; part: PartId; bar: number; q: string; a: string; tags?: string[] };
export type Data = {
  track: { title: string; short: string; artist: string; bpm: number; key: string; bars: number };
  sections: Section[];
  parts: Part[];
  chords: { from: number; to: number; name: string }[];
  notes: Note[];
};

const COLORS: Record<PartId, string> = { drums: "#f2b134", bass: "#ef5b37", other: "#23b3a5", vocals: "#cdbfa8" };

/** Chords per 8 bars (estimated): Am F C G, Dm Am F E in breakdowns, none in intros. */
function chordsFor(bars: number, sections: Section[]) {
  const out: Data["chords"] = [];
  for (let b = 1, i = 0; b <= bars; b += 8, i++) {
    const sec = sections.find((x) => b >= x.from && b < x.to);
    if (!sec || /intro/i.test(sec.name)) continue;
    const set = /breakdown/i.test(sec.name) ? ["Dm", "Am", "F", "E"] : ["Am", "F", "C", "G"];
    out.push({ from: b, to: Math.min(b + 8, bars + 1), name: set[i % 4] });
  }
  return out;
}

const DEMO_SECTIONS: Section[] = [
  { name: "Intro", from: 1, to: 33 },
  { name: "Build", from: 33, to: 65 },
  { name: "Drop", from: 65, to: 129 },
  { name: "Breakdown", from: 129, to: 161 },
  { name: "Drop", from: 161, to: 225 },
  { name: "Outro", from: 225, to: 241 },
];

const MEASURED = ["A1 · 55 Hz", "notes ≈ 1/8", "off the kick", "−11 LUFS"];

export const DEMO: Data = {
  track: { title: "Lost in The Loop", short: "Lost in The Loop", artist: "Mason Flint", bpm: 124, key: "A minor", bars: 240 },
  sections: DEMO_SECTIONS,
  parts: [
    { id: "drums", name: "Drums", color: COLORS.drums, blocks: [[1, 57], [65, 129], [153, 225], [225, 241]],
      subs: [{ name: "kick", blocks: [[1, 57], [65, 129], [161, 241]] }, { name: "hats", blocks: [[17, 57], [65, 129], [153, 225]] }, { name: "clap", blocks: [[65, 129], [161, 225]] }] },
    { id: "bass", name: "Bass", color: COLORS.bass, blocks: [[17, 57], [65, 129], [161, 225]],
      subs: [{ name: "sub", blocks: [[17, 57], [65, 129], [161, 225]] }, { name: "pluck", blocks: [[81, 129], [177, 225]] }] },
    { id: "other", name: "Other", color: COLORS.other, blocks: [[33, 65], [81, 129], [129, 161], [177, 225]],
      subs: [{ name: "pad", blocks: [[33, 65], [129, 161]] }, { name: "stab", blocks: [[81, 129], [177, 225]] }, { name: "lead", blocks: [[97, 129], [193, 225]] }] },
    { id: "vocals", name: "Vocals", color: COLORS.vocals, blocks: [[97, 113], [137, 153], [193, 209]],
      subs: [{ name: "lead", blocks: [[97, 113], [193, 209]] }, { name: "chops", blocks: [[137, 153]] }] },
  ],
  chords: chordsFor(240, DEMO_SECTIONS),
  notes: [
    { n: 1, part: "bass", bar: 17, q: "When does the bass come in?", a: "Bar 17, halfway through the Intro. It plays alone with the drums for 16 bars before the Build adds the pad." },
    { n: 2, part: "bass", bar: 97, q: "What's this bass doing?", a: "Short A1 notes between the kicks, gone before the next one. That gap is the bounce. I measure pitch, timing and loudness, not tone.", tags: MEASURED },
    { n: 3, part: "bass", bar: 177, q: "Is the second Drop the same bass?", a: "Same notes and timing as Drop 1. From bar 177 a pluck layer joins it (estimated)." },
  ],
};

const W_SECTIONS: Section[] = [
  { name: "Intro", from: 1, to: 33 }, { name: "Build", from: 33, to: 65 }, { name: "Drop", from: 65, to: 129 },
  { name: "Breakdown", from: 129, to: 161 }, { name: "Drop", from: 161, to: 225 }, { name: "Interlude (long version)", from: 225, to: 257 },
  { name: "Build", from: 257, to: 289 }, { name: "Drop", from: 289, to: 353 }, { name: "Breakdown", from: 353, to: 385 },
  { name: "Drop", from: 385, to: 449 }, { name: "Outro", from: 449, to: 481 }, { name: "Beatless outro", from: 481, to: 513 },
];

const LONG =
  "In this Drop the bass sits on A1 (55 Hz) and plays short notes, about an eighth long, placed between the kicks rather than on them. Each note is gone before the next kick lands, and that gap is most of what makes it bounce. Every fourth bar it jumps up to C2 for one note and comes straight back, which gives the line its little hiccup. The level stays very even, around −11 LUFS for the part on its own, so it is probably compressed or limited. What I can't tell you is the tone itself: I measure pitch, timing and loudness, not timbre, so whether it is a sine, a filtered saw or a sample is a guess. If you want to match it, start from a round sub, shorten Length until the notes stop before the kick, and add a little Pitch drop. Then switch between A and B at the same loudness and trust your ear more than my numbers.";

const qs = ["What's this bass doing?", "Why does it jump here?", "Is this the same note?", "Where does the pluck start?", "Is it sidechained?", "What key is this in?"];

export const WORST: Data = {
  track: {
    title: "Lost in The Loop (Mason Flint's 6 AM Extended Rework) [feat. Anneliese van der Berg-Hoffmann]",
    short: "Lost in The Loop",
    artist: "Mason Flint, Anneliese van der Berg-Hoffmann & The Warehouse Ensemble",
    bpm: 124, key: "A minor", bars: 512,
  },
  sections: W_SECTIONS,
  parts: [
    { id: "drums", name: "Drums", color: COLORS.drums, blocks: [[1, 57], [65, 129], [153, 257], [257, 481]],
      subs: [{ name: "kick", blocks: [[1, 57], [65, 129], [161, 225], [289, 481]] }, { name: "hats", blocks: [[17, 57], [65, 129], [153, 449]] }, { name: "clap", blocks: [[65, 129], [161, 225], [289, 353], [385, 449]] }] },
    { id: "bass", name: "Bass", color: COLORS.bass, blocks: [[17, 57], [65, 129], [161, 225], [289, 353], [385, 449]],
      subs: [{ name: "sub", blocks: [[17, 57], [65, 129], [161, 225], [289, 353], [385, 449]] }, { name: "pluck", blocks: [[81, 129], [177, 225], [401, 449]] }] },
    { id: "other", name: "Other", color: COLORS.other, blocks: [[33, 65], [81, 129], [129, 161], [177, 225], [225, 289], [353, 385], [449, 513]],
      subs: [{ name: "pad", blocks: [[33, 65], [129, 161], [225, 257], [353, 385], [449, 513]] }, { name: "stab", blocks: [[81, 129], [177, 225], [305, 353]] }, { name: "lead", blocks: [[97, 129], [193, 225], [417, 449]] }] },
    { id: "vocals", name: "Vocals", color: COLORS.vocals, blocks: [[97, 113], [137, 153], [193, 209], [241, 257], [321, 337]], subs: [] },
  ],
  chords: chordsFor(512, W_SECTIONS),
  notes: [17, 33, 65, 97, 99, 101, 129, 177, 289, 297, 385, 449].map((bar, i) => ({
    n: i + 1, part: "bass" as PartId, bar,
    q: qs[i % qs.length],
    a: bar === 97 ? LONG : "Short answer about bar " + bar + ", from pitch, timing and loudness only.",
    tags: bar === 97 ? MEASURED : undefined,
  })),
};

export const PRESET = { name: "Round sub", tags: ["bass", "sub", "clean"] };
/** 6 macros. `sug` is the Mentor's suggested value, shown as a quiet gold tick. */
export const MACROS = [
  { name: "Tone", value: 0.3, hint: "dark" },
  { name: "Length", value: 0.55, hint: "1/4", sug: 0.3 },
  { name: "Pitch drop", value: 0.35, hint: "slow", sug: 0.75 },
  { name: "Drive", value: 0.2, hint: "clean" },
  { name: "Wobble", value: 0.05, hint: "off" },
  { name: "Width", value: 0.1, hint: "mono" },
];
export const SUGGEST = "Length down to 1/8, Pitch drop up: that's the bounce.";

/** The suggested library name: a word for the sound plus the song's short title, never a full
 *  mix title (so it fits the field). */
export function suggestName(part: Part, short: string) {
  const word: Record<PartId, string> = { bass: "Rubbery bass", drums: "Tight drums", other: "Warm chords", vocals: "Vocal chop" };
  return `${word[part.id]}, from ${short}`;
}

export const clock = (bar: number, bpm: number) => {
  const s = Math.round(((bar - 1) * 4 * 60) / bpm);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
