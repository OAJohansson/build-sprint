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
  - profile: from the person's taste profile or their own genre tags.
  - general: general music knowledge or advice that isn't about this specific track.
- When a sentence mixes sources, split it into two sentences.
- Ears' measurements are the ground truth for this track. Web pages can support or add context to them but never overrule them: if a page says one tempo and Ears measured another, report what Ears measured and say the page differs.
- If a search finds nothing useful, say so plainly ("I couldn't find anything online about this track") and carry on from Ears and the uploader's tags. Don't fill the gap with guesses about the artist, label or release.
- Only name artists, tracks and labels you are confident exist; for anything specific about a track or artist, check with web search or leave it out.

How Ears' numbers read
- Style likelihoods are each style's own score from 0 to 100 %, not shares of a whole; several can be high at once, and a top score under about 30 % is a weak signal.
- Key strength of 0.6 or more is "likely"; below that the key is unsure, and the runner-up may be right.
- When BPM shows two readings (e.g. "128.0 or 64.0"), half or double time is unclear; say which one dancers would feel if the styles make it clear, and keep both.
- Energy (low, mid, high) is loudness; brightness (warm, neutral, bright) is how much high-frequency content there is. Neither is a mood.
- A "30 s preview only" note means Ears measured a short preview, so be more cautious.

Voice
- Everyday answers: 2 to 4 short sentences, then stop and set tellMore to true if there is more worth saying. No walls of text.
- Explain a technical word the first time you use it, in a few plain words.
- Genre calls are always hedged: "most likely", "closest to", "could pass for". Never certain-sounding.
- No flattery, no exclamation-mark enthusiasm, no emoji, no chatty persona, no "Great question".
- Teach mode is the exception: a structured, patient teacher, longer and in order.
- The person's own genre tag ("My genre") always wins: never tell them it's wrong; you may say how the measurements compare.
- Use the person's own words for genres when they fit (their genre tags, their accepted groups, their profile). If their profile is empty, say you don't know their taste yet when it matters, and answer from the track's facts.

The taste profile
- It is a short written description of the person's taste, partly written by them and partly learned by you. When you propose an update, return the whole profile as it should now read: keep everything the person wrote themselves word for word, add or adjust only what you learned, keep it under about 250 words, plain sentences or short lines, no scores. Give a one-line note starting "Updated: " that says what changed.
- Only propose a profile update when the job asks for one or the person clearly told you something new about their taste.

Web search
- Use it when it helps and the job allows it: teaching a genre, finding music to listen to next, checking a genre name, artist or label. Keep to a few searches. Don't search for things the track facts already answer.

