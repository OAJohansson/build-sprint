// Chords directions (Phase 6, dev only): realistic data for Make → Melody.
// Lost in The Loop bars 69–76: the G7 stab (G3 D4 B4 F5) struck on the last 16th before each beat;
// reader A reads "G" with G7 as its first alternative (spike CH-1). Dubspinna's "What's a Girl to Do"
// remix bars 57–64: the Fatima Yamaha loop D♭ – E♭ – B♭m as plucks with a lead line on top; A reads
// two cells wrong (B♭sus2, E♭sus2), as in the spike report. Nothing here plays audio.

export type Step = { at: number; len: number }; // 16ths inside the bar (0–15)
export type Alt = { name: string; score: number };
export type Bar = { read: string; alts: Alt[]; hits: Step[]; doubt?: boolean };
export type LeadNote = { bar: number; at: number; len: number; midi: number };
export type Song = {
  id: "lost" | "dub";
  title: string; artist: string; bpm: string; key: string; keyShort: string;
  from: number; clock: string; section: string;
  flats: boolean;
  bars: Bar[];
  keyChords: string[];
  lead: LeadNote[] | null;
  leadOff?: string; // the reason the Lead row is off in Mine
  preset: string; leadPreset: string; closeness: number; leadCloseness: number;
  save: string; tags: string;
  /** The Mentor's first answer and its facts line (fixtures other than Lost and Dubspinna). */
  mentor?: { answer: string; facts: string };
};

const stab4: Step[] = [3, 7, 11, 15].map((at) => ({ at, len: 1 }));
const pluck: Step[] = [{ at: 0, len: 2 }, { at: 3, len: 2 }, { at: 6, len: 2 }, { at: 10, len: 2 }, { at: 12, len: 3 }];

const gBar = (doubt?: boolean): Bar => ({
  read: "G", hits: stab4, doubt,
  alts: [{ name: "G7", score: 0.95 }, { name: "Gsus4", score: 0.81 }, { name: "Em", score: 0.74 }],
});

export const LOST: Song = {
  id: "lost", title: "Lost in The Loop", artist: "Cărbune Adrian", bpm: "123 BPM", key: "key G major", keyShort: "G major",
  from: 69, clock: "2:14–2:29", section: "Drop 2", flats: false,
  bars: [gBar(), gBar(), gBar(true), gBar(), gBar(), gBar(), gBar(true), gBar()],
  keyChords: ["G", "Am", "Bm", "C", "D", "Em", "F♯dim"],
  lead: [
    { bar: 1, at: 14, len: 1, midi: 74 }, { bar: 3, at: 6, len: 1, midi: 77 }, { bar: 5, at: 14, len: 1, midi: 74 }, { bar: 7, at: 2, len: 1, midi: 71 },
  ],
  leadOff: "a faint line, mostly the vocal leaking in",
  preset: "Stab", leadPreset: "Pluck", closeness: 41, leadCloseness: 0,
  save: "Offbeat G stabs, from Lost in The Loop", tags: "chords · stab · g major · 123 bpm · lost in the loop",
};

export const DUB: Song = {
  id: "dub", title: "What's a Girl to Do (Dubspinna Festival Remix)", artist: "Fatima Yamaha", bpm: "125 BPM", key: "key A♭ major", keyShort: "A♭ major",
  from: 57, clock: "1:48–2:04", section: "Drop 1", flats: true,
  bars: [
    { read: "D♭", hits: pluck, alts: [{ name: "D♭maj7", score: 0.91 }, { name: "B♭m7", score: 0.84 }, { name: "Fm", score: 0.77 }] },
    { read: "E♭sus2", hits: pluck, doubt: true, alts: [{ name: "E♭", score: 0.93 }, { name: "E♭7", score: 0.86 }, { name: "Cm", score: 0.75 }] },
    { read: "B♭sus2", hits: pluck, doubt: true, alts: [{ name: "B♭m", score: 0.83 }, { name: "B♭m7", score: 0.8 }, { name: "D♭maj7", score: 0.72 }] },
    { read: "B♭m", hits: pluck, alts: [{ name: "B♭m7", score: 0.9 }, { name: "B♭sus2", score: 0.86 }, { name: "D♭", score: 0.7 }] },
    { read: "D♭", hits: pluck, alts: [{ name: "D♭maj7", score: 0.9 }, { name: "B♭m7", score: 0.83 }, { name: "Fm", score: 0.76 }] },
    { read: "E♭", hits: pluck, alts: [{ name: "E♭sus2", score: 0.92 }, { name: "E♭7", score: 0.85 }, { name: "Cm", score: 0.74 }] },
    { read: "B♭m", hits: pluck, alts: [{ name: "B♭m7", score: 0.88 }, { name: "B♭sus2", score: 0.85 }, { name: "D♭", score: 0.71 }] },
    { read: "B♭m", hits: [{ at: 0, len: 16 }], alts: [{ name: "B♭m7", score: 0.9 }, { name: "B♭sus2", score: 0.84 }, { name: "D♭", score: 0.7 }] },
  ],
  keyChords: ["A♭", "B♭m", "Cm", "D♭", "E♭", "Fm", "Gdim"],
  lead: [
    { bar: 0, at: 0, len: 3, midi: 77 }, { bar: 0, at: 4, len: 2, midi: 75 }, { bar: 0, at: 8, len: 6, midi: 73 },
    { bar: 1, at: 0, len: 3, midi: 75 }, { bar: 1, at: 4, len: 2, midi: 73 }, { bar: 1, at: 8, len: 6, midi: 70 },
    { bar: 2, at: 0, len: 4, midi: 72 }, { bar: 2, at: 6, len: 2, midi: 73 }, { bar: 2, at: 10, len: 6, midi: 70 },
    { bar: 4, at: 0, len: 3, midi: 77 }, { bar: 4, at: 4, len: 2, midi: 75 }, { bar: 4, at: 8, len: 6, midi: 73 },
    { bar: 5, at: 0, len: 3, midi: 75 }, { bar: 5, at: 4, len: 2, midi: 78 }, { bar: 5, at: 8, len: 6, midi: 77 },
    { bar: 6, at: 0, len: 4, midi: 72 }, { bar: 6, at: 6, len: 2, midi: 73 }, { bar: 6, at: 10, len: 6, midi: 70 },
  ],
  preset: "Pluck", leadPreset: "Pluck", closeness: 58, leadCloseness: 47,
  save: "Fatima plucks, from What's a Girl to Do", tags: "chords · pluck · a♭ major · 125 bpm · what's a girl to do",
};

