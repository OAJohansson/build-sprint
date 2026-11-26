// Phase 6 slice 3 (K10, H12): the theory facts about one chord in a key, worked out in code, so the
// Mentor only writes the words. From (key, chord, its notes, the chords around it): the chord's
// numeral and degree, whether it is in the key or borrowed from the same key in the other mode, its
// role in plain words (home, away, pulls home…), each tone and whether it is in the key, and how it
// moves to the next chord. Every theory word comes with a plain gloss (a beginner sees none bare).
// Pure; names and numbers only (C2). Unit-tested (chord-facts.test.ts).
import { parseChord } from "@/lib/make/chords-mine";
import type { ChordType } from "@/lib/make/chords-read";
import { pitchClass, scalePitchClasses, usesFlats, type Scale } from "@/lib/synths/theory";

const mod12 = (n: number) => ((n % 12) + 12) % 12;
const SHARP = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const FLAT = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
const IV: Record<ChordType, number[]> = { maj: [0, 4, 7], min: [0, 3, 7], "7": [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus2: [0, 2, 7], sus4: [0, 5, 7], dim: [0, 3, 6] };
const SUFFIX: Record<ChordType, string> = { maj: "", min: "m", "7": "7", maj7: "maj7", m7: "m7", sus2: "sus2", sus4: "sus4", dim: "dim" };
const TONE_ROLE: Record<number, string> = { 0: "root", 2: "second", 3: "third", 4: "third", 5: "fourth", 6: "fifth", 7: "fifth", 10: "seventh", 11: "seventh" };
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
const ORDINAL = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh"];
const QUALITY_WORDS: Record<ChordType, string> = {
  maj: "major: bright, plain", min: "minor: darker, softer", "7": "dominant 7th: a major chord with a 4th note on top that wants to move",
  maj7: "major 7th: a major chord with a soft 4th note on top, dreamy", m7: "minor 7th: a minor chord with a 4th note on top, smooth",
  sus2: "sus2: the middle note swapped for a higher neighbour, open", sus4: "sus4: the middle note lifted, waiting to drop back", dim: "diminished: two small steps stacked, tense",
};

export type Role = "home" | "away" | "soft" | "pull" | "borrowed" | "secondary" | "outside";
export const ROLE_WORDS: Record<Role, string> = {
  home: "home: the chord everything settles on",
  away: "away from home: it moves off and sets up the way back",
  soft: "a softer stand-in for home: close to it, with a different mood",
  pull: "pulls home: tension that wants to resolve to the home chord",
  borrowed: "borrowed: a chord from the same key in the other mood, for colour",
  secondary: "a stepping stone: it pulls toward another chord of the key, not home",
  outside: "outside the key: a surprise that adds tension",
};

export type ToneFact = { name: string; role: string; inKey: boolean };
export type Neighbour = { chord: string; numeral: string; shared: number; move: string };
export type ChordFacts = {
  chord: string; key: string; quality: ChordType; qualityWords: string;
  /** 1–7 when the root is a note of the key's scale (in minor, the raised 7th counts as the 7th), else null. */
  degree: number | null;
  numeral: string; numeralWords: string;
  inKey: boolean;
  borrowed: string | null;
  /** The chord this one pulls toward when it is a stepping stone (a "V of" another chord of the key). */
  secondaryOf: string | null;
  role: Role; roleWords: string;
  tones: ToneFact[];
  outside: string[];
  yourNotes: { names: string[]; added: string[]; missing: string[] } | null;
  prev: Neighbour | null; next: Neighbour | null;
};

/** The key's own notes: its scale, plus the raised 7th in minor (the V7 of a minor key), as the chord reader counts them. */
function keyPcs(tonic: number, scale: Scale): Set<number> {
  const s = new Set(scalePitchClasses(tonic, scale));
  if (scale === "minor") s.add(mod12(tonic + 11));
  return s;
}

/** The numeral for a chord on `iv` semitones above the tonic: case from its quality, ♭/♯ when its root isn't a scale note. */
function numeralOf(iv: number, type: ChordType, scale: Scale): { numeral: string; degree: number | null } {
  const steps = scale === "major" ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];
  let degree = steps.indexOf(iv), acc = "";
  if (degree < 0 && scale === "minor" && iv === 11) { degree = 6; if (type !== "dim") acc = "♯"; }
  if (degree < 0) {
    const flatOf = steps.indexOf(iv + 1);
    if (flatOf >= 0) { degree = flatOf; acc = "♭"; } else { degree = steps.indexOf(iv - 1); acc = "♯"; }
  }
  const lower = type === "min" || type === "m7" || type === "dim";
  const base = lower ? ROMAN[degree].toLowerCase() : ROMAN[degree];
  const suffix = type === "7" || type === "m7" ? "7" : type === "maj7" ? "maj7" : type === "dim" ? "°" : type === "sus2" || type === "sus4" ? type : "";
  return { numeral: acc + base + suffix, degree: acc ? null : degree + 1 };
}

