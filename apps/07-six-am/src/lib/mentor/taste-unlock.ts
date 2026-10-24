// When the music taste profile unlocks (L92, owner's numbers L94): enough tracks, enough of them
// with the person's own genre, and enough Mentor conversations. One constant, one pure check.

/** L94. tracks = analysed tracks plus tracks read from playlists in setup (counted once each).
 *  conversationGapMinutes (T-decision): with one chat stream, a new conversation starts after this
 *  much quiet since the previous question. */
export const TASTE_UNLOCK = { tracks: 20, genresTagged: 5, conversations: 3, conversationGapMinutes: 30 } as const;

export type UnlockCounts = { tracks: number; genresTagged: number; conversations: number };
export type UnlockState = { unlocked: boolean; have: UnlockCounts; need: UnlockCounts };

/** Conversations in a list of question times: runs separated by at least `gapMinutes` of quiet. */
export function countConversations(times: readonly (string | Date)[], gapMinutes: number = TASTE_UNLOCK.conversationGapMinutes): number {
  const ms = times.map((t) => (typeof t === "string" ? Date.parse(t) : t.getTime())).filter(Number.isFinite).sort((a, b) => a - b);
  let n = 0;
  for (let i = 0; i < ms.length; i++) if (i === 0 || ms[i] - ms[i - 1] >= gapMinutes * 60_000) n += 1;
  return n;
}

export function unlockState(have: UnlockCounts): UnlockState {
  const need = { tracks: TASTE_UNLOCK.tracks, genresTagged: TASTE_UNLOCK.genresTagged, conversations: TASTE_UNLOCK.conversations };
  return { unlocked: have.tracks >= need.tracks && have.genresTagged >= need.genresTagged && have.conversations >= need.conversations, have, need };
}

/** The prompt and progress lines shown while locked (owner's copy, L94). */
export const unlockText = (u: UnlockState) =>
  `Your music taste profile unlocks at ${u.need.tracks} tracks, ${u.need.genresTagged} with your genre and ${u.need.conversations} Mentor chats.`;
export const unlockProgress = (u: UnlockState) =>
  [["tracks", u.have.tracks, u.need.tracks], ["genresTagged", u.have.genresTagged, u.need.genresTagged], ["conversations", u.have.conversations, u.need.conversations]]
    .map(([, h, n]) => `${Math.min(h as number, n as number)}/${n}`).join(" · ");
