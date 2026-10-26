// The Studio's lane model (S5): types and families, edit rules, mute/solo, migration, saved docs.
import { describe, expect, it } from "vitest";
import {
  FAMILIES, LANE_TYPES, accepts, crateLaneType, soundLaneType, withLanes as docWithLanes, addLane, clampDb, clampPan, colorOf, laneMix, laneOfRegion, lanesOf, legacyMix, legacyTrack,
  migrateDoc, moveLane, removeLane, renameLane, setPan, setVolume, sortLanes, toggleMute, toggleSolo, type Lane,
} from "./studio-lanes";
import { parseDoc } from "./tracks";
import { LOOPS, demoDoc, type Doc } from "./timeline";
import { placeInLane } from "./studio-drop";
import { makeKitLoop, makeSynthLoop } from "./synths/loop";

const muted = [false, false, false, false];
const lane = (id: string, type: Lane["type"], extra: Partial<Lane> = {}): Lane => ({ id, type, name: id, volumeDb: 0, pan: 0, muted: false, soloed: false, ...extra });

describe("types and families", () => {
  it("has 11 types in 7 families, in the fixed order, one colour per family", () => {
    expect(LANE_TYPES).toHaveLength(11);
    expect(FAMILIES.map((f) => f.name)).toEqual(["Drums", "Bass", "Harmony", "Melody", "Vocals", "FX", "Texture"]);
    expect(new Set(FAMILIES.map((f) => f.color)).size).toBe(7);
    expect(LANE_TYPES.filter((t) => t.family === "drums").map((t) => t.name)).toEqual(["Kick", "Claps & snares", "Hats", "Percussion"]);
    expect(colorOf("hats")).toBe(colorOf("kick"));
    expect([legacyTrack("perc"), legacyTrack("bass"), legacyTrack("pads"), legacyTrack("lead"), legacyTrack("texture")]).toEqual([0, 1, 2, 2, 3]);
  });
});

describe("migration from the 4 fixed lanes", () => {
  it("opens an old track as the same 4 lanes, names, order, mute and solo", () => {
    const ls = lanesOf({ muted: [false, true, false, false], soloed: [false, false, true, false] });
    expect(ls.map((l) => [l.id, l.type, l.name, l.volumeDb, l.pan])).toEqual([
      ["drums", "kick", "Drums", 0, 0], ["bass", "bass", "Bass", 0, 0], ["chords", "chords", "Chords", 0, 0], ["top", "fx", "Top / FX", 0, 0],
    ]);
    expect(ls.map((l) => l.muted)).toEqual([false, true, false, false]);
    expect(ls.map((l) => l.soloed)).toEqual([false, false, true, false]);
    expect(sortLanes(ls)).toEqual(ls);
  });
  it("keeps today's levels: fader 0 dB = drums 0, bass −3, chords −7, top/FX −9", () => {
    expect(laneMix(lanesOf({ muted })).map((m) => m.gainDb)).toEqual([0, -3, -7, -9]);
  });
  it("puts every old region on its lane and changes nothing else", () => {
    const d = demoDoc();
    const m = migrateDoc(d);
    expect(m.regions.map((r) => ({ ...r, lane: undefined }))).toEqual(d.regions.map((r) => ({ ...r, lane: undefined })));
    expect(m.regions.map((r) => r.lane)).toEqual(d.regions.map((r) => ["drums", "bass", "chords", "top"][r.track]));
    expect(migrateDoc(m)).toEqual(m);
    expect(legacyMix(m.lanes!)).toEqual({ muted, soloed: [false, false, false, false] });
  });
  it("a region without a lane (added by the 4-lane view) goes to the first lane on its old track", () => {
    const ls = [lane("k", "kick"), lane("h", "hats"), lane("b", "bass")];
    expect(laneOfRegion({ track: 0 }, ls)?.id).toBe("k");
    expect(laneOfRegion({ track: 0, lane: "h" }, ls)?.id).toBe("h");
    expect(laneOfRegion({ track: 0, lane: "gone" }, ls)?.id).toBe("k");
    expect(laneOfRegion({ track: 3 }, ls)).toBeUndefined();
  });
});

