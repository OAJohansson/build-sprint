// The track model: the crate, the demo track, the pure edit rules (snap, repeat, overwrite)
// and the drawn waveforms. No React here, so the rules can be unit tested.

export const BARS = 64;
export const BPM = 124;
export const BARS_PER_SECOND = BPM / 60 / 4;
export const TRACKS = ["Drums", "Bass", "Chords", "Top / FX"] as const;

export type Kind =
  | "kick" | "hats" | "broken" | "clap"
  | "sub" | "acid" | "pump"
  | "stab" | "pad"
  | "shaker" | "chop" | "ride" | "riser" | "perc";

export type Loop = { id: string; track: number; name: string; bars: number; vibe: string; kind: Kind };
export type Region = { id: string; loopId: string; track: number; start: number; length: number };
export type Doc = { regions: Region[]; muted: boolean[] };

const L = (track: number, name: string, bars: number, vibe: string, kind: Kind): Loop => ({
  id: name.toLowerCase().replace(/[^a-z]+/g, "-"),
  track, name, bars, vibe, kind,
});

// The crate: 24 loops, each played by its synth recipe in recipes.ts (decision 0019).
// shortcut: synthesised only; vocal chop and real instruments are stand-ins until Freesound CC0 samples join.
export const LOOPS: Loop[] = [
  L(0, "Four to the Floor", 4, "steady · classic", "kick"),
  L(0, "Rolling Hats", 2, "shuffled · bright", "hats"),
  L(0, "Jack Shuffle", 4, "swung · Chicago", "broken"),
  L(0, "Broken Beat", 4, "off-kilter · loose", "broken"),
  L(0, "Clap Stack", 2, "big · snappy", "clap"),
  L(0, "Warehouse Kick", 4, "heavy · Berlin", "kick"),
  L(1, "Deep Sub", 4, "deep · warm", "sub"),
  L(1, "Acid Line", 4, "squelchy · Chicago", "acid"),
  L(1, "Offbeat Pump", 2, "bouncy · classic house", "pump"),
  L(1, "Rubber Bass", 4, "funky · elastic", "acid"),
  L(1, "Low Rumble", 8, "dark · techno", "sub"),
  L(1, "Reese Roll", 4, "gritty · rolling", "pump"),
  L(2, "Chicago Stab", 4, "punchy · 1987", "stab"),
  L(2, "Warm Pad", 8, "soft · sunrise", "pad"),
  L(2, "Organ Hit", 2, "churchy · bold", "stab"),
  L(2, "Detroit Strings", 8, "lush · moody", "pad"),
  L(2, "Minor Wash", 8, "dreamy · minor", "pad"),
  L(2, "Piano Bounce", 4, "uplifting · Ibiza", "stab"),
  L(3, "Shaker Loop", 2, "tight · groovy", "shaker"),
  L(3, "Vocal Chop", 4, "soulful · cut-up", "chop"),
  L(3, "Ride Wash", 4, "airy · driving", "ride"),
  L(3, "Noise Riser", 8, "tension · build", "riser"),
  L(3, "Cowbell", 2, "cheeky · 808", "perc"),
  L(3, "Crash Swell", 4, "release · big", "riser"),
];
export const loopById = (id: string) => LOOPS.find((l) => l.id === id)!;

let seq = 0;
export const newId = () => `r${++seq}`;

const R = (loopId: string, start: number, length: number): Region => ({
  id: newId(), loopId, track: loopById(loopId).track, start, length,
});

// The contact sheet's demo track: the breakdown at bar 37 (drums out, a riser building).
export const demoDoc = (): Doc => ({
  regions: [
    R("four-to-the-floor", 1, 32), R("four-to-the-floor", 41, 24),
    R("acid-line", 9, 24), R("acid-line", 41, 24),
    R("chicago-stab", 17, 32),
    R("shaker-loop", 25, 8), R("noise-riser", 33, 8), R("shaker-loop", 41, 24),
  ],
  muted: [false, false, false, false],
});

