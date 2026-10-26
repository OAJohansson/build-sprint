// The Studio's lane model (S5, L159, L194, T102): about 11 lane types in 7 families, each lane with
// its own name, volume, pan, mute and solo. Pure: the types, the edit rules (add, remove, rename,
// reorder within a family, mix), the solo/mute rules and the migration from the 4 fixed lanes
// every track saved before S5 has (Drums, Bass, Chords, Top / FX). studio-lanes.test.ts.
//
// How it sits beside the old 4-lane Studio: a region keeps its `track` (0–3, its loop's old lane),
// so a build from before S5 still opens the track; the optional `region.lane` and `doc.lanes` say
// which lane it is on. A region without a lane (every pre-S5 track) is on the first lane of its
// old track's family (`legacyTrack`).
import type { Doc, Kind, Region } from "./timeline";
import type { Sound } from "./synths/loop";

export type FamilyId = "drums" | "bass" | "harmony" | "melody" | "vocals" | "fx" | "texture";
export type LaneType = "kick" | "clap" | "hats" | "perc" | "bass" | "chords" | "pads" | "lead" | "vocals" | "fx" | "texture";

/** The families in their fixed order, with their colour (T102; Melody, Vocals and Texture are the
 *  owner's to change) and the old lane (0 Drums, 1 Bass, 2 Chords, 3 Top / FX) they play through. */
export const FAMILIES: { id: FamilyId; name: string; color: string; legacyTrack: 0 | 1 | 2 | 3 }[] = [
  { id: "drums", name: "Drums", color: "#f2b134", legacyTrack: 0 },
  { id: "bass", name: "Bass", color: "#ef5b37", legacyTrack: 1 },
  { id: "harmony", name: "Harmony", color: "#23b3a5", legacyTrack: 2 },
  { id: "melody", name: "Melody", color: "#7fa7e6", legacyTrack: 2 },
  { id: "vocals", name: "Vocals", color: "#e48aa9", legacyTrack: 3 },
  { id: "fx", name: "FX", color: "#a9c95a", legacyTrack: 3 },
  { id: "texture", name: "Texture", color: "#b49be0", legacyTrack: 3 },
];

/**
 * The lane types. `trimDb` is the type's fixed level under its fader, so a fader at 0 dB sounds as
 * loud as today's lane of that kind (audio.ts TRACK_DB: drums 0, bass −3, chords −7, top/FX −9).
 */
export const LANE_TYPES: { id: LaneType; name: string; family: FamilyId; hint: string; trimDb: number }[] = [
  { id: "kick", name: "Kick", family: "drums", hint: "the four on the floor", trimDb: 0 },
  { id: "clap", name: "Claps & snares", family: "drums", hint: "on 2 and 4", trimDb: 0 },
  { id: "hats", name: "Hats", family: "drums", hint: "the ticking on top", trimDb: 0 },
  { id: "perc", name: "Percussion", family: "drums", hint: "shakers, congas, rims", trimDb: 0 },
  { id: "bass", name: "Bass", family: "bass", hint: "the low line", trimDb: -3 },
  { id: "chords", name: "Chords", family: "harmony", hint: "stabs and keys", trimDb: -7 },
  { id: "pads", name: "Pads", family: "harmony", hint: "long held chords", trimDb: -7 },
  { id: "lead", name: "Lead", family: "melody", hint: "the hook you hum", trimDb: -7 },
  { id: "vocals", name: "Vocals", family: "vocals", hint: "singing, chops", trimDb: -9 },
  { id: "fx", name: "FX", family: "fx", hint: "risers, sweeps, impacts", trimDb: -9 },
  { id: "texture", name: "Texture", family: "texture", hint: "noise, vinyl, room", trimDb: -9 },
];

