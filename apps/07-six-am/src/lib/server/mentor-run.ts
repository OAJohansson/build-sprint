import "server-only";
import type { EarsAnalysis } from "@/lib/ears/results";
import { cleanGenre, usedGenres } from "@/lib/ears/my-genre";
import { answerText, isJob, type Job, type MentorAnswer } from "@/lib/mentor/answer";
import { parseAnalysis } from "@/lib/mentor/context";
import type { StoredUsage } from "@/lib/mentor/cost";
import { monthRange, summarise, type UsageSummary } from "@/lib/mentor/periods";
import { setupInput, type PlaylistLike } from "@/lib/mentor/playlist";
import { JOBS_SPEC, type HistoryTurn, type LearnEvent, type MentorInput } from "@/lib/mentor/prompt";
import { CRATE_IDS, keyNote, studioStart, type StudioStart } from "@/lib/mentor/studio";
import { clock, libraryOrder, libraryText, MAIN_THREAD, mergeSetupTracks, refOf, studioText } from "@/lib/mentor/memory";
import { DEFAULT_BPM } from "@/lib/tempo";
import { bpmChoice } from "@/lib/ears/bpm-choice";
import { getStore } from "./store";
import { loadMemory, refreshMemory, saveMemory, unlockFor, verbatim } from "./mentor-memory";
import { sharedTraits } from "@/lib/mentor/group-traits";
import { ownerLines, recentEditLines, sentencesOf } from "@/lib/mentor/owner-lines";
import { askClaude, MentorError, UPDATES_PROFILE } from "./claude";
import { mapContext } from "@/lib/map/context";
import { factsLine, keyFlats, labContextText, unheardBars, unheardLoop, labThread, notesFromThread, parseLabAsk, PART_LABEL, type LabMeta, type ThreadItem } from "@/lib/mentor/lab";
import type { Group, MentorStore, MessageRow } from "./mentor-store";

// One Mentor request end to end: load what the job needs from the store (the server builds the
// prompt; the browser sends ids and the person's words), ask Claude, save the turn with its cost,
// apply group changes, and return the answer with Today / Month and the 50/day flag. A chat
// question gets the full context (L88): library, Studio tracks, genre words, the taste profile
// (once unlocked, L92), the memory summary and the turns since it. Afterwards `afterAnswer`
// rewrites the memory when it's due (run after the response is sent).

export const MIN_TAGGED_FOR_GROUPS = 4;
const EVENT_TYPES: LearnEvent["type"][] = ["typed_genre", "corrected_suggestion", "more_like_this", "not_for_me", "asked_about", "setup_answer", "note"];

export type AskBody = {
  job?: unknown;
  trackId?: unknown;
  /** Fallback when the result isn't synced yet: the Ears record itself (whitelisted). */
  analysis?: unknown;
  message?: unknown;
  /** F9: background for this question only; never stored as the person's turn. */
  context?: unknown;
  events?: unknown;
  playlists?: unknown;
  taste?: unknown;
  tz?: unknown;
  /** "setup": learn events from the setup dialog, so Settings says "From setup" (F11). */
  source?: unknown;
  /** Lab (S2): the focus part, bar, hearing, chords and the looped part's numbers (lab.ts LabAsk). */
  lab?: unknown;
};

/** Work to run after the response (memory rewrite), so the answer isn't slowed down. */
export type Later = () => Promise<unknown>;

export type AskReply = {
  threadId: string;
  job: Job;
  /** costUsd is an estimate; tokens is the API's usage summed over the answer's calls. */
  message: { id: string; createdAt: string; costUsd: number; tokens: StoredUsage };
  answer: MentorAnswer;
  studio?: StudioStart;
  groups?: Group[];
  profileUpdated?: { note: string };
  /** suggest_genre: the track the "Use as My genre" action applies to. */
  genreTrackId?: string;
  dropped: string[];
  latencyMs: number;
  usage: UsageSummary;
  /** Lab: where the exchange is pinned and its facts line. */
  lab?: LabMeta;
};

