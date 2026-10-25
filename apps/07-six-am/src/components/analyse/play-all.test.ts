import { describe, expect, it } from "vitest";
import { nextIndex, playList, skippedText } from "./play-all";

const row = (key: string, extra: Record<string, unknown> = {}) => ({ key, url: `https://soundcloud.com/a/${key}`, title: key, state: "done" as const, ...extra });

describe("play all", () => {
  it("keeps playable rows in order and counts the skipped ones", () => {
    const l = playList([row("a"), row("b", { preview: true }), row("c", { state: "blocked" }), row("d", { result: { preview: true } }), row("e")] as never);
    expect(l.keys).toEqual(["a", "e"]);
    expect(l.skipped).toEqual({ "preview only": 2, "not available": 1 });
    expect(skippedText(l.skipped)).toBe("Skipped 3: 2 preview only, 1 not available");
  });
  it("says one reason plainly, and nothing when none was skipped", () => {
    expect(skippedText({ "preview only": 2, "not available": 0 })).toBe("Skipped 2: preview only");
    expect(skippedText({ "preview only": 0, "not available": 0 })).toBe("");
  });
  it("goes to the next track and stops after the last", () => {
    const l = playList([row("a"), row("b")] as never);
    expect(nextIndex(l, 0)).toBe(1);
    expect(nextIndex(l, 1)).toBeNull();
    expect(nextIndex(playList([]), -1)).toBeNull();
  });
});
