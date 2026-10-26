import { describe, expect, it } from "vitest";
import { demoDoc } from "@/lib/timeline";
import { parseDoc } from "@/lib/tracks";
import { patternById, renderPattern } from "@/lib/synths/patterns";
import { inScale, pitchClass } from "@/lib/synths/theory";
import type { SynthLoop } from "@/lib/synths/loop";
import { mapToTemplate, templateDraft } from "./template";
import type { TrackMap } from "./types";

const map = {
  bpm: 125.97, key: "G", scale: "minor", bars: 108,
  sections: [
    { label: "intro", startBar: 0, endBar: 16, startSec: 0.4, endSec: 30.9 },
    { label: "drop", startBar: 16, endBar: 48, startSec: 30.9, endSec: 91.9 },
    { label: "outro", startBar: 96, endBar: 108, startSec: 183, endSec: 206 },
  ],
} as Pick<TrackMap, "bpm" | "key" | "scale" | "bars" | "sections">;

describe("mapToTemplate", () => {
  it("copies tempo and key, takes the length in whole bars, puts markers on the section bars", () => {
    const doc = mapToTemplate(map);
    expect(doc.bpm).toBe(126);
    expect(doc.key).toEqual({ key: "G", scale: "minor" });
    expect(doc.bars).toBe(108);
    expect(doc.markers).toEqual([{ bar: 1, label: "Intro" }, { bar: 17, label: "Drop" }, { bar: 97, label: "Outro" }]);
    expect(doc.regions).toEqual([]);
    expect(doc.muted).toEqual([false, false, false, false]);
  });
  it("rounds a fractional length and keeps the tempo within 0.1", () => {
    const doc = mapToTemplate({ ...map, bars: 99.6, bpm: 122.04 });
    expect(doc.bars).toBe(100);
    expect(Math.abs(doc.bpm! - 122.04)).toBeLessThanOrEqual(0.1);
  });
  it("leaves the key out when the map has none", () => {
    expect(mapToTemplate({ ...map, key: "", scale: "" }).key).toBeUndefined();
  });
  it("is a doc the Studio and the server accept, and a draft named after the track", () => {
    const doc = mapToTemplate(map);
    expect(parseDoc(doc)).toEqual(doc);
    const id = "https://soundcloud.com/koltercologne/symphony-no-5";
    const d = templateDraft({ ...(map as TrackMap), id, title: "Symphony No. 5" }, new Date("2026-10-25T21:00:00Z"));
    expect(d).toMatchObject({ name: "Symphony No. 5 · template", bpm: 126, at: "2026-10-25T21:00:00.000Z", analysisId: id });
    expect(d.doc.analysisId).toBe(id);
    expect(parseDoc(d.doc)).toEqual(d.doc);
  });
});

describe("mapToTemplate fills the lanes (L139)", () => {
  // 32 bars: kick + hats 1–16, hats only 17–24 (a break), kick only 25–32; bass 9–32; chords 17–24
  // Blocks are snapped inward to whole passes of their sound, starting from bar 1.
  const n = 32;
  const arr = (...spans: [number, number][]) => Array.from({ length: n }, (_, i) => (spans.some(([a, b]) => i + 1 >= a && i + 1 < b) ? 0.9 : 0));
  const layers = { kind: "estimate" as const, method: "test", kick: arr([1, 17], [25, 33]), hats: arr([1, 25]), bass: arr([9, 33]), chords: arr([17, 25]), vocals: arr([1, 33]) };
  const doc = mapToTemplate({ ...map, bars: n, sections: [], layers });
  const lane = (t: number) => doc.regions.filter((r) => r.track === t).map((r) => [doc.sounds!.find((x) => x.id === r.loopId)!.name, r.start, r.length]);

  it("puts drums where the kick and hats play, a Sub bass and Rhodes chords on their bars", () => {
    expect(lane(0)).toEqual([["909 · House Groove", 1, 16], ["909 · Offbeat Open Hat", 17, 8], ["909 · Four to the Floor", 25, 8]]);
    expect(lane(1)).toEqual([["Sub · Offbeat Bass", 9, 24]]);
    expect(lane(2)).toEqual([["Rhodes · Rhodes Swing", 17, 8]]);
    expect(lane(3)).toEqual([]); // vocals have no lane
  });
  it("plays every bass and chord note in the track's key", () => {
    const tonic = pitchClass("G")!;
    for (const s of doc.sounds!.filter((x): x is SynthLoop => x.source === "synth")) {
      const notes = renderPattern(patternById(s.pattern)!, "G", "minor")!;
      expect(notes.length).toBeGreaterThan(0);
      for (const x of notes) expect(inScale(x.midi, tonic, "minor")).toBe(true);
    }
  });
  it("is a doc the Studio accepts, with whole passes only", () => {
    expect(parseDoc(JSON.parse(JSON.stringify(doc)))).toEqual(doc);
  });
  it("keeps the drum skeleton whole: maybe bars inside a kick run filled, 4-bar phrases, no slivers (N3)", () => {
    const kick = arr([1, 11], [14, 31]).map((v, i) => (i + 1 >= 11 && i + 1 < 14 ? 0.45 : v)); // bars 11–13 only "maybe"
    const d = mapToTemplate({ ...map, bars: n, sections: [], layers: { ...layers, kick, hats: arr() } });
    const drums = d.regions.filter((r) => r.track === 0);
    expect(drums.map((r) => [r.start, r.length])).toEqual([[1, 32]]); // the run ends at bar 30, rounded to the phrase line at 33
    for (const r of drums) { expect((r.start - 1) % 4).toBe(0); expect(r.length % 4).toBe(0); }
  });
  it("plays no kick in a breakdown: hats only where hats play there, nothing where they don't", () => {
    // Kick and hats all through 32 bars, but the map calls bars 9–24 a breakdown with hats only at 9–16.
    const d = mapToTemplate({
      ...map, bars: n,
      sections: [{ label: "drop", startBar: 0, endBar: 8, startSec: 0, endSec: 0 }, { label: "breakdown", startBar: 8, endBar: 24, startSec: 0, endSec: 0 }, { label: "drop", startBar: 24, endBar: 32, startSec: 0, endSec: 0 }],
      layers: { ...layers, kick: arr([1, 33]), hats: arr([1, 17], [25, 33]) },
    });
    const drums = d.regions.filter((r) => r.track === 0).map((r) => [d.sounds!.find((x) => x.id === r.loopId)!.name, r.start, r.length]);
    expect(drums).toEqual([["909 · House Groove", 1, 8], ["909 · Offbeat Open Hat", 9, 8], ["909 · House Groove", 25, 8]]);
  });
  it("lays only drums when the map has no key", () => {
    const d = mapToTemplate({ ...map, key: "", scale: "", bars: n, sections: [], layers });
    expect(d.regions.every((r) => r.track === 0)).toBe(true);
  });
});

describe("parseDoc stays backwards compatible", () => {
  it("returns a pre-Phase-3 doc exactly as it was", () => {
    const old = JSON.parse(JSON.stringify(demoDoc()));
    expect(parseDoc(old)).toEqual(old);
    expect(Object.keys(parseDoc(old)!)).toEqual(["regions", "muted"]);
  });
  it("rejects a region past a template's own length", () => {
    const doc = { ...mapToTemplate({ ...map, bars: 16 }), regions: [{ id: "a", loopId: "four-to-the-floor", track: 0, start: 15, length: 4 }] };
    expect(parseDoc(doc)).toBeNull();
  });
});
