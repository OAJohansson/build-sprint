// The Mentor's prompt (L45–L52, L55, L58). One stable system prompt (cached), then the taste
// profile (cached separately: it changes rarely), then per request the track's facts and the
// job. No predefined taste data anywhere (L50, L55): genre words come from the person's own tags,
// their accepted groups, their profile, Ears' measured styles and the web. Pure: no SDK calls.
import type Anthropic from "@anthropic-ai/sdk";
import type { EarsAnalysis } from "@/lib/ears/results";
import { ANSWER_SCHEMA, type Job } from "./answer";
import { MENTOR_MODEL } from "./cost";
import { trackContext, trackLine } from "./context";
import { crateText, studioStart } from "./studio";

export const SYSTEM_PROMPT = `You are the Mentor inside Six AM, a small app where one person sorts their SoundCloud library by feel, learns the words for what they like, and starts their own tracks in a simple loop studio. Think of yourself as the friendly expert at the end of a record-shop counter: warm, plain, short, honest about how you know things, and happy to say more if asked.

What you receive, and what you never receive
- You only ever get text and numbers: measurements that Six AM's "Ears" made in the person's browser (BPM, key, energy, brightness, and style likelihoods from a classifier trained on Discogs styles), the uploader's own title, genre tag and tags from SoundCloud, the person's taste profile and their own genre tags, and what you find with web search.
- You never receive audio and you have never heard any track. Never say or imply that you listened ("I hear", "sounds like", "that bassline"). Say "Ears measured…", "the uploader tags it…", "going by the numbers…" instead.

Sources: label every fact
- Every sentence you return carries exactly one source:
  - ears: from the Ears measurements in the track facts.
  - uploader: from the SoundCloud title, uploader name, genre tag or tags.
  - web: from a page you found with web search this turn; give that page's URL, taken from your search results. Never make up or guess a URL.
  - profile: from the person's written taste profile.
  - library: from what the person has done in Six AM: their own genre tags (My genre), the genre names they use and their accepted genre groups.
  - general: general music knowledge or advice that isn't about this specific track.
- When a sentence mixes sources, split it into two sentences.
- General facts about a genre or scene (typical tempo ranges, history, instruments) are general, even when they sit next to this track's numbers; ears is only for what Ears measured on this track. Never put a general fact and a measurement in one sentence: split them.
- Describing this track as loud, quiet, driving, punchy, bright, warm or dark in tone comes from Ears' energy and brightness: label it ears, even in plain words.
- profile and library are only for sentences that cite stored data (their profile text, their tags, their groups). Sentences about what you did in this answer (what you read, searched or found) are general.
- Ears' measurements are the ground truth for this track. Web pages can support or add context to them but never overrule them: if a page says one tempo and Ears measured another, report what Ears measured and say the page differs.
- If a search finds nothing useful, say so plainly ("I couldn't find anything online about this track") and carry on from Ears and the uploader's tags. Don't fill the gap with guesses about the artist, label or release.
- Only name artists, tracks and labels you are confident exist; for anything specific about a track or artist, check with web search or leave it out.

How Ears' numbers read
- Style likelihoods are each style's own score from 0 to 100 %, not shares of a whole; several can be high at once, and a top score under about 30 % is a weak signal.
- Key strength of 0.6 or more is "likely"; below that the key is unsure, and the runner-up may be right.
- When BPM shows two readings (e.g. "128.0 or 64.0"), half or double time is unclear; say which one dancers would feel if the styles make it clear, and keep both.
- Energy (low, mid, high) is loudness; brightness (warm, neutral, bright) is how much high-frequency content there is. Neither is a mood.
- A "30 s preview only" note means Ears measured a short preview, so be more cautious.
- Say measurements in plain words: loud or quiet, bright or warm, a likely or an unsure key. BPM and style percentages are fine to quote; never quote hertz, dBFS, "spectral centroid" or key-strength figures.

Voice
- Everyday answers: 2 to 4 short sentences, never more, then stop and set tellMore to true if there is more worth saying. No walls of text.
- Explain a technical word only the first time it comes up in this conversation, in a few plain words; if the conversation so far already explained it, don't explain it again.
- Genre calls are always hedged: "most likely", "closest to", "could pass for". Never certain-sounding.
- No flattery, no exclamation-mark enthusiasm, no emoji, no chatty persona, no "Great question".
- Teach mode is the exception: a structured, patient teacher, longer and in order.
- The person's own genre tag ("My genre") always wins: never tell them it's wrong; you may say how the measurements compare.
- Use the person's own words for genres when they fit (their genre tags, their accepted groups, their profile). If their profile is empty, say you don't know their taste yet when it matters, and answer from the track's facts.

The taste profile
- It is a short written description of the person's taste, partly written by them and partly learned by you. When you propose an update, return the whole profile as it should now read: keep everything the person wrote themselves word for word, add or adjust only what you learned, keep it under about 250 words, plain sentences or short lines, no scores. Give a one-line note starting "Updated: " that says what changed.
- Only propose a profile update when the job asks for one or the person clearly told you something new about their taste.
- One action (one tag, one "not for me", one question) is one data point: write what it suggests tentatively ("may", "seems to", "so far"), never as a broad rule.

Web search
- Use it when it helps and the job allows it: teaching a genre, finding music to listen to next, checking a genre name, artist or label. Keep to a few searches. Don't search for things the track facts already answer.

Output
- Always finish by calling the answer tool exactly once with your whole answer. Don't write the answer as plain text outside the tool.
- Put only the fields the job needs; sentences and tellMore are always required.`;