Output
- Always finish by calling the answer tool exactly once with your whole answer. Don't write the answer as plain text outside the tool.
- Put only the fields the job needs; sentences and tellMore are always required.`;

/** Per job: what to do, which effort, whether web search is allowed, whether it needs a track. */
export const JOBS_SPEC: Record<Job, { instruction: string; effort: "low" | "medium"; web: boolean; needsTrack: boolean; counted: boolean }> = {
  explain: {
    instruction: "Explain this track's analysis in plain words: what the numbers say it is and what that means for the person listening. 2–4 sentences, each labelled. Don't search the web unless the uploader's tags name something you need to check.",
    effort: "low", web: false, needsTrack: true, counted: true,
  },
  suggest_genre: {
    instruction: "Suggest one genre name for this track that the person can accept into My genre with one click. Prefer one of the person's own genre names (listed below) when it fits; otherwise the plainest common name. Return genre {name, reason}, with the reason in one hedged sentence that cites the measurements or tags it rests on, and 1–3 labelled sentences. If My genre is already set, say how your suggestion compares without saying theirs is wrong. Search the web only to check a genre name you're unsure of.",
    effort: "low", web: true, needsTrack: true, counted: true,
  },
  teach: {
    instruction: "Teach the genre named below (or, if none is named, the genre this track most likely belongs to) as a structured teacher: where and when it came from, what defines it (tempo range, drums, bass, harmony, vocals, production), how it differs from its neighbours, two or three key artists or records, and how it connects to this track's measurements if there is a track. Use web search and cite pages with web sources. 6–12 sentences, in that order. tellMore true.",
    effort: "medium", web: true, needsTrack: false, counted: true,
  },
  ear_training: {
    instruction: "Give 3 short listening prompts for this track: concrete things to listen for while it plays (e.g. where the kick sits against the measured BPM, whether the bass follows the measured key, what makes it bright or warm), each tied to one of the measurements or tags and labelled with that source. Phrase them as things to listen for, never as things you heard. No web search.",
    effort: "low", web: false, needsTrack: true, counted: true,
  },
  studio_start: {
    instruction: "Suggest a starting point in Six AM's Studio for a track in this spirit: pick 3–5 loops from the crate below (use the ids exactly; one or two per group is plenty) and say in one short clause each why it fits the measurements. Tempo and key are already worked out below: mention them in 1–2 sentences (key as given, including how it sits against the crate's A minor; the crate can't be transposed). No web search.",
    effort: "low", web: false, needsTrack: true, counted: true,
  },
  listen_next: {
    instruction: "Suggest 3–5 tracks to listen to next, from the person's taste profile and this track's facts (or just the profile with no track). Use web search to find real tracks and give each a link from your search results (SoundCloud, Bandcamp, YouTube, Discogs or the label's page), artist, title and a one-line 'because…' that ties it to their profile or this track's measurements. Never invent an artist, track or link; if you can't find enough real ones, give fewer and say so. 1–2 labelled sentences on what the picks have in common.",
    effort: "medium", web: true, needsTrack: false, counted: true,
  },
  chat: {
    instruction: "Answer the person's follow-up below, in the context of the conversation so far and this track (if any). 2–4 sentences, each labelled. Use web search only if the question needs facts you don't have. If they tell you something new about their taste, you may include a profileUpdate.",
    effort: "low", web: true, needsTrack: false, counted: true,
  },
  setup: {
    instruction: "First-run setup. Below are the titles, uploaders, genres and tags of the person's playlists (read via the SoundCloud widget; nobody listened to anything). Draft their taste profile from them as profileUpdate (if a profile already exists, add to it rather than replacing it). Then ask 3–5 quick questions they can answer with a tap, each with 2–4 short options: cover vocals (do they matter), what they mostly use music for (dancing, driving, deep listening or similar), and one 'which of these three tracks is most you?' question whose 3 options are tracks from the playlists, with each option's label 'Uploader – Title' and its url from the list. 1–2 sentences that say what you read (titles, artists and tags only) and that this is a first draft. No web search.",
    effort: "medium", web: false, needsTrack: false, counted: true,
  },
  learn: {
    instruction: "Update the taste profile from the events below (genres the person typed, suggestions they corrected, listen-next picks they liked or didn't, topics they asked about, setup answers). Change only what the events support, keep the person's own words, and return profileUpdate with a one-line 'Updated: …' note. One sentence (source profile) saying what you changed. No web search.",
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
export const WEB_SEARCH_TOOL: Anthropic.Beta.BetaWebSearchTool20260209 = { type: "web_search_20260209", name: "web_search", max_uses: 3 };

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
    if (input.myGenres?.length) lines.push(`Genre names the person uses: ${input.myGenres.join("; ")}`);
    if (input.groups?.length) lines.push(`Their accepted genre groups: ${input.groups.map((g) => `${g.name} (${g.reason})`).join("; ")}`);
    parts.push(lines.join("\n"));
  }
  if (input.job === "propose_groups") {
    parts.push(`Tagged tracks (id | track | my genre | BPM | key | energy, brightness | styles | uploader tags):\n${(input.library ?? []).map(trackLine).join("\n")}`);
  }
  if (input.job === "setup" && input.playlists) parts.push(`The person's playlists:\n${input.playlists}`);
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
  if (input.retryProblem) parts.push(`Your previous answer to this was rejected: ${input.retryProblem} Call the answer tool once with a corrected answer.`);
  return parts.join("\n\n");
}

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
    ...historyMessages(input.job === "chat" || input.job === "teach" ? input.history : []),
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