type Fail = { error: string; status: number; extra?: Record<string, unknown> };
const fail = (error: string, status = 400, extra?: Record<string, unknown>): Fail => ({ error, status, extra });

/** One chat (L86): everything the person asks lands in "main"; setup keeps its own thread. */
export const threadFor = (job: Job) => (job === "setup" ? "setup" : MAIN_THREAD);

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

function historyOf(rows: MessageRow[], refs?: Map<string, string>): HistoryTurn[] {
  return rows.filter((r) => r.role === "user" || !r.content.startsWith('{"error"')).map((r) => {
    if (r.role === "user") return { role: "user" as const, content: r.content };
    try {
      const a = JSON.parse(r.content) as MentorAnswer;
      const about = (a.trackIds ?? []).map((id) => refs?.get(id)).filter(Boolean);
      return { role: "assistant" as const, content: `${answerText(a)}${about.length ? `\n(About ${about.join(", ")})` : ""}` };
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
    learn: "Learn from use", propose_groups: "Propose genre groups", taste_session: "Taste session", lab: "",
  };
  // "Explain · Work (Edit)": the track named once (critic, round 2).
  const base = job === "chat" ? message : message ? `${label[job]}: ${message}` : label[job];
  return track && job !== "chat" ? `${base} · ${track.title || track.id}` : base;
}

export async function ask(store: MentorStore, body: AskBody, now: Date, tz: number, later?: (fn: Later) => void): Promise<AskReply | Fail> {
  if (!isJob(body.job)) return fail("Unknown Mentor job.");
  const job = body.job;
  if (job === "chat") return askChat(store, body, now, tz, later);
  if (job === "learn") return learnEvents(store, body, now, tz, later);
  if (job === "lab") return askLab(store, body, now, tz);
  const spec = JOBS_SPEC[job];
  const trackId = text(body.trackId, 600) || null;
  const message = text(body.message);

  const track = trackId ? await loadTrack(store, trackId, body.analysis) : null;
  if (trackId && !track) return fail("That track isn't in the library yet. Analyse it first.", 404);
  if (spec.needsTrack && !track) return fail("Pick a track first.");

  const profile = await store.getProfile();
  const input: MentorInput = { job, profile: profile.text, track, message };
  // A4: the track's arrangement map, when it has one, so the Mentor can explain its structure.
  if (track) input.maps = await mapsFor(store, [track.id]);
  // F6: the lines the latest hand edit added (within a week; a restore or paste doesn't count).
  input.recentEdit = recentEditLines(profile.history, now);
  // The person's own lines, which every profile update must keep (setup merges, learning adjusts).
  // Setup only adds (L56, L81): every existing sentence stays. Learning keeps the person's own lines.
  const keepLines = job === "setup" ? sentencesOf(profile.text) : ownerLines(profile.text, profile.history);
  if (UPDATES_PROFILE.has(job) && keepLines.length) input.keepLines = keepLines;

  if (job === "suggest_genre" || job === "propose_groups" || job === "teach") {
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
  if (job === "setup") {
    const lists = (Array.isArray(body.playlists) ? body.playlists : []).filter(
      (p): p is PlaylistLike => !!p && typeof p === "object" && Array.isArray((p as PlaylistLike).sounds),
    ).slice(0, 10);
    const si = setupInput(lists);
    if (!si.tracks) return fail("None of those playlists had tracks Six AM could read.");
    input.playlists = si.text;
    // L94: playlist tracks count toward the taste profile unlock (titles and uploaders only).
    const mem = await loadMemory(store);
    await saveMemory(store, { ...mem, setupTracks: mergeSetupTracks(mem.setupTracks, si.items) });
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

  const threadId = threadFor(job);
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
  // Setup's draft is only returned: the dialog saves it on Save (F11). A taste session's preference
  // goes into the memory's events, which the next profile refresh folds in (L92).
  if (job === "taste_session" && input.taste) {
    const { a, b, preferred, why } = input.taste;
    const won = preferred === "a" ? a : b, lost = preferred === "a" ? b : a;
    await addEvents(store, [{ type: "note", detail: `Taste session: preferred "${won.title}" by ${won.uploader} over "${lost.title}" by ${lost.uploader}, because: ${why}`.slice(0, 500) }]);
  }
  if (later) later(() => refreshMemory(store, new Date()));
  if (job === "studio_start" && track) reply.studio = studioStart(track, result.answer.loops ?? []);
  if (job === "propose_groups") {
    reply.groups = await store.addGroups((result.answer.groups ?? []).map((g) => ({ ...g, status: "proposed" as const })));
  }
  return reply;
}

async function addEvents(store: MentorStore, events: LearnEvent[]) {
  const mem = await loadMemory(store);
  await saveMemory(store, { ...mem, events: [...mem.events, ...events].slice(-40) });
}

/** Learning from use (M11): no Claude call any more. Events wait in the memory and the next
 *  refresh folds them into the summary and, once unlocked, the profile (L92). */
async function learnEvents(store: MentorStore, body: AskBody, now: Date, tz: number, later?: (fn: Later) => void): Promise<AskReply | Fail> {
  const events = (Array.isArray(body.events) ? body.events : [])
    .map((e) => (e && typeof e === "object" ? (e as Record<string, unknown>) : {}))
    .filter((e) => EVENT_TYPES.includes(e.type as LearnEvent["type"]) && text(e.detail, 500))
    .map((e) => ({ type: e.type as LearnEvent["type"], detail: text(e.detail, 500), ...(text(e.trackId, 600) ? { trackId: text(e.trackId, 600) } : {}) }))
    .slice(0, 30);
  if (!events.length) return fail("Nothing to learn from.");
  await addEvents(store, events);
  if (later) later(() => refreshMemory(store, new Date()));
  return {
    threadId: "memory", job: "learn", answer: { sentences: [{ text: "Noted.", source: "general" }], tellMore: false }, dropped: [], latencyMs: 0,
    message: { id: "", createdAt: now.toISOString(), costUsd: 0, tokens: { model: "", calls: 0, input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 }, server_tool_use: { web_search_requests: 0 } } },
    usage: await usageSummary(store, now, tz),
  };
}

/** The one chat (L86–L88): the Mentor works out the job and the track(s) from the question. */
async function askChat(store: MentorStore, body: AskBody, now: Date, tz: number, later?: (fn: Later) => void): Promise<AskReply | Fail> {
  const message = text(body.message);
  if (!message) return fail("Type a question first.");
  const trackId = text(body.trackId, 600) || null;
  const tracks = getStore();
  const [library, groups, profile, mem, selected, studio] = await Promise.all([
    store.listAnalyses(), store.listGroups(), store.getProfile(), loadMemory(store),
    trackId ? loadTrack(store, trackId, body.analysis) : Promise.resolve(null),
    // Read-only: names and loops of the person's Studio tracks.
    "store" in tracks ? tracks.store.listWithDocs(30).catch(() => []) : Promise.resolve([]),
  ]);
  const [unlock, rows] = await Promise.all([unlockFor(store, library, mem), verbatim(store, mem)]);
  const ordered = libraryOrder(library);
  const refs = new Map(ordered.map((a, i) => [refOf(i), a.id] as const));
  const refById = new Map(ordered.map((a, i) => [a.id, refOf(i)] as const));
  const live = (g: Group) => sharedTraits(library.filter((a) => g.trackIds.includes(a.id))) || g.reason;
  const words = usedGenres(library);
  const accepted = groups.filter((g) => g.status === "accepted");
  const context = [
    libraryText(ordered),
    studioText(studio),
    words.length ? `[library] Genre names the person uses: ${words.join("; ")}` : "",
    accepted.length ? `[library] Their accepted genre groups: ${accepted.map((g) => `${g.name} (${live(g)}; ${g.trackIds.length} tracks)`).join("; ")}` : "",
  ].filter(Boolean).join("\n\n");

  // F1: the tracks this conversation has been about, in order of first mention.
  const discussedIds: string[] = [];
  for (const r of rows) {
    if (r.role !== "assistant" || r.content.startsWith('{"error"')) continue;
    try {
      for (const id of (JSON.parse(r.content) as MentorAnswer).trackIds ?? []) if (!discussedIds.includes(id)) discussedIds.push(id);
    } catch { /* not an answer */ }
  }
  const discussed = discussedIds.map((id) => library.find((a) => a.id === id)).filter((a): a is EarsAnalysis => !!a);
  // A4: maps of the tracks in view: the selected row, the last discussed, and any the question
  // names by title (at most 3 in all).
  const lower = message.toLowerCase();
  const namedIds = library.filter((a) => a.title.trim().length >= 4 && lower.includes(a.title.trim().toLowerCase())).map((a) => a.id);
  const mapIds = [...new Set([selected?.id, discussed.at(-1)?.id, ...namedIds].filter((x): x is string => !!x))].slice(0, 3);
  const input: MentorInput = {
    job: "chat", message, context, selected,
    discussed: discussed.map((a) => `${refById.get(a.id)} | ${a.uploader || "?"} – ${a.title || "untitled"}`),
    lastDiscussed: discussed.at(-1) ?? null,
    // L92: while locked the Mentor neither uses nor shows a profile.
    profile: unlock.unlocked ? profile.text : "",
    memory: mem.summary,
    history: historyOf(rows, refById),
    myGenres: words,
    maps: await mapsFor(store, mapIds),
    background: text(body.context, 4000) || undefined,
  };
  const threadId = MAIN_THREAD;
  let result;
  try {
    const bpms = library.flatMap((a) => { const c = bpmChoice(a); return [a.bpm, a.bpmAlternative?.bpm ?? 0, c.lead, c.other ?? 0, c.studio]; }).filter((x) => x > 0);
    const snippetTimes = new Map(library.map((a) => [a.id, a.snippets.map((x) => clock(x.startMs))] as const));
    const keyRelations = new Map(library.map((a) => [a.id, keyNote(a.key, a.scale).relation] as const));
    result = await askClaude(input, { loopIds: CRATE_IDS, trackRefs: refs, bpms, snippetTimes, keyRelations });
  } catch (error) {
    if (error instanceof MentorError && error.costUsd > 0) {
      await store.addMessage({ threadId, role: "assistant", job: "chat", content: JSON.stringify({ error: error.kind }), sources: null, usage: error.usage, costUsd: error.costUsd, counted: false });
    }
    throw error;
  }
  const a = result.answer;
  await store.addMessage({ threadId, role: "user", job: "chat", content: message, sources: null, usage: null, costUsd: 0, counted: true });
  const saved = await store.addMessage({ threadId, role: "assistant", job: a.intent ?? "chat", content: JSON.stringify(a), sources: a.sentences, usage: result.usage, costUsd: result.costUsd, counted: false });

  const about = (a.trackIds ?? []).map((id) => library.find((x) => x.id === id)).find(Boolean) ?? selected;
  const reply: AskReply = {
    threadId, job: "chat", answer: a, dropped: result.dropped, latencyMs: result.latencyMs,
    message: { id: saved.id, createdAt: saved.createdAt, costUsd: result.costUsd, tokens: result.usage },
    usage: await usageSummary(store, now, tz),
  };
  if (a.intent === "suggest_genre" && a.genre && about) reply.genreTrackId = about.id;
  if (a.intent === "studio_start" && a.loops?.length) {
    // No track named or selected: the crate's own key and the Studio's default tempo.
    reply.studio = studioStart(about ?? { bpm: DEFAULT_BPM, bpmAlternative: null, bpmAmbiguous: false, key: "A", scale: "minor" }, a.loops);
  }
  // refreshMemory checks itself whether a rewrite is due (every MEMORY_EVERY exchanges, or the profile).
  if (later) later(() => refreshMemory(store, new Date()));
  return reply;
}

/** How many earlier Lab exchanges about this track's part go back to the model (newest last). */
const LAB_HISTORY = 6;

/**
 * A question from the Lab (S2, B6): the track's map and the Lab's facts (focus part, bar, what is
 * heard, chords so far, the looped part's numbers) go with it; the exchange is stored in the
 * track's own thread ("lab:<id>") with the bar and part it pins to, so the notes survive a reload.
 * Not part of the one chat's memory.
 */
async function askLab(store: MentorStore, body: AskBody, now: Date, tz: number): Promise<AskReply | Fail> {
  const message = text(body.message);
  if (!message) return fail("Type a question first.");
  const trackId = text(body.trackId, 600);
  if (!trackId) return fail("Pick a track first.");
  const map = await store.getMap(trackId).catch(() => null);
  if (!map) return fail("This track has no map yet. Map it first.", 404);
  const lab = parseLabAsk(body.lab, map.bars);
  if (!lab) return fail("The Lab didn't say which part and bar this is about.");
  const [track, profile] = await Promise.all([loadTrack(store, trackId, body.analysis), store.getProfile()]);
  const threadId = labThread(trackId);
  // The earlier exchanges about this part, each question starting with its bar.
  const notes = notesFromThread((await store.thread(threadId, 100)).flatMap((r): ThreadItem[] => {
    if (r.role === "user") return [{ id: r.id, role: "user" as const, text: r.content, createdAt: r.createdAt }];
    if (r.content.startsWith('{"error"')) return [];
    try { return [{ id: r.id, role: "assistant" as const, answer: JSON.parse(r.content) as unknown, createdAt: r.createdAt }]; } catch { return []; }
  })).filter((n) => n.part === lab.part).slice(-LAB_HISTORY);
  const history: HistoryTurn[] = notes.flatMap((n) => [
    { role: "user" as const, content: `(bar ${n.bar}, ${PART_LABEL[n.part]}) ${n.q}` },
    { role: "assistant" as const, content: answerText(n.answer) },
  ]);
  const input: MentorInput = {
    job: "lab", profile: profile.text, track, message, history,
    maps: { [trackId]: mapContext(map) },
    lab: labContextText(lab, map),
  };
  // No analysis stored (a map made from a link): the map's own facts stand in for the track's.
  if (!track) input.lab = `[ears] Track: ${map.title || "untitled"} by ${map.uploader || "unknown"}, ${map.bpm} BPM, key ${map.key} ${map.scale}.\n${mapContext(map)}\n${input.lab}`;
  let result;
  try {
    result = await askClaude(input, { labQuestion: message, labUnheard: unheardLoop(lab, map) ?? undefined, labUnheardBars: new Set(unheardBars(lab)) });
  } catch (error) {
    if (error instanceof MentorError && error.costUsd > 0) {
      await store.addMessage({ threadId, role: "assistant", job: "lab", content: JSON.stringify({ error: error.kind }), sources: null, usage: error.usage, costUsd: error.costUsd, counted: false });
    }
    throw error;
  }
  const meta: LabMeta = { bar: lab.bar, part: lab.part, facts: factsLine(lab.measure, keyFlats(map.key, map.scale)) };
  await store.addMessage({ threadId, role: "user", job: "lab", content: message, sources: null, usage: null, costUsd: 0, counted: true });
  const saved = await store.addMessage({
    threadId, role: "assistant", job: "lab", content: JSON.stringify({ ...result.answer, lab: meta }), sources: result.answer.sentences,
    usage: result.usage, costUsd: result.costUsd, counted: false,
  });
  return {
    threadId, job: "lab", answer: result.answer, dropped: result.dropped, latencyMs: result.latencyMs,
    message: { id: saved.id, createdAt: saved.createdAt, costUsd: result.costUsd, tokens: result.usage },
    usage: await usageSummary(store, now, tz),
    lab: meta,
  };
}

/** The stored maps of these tracks as prompt text; a missing map (or table) is simply left out. */
async function mapsFor(store: MentorStore, ids: string[]): Promise<Record<string, string> | undefined> {
  const out: Record<string, string> = {};
  for (const id of ids) {
    const m = await store.getMap(id).catch(() => null);
    if (m) out[id] = mapContext(m);
  }
  return Object.keys(out).length ? out : undefined;
}

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
