import { describe, expect, it } from "vitest";
import { firstFreeBar } from "@/lib/timeline";
import { aiCostLine, triesReason } from "./ai-text";

describe("aiCostLine", () => {
  it("matches the Mentor's form, tries only when more than one", () => {
    expect(aiCostLine(0.16, 2, 0.4, 0.4, "October")).toBe("$0.16 · 2 tries · today $0.40 · October $0.40 (estimate)");
    expect(aiCostLine(0.08, 1, null, null, "October")).toBe("$0.08 (estimate)");
  });
});

describe("triesReason", () => {
  it("says why each missed try was redone", () => {
    expect(triesReason([{ bpm: 131.2, key: "A", scale: "minor", onTempo: false, inKey: true }, { bpm: 124, key: "C", scale: "minor", onTempo: true, inKey: false }, { onTempo: true, inKey: true }]))
      .toBe("Try 1 was off tempo (131.2 BPM), try 2 off key (C minor).");
    expect(triesReason([{ error: true }, { onTempo: true, inKey: true }])).toBe("Try 1 failed.");
  });
  it("is null for a single try", () => {
    expect(triesReason([{ onTempo: true, inKey: true }])).toBeNull();
  });
});

describe("firstFreeBar", () => {
  const r = (start: number, length: number, track = 1) => ({ id: `r${start}`, loopId: "x", track, start, length });
  it("finds the first empty span at or after the playhead, never overlapping", () => {
    expect(firstFreeBar([r(1, 8), r(13, 4)], 1, 4, 3, 64)).toBe(9);
    expect(firstFreeBar([r(1, 8), r(9, 4)], 1, 4, 3, 64)).toBe(13);
  });
  it("wraps to the start when the end is full, ignores other lanes, and says null when full", () => {
    expect(firstFreeBar([r(9, 56)], 1, 4, 20, 64)).toBe(1);
    expect(firstFreeBar([r(1, 64, 2)], 1, 4, 1, 64)).toBe(1);
    expect(firstFreeBar([r(1, 62)], 1, 4, 1, 64)).toBeNull();
  });
});