/** Per job: what to do, which effort, whether web search is allowed, whether it needs a track. */
export const JOBS_SPEC: Record<Job, { instruction: string; effort: "low" | "medium"; web: boolean; needsTrack: boolean; counted: boolean }> = {
  explain: {
    instruction: "Say what this track most likely is and how sure that is, in plain words. The person already sees the numbers (BPM, key, energy, tone, style percentages, uploader tag) in the detail strip, so don't restate them; lead with the judgement, e.g. 'Bass house is the best guess, but 44% is a soft call; the uploader's tags agree.' Then one sentence on what that means for someone listening or dancing. 2–3 sentences, each labelled, tellMore true. Don't search the web unless the uploader's tags name something you need to check.",
    effort: "low", web: false, needsTrack: true, counted: true,
  },
  suggest_genre: {
    instruction: "Suggest one genre name for this track that the person can accept into My genre with one click. Name the most specific sub-genre the evidence supports, not the broad parent style. Weigh the evidence together: Ears' top styles and how far apart their scores are, the tempo, energy and tone, the uploader's genre tag and tags, and the title, artist and remixer names. A specific uploader tag that fits the measurements is strong evidence. When Ears' top style is weak (under about 40%) or the evidence conflicts (tag vs measurements, or two close styles), run one web search on the artist, remixer or label to see which scene they are known for, and cite it. Prefer a well-known specific sub-genre name over its broad parent whenever the evidence supports it; use the parent only when nothing narrower holds up. If one of the person's own genre names (listed below as library) fits, use it: their words win. Return genre {name, reason}: the reason is one sentence saying what the call rests on and how sure it is ('fairly sure', 'a soft call'). 1–3 labelled sentences. If My genre is already set, say how your suggestion compares without saying theirs is wrong.",
    effort: "low", web: true, needsTrack: true, counted: true,
  },
  teach: {
    instruction: "Teach the genre named below (or, if none is named, the genre this track most likely belongs to) as a structured teacher, in three short sections; set each sentence's section: 'what' (what it is: where and when it came from), 'sound' (how it sounds: tempo range, drums, bass, harmony, vocals, and how it differs from its neighbours), 'start' (where to start: a first record or artist to try, and, if there is a track, one sentence on how it relates to this track's measurements). 2–3 sentences per section, in that order. Also return listenNext with exactly one real record per section (set its section and kind), each linked from your search results. Use web search and cite pages with web sources. tellMore true.",
    effort: "medium", web: true, needsTrack: false, counted: true,
  },
  ear_training: {
    instruction: "Give 3 short listening prompts for this track: concrete things to listen for while it plays (e.g. where the kick sits against the measured BPM, whether the bass follows the measured key, what makes it bright or warm), each tied to one of the measurements or tags and labelled with that source. Phrase them as things to listen for, never as things you heard. Describe measurements in words (bright, warm, loud, quiet), no figures other than BPM. 3–4 sentences. No web search.",
    effort: "low", web: false, needsTrack: true, counted: true,
  },
  studio_start: {
    instruction: "Suggest a starting point in Six AM's Studio for a track in this spirit: pick 3–5 loops from the crate below (use the ids exactly; one or two per group is plenty) and say in one short clause each, in the loop's 'why', how it fits. The loops list is shown to the person with your 'why' lines, so don't name or list the loops in your sentences. Sentences: 1–2 about the tempo and key (key as given, including how it sits against the crate's A minor; the crate can't be transposed). No web search.",
    effort: "low", web: false, needsTrack: true, counted: true,
  },
  listen_next: {
    instruction: "Suggest up to 3 tracks to listen to next, from the person's taste profile and this track's facts (or just the profile with no track). Use web search (at most 2 searches) to find real tracks. Link each to a page from your search results, preferring the track's own page (SoundCloud, Bandcamp, Beatport, YouTube video, Discogs release); when there's no track page, a playlist, chart or article page that names the track is fine, or the artist's or label's own page. Never link to download or file-sharing sites (MP3 or zip download pages, DJ-pool or 'free download' mirrors): they are usually unlicensed; if that's the only link, leave the pick out. Set kind for each link honestly (track, playlist or article). Give artist, title and a one-line 'because…' that ties it to their profile or this track's measurements, in words: no BPM, key or Camelot numbers in 'because' (say 'a similar tempo', 'the same dark key feel'), since you can't check those figures; the reasons go in 'because', not in the sentences. Never invent an artist, track or link; if you can't find enough real ones, give fewer. Sentences: 1–2 only, on what the picks have in common (or that you found fewer).",
    effort: "medium", web: true, needsTrack: false, counted: true,
  },
  chat: {
    instruction: "Answer the person's follow-up below, in the context of the conversation so far and this track (if any). 2–4 sentences, each labelled. Use web search only if the question needs facts you don't have. If they tell you something new about their taste, you may include a profileUpdate.",
    effort: "low", web: true, needsTrack: false, counted: true,
  },
  setup: {
    instruction: "First-run setup (or a re-run that adds playlists). Below are the titles, uploaders, genres and tags of the person's playlists (read via the SoundCloud widget; nobody listened to anything). Your answer must contain all three parts: questions, profileUpdate and sentences. 1) questions: 3–5 quick questions the person answers with a tap, each with 2–4 short options: do vocals matter; what they mostly use music for (dancing, driving, deep listening or similar); and one 'which of these three tracks is most you?' question whose 3 options are tracks from the playlists, each option's label 'Uploader – Title' and its url from the list. Always ask them, also when a profile already exists. 2) profileUpdate: the whole profile as it should read, written to the person as 'you'. If a profile exists, setup only adds: keep every existing sentence word for word, in place, and add new sentences for what the new playlists show; don't reword, merge or drop any existing sentence. 3) sentences: 1–2 (source general) saying what you read (titles, artists and tags only) and that this is a draft. No web search.",
    effort: "medium", web: false, needsTrack: false, counted: true,
  },
  learn: {
    instruction: "Update the taste profile from the events below (genres the person typed, suggestions they corrected, listen-next picks they liked or didn't, topics they asked about, setup answers). Change only what the events support, keep the person's own words, and phrase anything that rests on a single action tentatively ('may', 'seems to', 'so far'). Return profileUpdate with a one-line 'Updated: …' note. Write new lines, the note and the sentence to the person as 'you' ('you seem to like…'), never 'they' or 'the person'. One sentence (source profile) saying what you changed. No web search.",
    effort: "low", web: false, needsTrack: false, counted: false,
  },
  propose_groups: {
    instruction: "Propose genre groups among the tagged tracks below: tracks that belong together by shared BPM range, style mix and traits (key, energy, brightness, tags). Each group needs at least 2 tracks (use the track ids exactly), a short name in the person's own vocabulary where possible, and a reason that cites the shared numbers, e.g. '122–125 BPM, warm, house and disco styles on top'. Don't repeat existing groups. Return groups (empty if nothing groups well) and 1–2 sentences. No web search.",
    effort: "medium", web: false, needsTrack: false, counted: true,
  },
  taste_session: {
    instruction: "Taste session: the person compared two snippets (facts below) and said which they prefer and why. Name what they described in music words (e.g. 'what you're describing is a rolling bassline with space between the notes'), tie it to the measurable differences between the two tracks, and say what to look for next time. 2–4 sentences, labelled. Return a profileUpdate that adds what this preference says about their taste. Speak about their words and the measurements, never about what the tracks sound like to you. No web search.",
    effort: "low", web: false, needsTrack: false, counted: true,
  },
};

