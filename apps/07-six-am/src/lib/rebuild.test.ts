// Rebuild the song (Phase 7 slice 3): sections → slots, hints, counts, fill to the section's end,
// leave empty, saved docs. The audio side (a block stops at its section's end) via buildSoundIndex.
import { describe, expect, it } from "vitest";
import { buildSoundIndex } from "@/lib/synths/schedule";
import { parseDoc } from "@/lib/tracks";
import { demoDoc } from "@/lib/timeline";
import type { LibrarySound } from "@/lib/make/library";
import { clampPolyMacros } from "@/lib/make/poly-synth";
import { clampDrumMacros } from "@/lib/make/drum-synth";
import type { TrackMap } from "@/lib/map/types";
import { emptySlot, fillSlot, leaveSlot, originalMsAt, parseRebuild, partFits, rebuildBarAt, rebuildDoc, rebuildSections, rebuildTrackId, sectionIndexAt, slotHint, slotState, toFill } from "./rebuild";

// 48 bars: intro 1–8 (kick, hats), drop 9–24 (kick, hats, bass, chords, vocals), breakdown 25–32
// (chords, vocals; no kick), drop 33–48 (kick, hats, bass, chords).
const N = 48;
const on = (...spans: [number, number][]) => Array.from({ length: N }, (_, i) => (spans.some(([a, b]) => i + 1 >= a && i + 1 <= b) ? 0.9 : 0.05));
const MAP: Pick<TrackMap, "id" | "bpm" | "key" | "scale" | "bars" | "sections" | "energy" | "layers" | "originSec"> = {
  id: "https://soundcloud.com/test/rebuild-fixture", bpm: 123.02, originSec: 1.407, key: "G", scale: "major", bars: N,
  energy: Array(N).fill(0.6),
  sections: [
    { label: "intro", startBar: 0, endBar: 8, startSec: 0, endSec: 0 },
    { label: "drop", startBar: 8, endBar: 24, startSec: 0, endSec: 0 },
    { label: "breakdown", startBar: 24, endBar: 32, startSec: 0, endSec: 0 },
    { label: "drop", startBar: 32, endBar: 48, startSec: 0, endSec: 0 },
  ],
  layers: { kind: "estimate", method: "test", kick: on([1, 24], [33, 48]), hats: on([1, 24], [33, 48]), bass: on([9, 24], [33, 48]), chords: on([9, 48]), vocals: on([9, 32]) },
};

const part = (id: string, over: Partial<LibrarySound>): LibrarySound => ({
  id, name: "part", part: "drums", preset: "kick-909-round", macros: clampDrumMacros("kick-909-round", {}), pattern: { bars: 1, notes: [{ step: 0, midi: 36, dur: 1, vel: 1 }] },
  key: "A", scale: "minor", bpm: 124, source: null, tags: [], createdAt: "", updatedAt: "", ...over,
} as LibrarySound);
const KICK = part("11111111-1111-4111-8111-111111111111", { name: "909 round kick", pattern: { bars: 1, notes: [0, 4, 8, 12].map((step) => ({ step, midi: 36, dur: 1, vel: 1 })) } as LibrarySound["pattern"] });
const CHORDS = part("22222222-2222-4222-8222-222222222222", {
  name: "Am stabs", part: "other", preset: "chords-stab", macros: clampPolyMacros("chords-stab", undefined),
  pattern: { bars: 8, notes: Array.from({ length: 8 }, (_, b) => ({ step: b * 16, midi: 57, dur: 4, vel: 0.8 })) },
} as Partial<LibrarySound>);
const PAD = part("33333333-3333-4333-8333-333333333333", { name: "Warm pad", part: "other", preset: "chords-pad", macros: clampPolyMacros("chords-pad", undefined), pattern: { bars: 4, notes: [{ step: 0, midi: 57, dur: 64, vel: 0.6 }] } } as Partial<LibrarySound>);