export const laneType = (id: LaneType) => LANE_TYPES.find((t) => t.id === id)!;
export const family = (id: FamilyId) => FAMILIES.find((f) => f.id === id)!;
export const familyOf = (t: LaneType) => family(laneType(t).family);
export const colorOf = (t: LaneType) => familyOf(t).color;
/** The old lane (0–3) a lane type plays through and shows on in the 4-lane view. */
export const legacyTrack = (t: LaneType) => familyOf(t).legacyTrack;
const isLaneType = (v: unknown): v is LaneType => LANE_TYPES.some((t) => t.id === v);

/** One lane. volumeDb is the fader (−30…+6, 0 = the type's normal level); pan −100 (L) … 100 (R). */
export type Lane = { id: string; type: LaneType; name: string; volumeDb: number; pan: number; muted: boolean; soloed: boolean };

export const MIN_DB = -30;
export const MAX_DB = 6;
export const MAX_LANES = 24;
export const MAX_LANE_NAME = 40;

// ── Migration from the 4 fixed lanes ─────────────────────────────────────────────────────────────

/**
 * The 4 lanes every pre-S5 track has, as lanes: same order, same names, same level (fader 0 dB =
 * today's level via trimDb). Drums → a Kick-type lane named "Drums" (the Drums family's first type;
 * it keeps every drum loop it had); Bass → Bass; Chords → Chords; Top / FX → an FX-type lane named
 * "Top / FX" (FX keeps it last; Percussion would sort it above Bass). Stable ids, so the migration
 * is the same every time a track opens.
 */
export const LEGACY_LANES: { id: string; type: LaneType; name: string }[] = [
  { id: "drums", type: "kick", name: "Drums" },
  { id: "bass", type: "bass", name: "Bass" },
  { id: "chords", type: "chords", name: "Chords" },
  { id: "top", type: "fx", name: "Top / FX" },
];

/** A track's lanes: its own when it has them, else the 4 old lanes with its mute and solo. */
export function lanesOf(d: Pick<Doc, "muted" | "soloed" | "lanes">): Lane[] {
  if (d.lanes?.length) return d.lanes;
  return LEGACY_LANES.map((l, i) => ({ ...l, volumeDb: 0, pan: 0, muted: !!d.muted[i], soloed: !!d.soloed?.[i] }));
}

/** The lane a region is on: its own `lane` when that lane exists, else the first lane playing
 *  through its old track (every pre-S5 region, and any the 4-lane view adds). */
export function laneOfRegion(r: Pick<Region, "track" | "lane">, lanes: Lane[]): Lane | undefined {
  return (r.lane ? lanes.find((l) => l.id === r.lane) : undefined) ?? lanes.find((l) => legacyTrack(l.type) === r.track);
}

/** A doc with lanes: every region gets its lane id. A doc that already has them is returned as is. */
export function migrateDoc(d: Doc): Doc {
  const lanes = lanesOf(d);
  const regions = d.regions.map((r) => (r.lane ? r : { ...r, lane: laneOfRegion(r, lanes)?.id }));
  return { ...d, lanes, regions };
}

/** The 4-lane view's muted / soloed for a set of lanes: an old lane is muted when all its lanes
 *  are (and it has any), soloed when any of them is. */
export function legacyMix(lanes: Lane[]): { muted: boolean[]; soloed: boolean[] } {
  const muted = [0, 1, 2, 3].map((t) => { const ls = lanes.filter((l) => legacyTrack(l.type) === t); return ls.length > 0 && ls.every((l) => l.muted); });
  const soloed = [0, 1, 2, 3].map((t) => lanes.some((l) => legacyTrack(l.type) === t && l.soloed));
  return { muted, soloed };
}

/**
 * A doc with these lanes: every region gets its lane id, and `muted`/`soloed` follow the lanes
 * (legacyMix), so a build from before S5 opening it hears roughly the same. `soloed` is left out
 * when nothing is soloed, as before.
 */
export function withLanes(d: Doc, lanes: Lane[]): Doc {
  const regions = d.regions.map((r) => (r.lane && lanes.some((l) => l.id === r.lane) ? r : { ...r, lane: laneOfRegion(r, lanes)?.id }));
  const { muted, soloed } = legacyMix(lanes);
  const { soloed: _old, ...rest } = d;
  void _old;
  return { ...rest, lanes, regions: regions.filter((r) => r.lane), muted, ...(soloed.some(Boolean) ? { soloed } : {}) };
}