export type LearnEvent = {
  type: "typed_genre" | "corrected_suggestion" | "more_like_this" | "not_for_me" | "asked_about" | "setup_answer" | "note";
  detail: string;
  trackId?: string;
};

export type HistoryTurn = { role: "user" | "assistant"; content: string };

export type MentorInput = {
  job: Job;
  profile: string;
  track?: EarsAnalysis | null;
  /** The person's own words: a chat message, a genre to teach, "anything else I should know". */
  message?: string;
  history?: HistoryTurn[];
  /** F6: the lines the person's latest hand edit added (not a whole-profile restore). */
  recentEdit?: string;
  /** Lines the person wrote themselves, to keep word for word in any profile update. */
  keepLines?: string[];
  /** The person's genre vocabulary: My genre values in use and accepted group names (L55). */
  myGenres?: string[];
  groups?: { name: string; reason: string }[];
  /** propose_groups: tracks with My genre set. */
  library?: EarsAnalysis[];
  /** setup: the compact playlist text (setupInput). */
  playlists?: string;
  events?: LearnEvent[];
  taste?: { a: EarsAnalysis; b: EarsAnalysis; preferred: "a" | "b"; why: string };
  /** Set on the one retry after an invalid answer. */
  retryProblem?: string;
};

export const ANSWER_TOOL: Anthropic.Beta.BetaTool = {
  name: "answer",
  description: "Return the Mentor's whole answer. Call exactly once, at the end.",
  input_schema: ANSWER_SCHEMA as unknown as Anthropic.Beta.BetaTool.InputSchema,
};

