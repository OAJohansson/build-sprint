// A track's own sounds in a saved doc and on the 16th grid (S3/S4).
import { describe, expect, it } from "vitest";
import { parseDoc } from "@/lib/tracks";
import { makeKitLoop, makeSynthLoop, type AiLoop } from "./loop";
import { buildSoundIndex } from "./schedule";

const muted = [false, false, false, false];
const acid = makeSynthLoop("acid", "rolling-acid", { cutoff: 900 }, "sndA")!;
const kit = makeKitLoop("808", "kit-four-floor", "sndK")!;
const ai: AiLoop = { id: "sndAI", source: "ai", name: "AI bass loop", bars: 4, lane: 1, aiId: "0f8fad5b-d9cb-469f-a165-70867728950e", bpm: 124, key: "A", scale: "minor", measured: { bpm: 72.5, key: "G", scale: "minor" }, checked: false, costUsd: 0.24, draws: 3 };

describe("parseDoc with sounds", () => {
  it("leaves an old doc exactly as it was", () => {
    const old = { regions: [{ id: "r1", loopId: "deep-sub", track: 1, start: 1, length: 4 }], muted };
    expect(parseDoc(old)).toEqual(old);
  });
  it("accepts regions that play the doc's own sounds, on their lane, in whole passes", () => {
    const doc = {
      regions: [{ id: "r1", loopId: "sndA", track: 1, start: 5, length: 4 }, { id: "r2", loopId: "sndK", track: 0, start: 1, length: 2 }, { id: "r3", loopId: "sndAI", track: 1, start: 9, length: 8 }],
      muted, sounds: [acid, kit, ai],
    };
    expect(parseDoc(JSON.parse(JSON.stringify(doc)))).toEqual(doc);
  });
  it("rejects a region whose sound is missing, on the wrong lane, or not a whole pass", () => {
    expect(parseDoc({ regions: [{ id: "r1", loopId: "sndA", track: 1, start: 1, length: 2 }], muted })).toBeNull();
    expect(parseDoc({ regions: [{ id: "r1", loopId: "sndA", track: 2, start: 1, length: 2 }], muted, sounds: [acid] })).toBeNull();
    expect(parseDoc({ regions: [{ id: "r1", loopId: "sndA", track: 1, start: 1, length: 3 }], muted, sounds: [acid] })).toBeNull();
    expect(parseDoc({ regions: [], muted, sounds: [{ ...ai, aiId: "nope" }] })).toBeNull();
  });
});

describe("buildSoundIndex", () => {
  it("repeats a sound over its region on the grid and cuts at the region's end", () => {
    const regions = [{ id: "r1", loopId: "sndK", track: 0, start: 2, length: 2 }, { id: "r2", loopId: "sndAI", track: 1, start: 1, length: 6 }];
    const index = buildSoundIndex(regions, [kit, ai], "A", "minor", 64 * 16);
    const kicks = [...index.entries()].filter(([, hs]) => hs.some((h) => h.kind === "kit")).map(([k]) => k).sort((a, b) => a - b);
    expect(kicks).toEqual([16, 20, 24, 28, 32, 36, 40, 44]);
    const aiHits = [...index.entries()].flatMap(([k, hs]) => hs.filter((h) => h.kind === "ai").map((h) => [k, h.kind === "ai" ? h.dur : 0]));
    expect(aiHits).toEqual([[0, 64], [64, 32]]);
  });
});