function roleOf(degree: number | null, type: ChordType, scale: Scale, inKey: boolean, borrowed: boolean, secondary: boolean): Role {
  if (!inKey) return secondary ? "secondary" : borrowed ? "borrowed" : "outside";
  if (degree === 1) return "home";
  if (scale === "major") return degree === 5 || degree === 7 ? "pull" : degree === 3 || degree === 6 ? "soft" : "away";
  // Minor: the V (major, the raised 7th) and the VII pull home; the III is home's brighter twin.
  if (degree === 5) return type === "maj" || type === "7" || type === "sus4" ? "pull" : "away";
  if (degree === 7) return "pull";
  return degree === 3 ? "soft" : "away";
}

/**
 * The facts about `chord` in `key` `scale`. `notes`: MIDI notes when the owner built the chord on the
 * piano (what was added or left out); `prev` / `next`: the chords before and after it in the loop.
 * Null when the key or the chord can't be read.
 */
export function chordFacts(o: { key: string; scale: Scale; chord: string; notes?: number[] | null; prev?: string | null; next?: string | null }): ChordFacts | null {
  const tonic = pitchClass(o.key), c = parseChord(o.chord);
  if (tonic === null || !c || (o.scale !== "major" && o.scale !== "minor")) return null;
  const flats = usesFlats(tonic, o.scale), names = flats ? FLAT : SHARP, nm = (pc: number) => names[mod12(pc)];
  const inKeyPcs = keyPcs(tonic, o.scale);
  const other: Scale = o.scale === "major" ? "minor" : "major";
  const otherPcs = new Set(scalePitchClasses(tonic, other));
  const pcs = IV[c.type].map((i) => mod12(c.root + i));
  const inKey = pcs.every((p) => inKeyPcs.has(p));
  const borrowed = !inKey && pcs.every((p) => otherPcs.has(p));
  // A stepping stone ("V of" a chord of the key): a major or 7th chord outside the key whose root is a
  // fifth above a key chord that isn't home (that one is just the V).
  let secondaryOf: string | null = null;
  if (!inKey && !borrowed && (c.type === "maj" || c.type === "7")) {
    const target = mod12(c.root + 5), tIv = mod12(target - tonic);
    const steps = o.scale === "major" ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];
    const triad = o.scale === "major" ? ["", "m", "m", "", "", "m", "dim"] : ["m", "dim", "", "m", "m", "", ""];
    const d = steps.indexOf(tIv);
    if (d > 0 && triad[d] !== "dim") secondaryOf = nm(target) + triad[d];
  }
  const iv = mod12(c.root - tonic), { numeral, degree } = numeralOf(iv, c.type, o.scale);
  // A chord off the scale is spelled the way its numeral reads (♭VII in C is B♭, not A♯).
  const cn = numeral.startsWith("♭") ? FLAT : numeral.startsWith("♯") ? SHARP : names, cname = (pc: number) => cn[mod12(pc)];
  const role = roleOf(degree, c.type, o.scale, inKey, borrowed, !!secondaryOf);
  const keyName = `${nm(tonic)} ${o.scale}`;
  const spelled = cname(c.root) + SUFFIX[c.type];
  const roleWords = role === "borrowed" ? `borrowed from ${nm(tonic)} ${other} (the same key in its ${other === "minor" ? "darker" : "brighter"} mood), for colour`
    : role === "secondary" ? `a stepping stone: the V (fifth chord) of ${secondaryOf}, so it pulls toward ${secondaryOf}, not home` : ROLE_WORDS[role];
  const numeralWords = degree ? `${numeral} = the ${ORDINAL[degree - 1]} chord of ${keyName}` : `${numeral} = built on a note outside ${keyName}`;
  const tones = IV[c.type].map((i) => ({ name: cname(c.root + i), role: TONE_ROLE[i] ?? "note", inKey: inKeyPcs.has(mod12(c.root + i)) }));
  let yourNotes: ChordFacts["yourNotes"] = null;
  if (o.notes?.length) {
    const own = [...new Set(o.notes.map(mod12))];
    yourNotes = { names: [...o.notes].sort((a, b) => a - b).map((m) => nm(m)), added: own.filter((p) => !pcs.includes(p)).map(nm), missing: pcs.filter((p) => !own.includes(p)).map(nm) };
  }
  const near = (name: string | null | undefined): Neighbour | null => {
    const x = name ? parseChord(name) : null;
    if (!x) return null;
    const xp = IV[x.type].map((i) => mod12(x.root + i)), d = mod12(x.root - c.root);
    const move = d === 0 ? "the same root" : d === 5 ? "its root drops a fifth (up a fourth): the strongest pull, it sounds like arriving"
      : d === 7 ? "its root rises a fifth: it opens up" : d === 1 || d === 11 ? "its root moves a half step: smooth and close" : d === 2 || d === 10 ? "its root moves a whole step: a gentle step" : "its root moves a third: a soft shift";
    return { chord: nm(x.root) + SUFFIX[x.type], numeral: numeralOf(mod12(x.root - tonic), x.type, o.scale).numeral, shared: xp.filter((p) => pcs.includes(p)).length, move };
  };
  return {
    chord: spelled, key: keyName, quality: c.type, qualityWords: QUALITY_WORDS[c.type], degree, numeral, numeralWords, inKey,
    borrowed: role === "borrowed" ? `${nm(tonic)} ${other}` : null, secondaryOf, role, roleWords, tones,
    outside: tones.filter((t) => !t.inKey).map((t) => t.name), yourNotes, prev: near(o.prev), next: near(o.next),
  };
}