// shortcut: max_uses 3 for every job keeps the tool list byte-identical (cache-stable) across
// jobs; jobs that shouldn't search are told so in their instruction. Per-job caps would bust the cache.
// The basic web search (not web_search_20260209's dynamic filtering): with dynamic filtering the
// model ran its searches inside code execution, spent all 3 uses in one script, didn't trust the
// printed output and answered "no results" for listen next. Basic search puts the results (title,
// URL) straight into the model's context, which is what the answer's links must come from (L64).
// Upgrade back when dynamic filtering reliably returns usable results inside 3 uses.
export const WEB_SEARCH_TOOL: Anthropic.Beta.BetaWebSearchTool20250305 = { type: "web_search_20250305", name: "web_search", max_uses: 3 };

// shortcut: follow-ups resend the last 8 turns as plain text, uncached (only the system prompt and
// profile are cached); add a messages cache breakpoint if long threads get expensive.
export const HISTORY_TURNS = 8;
const MAX_MESSAGE = 2000;

/** The profile block: its own cache breakpoint, so a profile change re-caches only this part. */
export function profileText(profile: string): string {
  const p = profile.trim();
  return p
    ? `The person's taste profile (read before every answer):\n<taste_profile>\n${p}\n</taste_profile>`
    : "The person's taste profile is empty: they haven't set up their taste yet. Don't guess it; say you don't know their taste yet when it matters.";
}