describe("rebuildDoc lays out the original's sections bar for bar (W9)", () => {
  const doc = rebuildDoc(MAP);
  it("copies tempo, key and length; sections start on the map's bars; no blocks at all (L269)", () => {
    expect(doc.bpm).toBe(123);
    expect(doc.key).toEqual({ key: "G", scale: "major" });
    expect(doc.bars).toBe(48);
    expect(doc.regions).toEqual([]);
    expect(doc.sounds).toBeUndefined();
    expect(doc.rebuild!.sections.map((s) => [s.name, s.start, s.bars])).toEqual([["Intro", 1, 8], ["Drop 1", 9, 16], ["Breakdown", 25, 8], ["Drop 2", 33, 16]]);
    expect(doc.rebuild!.sections.map((s) => s.start)).toEqual(MAP.sections.map((s) => s.startBar + 1));
    expect(doc.lanes!.map((l) => l.name)).toEqual(["Kick", "Claps", "Hats", "Percussion", "Bass", "Chords", "Pads", "Lead", "Vocals", "FX"]);
  });
  it("hints only the measured layers, per section: no kick in the breakdown, chords only from the drop", () => {
    const has = doc.rebuild!.sections.map((s) => s.has);
    expect(has).toEqual([["kick", "hats"], ["kick", "bass", "chords", "hats", "vocals"], ["chords", "vocals"], ["kick", "bass", "chords", "hats"]]);
    const [intro, drop, breakdown] = doc.rebuild!.sections;
    expect(slotHint(intro, "kick")).toBe("has");
    expect(slotHint(breakdown, "kick")).toBe("none");
    expect(slotHint(intro, "claps")).toBeNull(); // not measured: no hint, not a guess (L273a)
    expect(slotHint(drop, "vocals")).toBe("vocals");
    expect(slotHint(intro, "vocals")).toBe("none");
  });
  it("counts what's still to fill: measured parts the original has, vocals not counted", () => {
    expect([0, 1, 2, 3].map((i) => toFill(doc, i).length)).toEqual([2, 4, 1, 4]);
    expect(toFill(doc, 2)).toEqual(["chords"]);
  });
  it("is a doc the Studio and the server accept, unchanged", () => {
    expect(parseDoc(JSON.parse(JSON.stringify(doc)))).toEqual(doc);
  });
  it("gives the edges to a section: a gap before the first section and a short map", () => {
    const s = rebuildSections({ ...MAP, sections: [{ label: "drop", startBar: 2, endBar: 10, startSec: 0, endSec: 0 }] }, 12);
    expect(s.map((x) => [x.start, x.bars])).toEqual([[1, 12]]);
    expect(rebuildSections({ ...MAP, sections: [] }, 12)).toMatchObject([{ name: "Whole song", start: 1, bars: 12 }]);
  });
  it("knows the section under a bar, including the last bar and past the end", () => {
    expect(sectionIndexAt(doc.rebuild!, 1)).toBe(0);
    expect(sectionIndexAt(doc.rebuild!, 24.99)).toBe(1);
    expect(sectionIndexAt(doc.rebuild!, 48)).toBe(3);
    expect(sectionIndexAt(doc.rebuild!, 60)).toBe(3);
  });
});