describe("edit rules", () => {
  const base = lanesOf({ muted });
  it("adds a lane at the end of its family, named after its type", () => {
    let r = addLane(base, "hats", "h1");
    expect(r.lanes.map((l) => l.id)).toEqual(["drums", "h1", "bass", "chords", "top"]);
    expect(r.lanes[1]).toMatchObject({ name: "Hats", volumeDb: 0, pan: 0, muted: false, soloed: false });
    r = addLane(r.lanes, "hats", "h2");
    expect(r.lanes.find((l) => l.id === "h2")!.name).toBe("Hats 2");
    expect(addLane(base, "texture", "t").lanes.at(-1)!.id).toBe("t");
    expect(addLane(base, "lead", "ld").lanes.map((l) => l.id)).toEqual(["drums", "bass", "chords", "ld", "top"]);
    expect(addLane([], "bass", "b").lanes.map((l) => l.id)).toEqual(["b"]);
  });
  it("won't add past 24 lanes or reuse an id", () => {
    let ls: Lane[] = [];
    for (let i = 0; i < 24; i++) ls = addLane(ls, "perc", `p${i}`).lanes;
    expect(addLane(ls, "perc", "x").id).toBeNull();
    expect(addLane(base, "bass", "bass").id).toBeNull();
  });
  it("removes a lane and only its blocks", () => {
    const regions = [{ id: "a", loopId: "x", track: 0, start: 1, length: 4, lane: "drums" }, { id: "b", loopId: "y", track: 1, start: 1, length: 4 }];
    const r = removeLane(base, regions, "bass");
    expect(r.lanes.map((l) => l.id)).toEqual(["drums", "chords", "top"]);
    expect(r.regions.map((x) => x.id)).toEqual(["a"]);
    expect(removeLane(base, regions, "nope").regions).toBe(regions);
  });
  it("renames, trimmed and capped; empty gives the type's name back", () => {
    expect(renameLane(base, "bass", "  Rubber   sub ")[1].name).toBe("Rubber sub");
    expect(renameLane(base, "bass", "   ")[1].name).toBe("Bass");
    expect(renameLane(base, "bass", "x".repeat(60))[1].name).toHaveLength(40);
  });
  it("reorders only inside a family", () => {
    const ls = [lane("k", "kick"), lane("h", "hats"), lane("b", "bass"), lane("b2", "bass")];
    expect(moveLane(ls, "h", -1).map((l) => l.id)).toEqual(["h", "k", "b", "b2"]);
    expect(moveLane(ls, "h", 1)).toBe(ls); // Bass is another family
    expect(moveLane(ls, "b2", -1).map((l) => l.id)).toEqual(["k", "h", "b2", "b"]);
    expect(moveLane(ls, "k", -1)).toBe(ls);
  });
  it("clamps volume to −30…+6 dB in half dB and pan to L100…R100", () => {
    expect(setVolume(base, "bass", -50)[1].volumeDb).toBe(-30);
    expect(setVolume(base, "bass", 9)[1].volumeDb).toBe(6);
    expect(setVolume(base, "bass", -3.3)[1].volumeDb).toBe(-3.5);
    expect(setPan(base, "bass", -140)[1].pan).toBe(-100);
    expect(setPan(base, "bass", 33.6)[1].pan).toBe(34);
    expect([clampDb(Number.NaN), clampPan(Number.NaN)]).toEqual([0, 0]);
  });
});

describe("mute and solo", () => {
  const ls = [lane("k", "kick"), lane("h", "hats"), lane("b", "bass", { volumeDb: 2, pan: -50 }), lane("c", "chords")];
  const audible = (x: Lane[]) => laneMix(x).filter((m) => m.audible).map((m) => m.id);
  it("plays everything that isn't muted", () => {
    expect(audible(ls)).toEqual(["k", "h", "b", "c"]);
    expect(audible(toggleMute(ls, "h"))).toEqual(["k", "b", "c"]);
  });
  it("with any solo, plays only the soloed lanes; solo beats mute", () => {
    expect(audible(toggleSolo(ls, "b"))).toEqual(["b"]);
    expect(audible(toggleSolo(toggleSolo(ls, "b"), "k"))).toEqual(["k", "b"]);
    expect(audible(toggleSolo(toggleMute(ls, "b"), "b"))).toEqual(["b"]);
    expect(audible(toggleSolo(toggleSolo(ls, "b"), "b"))).toEqual(["k", "h", "b", "c"]);
  });
  it("gain is the type's trim plus the fader; pan −1…1", () => {
    expect(laneMix(ls)[2]).toEqual({ id: "b", audible: true, gainDb: -1, pan: -0.5 });
  });
  it("projects onto the 4-lane view: muted when all its lanes are, soloed when any is", () => {
    expect(legacyMix(toggleMute(ls, "k"))).toEqual({ muted: [false, false, false, false], soloed: [false, false, false, false] });
    expect(legacyMix(toggleMute(toggleMute(ls, "k"), "h")).muted).toEqual([true, false, false, false]);
    expect(legacyMix(toggleSolo(ls, "c")).soloed).toEqual([false, false, true, false]);
  });
});

