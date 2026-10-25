import { describe, expect, it } from "vitest";
import { demoDoc } from "@/lib/timeline";
import { parseDoc } from "@/lib/tracks";
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
    expect(doc.markers).toEqual([{ bar: 1, label: "intro" }, { bar: 17, label: "drop" }, { bar: 97, label: "outro" }]);
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