// ── What goes on which lane ─────────────────────────────────────────────────────────────────────

const KIND_TYPE: Record<Kind, LaneType> = {
  kick: "kick", hats: "hats", ride: "hats", clap: "clap", broken: "perc", perc: "perc", shaker: "perc",
  sub: "bass", acid: "bass", pump: "bass", stab: "chords", pad: "pads", arp: "lead", chop: "vocals", riser: "fx", fall: "fx",
};
// Loops whose kind says less than their name: a snare fill is a snare, a siren an effect, crackle a texture.
const LOOP_TYPE: Record<string, LaneType> = { "snare-fill": "clap", siren: "fx", "vinyl-crackle": "texture", "crash-swell": "fx" };

/** The lane type a crate loop belongs on (its crate tab's family, its drop target). */
export const crateLaneType = (l: { id: string; kind: Kind }): LaneType => LOOP_TYPE[l.id] ?? KIND_TYPE[l.kind];

/** The lane type a track sound belongs on: kits on Kick, synths on Bass / Chords / Pads, AI loops
 *  on Bass, library sounds on their own type. */
export function soundLaneType(x: Sound): LaneType {
  if (x.source === "lib") return x.type;
  if (x.source === "kit") return "kick";
  if (x.source === "ai") return "bass";
  return x.lane === 1 ? "bass" : x.preset === "pad" ? "pads" : "chords";
}

const LEGACY_IDS = LEGACY_LANES.map((l) => l.id);

/**
 * Whether a lane takes an item (a crate loop, a track sound or a library sound) of `type` whose old
 * lane is `track`: any lane of the same family, and an old track's own 4 lanes also take what they
 * always took ("Top / FX" keeps taking shakers and congas).
 */
export function accepts(lane: Lane, item: { type: LaneType; track: number }): boolean {
  if (laneType(lane.type).family === laneType(item.type).family) return true;
  const i = LEGACY_IDS.indexOf(lane.id);
  return i >= 0 && i === item.track && LEGACY_LANES[i].type === lane.type;
}

// ── Edit rules ────────────────────────────────────────────────────────────────────────────────────

const familyIndex = (t: LaneType) => FAMILIES.findIndex((f) => f.id === laneType(t).family);

/** Lanes in family order (Drums first, Texture last), keeping the order inside each family. */
export const sortLanes = (lanes: Lane[]) => lanes.map((l, i) => ({ l, i })).sort((a, b) => familyIndex(a.l.type) - familyIndex(b.l.type) || a.i - b.i).map((x) => x.l);

