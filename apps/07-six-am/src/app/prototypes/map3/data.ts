// Arrangement map, round 2 (the PM's three picks). Fixtures for the demo track and the break-ui
// worst cases, plus the plain functions every direction reads from.
export type Level = 1 | 2 | 3; // 1 maybe, 2 likely, 3 clearly
export type Span = { from: number; to: number; level: Level }; // bars; from inclusive, to exclusive
export type Section = { name: string; from: number; to: number };
export type Layer = { id: string; name: string; color: string; spans: Span[] };
export type Track = { title: string; uploader: string; bpm: number; key: string; seconds: number; sections: Section[]; layers: Layer[] };

const COL = { kick: "#f2b134", bass: "#ef5b37", chords: "#23b3a5", hats: "#a9c95a", vocals: "#cdbfa8" };
const sp = (from: number, to: number, level: Level): Span => ({ from, to, level });
const L = (id: keyof typeof COL, spans: Span[]): Layer => ({ id, name: id[0].toUpperCase() + id.slice(1), color: COL[id], spans });
const secs = (list: [string, number][], end: number): Section[] =>
  list.map(([name, from], i) => ({ name, from, to: i + 1 < list.length ? list[i + 1][1] : end + 1 }));

export const barsOf = (t: Track) => Math.round(t.seconds / ((4 * 60) / t.bpm));

/* Demo: 124 BPM, 7:44 → 240 bars */
const demo: Track = {
  title: "Lost in The Loop", uploader: "Cărbune Adrian", bpm: 124, key: "A minor", seconds: 464,
  sections: secs([["Intro", 1], ["Build", 33], ["Drop", 65], ["Breakdown", 97], ["Build", 129], ["Drop", 145], ["Outro", 209]], 240),
  layers: [
    L("kick", [sp(1, 97, 3), sp(137, 145, 2), sp(145, 233, 3), sp(233, 241, 2)]),
    L("bass", [sp(17, 33, 2), sp(33, 97, 3), sp(145, 225, 3), sp(225, 233, 1)]),
    L("chords", [sp(33, 97, 2), sp(97, 129, 3), sp(129, 209, 2)]),
    L("hats", [sp(9, 33, 2), sp(33, 97, 3), sp(113, 129, 1), sp(129, 145, 2), sp(145, 225, 3), sp(225, 241, 2)]),
    L("vocals", [sp(49, 65, 1), sp(65, 97, 2), sp(105, 129, 3), sp(145, 177, 2), sp(177, 209, 1)]),
  ],
};

/* Worst case: a 12-minute extended mix, 122 BPM, 12:08 → 370 bars, short sections among long ones */
const long: Track = {
  title: "Into the Deep (Extended Club Mix)", uploader: "Marlon Hoffstadt", bpm: 122, key: "F♯ minor", seconds: 728,
  sections: secs([["Intro", 1], ["Build", 65], ["Drop", 97], ["Breakdown", 161], ["Build", 209], ["Drop", 225], ["Breakdown", 305], ["Drop", 321], ["Outro", 337]], 370),
  layers: [
    L("kick", [sp(1, 161, 3), sp(217, 305, 3), sp(321, 371, 3)]),
    L("bass", [sp(33, 65, 2), sp(65, 161, 3), sp(225, 305, 3), sp(321, 353, 3), sp(353, 361, 1)]),
    L("chords", [sp(97, 161, 2), sp(161, 209, 3), sp(209, 337, 2)]),
    L("hats", [sp(17, 161, 3), sp(193, 209, 1), sp(209, 305, 3), sp(321, 371, 2)]),
    L("vocals", [sp(177, 209, 2), sp(241, 289, 1)]),
  ],
};

/* Worst case: a 3-minute radio edit, 122 BPM, 3:09 → 96 bars, 8-bar sections */
const edit: Track = {
  title: "Music Is The Answer (Radio Edit)", uploader: "Retrouve", bpm: 122, key: "D minor", seconds: 189,
  sections: secs([["Intro", 1], ["Build", 9], ["Drop", 25], ["Breakdown", 57], ["Drop", 73], ["Outro", 89]], 96),
  layers: [
    L("kick", [sp(1, 57, 3), sp(73, 97, 3)]),
    L("bass", [sp(9, 57, 3), sp(73, 89, 3)]),
    L("chords", [sp(9, 97, 2)]),
    L("hats", [sp(1, 9, 1), sp(9, 57, 3), sp(65, 97, 2)]),
    L("vocals", [sp(25, 89, 3)]),
  ],
};

/* Worst case: a looped techno track with only three sections and two layers never heard */
const three: Track = {
  title: "Soma", uploader: "Jo", bpm: 130, key: "C minor", seconds: 360,
  sections: secs([["Intro", 1], ["Drop", 33], ["Outro", 177]], 195),
  layers: [
    L("kick", [sp(1, 196, 3)]),
    L("bass", [sp(17, 177, 2)]),
    L("chords", []),
    L("hats", [sp(33, 177, 3), sp(177, 196, 1)]),
    L("vocals", []),
  ],
};

