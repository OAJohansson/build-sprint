import "server-only";
import type { EarsAnalysis } from "@/lib/ears/results";
import { cleanGenre, usedGenres } from "@/lib/ears/my-genre";
import { answerText, isJob, type Job, type MentorAnswer } from "@/lib/mentor/answer";
import { parseAnalysis } from "@/lib/mentor/context";
import type { StoredUsage } from "@/lib/mentor/cost";
import { monthRange, summarise, type UsageSummary } from "@/lib/mentor/periods";
import { setupInput, type PlaylistLike } from "@/lib/mentor/playlist";
import { JOBS_SPEC, THREAD_JOBS, type HistoryTurn, type LearnEvent, type MentorInput } from "@/lib/mentor/prompt";
import { CRATE_IDS, studioStart, type StudioStart } from "@/lib/mentor/studio";
import { sharedTraits } from "@/lib/mentor/group-traits";
import { ownerLines, recentEditLines, sentencesOf } from "@/lib/mentor/owner-lines";
import { askClaude, MentorError, UPDATES_PROFILE } from "./claude";
import type { Group, MentorStore, MessageRow } from "./mentor-store";

// One Mentor request end to end: load what the job needs from the store (the server builds the
// prompt; the browser sends ids and the person's words), ask Claude, save the turn with its cost,
// apply profile and group changes, and return the answer with Today / Month and the 50/day flag.

export const MIN_TAGGED_FOR_GROUPS = 4;
const EVENT_TYPES: LearnEvent["type"][] = ["typed_genre", "corrected_suggestion", "more_like_this", "not_for_me", "asked_about", "setup_answer", "note"];

export type AskBody = {
  job?: unknown;
  trackId?: unknown;
  /** Fallback when the result isn't synced yet: the Ears record itself (whitelisted). */
  analysis?: unknown;
  message?: unknown;
  events?: unknown;
  playlists?: unknown;
  taste?: unknown;
  tz?: unknown;
  /** "setup": learn events from the setup dialog, so Settings says "From setup" (F11). */
  source?: unknown;
};

export type AskReply = {
  threadId: string;
  job: Job;
  /** costUsd is an estimate; tokens is the API's usage summed over the answer's calls. */
  message: { id: string; createdAt: string; costUsd: number; tokens: StoredUsage };
  answer: MentorAnswer;
  studio?: StudioStart;
  groups?: Group[];
  profileUpdated?: { note: string };
  dropped: string[];
  latencyMs: number;
  usage: UsageSummary;
};

type Fail = { error: string; status: number; extra?: Record<string, unknown> };
const fail = (error: string, status = 400, extra?: Record<string, unknown>): Fail => ({ error, status, extra });

export const threadFor = (job: Job, trackId: string | null) =>
  job === "learn" ? "learn" : job === "setup" ? "setup" : job === "propose_groups" ? "groups" : job === "taste_session" ? "taste" : trackId ?? "general";

const text = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function usageSummary(store: MentorStore, now: Date, tz: number): Promise<UsageSummary> {
  const rows = await store.costRows(monthRange(now, tz).start);
  return summarise(rows, now, tz);
}

async function loadTrack(store: MentorStore, id: string, fallback: unknown): Promise<EarsAnalysis | null> {
  const stored = await store.getAnalysis(id);
  if (stored) return stored;
  const parsed = parseAnalysis(fallback);
  return parsed && parsed.id === id ? parsed : null;
}

function historyOf(rows: MessageRow[]): HistoryTurn[] {
  return rows.map((r) => {
    if (r.role === "user") return { role: "user" as const, content: r.content };
    try {
      return { role: "assistant" as const, content: answerText(JSON.parse(r.content) as MentorAnswer) };
    } catch {
      return { role: "assistant" as const, content: r.content };
    }
  });
}