const newLaneId = () => `l${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

/** A new lane of `type` at the end of its family, named after its type ("Hats", then "Hats 2").
 *  Unchanged lanes (and no new id) when the track already has MAX_LANES. */
export function addLane(lanes: Lane[], type: LaneType, id = newLaneId()): { lanes: Lane[]; id: string | null } {
  if (lanes.length >= MAX_LANES || lanes.some((l) => l.id === id)) return { lanes, id: null };
  const base = laneType(type).name;
  const names = new Set(lanes.map((l) => l.name));
  let name = base;
  for (let n = 2; names.has(name); n++) name = `${base} ${n}`;
  const lane: Lane = { id, type, name, volumeDb: 0, pan: 0, muted: false, soloed: false };
  const f = familyIndex(type);
  const at = lanes.reduce((acc, l, i) => (familyIndex(l.type) <= f ? i + 1 : acc), 0);
  return { lanes: [...lanes.slice(0, at), lane, ...lanes.slice(at)], id };
}

/** Removes a lane and its blocks. */
export function removeLane(lanes: Lane[], regions: Region[], id: string): { lanes: Lane[]; regions: Region[] } {
  const next = lanes.filter((l) => l.id !== id);
  if (next.length === lanes.length) return { lanes, regions };
  return { lanes: next, regions: regions.filter((r) => laneOfRegion(r, lanes)?.id !== id) };
}

const patch = (lanes: Lane[], id: string, f: (l: Lane) => Partial<Lane>) => lanes.map((l) => (l.id === id ? { ...l, ...f(l) } : l));

/** Renames a lane: spaces collapsed, at most 40 characters; an empty name gives back the type's. */
export function renameLane(lanes: Lane[], id: string, name: string): Lane[] {
  const clean = name.normalize("NFC").replace(/\s+/g, " ").trim().slice(0, MAX_LANE_NAME).trim();
  return patch(lanes, id, (l) => ({ name: clean || laneType(l.type).name }));
}

/** Moves a lane one place up (−1) or down (1) inside its family; at the family's edge, nothing. */
export function moveLane(lanes: Lane[], id: string, dir: -1 | 1): Lane[] {
  const i = lanes.findIndex((l) => l.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= lanes.length || laneType(lanes[j].type).family !== laneType(lanes[i].type).family) return lanes;
  const next = [...lanes];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** Fader: clamped to −30…+6 dB, in half-dB steps. */
export const clampDb = (db: number) => (Number.isFinite(db) ? Math.min(MAX_DB, Math.max(MIN_DB, Math.round(db * 2) / 2)) : 0);
/** Pan: clamped to L100…R100, whole steps (0 = centre, what a double-click sets). */
export const clampPan = (pan: number) => (Number.isFinite(pan) ? Math.min(100, Math.max(-100, Math.round(pan))) : 0);

export const setVolume = (lanes: Lane[], id: string, db: number) => patch(lanes, id, () => ({ volumeDb: clampDb(db) }));
export const setPan = (lanes: Lane[], id: string, pan: number) => patch(lanes, id, () => ({ pan: clampPan(pan) }));
export const toggleMute = (lanes: Lane[], id: string) => patch(lanes, id, (l) => ({ muted: !l.muted }));
export const toggleSolo = (lanes: Lane[], id: string) => patch(lanes, id, (l) => ({ soloed: !l.soloed }));

// ── Mix: mute and solo rules ──────────────────────────────────────────────────────────────────────

export type LaneMix = { id: string; audible: boolean; gainDb: number; pan: number };

/**
 * What each lane sounds like: with any lane soloed, only soloed lanes are heard (solo beats mute,
 * like today's silentLanes, L140); otherwise every lane that isn't muted. gainDb is the type's
 * trim plus the fader; pan is −1…1.
 */
export function laneMix(lanes: Lane[]): LaneMix[] {
  const anySolo = lanes.some((l) => l.soloed);
  return lanes.map((l) => ({
    id: l.id,
    audible: anySolo ? l.soloed : !l.muted,
    gainDb: laneType(l.type).trimDb + clampDb(l.volumeDb),
    pan: clampPan(l.pan) / 100,
  }));
}

// ── Parsing (saved docs) ──────────────────────────────────────────────────────────────────────────

/** Lanes we can trust, in family order, or null: unique ids ≤ 40 chars, known types, names,
 *  volume and pan clamped. */
export function parseLanes(v: unknown): Lane[] | null {
  if (!Array.isArray(v) || v.length < 1 || v.length > MAX_LANES) return null;
  const out: Lane[] = [];
  for (const x of v as Record<string, unknown>[]) {
    if (!x || typeof x.id !== "string" || !x.id || x.id.length > 40 || out.some((l) => l.id === x.id)) return null;
    if (!isLaneType(x.type) || typeof x.name !== "string") return null;
    if (typeof x.volumeDb !== "number" || typeof x.pan !== "number" || typeof x.muted !== "boolean" || typeof x.soloed !== "boolean") return null;
    const name = x.name.normalize("NFC").replace(/\s+/g, " ").trim().slice(0, MAX_LANE_NAME).trim() || laneType(x.type).name;
    out.push({ id: x.id, type: x.type, name, volumeDb: clampDb(x.volumeDb), pan: clampPan(x.pan), muted: x.muted, soloed: x.soloed });
  }
  return sortLanes(out);
}
