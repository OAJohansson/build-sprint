import { describe, expect, it } from "vitest";
import { missingLines, ownerLines, recentEditLines } from "./owner-lines";

// recentEditLines is date logic (decision 0011): a normal case and the edges.
describe("owner lines", () => {
  const history = [
    { at: "2026-10-20T10:00:00Z", by: "mentor" as const, now: "You like warm house." },
    { at: "2026-10-23T10:00:00Z", by: "owner" as const, was: "You like warm house.", now: "I love piano house. No big festival drops." },
  ];
  it("finds the person's own sentences still in the profile, and what a draft dropped", () => {
    const profile = "You like warm house. I love piano house. No big festival drops.";
    expect(ownerLines(profile, history)).toEqual(["I love piano house.", "No big festival drops."]);
    expect(missingLines("You like warm house. I love piano house.", ownerLines(profile, history))).toEqual(["No big festival drops."]);
    expect(ownerLines(profile, [])).toEqual([]);
  });
  it("passes a recent short edit, not an old one, a restore or an empty history", () => {
    expect(recentEditLines(history, new Date("2026-10-24T00:00:00Z"))).toBe("I love piano house. No big festival drops.");
    expect(recentEditLines(history, new Date("2026-11-01T00:00:00Z"))).toBeUndefined();
    const restore = [{ at: "2026-10-23T10:00:00Z", by: "owner" as const, was: "", now: "A. B. C. D." }];
    expect(recentEditLines(restore, new Date("2026-10-24T00:00:00Z"))).toBeUndefined();
    expect(recentEditLines([], new Date("2026-10-24T00:00:00Z"))).toBeUndefined();
  });
});
