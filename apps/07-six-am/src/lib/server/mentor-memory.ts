import "server-only";
import { cleanGenre } from "@/lib/ears/my-genre";
import type { EarsAnalysis } from "@/lib/ears/results";
import { answerText, type MentorAnswer } from "@/lib/mentor/answer";
import {
  EVENTS_FOR_REFRESH, libraryCount, libraryOrder, libraryText, MAIN_THREAD, MEMORY_KEEP, MEMORY_THREAD, memoryDue, parseMemory, type MemoryState,
} from "@/lib/mentor/memory";
import { missingLines, ownerLines } from "@/lib/mentor/owner-lines";
import { countConversations, unlockState, type UnlockState } from "@/lib/mentor/taste-unlock";
import { askMemory, MentorError } from "./claude";
import type { MentorStore, MessageRow } from "./mentor-store";

// Persistent memory (L88) and the taste profile refresh (L92). The memory is the newest row of the
// reserved thread "memory" in sixam_mentor_messages (JSON in `content`, its cost in cost_usd), so
// no schema change is needed. Every MEMORY_EVERY exchanges in the chat, one cheap call rewrites
// the summary and moves the anchor, keeping the newest MEMORY_KEEP exchanges verbatim. Once the
// profile is unlocked, the same call rewrites it as 3–6 short pattern lines.

export async function loadMemory(store: MentorStore): Promise<MemoryState> {
  const [row] = await store.thread(MEMORY_THREAD, 1);
  return parseMemory(row?.content);
}

export async function saveMemory(store: MentorStore, state: MemoryState, costUsd = 0, usage: MessageRow["usage"] = null): Promise<void> {
  await store.addMessage({ threadId: MEMORY_THREAD, role: "assistant", job: "memory", content: JSON.stringify(state), sources: null, usage, costUsd, counted: false });
}

/** L94: tracks (analysed + setup), tracks with My genre, conversations (30-minute gaps). */
export async function unlockFor(store: MentorStore, library?: EarsAnalysis[], memory?: MemoryState): Promise<UnlockState> {
  const [lib, mem, rows] = await Promise.all([library ?? store.listAnalyses(), memory ?? loadMemory(store), store.costRows(new Date(0))]);
  return unlockState({
    tracks: libraryCount(lib, mem.setupTracks),
    genresTagged: lib.filter((a) => cleanGenre(a.myGenre)).length,
    conversations: countConversations(rows.filter((r) => r.role === "user" && r.counted).map((r) => r.createdAt)),
  });
}

/** The chat messages still sent verbatim (since the anchor), oldest first. */
export async function verbatim(store: MentorStore, mem: MemoryState): Promise<MessageRow[]> {
  const rows = await store.thread(MAIN_THREAD, 60);
  return mem.anchor ? rows.filter((r) => r.createdAt >= mem.anchor!) : rows;
}

const exchanges = (rows: MessageRow[]) => rows.filter((r) => r.role === "user").length;

export function refreshDue(mem: MemoryState, rows: MessageRow[], unlock: UnlockState): boolean {
  if (memoryDue(exchanges(rows))) return true;
  return unlock.unlocked && (!mem.profileAt || mem.events.length >= EVENTS_FOR_REFRESH);
}

const turnText = (r: MessageRow) => {
  if (r.role === "user") return `Person: ${r.content}`;
  try {
    return `Mentor: ${answerText(JSON.parse(r.content) as MentorAnswer)}`;
  } catch {
    return `Mentor: ${r.content}`;
  }
};

const SYSTEM = `You keep the memory of the Mentor inside Six AM, an app where one person sorts their SoundCloud library by feel and makes tracks in a small loop studio. You never hear audio: you only read text and numbers.
Always finish by calling the remember tool exactly once.
The memory summary: plain short lines, at most about 200 words, written about "the person". Keep what matters for later conversations: what was discussed (tracks by artist and title, genres, Studio ideas), preferences they stated or showed, decisions (genres they accepted), and open threads or questions to pick up. Merge the new turns into the old summary; drop small talk and anything already outdated. Never invent anything.`;

