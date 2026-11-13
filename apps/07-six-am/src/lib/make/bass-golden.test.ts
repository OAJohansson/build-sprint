// P2 guard (Phase 5): the bass renders sample for sample as before the drums slice. The hashes were
// taken from the code before any Phase 5 change (28 Oct); a saved bass sound goes through the API's
// parser, the Studio's copy and its render, and Make's own render job, and must hash the same.
import { describe, expect, it } from "vitest";
import { parseNewSound } from "./library";
import { libLoopFrom, levelled, parseLibLoop, renderLibPass } from "./lib-loop";
import { runMakeJob } from "./jobs";
import { MAKE_PRESET_IDS, MAKE_PRESETS } from "./presets";
import type { PartReading } from "./from-part";

const hash = (xs: Float32Array[]) => {
  let h = 0x811c9dc5;
  for (const x of xs) { const b = new Uint8Array(x.buffer, x.byteOffset, x.byteLength); for (let i = 0; i < b.length; i++) { h ^= b[i]; h = Math.imul(h, 0x01000193) >>> 0; } }
  return h.toString(16);
};
const NOTES = [{ step: 0, midi: 33, dur: 2, vel: 0.9 }, { step: 6, midi: 36, dur: 2, vel: 0.8 }, { step: 16, midi: 28, dur: 2, vel: 0.9 }, { step: 22, midi: 31, dur: 3, vel: 0.8 }];
// One with Sub and Weight (L209), one saved before them (no sub/weight keys: both off).
const MACROS = [(id: (typeof MAKE_PRESET_IDS)[number]) => ({ ...MAKE_PRESETS[id].macros, tone: 0.55, drive: 0.4, wobble: 0.3 }), () => ({ tone: 0.3, length: 0.5, pitchDrop: 0.2, drive: 0.1, wobble: 0, width: 0.3 })];

const GOLDEN: Record<string, string> = {"studio:round-sub:0":"a57635e5","make:round-sub:0":"e69c2a8d","studio:round-sub:1":"a78ead1e","make:round-sub:1":"861f6329","studio:rubber-pluck:0":"b5dbb05d","make:rubber-pluck:0":"8dedac5d","studio:rubber-pluck:1":"e42faebf","make:rubber-pluck:1":"bc022902","studio:reese:0":"6f04ce8e","make:reese:0":"fde256cd","studio:reese:1":"6ca5b848","make:reese:1":"646b9990","studio:acid-line:0":"a63b5bc5","make:acid-line:0":"8db23d95","studio:acid-line:1":"b7649c8c","make:acid-line:1":"fd6a39d9"};

function bassHashes(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of MAKE_PRESET_IDS) MACROS.forEach((m, j) => {
    const s = parseNewSound({ name: "x", part: "bass", preset: id, macros: m(id), pattern: { bars: 2, notes: NOTES }, key: "A", scale: "minor", bpm: 124 });
    if (!s) throw new Error("parse");
    const lib = parseLibLoop(JSON.parse(JSON.stringify(libLoopFrom({ ...s, id: "0f8fad5b-d9cb-469f-a165-70867728950e", createdAt: "", updatedAt: "" } as never, "bass", "s1"))));
    if (!lib) throw new Error("lib");
    const r = levelled(renderLibPass(lib, { key: "C", scale: "minor", bpm: 126 }, 22050));
    out[`studio:${id}:${j}`] = hash([r.left, r.right]);
    const reading = { pattern: { bars: 2, notes: s.pattern.notes, offsetMs: 7, confidence: 1 }, features: {}, loopSteps: 64 } as unknown as PartReading;
    const res = runMakeJob({ type: "render", id: 1, reading, active: [true, true, false, true], preset: id, macros: s.macros as never, bpm: 124, rate: 22050, levelDb: -18, lufs: -14, samples: Math.round(64 * (60 / 124 / 4) * 22050) }).res;
    if (res.type !== "render") throw new Error(res.type === "error" ? res.message : res.type);
    out[`make:${id}:${j}`] = hash([res.left, res.right]);
  });
  return out;
}

describe("bass renders unchanged (P2)", () => {
  it("hashes as before Phase 5", () => {
    expect(bassHashes()).toEqual(GOLDEN);
  });
});