/** Nearest bar line for a pixel offset into the lanes, kept inside the timeline. */
export function snapBar(x: number, pxPerBar: number, length: number) {
  const bar = Math.round(x / pxPerBar) + 1;
  return Math.min(Math.max(bar, 1), BARS - length + 1);
}

/** Length in whole loop repeats for a pixel width, at least one repeat, never past the end. */
export function snapLength(width: number, pxPerBar: number, loopBars: number, start: number) {
  const reps = Math.max(1, Math.round(width / pxPerBar / loopBars));
  const maxReps = Math.max(1, Math.floor((BARS - start + 1) / loopBars));
  return Math.min(reps, maxReps) * loopBars;
}

/** Place a region, trimming or removing whatever it overlaps on its track (GarageBand overwrites). */
export function place(regions: Region[], r: Region): Region[] {
  const s = r.start, e = r.start + r.length;
  const out: Region[] = [];
  for (const o of regions) {
    if (o.id === r.id) continue;
    const os = o.start, oe = o.start + o.length;
    if (o.track !== r.track || oe <= s || os >= e) { out.push(o); continue; }
    const lb = loopById(o.loopId).bars;
    if (os < s) {
      const len = Math.floor((s - os) / lb) * lb;
      if (len > 0) out.push({ ...o, length: len });
    }
    if (oe > e) {
      const len = Math.floor((oe - e) / lb) * lb;
      if (len > 0) out.push({ ...o, id: os < s ? newId() : o.id, start: oe - len, length: len });
    }
  }
  return [...out, r];
}

// Pseudo waveforms: one amplitude per 16th note, shaped by the loop type.
// shortcut: drawn, not measured; render each recipe offline (Tone.Offline) and draw its real peaks.
const jit = (i: number, s: number) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
export function amps(kind: Kind, bars: number, seed = 1): number[] {
  const n = bars * 16, a: number[] = [];
  for (let i = 0; i < n; i++) {
    const q = i % 16, r = jit(i, seed);
    let v = 0.1;
    switch (kind) {
      case "kick": v = q % 4 === 0 ? 0.95 : q % 4 === 2 ? 0.4 : 0.13; break;
      case "hats": v = q % 2 ? 0.42 : 0.2; break;
      case "broken": v = [0, 3, 6, 10, 12].includes(q) ? 0.9 : q % 2 ? 0.3 : 0.16; break;
      case "clap": v = q === 4 || q === 12 ? 0.95 : 0.08; break;
      case "sub": v = 0.55 + 0.15 * Math.sin(i * 0.4); break;
      case "acid": v = 0.35 + 0.35 * Math.abs(Math.sin(i * 0.9)) + (q % 4 === 3 ? 0.2 : 0); break;
      case "pump": v = q % 4 === 2 ? 0.9 : q % 4 === 3 ? 0.5 : 0.15; break;
      case "stab": v = [3, 6, 11].includes(q) ? 0.88 : [4, 7, 12].includes(q) ? 0.4 : 0.06; break;
      case "pad": v = 0.45 + 0.25 * Math.sin((i / n) * Math.PI * 2 * (bars / 4)); break;
      case "shaker": v = 0.22 + (q % 2 ? 0.16 : 0.05); break;
      case "chop": v = [0, 2, 7, 9, 14].includes(q) ? 0.8 : 0.1; break;
      case "ride": v = q % 4 === 2 ? 0.6 : 0.3; break;
      case "riser": v = 0.08 + 0.9 * (i / n) ** 1.6; break;
      case "perc": v = [0, 3, 8, 11].includes(q) ? 0.75 : 0.06; break;
    }
    a.push(Math.min(1, v * (0.85 + 0.3 * r)));
  }
  return a;
}

/** SVG path for a loop tiled over a region's length, in a 0..(bars*16) × 0..100 box. */
export function wavePath(kind: Kind, loopBars: number, totalBars: number, seed = 1, scale = 1) {
  const one = amps(kind, loopBars, seed);
  const n = totalBars * 16;
  let d = "";
  for (let i = 0; i < n; i++) {
    const h = one[i % one.length] * 46 * scale;
    d += `M${i + 0.5} ${(50 - h).toFixed(1)}V${(50 + h).toFixed(1)}`;
  }
  return d;
}