const PROFILE_RULES = `Also return profile: the person's music taste profile as 3–6 short lines (one per line, no bullets, under 12 words each), a pattern summary of what they seem to listen to: styles, tempo range, vocals, mood or energy, anything else that clearly stands out. Write to the person as "you" ("Mostly warm, rolling house around 122–126 BPM"). Base it only on the library, their own genre tags, accepted suggestions, the events and the conversations. Tentative where the evidence is thin ("so far", "seems"). No source labels, no scores.`;

let running = false;

/** Rewrite the memory (and the profile when unlocked) if it's due. Safe to call after every answer;
 *  a failure leaves the old memory in place. */
export async function refreshMemory(store: MentorStore, now: Date, opts: { force?: boolean } = {}): Promise<{ ran: boolean; costUsd: number }> {
  // shortcut: an in-process flag stops two refreshes at once on one server; two serverless
  // instances could still both run one (harmless: the newest row wins).
  if (running) return { ran: false, costUsd: 0 };
  running = true;
  try {
    const [mem, library, profile] = await Promise.all([loadMemory(store), store.listAnalyses(), store.getProfile()]);
    const rows = await verbatim(store, mem);
    const unlock = await unlockFor(store, library, mem);
    if (!opts.force && !refreshDue(mem, rows, unlock)) return { ran: false, costUsd: 0 };

    const fold = memoryDue(exchanges(rows));
    const keepLines = ownerLines(profile.text, profile.history).filter((l) => l.length <= 140).slice(0, 3);
    const parts = [
      `Current memory summary:\n${mem.summary || "(empty)"}`,
      fold ? `New conversation turns to fold in:\n${rows.map(turnText).join("\n").slice(0, 16000)}` : "No new turns to fold in: return the summary unchanged.",
    ];
    if (mem.events.length) parts.push(`What the person did in Six AM since last time:\n${mem.events.map((e) => `- ${e.type}: ${e.detail}`).join("\n")}`);
    if (unlock.unlocked) {
      parts.push(libraryText(libraryOrder(library)));
      if (mem.setupTracks.length) parts.push(`Tracks from their playlists (read in setup, not analysed): ${mem.setupTracks.slice(-120).map((t) => `${t.uploader} – ${t.title}`).join("; ")}`);
      parts.push(`Current taste profile:\n${profile.text || "(empty)"}`);
      if (keepLines.length) parts.push(`Lines the person wrote themselves (keep each word for word as one of the lines):\n${keepLines.map((l) => `- ${l}`).join("\n")}`);
      parts.push(PROFILE_RULES);
    }

    let result;
    try {
      result = await askMemory(SYSTEM, parts.join("\n\n"));
    } catch (error) {
      console.error(`[mentor] memory refresh failed: ${error instanceof MentorError ? error.kind : String(error)}`);
      return { ran: false, costUsd: 0 };
    }
    const next: MemoryState = { ...mem };
    if (result.reply) {
      next.summary = result.reply.summary;
      next.events = [];
      if (fold) {
        // Keep the newest MEMORY_KEEP exchanges verbatim: the anchor is the MEMORY_KEEP-th last question.
        const users = rows.filter((r) => r.role === "user");
        next.anchor = users.at(-MEMORY_KEEP)?.createdAt ?? next.anchor;
      }
      const p = result.reply.profile;
      const lines = p?.text.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];
      if (unlock.unlocked && p && lines.length >= 2 && lines.length <= 8 && !missingLines(p.text, keepLines).length) {
        await store.saveProfile(lines.join("\n"), { at: now.toISOString(), note: p.note, by: "mentor", from: "your library and chats" });
        next.profileAt = now.toISOString();
      }
    }
    // The row is written even when the answer was unusable, so its cost still counts in Today / Month.
    await saveMemory(store, next, result.costUsd, result.usage);
    return { ran: true, costUsd: result.costUsd };
  } finally {
    running = false;
  }
}