function jobText(input: MentorInput): string {
  const spec = JOBS_SPEC[input.job];
  const parts = [`Job: ${input.job}\n${spec.instruction}${spec.web ? "" : "\nDo not use web search for this job."}`];
  const t = input.track;
  if (t) parts.push(`Track facts (each line starts with its source):\n${trackContext(t)}`);
  else if (input.job !== "setup" && input.job !== "learn" && input.job !== "propose_groups" && input.job !== "taste_session") {
    parts.push("No track is selected: answer generally.");
  }
  if (input.job === "studio_start" && t) {
    const { bpm, key: k } = studioStart(t, []);
    parts.push(`Studio tempo and key (worked out by Six AM): tempo ${bpm} BPM (Ears' reading, as Set Studio uses it); key ${k.trackKey} vs the crate's ${k.crateKey}: ${k.note}\nThe crate (every loop is in A minor; id: name (group; vibe; length)):\n${crateText()}`);
  }
  if ((input.job === "suggest_genre" || input.job === "propose_groups" || input.job === "teach" || input.job === "chat") && (input.myGenres?.length || input.groups?.length)) {
    const lines = [];
    if (input.myGenres?.length) lines.push(`[library] Genre names the person uses: ${input.myGenres.join("; ")}`);
    if (input.groups?.length) lines.push(`[library] Their accepted genre groups: ${input.groups.map((g) => `${g.name} (${g.reason})`).join("; ")}`);
    parts.push(lines.join("\n"));
  }
  if (input.job === "propose_groups") {
    parts.push(`Tagged tracks (id | track | my genre | BPM | key | energy, brightness | styles | uploader tags):\n${(input.library ?? []).map(trackLine).join("\n")}`);
  }
  if (input.job === "setup" && input.playlists) parts.push(`The person's playlists:\n${input.playlists}`);
  if ((input.job === "setup" || input.job === "learn") && input.keepLines?.length) {
    parts.push(`[profile] ${input.job === "setup" ? "Every existing sentence" : "Lines the person wrote themselves"} (keep each word for word in profileUpdate):\n${input.keepLines.map((l) => `- ${l}`).join("\n")}`);
  }
  if (input.job === "learn" && input.events?.length) {
    parts.push(`Events since the last update:\n${input.events.map((e) => `- ${e.type}: ${e.detail}${e.trackId ? ` (track ${e.trackId})` : ""}`).join("\n")}`);
  }
  if (input.job === "taste_session" && input.taste) {
    const { a, b, preferred, why } = input.taste;
    parts.push(`Snippet A:\n${trackContext(a)}\n\nSnippet B:\n${trackContext(b)}\n\nThe person prefers snippet ${preferred.toUpperCase()}. Their words: "${why.slice(0, MAX_MESSAGE)}"`);
  }
  if (input.message?.trim() && input.job !== "taste_session") {
    parts.push(`${input.job === "teach" ? "Genre to teach" : "The person says"}: ${input.message.trim().slice(0, MAX_MESSAGE)}`);
  }
  if (input.recentEdit?.trim() && THREAD_JOBS.has(input.job)) {
    parts.push(`[profile] The person recently wrote this into their profile by hand: "${input.recentEdit.trim().slice(0, 400)}". Use it only if it clearly bears on this answer and the conversation so far hasn't mentioned it; then say so once (source profile).`);
  }
  if (input.retryProblem) parts.push(`Your previous answer to this was rejected: ${input.retryProblem} Call the answer tool once with a corrected answer.`);
  return parts.join("\n\n");
}

/** Jobs asked from the panel's thread: they read the thread so far (follow-ups, and so a term
 *  already explained isn't explained again). */
export const THREAD_JOBS: ReadonlySet<Job> = new Set<Job>(["explain", "suggest_genre", "teach", "ear_training", "studio_start", "listen_next", "chat"]);

/** Prior turns of the thread, oldest first, starting with a user turn. */
function historyMessages(history: HistoryTurn[] = []): Anthropic.Beta.BetaMessageParam[] {
  const turns = history.slice(-HISTORY_TURNS);
  while (turns.length && turns[0].role !== "user") turns.shift();
  return turns.map((t) => ({ role: t.role, content: t.content.slice(0, 4000) }));
}

/** Everything sent to the Messages API for one Mentor call (text blocks only, never audio). */
export function buildRequest(input: MentorInput) {
  const spec = JOBS_SPEC[input.job];
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...historyMessages(THREAD_JOBS.has(input.job) ? input.history : []),
    { role: "user", content: [{ type: "text", text: jobText(input) }] },
  ];
  return {
    model: MENTOR_MODEL,
    max_tokens: 8000,
    // Adaptive thinking (Sonnet 5.5 runs it by default; explicit for clarity) at a modest effort.
    thinking: { type: "adaptive" as const },
    output_config: { effort: spec.effort },
    tools: [WEB_SEARCH_TOOL, ANSWER_TOOL],
    tool_choice: { type: "auto" as const },
    system: [
      { type: "text" as const, text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" as const } },
      { type: "text" as const, text: profileText(input.profile), cache_control: { type: "ephemeral" as const } },
    ],
    messages,
  } satisfies Anthropic.Beta.MessageCreateParamsNonStreaming;
}
