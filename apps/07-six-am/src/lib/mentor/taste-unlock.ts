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
/** "15/20 tracks · 5/5 with your genre · 3/3 chats" (user test F9: labelled). */
export const unlockProgress = (u: UnlockState) => {
  const n = (h: number, need: number) => `${Math.min(h, need)}/${need}`;
  return `${n(u.have.tracks, u.need.tracks)} tracks · ${n(u.have.genresTagged, u.need.genresTagged)} with your genre · ${n(u.have.conversations, u.need.conversations)} chats`;
};
