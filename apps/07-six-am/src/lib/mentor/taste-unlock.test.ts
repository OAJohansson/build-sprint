import { afterEach, describe, expect, it, vi } from "vitest";
import { countConversations, TASTE_UNLOCK, unlockProgress, unlockState, unlockText } from "./taste-unlock";

describe("taste unlock", () => {
  afterEach(() => vi.useRealTimers());
  it("counts runs of questions split by 30 minutes of quiet", () => {
    vi.setSystemTime(new Date("2026-10-24T12:00:00Z"));
    const t = (m: number) => new Date(Date.now() + m * 60_000).toISOString();
    expect(countConversations([t(0), t(5), t(20)])).toBe(1);
    expect(countConversations([t(0), t(29), t(58)])).toBe(1);
    expect(countConversations([t(0), t(30)])).toBe(2);
    // Order doesn't matter; across midnight and month end is just time.
    expect(countConversations([t(600), t(0), t(300)])).toBe(3);
    expect(countConversations(["2026-10-31T23:50:00Z", "2026-11-01T00:10:00Z"])).toBe(1);
  });
  it("empty history: no conversations, locked", () => {
    expect(countConversations([])).toBe(0);
    const u = unlockState({ tracks: 0, genresTagged: 0, conversations: 0 });
    expect(u.unlocked).toBe(false);
    expect(unlockProgress(u)).toBe(`0/${TASTE_UNLOCK.tracks} · 0/5 · 0/3`);
  });
  it("unlocks only when all three are met; progress caps at the target", () => {
    expect(unlockState({ tracks: 20, genresTagged: 5, conversations: 2 }).unlocked).toBe(false);
    const u = unlockState({ tracks: 31, genresTagged: 5, conversations: 3 });
    expect(u.unlocked).toBe(true);
    expect(unlockProgress(u)).toBe("20/20 · 5/5 · 3/3");
    expect(unlockText(u)).toBe("Your music taste profile unlocks at 20 tracks, 5 with your genre and 3 Mentor chats.");
  });
});