/** The facts as prompt lines ([theory]), each theory word glossed; the model writes the words from these only. */
export function chordFactsLines(f: ChordFacts, bar: number): string[] {
  const n = (x: Neighbour, dir: "before" | "after") => `the chord ${dir} it is ${x.chord} (${x.numeral}); they share ${x.shared} note${x.shared === 1 ? "" : "s"}; ${dir === "after" ? `from ${f.chord} to ${x.chord}` : `from ${x.chord} to ${f.chord}`}, ${x.move}`;
  return [
    `[theory] The open chord in Make, bar ${bar}: ${f.chord} in ${f.key} (worked out by Six AM's code from the key and the chord name; not your call). ${f.chord} is ${f.qualityWords}.`,
    `[theory] Place in the key: ${f.numeralWords}. ${f.inKey ? "All its notes are in the key." : `Notes outside the key: ${f.outside.join(", ")}.`} Role: ${f.roleWords}.`,
    `[theory] Its notes: ${f.tones.map((t) => `${t.name} (${t.role}${t.inKey ? "" : ", outside the key"})`).join(", ")}.`,
    ...(f.yourNotes ? [`[theory] They built it on the piano themselves: ${f.yourNotes.names.join(" ")}${f.yourNotes.added.length ? `; added ${f.yourNotes.added.join(", ")}` : ""}${f.yourNotes.missing.length ? `; left out ${f.yourNotes.missing.join(", ")}` : ""}. The name ${f.chord} is the closest one.`] : []),
    ...(f.prev || f.next ? [`[theory] In the loop: ${[f.prev ? n(f.prev, "before") : "", f.next ? n(f.next, "after") : ""].filter(Boolean).join("; ")}.`] : []),
    `[theory] Explain the open chord when the question is about it (or asks why it fits): what it is, its place in the key, and why it fits, from these lines only, in 2–3 short sentences labelled general. Every theory word gets a short plain gloss in the same sentence (for example "the V, the key's fifth chord"); no other theory words.`,
  ];
}

/** The offline answer (no model): the same facts in two plain sentences, written by code. */
export function chordFactsPlain(f: ChordFacts): string {
  const place = f.degree ? `the ${f.numeral} of ${f.key} (its ${ORDINAL[f.degree - 1]} chord)` : `the ${f.numeral} (outside ${f.key})`;
  const next = f.next ? ` Next comes ${f.next.chord}: ${f.next.move}, sharing ${f.next.shared} note${f.next.shared === 1 ? "" : "s"}.` : "";
  return `${f.chord} is ${place}: ${f.roleWords}.${f.inKey ? " All its notes are in the key." : ` ${f.outside.join(" and ")} ${f.outside.length === 1 ? "is" : "are"} outside the key.`}${next}`;
}