/** What the person asked, as stored in the thread. */
function askedText(job: Job, message: string, track: EarsAnalysis | null): string {
  const label: Record<Job, string> = {
    explain: "Explain", suggest_genre: "Suggest genre", teach: "Teach me a genre", ear_training: "Ear training",
    studio_start: "Studio start", listen_next: "Listen next", chat: "", setup: "Set up my taste",
    learn: "Learn from use", propose_groups: "Propose genre groups", taste_session: "Taste session",
  };
  // "Explain · Work (Edit)": the track named once (critic, round 2).
  const base = job === "chat" ? message : message ? `${label[job]}: ${message}` : label[job];
  return track && job !== "chat" ? `${base} · ${track.title || track.id}` : base;
}

export async function ask(store: MentorStore, body: AskBody, now: Date, tz: number): Promise<AskReply | Fail> {
  if (!isJob(body.job)) return fail("Unknown Mentor job.");
  const job = body.job;
  const spec = JOBS_SPEC[job];
  const trackId = text(body.trackId, 600) || null;
  const message = text(body.message);
  if (job === "chat" && !message) return fail("Type a question first.");

  const track = trackId ? await loadTrack(store, trackId, body.analysis) : null;
  if (trackId && !track) return fail("That track isn't in the library yet. Analyse it first.", 404);
  if (spec.needsTrack && !track) return fail("Pick a track first.");

  const profile = await store.getProfile();
  const input: MentorInput = { job, profile: profile.text, track, message };
  // F6: the lines the latest hand edit added (within a week; a restore or paste doesn't count).
  input.recentEdit = recentEditLines(profile.history, now);
  // The person's own lines, which every profile update must keep (setup merges, learning adjusts).
  // Setup only adds (L56, L81): every existing sentence stays. Learning keeps the person's own lines.
  const keepLines = job === "setup" ? sentencesOf(profile.text) : ownerLines(profile.text, profile.history);
  if (UPDATES_PROFILE.has(job) && keepLines.length) input.keepLines = keepLines;

  if (job === "suggest_genre" || job === "propose_groups" || job === "teach" || job === "chat") {
    const [library, groups] = await Promise.all([store.listAnalyses(), store.listGroups()]);
    input.myGenres = usedGenres(library);
    // A group's reason is derived live from its current tracks, so a split or a re-tag never leaves
    // an outdated reason for the Mentor to repeat as fact.
    const live = (g: Group) => sharedTraits(library.filter((a) => g.trackIds.includes(a.id))) || g.reason;
    input.groups = groups.filter((g) => g.status === "accepted").map((g) => ({ name: g.name, reason: `${live(g)} (${g.trackIds.length} track${g.trackIds.length === 1 ? "" : "s"})` }));
    if (job === "propose_groups") {
      const tagged = library.filter((a) => cleanGenre(a.myGenre));
      if (tagged.length < MIN_TAGGED_FOR_GROUPS) {
        return fail(`Tag at least ${MIN_TAGGED_FOR_GROUPS} tracks with My genre first.`, 400, { needed: MIN_TAGGED_FOR_GROUPS, have: tagged.length });
      }
      // shortcut: the newest 150 tagged tracks; page or summarise per genre past that.
      input.library = tagged.slice(0, 150);
      input.groups = groups.filter((g) => g.status !== "dismissed").map((g) => ({ name: g.name, reason: live(g) }));
    }
  }
  if (THREAD_JOBS.has(job)) input.history = historyOf(await store.thread(threadFor(job, trackId), 16));
  if (job === "setup") {
    const lists = (Array.isArray(body.playlists) ? body.playlists : []).filter(
      (p): p is PlaylistLike => !!p && typeof p === "object" && Array.isArray((p as PlaylistLike).sounds),
    ).slice(0, 10);
    const si = setupInput(lists);
    if (!si.tracks) return fail("None of those playlists had tracks Six AM could read.");
    input.playlists = si.text;
  }
  if (job === "learn") {
    const events = (Array.isArray(body.events) ? body.events : [])
      .map((e) => (e && typeof e === "object" ? (e as Record<string, unknown>) : {}))
      .filter((e) => EVENT_TYPES.includes(e.type as LearnEvent["type"]) && text(e.detail, 500))
      .map((e) => ({ type: e.type as LearnEvent["type"], detail: text(e.detail, 500), ...(text(e.trackId, 600) ? { trackId: text(e.trackId, 600) } : {}) }))
      .slice(0, 30);
    if (!events.length) return fail("Nothing to learn from.");
    input.events = events;
  }
  if (job === "taste_session") {
    const t = (body.taste ?? {}) as Record<string, unknown>;
    const [a, b] = await Promise.all([store.getAnalysis(text(t.a, 600)), store.getAnalysis(text(t.b, 600))]);
    const preferred = t.preferred === "a" || t.preferred === "b" ? t.preferred : null;
    const why = text(t.why);
    if (!a || !b || a.id === b.id) return fail("A taste session needs two different analysed tracks.");
    if (!preferred || !why) return fail("Say which one you prefer and why.");
    input.taste = { a, b, preferred, why };
  }

  const threadId = threadFor(job, trackId);
  let result;
  try {
    result = await askClaude(input, {
      loopIds: job === "studio_start" ? CRATE_IDS : undefined,
      keepLines: input.keepLines,
      trackIds: job === "propose_groups" ? new Set((input.library ?? []).map((a) => a.id)) : undefined,
    });
  } catch (error) {
    // Keep the cost of a failed answer, so Today / Month stay honest.
    if (error instanceof MentorError && error.costUsd > 0) {
      await store.addMessage({ threadId, role: "assistant", job, content: JSON.stringify({ error: error.kind }), sources: null, usage: error.usage, costUsd: error.costUsd, counted: false });
    }
    throw error;
  }

  await store.addMessage({ threadId, role: "user", job, content: askedText(job, message, track), sources: null, usage: null, costUsd: 0, counted: spec.counted });
  const saved = await store.addMessage({
    threadId, role: "assistant", job, content: JSON.stringify(result.answer), sources: result.answer.sentences,
    usage: result.usage, costUsd: result.costUsd, counted: false,
  });

  const reply: AskReply = {
    threadId, job, answer: result.answer, dropped: result.dropped, latencyMs: result.latencyMs,
    message: { id: saved.id, createdAt: saved.createdAt, costUsd: result.costUsd, tokens: result.usage },
    usage: await usageSummary(store, now, tz),
  };
  // At most one "Updated: …" per answer (L56). Setup's draft is only returned: the dialog saves it
  // on Save (F11), so leaving setup halfway changes nothing.
  if (result.answer.profileUpdate && UPDATES_PROFILE.has(job) && job !== "setup") {
    const from = job === "learn" && body.source === "setup" ? "setup" : FROM[job];
    await store.saveProfile(result.answer.profileUpdate.text, { at: now.toISOString(), note: result.answer.profileUpdate.note, by: "mentor", from });
    reply.profileUpdated = { note: result.answer.profileUpdate.note };
  }
  if (job === "studio_start" && track) reply.studio = studioStart(track, result.answer.loops ?? []);
  if (job === "propose_groups") {
    reply.groups = await store.addGroups((result.answer.groups ?? []).map((g) => ({ ...g, status: "proposed" as const })));
  }
  return reply;
}

/** "From …" in Settings' recent updates. */
const FROM: Partial<Record<Job, string>> = { setup: "setup", learn: "what you did in Six AM", taste_session: "a taste session", chat: "a chat with the Mentor" };

export const isFail = (r: AskReply | Fail): r is Fail => "error" in r;

/** HTTP status and a plain message for a MentorError (details go to the server log). */
export function mentorErrorResponse(error: MentorError): Response {
  console.error(`[mentor] ${error.kind}: ${error.message}`);
  const map: Record<MentorError["kind"], [number, string]> = {
    not_configured: [503, "The Mentor isn't set up on the server yet."],
    refused: [422, "The Mentor couldn't answer that one. Try asking another way."],
    invalid: [502, "The Mentor's answer didn't come out right. Try again."],
    busy: [429, "The Mentor is busy. Try again in a minute."],
    timeout: [504, "The Mentor took too long. Try again."],
    api: [502, "The Mentor couldn't be reached. Try again."],
  };
  const [status, msg] = map[error.kind];
  // In development the validator's reason comes along, to debug prompts (never in production).
  const detail = process.env.NODE_ENV === "development" ? { detail: error.message } : {};
  return Response.json({ error: msg, kind: error.kind, costUsd: error.costUsd, ...detail }, { status });
}