describe("saved docs", () => {
  const withLanes = (): Doc => ({
    regions: [{ id: "r1", loopId: "deep-sub", track: 1, start: 1, length: 4, lane: "b2" }, { id: "r2", loopId: "rolling-hats", track: 0, start: 1, length: 2 }],
    muted,
    lanes: [lane("k", "kick"), lane("b", "bass"), lane("b2", "bass", { name: "Sub", volumeDb: -4, pan: 10 })],
  });
  it("an old doc still parses exactly as it was", () => {
    const old = { regions: [{ id: "r1", loopId: "deep-sub", track: 1, start: 1, length: 4 }], muted };
    expect(parseDoc(old)).toEqual(old);
  });
  it("keeps lanes and region lanes through a save", () => {
    const d = withLanes();
    expect(parseDoc(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });
  it("an old region may name a migrated lane", () => {
    expect(parseDoc({ regions: [{ id: "r1", loopId: "deep-sub", track: 1, start: 1, length: 4, lane: "bass" }], muted })).not.toBeNull();
  });
  it("rejects a region on a lane that doesn't exist; any existing lane is fine (S5: a lane takes its family)", () => {
    expect(parseDoc({ ...withLanes(), regions: [{ id: "r1", loopId: "deep-sub", track: 1, start: 1, length: 4, lane: "zz" }] })).toBeNull();
    expect(parseDoc({ ...withLanes(), regions: [{ id: "r1", loopId: "shaker-loop", track: 3, start: 1, length: 2, lane: "k" }] })).not.toBeNull();
  });
  it("rejects bad lanes, clamps mix values and sorts families", () => {
    expect(parseDoc({ ...withLanes(), lanes: [lane("a", "kick"), lane("a", "bass")] })).toBeNull();
    expect(parseDoc({ ...withLanes(), lanes: [{ ...lane("a", "kick"), type: "banjo" }] })).toBeNull();
    expect(parseDoc({ ...withLanes(), lanes: [] })).toBeNull();
    const p = parseDoc({ ...withLanes(), regions: [], lanes: [lane("b", "bass", { volumeDb: 40, pan: -300 }), lane("k", "kick")] })!;
    expect(p.lanes!.map((l) => [l.id, l.volumeDb, l.pan])).toEqual([["k", 0, 0], ["b", 6, -100]]);
  });
});

describe("what goes on which lane (S5 UI)", () => {
  it("gives every crate loop a type, and every family a crate tab", () => {
    const fams = new Set(LOOPS.map((l) => LANE_TYPES.find((t) => t.id === crateLaneType(l))!.family));
    expect([...fams].sort()).toEqual(FAMILIES.map((f) => f.id).sort());
    expect(crateLaneType(LOOPS.find((l) => l.id === "shaker-loop")!)).toBe("perc");
    expect(crateLaneType(LOOPS.find((l) => l.id === "vinyl-crackle")!)).toBe("texture");
    expect(crateLaneType(LOOPS.find((l) => l.id === "siren")!)).toBe("fx");
  });
  it("types the track's own sounds", () => {
    expect(soundLaneType(makeKitLoop("808", "kit-four-floor")!)).toBe("kick");
    expect(soundLaneType(makeSynthLoop("acid", "rolling-acid")!)).toBe("bass");
    expect(soundLaneType(makeSynthLoop("pad", "long-pad")!)).toBe("pads");
    expect(soundLaneType(makeSynthLoop("rhodes", "rhodes-swing")!)).toBe("chords");
  });
  it("a lane takes its family; the 4 old lanes keep taking what they always took", () => {
    const old = lanesOf({ muted });
    const shaker = { type: "perc" as const, track: 3 };
    expect(accepts(old[3], shaker)).toBe(true); // Top / FX
    expect(accepts(old[0], shaker)).toBe(true); // Drums (drums family)
    expect(accepts(old[1], shaker)).toBe(false);
    expect(accepts(lane("v", "vocals"), { type: "fx", track: 3 })).toBe(false);
    expect(accepts(lane("h", "hats"), { type: "kick", track: 0 })).toBe(true);
    // A renamed copy of an old lane id with another type doesn't inherit the old rule.
    expect(accepts(lane("top", "vocals"), shaker)).toBe(false);
  });
  it("withLanes gives regions their lane and keeps muted/soloed in step for older builds", () => {
    const d = demoDoc();
    const ls = toggleSolo(toggleMute(lanesOf(d), "chords"), "bass");
    const w = docWithLanes(d, ls);
    expect(w.regions.every((r) => r.lane)).toBe(true);
    expect(w.muted).toEqual([false, false, true, false]);
    expect(w.soloed).toEqual([false, true, false, false]);
    expect(docWithLanes(d, lanesOf(d)).soloed).toBeUndefined();
  });
  it("placing on a lane trims only that lane, also when it holds loops from several old tracks", () => {
    const ls = [lane("p", "perc"), lane("p2", "perc")];
    const regions = [
      { id: "a", loopId: "shaker-loop", track: 3, lane: "p", start: 1, length: 16 },
      { id: "b", loopId: "conga-loop", track: 3, lane: "p2", start: 1, length: 16 },
    ];
    const out = placeInLane(regions, { id: "n", loopId: "tribal-toms", track: 0, lane: "p", start: 5, length: 4 }, ls);
    expect(out.filter((r) => r.lane === "p").map((r) => [r.loopId, r.track, r.start, r.length]).sort()).toEqual([
      ["shaker-loop", 3, 1, 4], ["shaker-loop", 3, 9, 8], ["tribal-toms", 0, 5, 4],
    ]);
    expect(out.find((r) => r.id === "b")).toEqual(regions[1]);
  });
});