/* Worst case: a very long title and uploader */
const title: Track = {
  ...demo,
  title: "What's A Girl To Do (Dubspinna Festival Remix) [feat. Fatima Yamaha] – Extended Version",
  uploader: "Dubspinna & The Northwind Collective (Official)",
};

export const TRACKS = { demo, long, edit, three, title };
export type TrackId = keyof typeof TRACKS;

export const LEVEL_WORD: Record<Level, string> = { 1: "maybe", 2: "likely", 3: "clearly" };

export function barTime(t: Track, bar: number) {
  const s = Math.round(((bar - 1) * 4 * 60) / t.bpm);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
export const lengthText = (t: Track) => `${Math.floor(t.seconds / 60)}:${String(t.seconds % 60).padStart(2, "0")}`;

export function levelAt(l: Layer, bar: number): 0 | Level {
  for (const s of l.spans) if (bar >= s.from && bar < s.to) return s.level;
  return 0;
}

/** Everything clipped to what has been heard (listening state). */
export function heardOf(t: Track, heard: number): Track {
  return {
    ...t,
    sections: t.sections.filter((x) => x.from <= heard).map((x) => ({ ...x, to: Math.min(x.to, heard + 1) })),
    layers: t.layers.map((l) => ({ ...l, spans: l.spans.filter((s) => s.from <= heard).map((s) => ({ ...s, to: Math.min(s.to, heard + 1) })) })),
  };
}

/** How a layer behaves in a section. */
export function cover(l: Layer, x: Section) {
  let n = 0, first = 0, last = 0, max: 0 | Level = 0;
  for (let b = x.from; b < x.to; b++) {
    const v = levelAt(l, b);
    if (v) { n++; if (!first) first = b; last = b; if (v > max) max = v; }
  }
  return { share: n / (x.to - x.from), first, last, max };
}

/** One short phrase per layer per section: "clearly", "from bar 17", "until bar 232", "not heard". */
export function phrase(l: Layer, x: Section) {
  const c = cover(l, x);
  if (!c.share) return "not heard";
  if (c.share === 1) return LEVEL_WORD[c.max as Level];
  if (c.first > x.from) return `from bar ${c.first}`;
  if (c.last < x.to - 1) return `until bar ${c.last}`;
  return "on and off";
}

const list = (a: string[]) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

/** A plain sentence about one section, from the map's numbers only. */
export function sectionNote(t: Track, i: number) {
  const x = t.sections[i];
  const prev = t.sections[i - 1];
  const name = (l: Layer) => l.name.toLowerCase();
  const plays = t.layers.filter((l) => cover(l, x).share > 0);
  if (!plays.length) return "Nothing clear plays here.";
  const enters = t.layers.filter((l) => cover(l, x).first > x.from || (prev && cover(l, x).first === x.from && !cover(l, prev).share && i > 0));
  const leaves = prev ? t.layers.filter((l) => cover(l, prev).share > 0 && !cover(l, x).share) : [];
  const parts: string[] = [];
  if (i === 0) parts.push(`It opens with ${list(t.layers.filter((l) => levelAt(l, 1)).map(name)) || "near silence"}.`);
  if (leaves.length) parts.push(`${cap(list(leaves.map(name)))} ${leaves.length > 1 ? "drop" : "drops"} out.`);
  const late = enters.filter((l) => cover(l, x).first > x.from);
  const atStart = enters.filter((l) => cover(l, x).first === x.from);
  if (atStart.length && i > 0) parts.push(`${cap(list(atStart.map(name)))} ${atStart.length > 1 ? "come" : "comes"} in.`);
  if (late.length) parts.push(late.map((l) => `${cap(name(l))} joins at bar ${cover(l, x).first}.`).join(" "));
  if (parts.length === 0) parts.push(`${cap(list(plays.map(name)))} carry on as before.`);
  return parts.join(" ");
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The Mentor's short answer, built from the map's numbers (the real one comes from the API). */
export function mentorAnswer(t: Track) {
  const drops = t.sections.filter((x) => x.name === "Drop");
  const bd = t.sections.find((x) => x.name === "Breakdown");
  const bass = t.layers.find((l) => l.id === "bass")?.spans[0]?.from;
  const s: string[] = [];
  if (drops[0]) s.push(`It takes ${drops[0].from - 1} bars to reach the first drop at bar ${drops[0].from}${bass ? `; the bass comes in at bar ${bass}` : ""}.`);
  if (bd) {
    const gone = t.layers.filter((l) => cover(l, { ...bd, to: Math.min(bd.to, bd.from + 8) }).share === 0 && t.layers.indexOf(l) < 2).map((l) => l.name.toLowerCase());
    const next = drops.find((d) => d.from > bd.from);
    s.push(`The breakdown at bar ${bd.from} takes ${gone.length ? `the ${list(gone)}` : "the energy"} away for ${bd.to - bd.from} bars${next ? `, so the drop at bar ${next.from} lands harder` : ""}.`);
  } else if (drops[0]) {
    s.push(`There's no breakdown: one long drop runs ${drops[0].to - drops[0].from} bars and changes by small layers instead.`);
  }
  return s.join(" ");
}

export const MENTOR_MORE =
  "A build adds one layer at a time so you feel the drop coming; a breakdown takes the low end away so its return feels big. When you copy it, start with the 16-bar steps.";
