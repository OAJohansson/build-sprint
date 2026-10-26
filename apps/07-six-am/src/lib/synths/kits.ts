// The two sampled drum kits (A8) and drum patterns as data. Samples are CC0, from Freesound; every
// file's source, author and licence is in public/kits/LICENSES.md. Pure data, no audio here.

export type KitId = "909" | "808";
export type DrumSound = "kick" | "clap" | "hat" | "ohat";
export const DRUM_SOUNDS: DrumSound[] = ["kick", "clap", "hat", "ohat"];

export type Kit = { id: KitId; name: string; about: string; urls: Record<DrumSound, string> };

// shortcut: Freesound's 128 kbps MP3 previews (the WAV originals need a Freesound login); swap in the WAVs if the hats sound dull.
const urls = (kit: KitId) =>
  Object.fromEntries(DRUM_SOUNDS.map((s) => [s, `/kits/${kit}/${s}.mp3`])) as Record<DrumSound, string>;

export const KITS: Record<KitId, Kit> = {
  "909": { id: "909", name: "909", urls: urls("909"),
    about: "Roland TR-909 style (sampled from a JD-Xi's 909 sounds): punchy kick, bright noisy hats, the house and techno kit." },
  "808": { id: "808", name: "808", urls: urls("808"),
    about: "Roland TR-808 style (sampled from a TR-08): a round, boomy kick, a soft clap and thin metallic hats; electro, early house, hip hop." },
};

export type DrumHit = { step: number; sound: DrumSound; vel: number };
export type DrumPattern = { id: string; name: string; bars: number; idiom: string; hits: DrumHit[] };

const h = (step: number, sound: DrumSound, vel = 0.9): DrumHit => ({ step, sound, vel });
const perBar = (count: number, fn: (bar: number) => DrumHit[]) =>
  Array.from({ length: count }, (_, bar) => fn(bar).map((x) => ({ ...x, step: bar * 16 + x.step }))).flat();

export const DRUM_PATTERNS: DrumPattern[] = [
  { id: "kit-four-floor", name: "Four to the Floor", bars: 1, idiom: "A kick on every beat: the heartbeat of house and techno.",
    hits: [0, 4, 8, 12].map((s) => h(s, "kick", 1)) },
  { id: "kit-offbeat-ohat", name: "Offbeat Open Hat", bars: 1, idiom: "An open hat on every 'and' between the kicks: the 'tss' that makes house bounce.",
    hits: [2, 6, 10, 14].map((s) => h(s, "ohat", 0.7)) },
  { id: "kit-clap-2-4", name: "Clap on 2 and 4", bars: 1, idiom: "The backbeat: a clap on beats two and four.",
    hits: [4, 12].map((s) => h(s, "clap", 0.85)) },
  { id: "kit-sixteenth-hats", name: "16th Hats", bars: 1, idiom: "Closed hats on every 16th, louder on the offbeats: drive and shuffle.",
    hits: Array.from({ length: 16 }, (_, s) => h(s, "hat", s % 4 === 2 ? 0.8 : s % 2 ? 0.4 : 0.55)) },
  { id: "kit-house-groove", name: "House Groove", bars: 2, idiom: "All four together, with a pickup kick at the end of bar two.",
    hits: perBar(2, (bar) => [
      ...[0, 4, 8, 12].map((s) => h(s, "kick", 1)),
      ...[4, 12].map((s) => h(s, "clap", 0.85)),
      ...[2, 6, 10, 14].map((s) => h(s, "ohat", 0.65)),
      ...[0, 1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15].map((s) => h(s, "hat", s % 2 ? 0.35 : 0.5)),
      ...(bar === 1 ? [h(15, "kick", 0.6)] : []),
    ]).sort((a, z) => a.step - z.step) },
];

export const drumPatternById = (id: string) => DRUM_PATTERNS.find((p) => p.id === id);