// ── A little theory (names ↔ notes), enough for the grid ────────────────────────────────────────────

const SHARP = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const FLAT = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
export const pcName = (pc: number, flats: boolean) => (flats ? FLAT : SHARP)[((pc % 12) + 12) % 12];
export const noteName = (midi: number, flats: boolean) => `${pcName(midi, flats)}${Math.floor(midi / 12) - 1}`;
export const isBlack = (midi: number) => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);

const QUAL: [string, number[]][] = [
  ["maj7", [0, 4, 7, 11]], ["m7", [0, 3, 7, 10]], ["7", [0, 4, 7, 10]], ["", [0, 4, 7]], ["m", [0, 3, 7]],
  ["sus2", [0, 2, 7]], ["sus4", [0, 5, 7]], ["dim", [0, 3, 6]],
];
const rootPc = (name: string) => {
  const m = /^([A-G])([♯♭]?)/.exec(name)!;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1] as "C"];
  return base + (m[2] === "♯" ? 1 : m[2] === "♭" ? -1 : 0);
};
const qualOf = (name: string) => name.replace(/^[A-G][♯♭]?/, "");

/** A standard voicing: root position, closed, the root in the octave from `low`. */
export function voicing(name: string, low = 55): number[] {
  const r = rootPc(name), q = QUAL.find(([k]) => k === qualOf(name))?.[1] ?? [0, 4, 7];
  let root = low + ((r - low) % 12 + 12) % 12;
  if (root - low > 7) root -= 12;
  return q.map((i) => root + i);
}

/** The closest chord name for a set of notes: exact template first, else the best overlap. */
export function closestName(notes: number[], flats: boolean): { name: string; exact: boolean } {
  if (!notes.length) return { name: "–", exact: false };
  const pcs = [...new Set(notes.map((n) => ((n % 12) + 12) % 12))];
  const low = ((Math.min(...notes) % 12) + 12) % 12;
  let best = { name: "–", score: -1, exact: false };
  for (let r = 0; r < 12; r++) for (const [q, iv] of QUAL) {
    const tpl = iv.map((i) => (r + i) % 12);
    const hit = tpl.filter((p) => pcs.includes(p)).length, extra = pcs.filter((p) => !tpl.includes(p)).length;
    const exact = hit === tpl.length && extra === 0;
    const score = hit * 2 - (tpl.length - hit) * 2 - extra + (r === low ? 0.5 : 0) + (exact ? 10 : 0);
    if (score > best.score) best = { name: `${pcName(r, flats)}${q}`, score, exact };
  }
  return { name: best.name, exact: best.exact };
}

export const voiceNames = (notes: number[], flats: boolean) => notes.map((n) => pcName(n, flats)).join(" ");

/** break-ui: the realistic worst case. A 16-bar loop (the longest Make keeps), the longest names the
 *  reader gives (maj7 on a sharp root, sus4), a chord change every bar, and a long title. */
const WN = ["F♯m7", "D♭maj7", "C♯sus4", "B♭m7", "F♯m7", "D♭maj7", "G♯sus2", "E♭7"];
export const WORST: Song = {
  ...LOST, id: "lost", title: "Música de Ritual (Ricardo Villalobos Extended Unreleased Dub) [Remastered]", artist: "Ricardo Villalobos & Max Loderbauer",
  from: 113, bars: Array.from({ length: 16 }, (_, i) => ({ read: WN[i % 8], doubt: i % 8 === 2, hits: i % 4 === 3 ? [{ at: 0, len: 16 }] : stab4, alts: [{ name: "D♭maj7", score: 0.9 }, { name: "F♯sus4", score: 0.8 }, { name: "C♯m7", score: 0.7 }] })),
  keyChords: ["F♯", "G♯m", "A♯m", "B", "C♯", "D♯m", "E♯dim"], keyShort: "F♯ major", key: "key F♯ major",
  save: "Long held stabs with a lot of room, from Música de Ritual (Ricardo Villalobos Extended", flats: false,
  clock: "4:31–5:02", section: "Breakdown", tags: "chords · stab · f♯ major · 123 bpm · música de ritual",
  mentor: { answer: "Sixteen bars, a new chord every bar: F♯m7, D♭maj7, C♯sus4, B♭m7 and on, then the same eight again. Every fourth bar is held. Make isn't sure of bars 115 and 123.", facts: "8 chords × 2 · stabs, every 4th bar held · 16 bars" },
};