describe("filling a slot", () => {
  const doc = rebuildDoc(MAP);
  it("a 1-bar kick repeats over the whole section and stops at its end", () => {
    const d = fillSlot(doc, 1, "kick", KICK)!;
    expect(d.regions).toHaveLength(1);
    expect(d.regions[0]).toMatchObject({ lane: "kick", start: 9, length: 16 });
    expect(slotState(d, 1, "kick").state).toBe("filled");
    expect(toFill(d, 1)).toEqual(["bass", "chords", "hats"].sort((a, b) => ["kick", "claps", "hats", "perc", "bass", "chords"].indexOf(a) - ["kick", "claps", "hats", "perc", "bass", "chords"].indexOf(b)));
    const steps = [...buildSoundIndex(d.regions, d.sounds!, "G", "major", 48 * 16).keys()].sort((a, b) => a - b);
    expect(steps[0]).toBe(8 * 16);
    expect(steps.at(-1)).toBeLessThan(24 * 16);
    expect(steps.length % 16).toBe(0); // the same hits in each of the 16 bars
  });
  it("an 8-bar part in an 8-bar section fills it; in a 16-bar section it plays twice", () => {
    const d = fillSlot(fillSlot(doc, 2, "chords", CHORDS)!, 1, "chords", CHORDS)!;
    expect(d.regions.map((r) => [r.start, r.length])).toEqual([[25, 8], [9, 16]]);
    expect(d.sounds).toHaveLength(1); // one copy of the part, reused
  });
  it("a part longer than its section is cut at the section's end, and the doc still saves", () => {
    const short = { ...MAP, bars: 12, sections: [{ label: "intro" as const, startBar: 0, endBar: 2, startSec: 0, endSec: 0 }, { label: "drop" as const, startBar: 2, endBar: 12, startSec: 0, endSec: 0 }] };
    const d = fillSlot(rebuildDoc(short), 0, "chords", CHORDS)!;
    expect(d.regions[0]).toMatchObject({ start: 1, length: 2 });
    const steps = [...buildSoundIndex(d.regions, d.sounds!, "G", "major", 12 * 16).keys()];
    expect(Math.max(...steps)).toBeLessThan(2 * 16);
    expect(parseDoc(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });
  it("replaces what the slot held, and keeps other slots", () => {
    const a = fillSlot(fillSlot(doc, 0, "kick", KICK)!, 1, "kick", KICK)!;
    const b = fillSlot(a, 1, "chords", PAD)!; // a pad fits Chords (one family)
    const c = fillSlot(b, 1, "chords", CHORDS)!;
    expect(c.regions.filter((r) => r.lane === "chords")).toHaveLength(1);
    expect(c.sounds!.map((x) => x.name).sort()).toEqual(["909 round kick", "Am stabs"]);
    expect(c.regions.filter((r) => r.lane === "kick").map((r) => r.start)).toEqual([1, 9]);
  });
  it("refuses a part that doesn't fit the lane, vocals, or a section that doesn't exist", () => {
    expect(partFits(KICK, "bass")).toBe(false);
    expect(partFits(CHORDS, "pads")).toBe(true);
    expect(fillSlot(doc, 1, "vocals", CHORDS)).toBeNull();
    expect(fillSlot(doc, 1, "bass", KICK)).toBeNull();
    expect(fillSlot(doc, 9, "kick", KICK)).toBeNull();
  });
});

describe("emptying and leaving a slot (L277)", () => {
  const doc = rebuildDoc(MAP);
  it("empty this slot removes its block and the part copy no block uses", () => {
    const d = emptySlot(fillSlot(doc, 1, "kick", KICK)!, 1, "kick");
    expect(d.regions).toEqual([]);
    expect(d.sounds).toEqual([]);
    expect(toFill(d, 1)).toContain("kick");
  });
  it("left empty drops out of the count; Undo brings it back; filling clears it", () => {
    const left = leaveSlot(doc, 2, "chords", true);
    expect(slotState(left, 2, "chords").state).toBe("left");
    expect(toFill(left, 2)).toEqual([]);
    expect(toFill(leaveSlot(left, 2, "chords", false), 2)).toEqual(["chords"]);
    const filled = fillSlot(left, 2, "chords", CHORDS)!;
    expect(filled.rebuild!.left).toEqual([]);
    expect(parseDoc(JSON.parse(JSON.stringify(left)))).toEqual(left);
  });
});

describe("saved rebuilds", () => {
  const doc = rebuildDoc(MAP);
  it("rejects sections that don't cover the track exactly, or unknown layers", () => {
    expect(parseRebuild({ ...doc.rebuild, sections: doc.rebuild!.sections.slice(1) }, 48)).toBeNull();
    expect(parseRebuild(doc.rebuild, 47)).toBeNull();
    expect(parseRebuild({ ...doc.rebuild, sections: [{ name: "All", start: 1, bars: 48, has: ["drums"] }] }, 48)).toBeNull();
    expect(parseRebuild({ ...doc.rebuild, mapId: "https://example.com/x" }, 48)).toBeNull();
  });
  it("a block in a track that isn't a rebuild still needs whole passes (old tracks unchanged)", () => {
    const d = fillSlot(doc, 1, "kick", KICK)!;
    const { rebuild: _r, ...plain } = d;
    void _r;
    expect(parseDoc({ ...plain, regions: [{ ...d.regions[0], length: 3 }], sounds: [{ ...d.sounds![0], bars: 2, pattern: { ...(d.sounds![0] as { pattern: object }).pattern, bars: 2 } }] })).toBeNull();
  });
  it("one rebuild per song: the track id comes from the map id, UUID-shaped and stable", () => {
    const id = rebuildTrackId(MAP.id);
    expect(id).toBe(rebuildTrackId(MAP.id));
    expect(id).not.toBe(rebuildTrackId(`${MAP.id}-2`));
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

// Kept from the retired Phase 3 template's tests (L273d): old tracks still parse exactly as they were.
describe("parseDoc stays backwards compatible", () => {
  it("returns a pre-Phase-3 doc exactly as it was", () => {
    const old = JSON.parse(JSON.stringify(demoDoc()));
    expect(parseDoc(old)).toEqual(old);
    expect(Object.keys(parseDoc(old)!)).toEqual(["regions", "muted"]);
  });
  it("rejects a region past a track's own length", () => {
    const doc = { regions: [{ id: "a", loopId: "four-to-the-floor", track: 0, start: 15, length: 4 }], muted: [false, false, false, false], bars: 16 };
    expect(parseDoc(doc)).toBeNull();
  });
});

describe("compare with the original: bar ↔ ms on the map's grid (slice 4, W10)", () => {
  const grid = { bpm: 123.02, originSec: 1.407 }, bars = 101;
  const barMs = (4 * 60 / 123.02) * 1000;
  it("bar 1 is the first downbeat; a mid-song bar and the last bar sit on the map's own tempo", () => {
    expect(originalMsAt(1, grid, bars)).toBe(1407);
    expect(originalMsAt(41, grid, bars)).toBe(Math.round(1407 + 40 * barMs));
    expect(originalMsAt(101, grid, bars)).toBe(Math.round(1407 + 100 * barMs));
    expect(originalMsAt(21.5, grid, bars)).toBe(Math.round(1407 + 20.5 * barMs));
  });
  it("a bar past the end (or before bar 1) is held to the song", () => {
    expect(originalMsAt(140, grid, bars)).toBe(originalMsAt(101, grid, bars));
    expect(originalMsAt(0, grid, bars)).toBe(1407);
    expect(originalMsAt(Number.NaN, grid, bars)).toBe(1407);
  });
  it("and back: the Deck's position gives the same bar, held inside the song", () => {
    for (const b of [1, 17, 41.25, 101]) expect(rebuildBarAt(originalMsAt(b, grid, bars), grid, bars)).toBeCloseTo(b, 3);
    expect(rebuildBarAt(0, grid, bars)).toBe(1); // the intro before the first downbeat
    expect(rebuildBarAt(10_000_000, grid, bars)).toBeLessThan(102);
  });
  it("a new rebuild keeps the map's exact grid, and saved docs keep it", () => {
    const d = rebuildDoc({ ...MAP, originSec: 0.4 });
    expect(d.rebuild!.grid).toEqual({ bpm: 123.02, originSec: 0.4 });
    expect(parseDoc(JSON.parse(JSON.stringify(d)))!.rebuild!.grid).toEqual({ bpm: 123.02, originSec: 0.4 });
    expect(parseRebuild({ ...d.rebuild, grid: { bpm: 0, originSec: 0 } }, 48)).toBeNull();
  });
});
