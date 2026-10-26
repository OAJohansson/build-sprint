// The Mentor's structured answer: what the model returns through the `answer` tool, and the
// checks it must pass before anyone sees it (M2 source on every fact, M6 real loops, M7 real
// links). Pure, shared by the server and the panel.

import { CANT_HEAR, HEARD_CLAIM, TONE_QUESTION } from "./lab";
import { missingLines } from "./owner-lines";

export const JOBS = [
  "explain", "suggest_genre", "teach", "ear_training", "studio_start", "listen_next", "chat",
  "setup", "learn", "propose_groups", "taste_session", "lab",
] as const;
export type Job = (typeof JOBS)[number];

/** What a free-text question in the one chat asks for (L87): the model picks it in the answer
 *  tool, and the server checks the answer by that job's rules. help = "What can you help me with?". */
export const INTENTS = ["explain", "suggest_genre", "teach", "ear_training", "studio_start", "listen_next", "taste_session", "propose_groups", "help", "chat"] as const;
export type Intent = (typeof INTENTS)[number];
const isIntent = (v: unknown): v is Intent => typeof v === "string" && (INTENTS as readonly string[]).includes(v);
/** The job whose rules a chat answer follows. */
const ANSWER_JOBS: readonly Job[] = ["explain", "suggest_genre", "teach", "ear_training", "studio_start", "listen_next"];
export const ruleJob = (job: Job, intent: unknown): Job => (job === "chat" && isJob(intent) && ANSWER_JOBS.includes(intent) ? intent : job);
export const isJob = (v: unknown): v is Job => typeof v === "string" && (JOBS as readonly string[]).includes(v);

/** Where a fact came from (E2's source labels). Ears = the browser's measurements; uploader =
 *  SoundCloud title/tags; profile = the written taste profile; library = the person's own tags and
 *  accepted genre groups in Six AM (F9: kept apart from the profile). The order is the panel's
 *  fixed footnote numbering. */
export const SOURCES = ["ears", "uploader", "web", "profile", "library", "memory", "general"] as const;
export type Source = (typeof SOURCES)[number];

/** Teach answers come in three labelled sections (critic, round 2). */
export const TEACH_SECTIONS = ["what", "sound", "start"] as const;
export type TeachSection = (typeof TEACH_SECTIONS)[number];
export type Sentence = { text: string; source: Source; url?: string; section?: TeachSection };
/** kind: what the link opens (F4): a track page, a playlist/tracklist/tag page, or an article. */
export type LinkKind = "track" | "artist" | "playlist" | "chart" | "article" | "search";
export type ListenNext = { artist: string; title: string; url: string; because: string; kind?: LinkKind; section?: TeachSection };
export type GenreCall = { name: string; reason: string };
export type LoopPick = { id: string; why: string };
export type Question = { question: string; options: { label: string; url?: string }[] };
export type GroupProposal = { name: string; reason: string; trackIds: string[] };
export type ProfileUpdate = { text: string; note: string };

export type MentorAnswer = {
  /** Chat only: what the question asked for, and the analysed track(s) it is about (ids). */
  intent?: Intent;
  trackIds?: string[];
  sentences: Sentence[];
  /** Offer "Tell me more" (everyday answers are 2–4 sentences). */
  tellMore: boolean;
  listenNext?: ListenNext[];
  genre?: GenreCall;
  loops?: LoopPick[];
  questions?: Question[];
  groups?: GroupProposal[];
  profileUpdate?: ProfileUpdate;
};

/** JSON schema for the `answer` tool. Every field but sentences/tellMore is optional; the
 *  per-job checks below say which a job needs. */
export const ANSWER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["sentences", "tellMore"],
  properties: {
    intent: { type: "string", enum: [...INTENTS], description: "Chat only: what the question asks for (see the Jobs list)." },
    trackIds: { type: "array", items: { type: "string" }, description: "Chat only: refs (T1, T2…) of the library tracks this answer is about, most relevant first; empty if none." },
    sentences: {
      type: "array",
      description: "The answer, one fact or idea per item, each with where it came from.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "source"],
        properties: {
          text: { type: "string" },
          source: { type: "string", enum: [...SOURCES] },
          url: { type: "string", description: "Required when source is web: the page it came from (from your search results)." },
          section: { type: "string", enum: [...TEACH_SECTIONS], description: "Teach only: what (what it is), sound (how it sounds), start (where to start listening)." },
        },
      },
    },
    tellMore: { type: "boolean", description: "True when there is more worth saying (offer 'Tell me more')." },
    listenNext: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["artist", "title", "url", "because"],
        properties: {
          artist: { type: "string" }, title: { type: "string" }, url: { type: "string" }, because: { type: "string" },
          kind: { type: "string", enum: ["track", "artist", "playlist", "chart", "article"], description: "What the link opens: track = the track's own page (SoundCloud, Bandcamp, Beatport, YouTube video, Discogs release); artist = the artist's or label's page; playlist = a playlist or tracklist; chart = a chart page; article = a written article or review. The pick itself is always one named track." },
          section: { type: "string", enum: [...TEACH_SECTIONS], description: "Teach only: which section this listen link belongs to (one per section)." },
        },
      },
    },
    genre: {
      type: "object",
      additionalProperties: false,
      required: ["name", "reason"],
      properties: { name: { type: "string" }, reason: { type: "string" } },
    },
    loops: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "why"],
        properties: { id: { type: "string", description: "A loop id from the crate list, exactly." }, why: { type: "string" } },
      },
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "options"],
        properties: {
          question: { type: "string" },
          options: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["label"],
              properties: { label: { type: "string" }, url: { type: "string", description: "For a track option: its SoundCloud URL from the playlists." } },
            },
          },
        },
      },
    },
    groups: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "reason", "trackIds"],
        properties: { name: { type: "string" }, reason: { type: "string" }, trackIds: { type: "array", items: { type: "string" } } },
      },
    },
    profileUpdate: {
      type: "object",
      additionalProperties: false,
      required: ["text", "note"],
      properties: {
        text: { type: "string", description: "The whole taste profile as it should now read." },
        note: { type: "string", description: "One short line starting 'Updated: '." },
      },
    },
  },
} as const;

/** What a job's answer must contain beyond sentences. */
export type Needs = {
  loopIds?: ReadonlySet<string>;
  trackIds?: ReadonlySet<string>;
  /** URLs seen in this answer's web search results; listen-next links must be among them. */
  searchUrls?: ReadonlySet<string>;
  /** urlKey → the search result's page title: a pick's link must name the pick (Re-run 4). */
  searchTitles?: ReadonlyMap<string, string>;
  /** Track id → how its key sits against the crate (studio.ts keyNote); a Studio start may not
   *  say the bass and chords fit when it clashes. */
  keyRelations?: ReadonlyMap<string, string>;
  /** Track id → the clock times Ears listened at ("2:55"); ear training anchors to these. */
  snippetTimes?: ReadonlyMap<string, readonly string[]>;
  /** Lines the person wrote themselves: a profile update must keep each word for word. */
  keepLines?: readonly string[];
  /** F4: every tempo the facts give (lead and other readings, Studio tempo); a BPM figure in an
   *  answer must be one of these (±0.6), so no half/double maths slips into prose. */
  bpms?: readonly number[];
  /** Chat: library refs (T1…) → track ids; trackIds outside it are dropped. */
  trackRefs?: ReadonlyMap<string, string>;
  /** Lab (B6): the person's question, so a question about tone gets "I can't hear that" said. */
  labQuestion?: string;
  /** Lab (LS2-M6): the bar isn't heard yet: the loop to suggest ("bars 49–56"). */
  labUnheard?: string;
};

/** A tempo or key stated as a number in a listen-next "because" (data-evals: two were wrong; the
 *  model can't check them against what it found, so the reason is given in words). */
/** Download and file-sharing sites (usually unlicensed): never linked (data-evals re-run). */
const DOWNLOAD_HOST = /(^|\.)(edmdls|zippyshare|mediafire|4shared|rapidgator|nitroflare|uploaded|turbobit|mega|krakenfiles|hitfile|katfile)\.[a-z.]+$|mp3|download|flac|320kbps/i;
export function isDownloadLink(u: string): boolean {
  try {
    const url = new URL(u);
    return DOWNLOAD_HOST.test(url.hostname) || /\.(mp3|zip|rar|flac|wav)(\?|$)/i.test(url.pathname);
  } catch {
    return true;
  }
}

/** F2: a chart, playlist or compilation named as if it were a track. */
const NOT_A_TRACK = /\b(top\s*\d+|charts?|playlists?|compilations?|best of|various artists|hits of|\d{4}\s+(?:selection|list|mix)|essential mix|tracklist)\b/i;
const RESEARCH_TALK = /\b(search(?:ed|ing)?|similar[- ]songs?|lists?|queues?|found|took these|pulled these|according to|web ?page|charts?)\b/i;
const UPLOADER_TALK = /\buploader\b|\btagged\b|\b(?:genre )?tags?\b/i;
const EARS_NUMBER = /\b\d{2,3}(?:[.,]\d)?\s*(?:bpm|%)/i;
const KEY_FITS_CLAIM = /\b(bass|chords?|every loop|all (?:the )?loops)\b[^.]*\b(fit|fits|sit|sits|blend|blends|together|match|matches|work)\b|\bsame key\b/i;
const KEY_CLASH_WORDS = /\b(clash|clashes|clashing|not|won't|don't|doesn't|wouldn't|only)\b/i;
const CLOCK = /\b\d{1,2}:[0-5]\d\b/g;
const BPM_FIGURE = /\b(\d{2,3}(?:[.,]\d)?)\s*bpm\b/gi;

const NUMERIC_FACT = /\b\d{2,3}(?:[.,]\d)?\s*bpm\b|\b(?:1[0-2]|[1-9])[ab]\b|\b[a-g](?:#|b|♯|♭)?\s+(?:major|minor)\b/i;

export type Checked = { ok: true; answer: MentorAnswer; dropped: string[] } | { ok: false; problem: string };

const str = (v: unknown, max = 2000) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const isUrl = (v: unknown): v is string => typeof v === "string" && /^https?:\/\/\S+$/i.test(v.trim());
const isSection = (v: unknown): v is TeachSection => typeof v === "string" && (TEACH_SECTIONS as readonly string[]).includes(v);
const KINDS: LinkKind[] = ["track", "artist", "playlist", "chart", "article"];
const fold = (t: string) => t.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
/** Whether a search result's title names the pick: its main artist or its title (without the
 *  remix part), as whole words. */
export function namesPick(pageTitle: string | undefined, artist: string, title: string): boolean {
  if (!pageTitle) return false;
  const page = ` ${fold(pageTitle)} `;
  const mainArtist = fold(artist.split(/\s*(?:,|&|\bfeat\.?|\bft\.?|\bx\b|\band\b)\s*/i)[0] ?? "");
  const core = fold(title.replace(/\([^)]*\)|\[[^\]]*\]/g, ""));
  return (mainArtist.length >= 3 && page.includes(` ${mainArtist} `)) || (core.length >= 4 && page.includes(` ${core} `));
}
export const soundcloudSearch = (artist: string, title: string) => `https://soundcloud.com/search?q=${encodeURIComponent(`${artist} ${title}`)}`;
/** N4: a SoundCloud or Bandcamp profile is an artist page, whatever the model called it. */
export function linkKind(u: string, said: LinkKind): LinkKind {
  try {
    const url = new URL(u);
    const host = url.hostname.replace(/^(www|m)\./, "");
    const parts = url.pathname.split("/").filter(Boolean);
    if (host === "soundcloud.com" && parts.length === 1) return "artist";
    if (host === "soundcloud.com" && parts[1] === "sets") return "playlist";
    if (host.endsWith(".bandcamp.com") && (parts.length === 0 || parts[0] === "music")) return "artist";
    return said;
  } catch {
    return said;
  }
}
const INTERVAL_JARGON = /\b(?:minor|major|perfect|diminished|augmented) (?:second|third|fourth|fifth|sixth|seventh)s?\b(?!\s*\()/i;
/** N5: Studio start talks about keys in plain words. */
const KEY_JARGON = /semitone|key wheel|camelot|\b(?:1[0-2]|[1-9])[AB]\b/;
/** At most this many sentences per answer (F8): 2–4 everywhere but teach. */
/** Clutter review: chat, explain and genre answers say 2–3 sentences first, the rest behind "Tell me more". */
export const maxSentences = (job: Job) => (job === "teach" ? 10 : job === "chat" || job === "explain" || job === "suggest_genre" ? 2 : job === "ear_training" || job === "lab" ? 3 : 4);
/** Raw measurement jargon the person shouldn't see (F2): say bright/warm, loud/quiet, likely/unsure. */
const RAW_NUMBERS = /\b\d+(?:[.,]\d+)?\s*(?:k?hz|dbfs|db)\b|spectral centroid|\bcentroid\b|\bdbfs\b|\bstrength\s*(?:of\s*)?[01]?[.,]\d+/i;
const isSource = (v: unknown): v is Source => typeof v === "string" && (SOURCES as readonly string[]).includes(v);
/** Same page, ignoring a trailing slash, the fragment and http/https. */
export const urlKey = (u: string) => u.trim().replace(/^https?:\/\//i, "").replace(/#.*$/, "").replace(/\/+$/, "").toLowerCase();

/** Validate and clean the model's answer for a job. Unknown fields are dropped. */
export function checkAnswer(asked: Job, raw: unknown, needs: Needs = {}): Checked {
  if (!raw || typeof raw !== "object") return { ok: false, problem: "The answer is not an object." };
  const r = raw as Record<string, unknown>;
  // A chat answer is checked by the rules of the job it turned out to be (L87).
  const job = ruleJob(asked, r.intent);
  const dropped: string[] = [];

  if (!Array.isArray(r.sentences) || r.sentences.length === 0) return { ok: false, problem: "sentences must be a non-empty array." };
  const sentences: Sentence[] = [];
  for (const [i, s] of r.sentences.entries()) {
    const o = (s ?? {}) as Record<string, unknown>;
    const text = str(o.text);
    if (!text) return { ok: false, problem: `sentences[${i}] has no text.` };
    if (!isSource(o.source)) return { ok: false, problem: `sentences[${i}] has no valid source (one of ${SOURCES.join(", ")}).` };
    if (o.source === "web" && !isUrl(o.url)) return { ok: false, problem: `sentences[${i}] is from the web but has no url.` };
    if (RAW_NUMBERS.test(text)) return { ok: false, problem: `sentences[${i}] uses raw measurement numbers ("${text.match(RAW_NUMBERS)?.[0]}"): describe them in words (bright/warm, loud/quiet, likely/unsure), no Hz, dBFS, centroid or strength figures.` };
    // Where picks or facts were found is web, with the page: never general (Re-run 4).
    if ((job === "listen_next" || job === "teach") && o.source === "general" && RESEARCH_TALK.test(text)) {
      return { ok: false, problem: `sentences[${i}] says where you found something ("${text.match(RESEARCH_TALK)?.[0]}") but is labelled general: label it web with that page's URL, or leave it out.` };
    }
    // One source per sentence: an uploader tag and an Ears number don't share one.
    if ((o.source === "ears" && UPLOADER_TALK.test(text)) || (o.source === "uploader" && EARS_NUMBER.test(text))) {
      return { ok: false, problem: `sentences[${i}] mixes the uploader's title or tags with Ears' measurements: split it into an uploader sentence and an ears sentence.` };
    }
    if (job === "ear_training" && /\d\s*%/.test(text)) return { ok: false, problem: `sentences[${i}] has a percentage: ear-training cues name the style Ears heard there, without percentages.` };
    // Ear training only: other answers may quote general genre tempo ranges.
    if (job === "ear_training" && needs.bpms?.length) {
      for (const m of text.matchAll(BPM_FIGURE)) {
        const v = Number(m[1].replace(",", "."));
        if (!needs.bpms.some((b) => Math.abs(b - v) <= 0.6)) {
          return { ok: false, problem: `sentences[${i}] states ${m[0]}, which isn't a tempo in the facts. Quote tempos exactly as the facts give them (lead or other reading); never work out half or double time yourself.` };
        }
      }
    }
    // B6: the Mentor never claims to have heard the part (it gets numbers only).
    if (job === "lab" && HEARD_CLAIM.test(text)) {
      return { ok: false, problem: `sentences[${i}] claims to hear the audio ("${text.match(HEARD_CLAIM)?.[0]}"): you get numbers only. Say what the measurements or the map show instead ("the loop measures…", "the map estimates…").` };
    }
    // LS2-M5: plain words for a beginner: an interval name only with a short explanation in brackets.
    if (job === "lab" && INTERVAL_JARGON.test(text)) {
      return { ok: false, problem: `sentences[${i}] uses theory jargon ("${text.match(INTERVAL_JARGON)?.[0]}"): say it in plain words ("three notes up"), or explain it in brackets right after.` };
    }
    if (job === "studio_start" && KEY_JARGON.test(text)) {
      return { ok: false, problem: `sentences[${i}] uses key jargon ("${text.match(KEY_JARGON)?.[0]}"): say it in plain words ("the bass and chords would clash, drums still fit").` };
    }
    const sentence: Sentence = o.url && isUrl(o.url) ? { text, source: o.source, url: o.url.trim() } : { text, source: o.source };
    if (job === "teach") sentence.section = isSection(o.section) ? o.section : sentences.at(-1)?.section ?? "what";
    sentences.push(sentence);
  }
  if (sentences.length > maxSentences(job)) {
    return { ok: false, problem: `${sentences.length} sentences: keep to at most ${maxSentences(job)} and offer tellMore for the rest.` };
  }
  const answer: MentorAnswer = { sentences, tellMore: r.tellMore === true };
  // LS2-M6: a bar not heard yet gets the map's estimate and the loop to hear it, nothing more.
  if (job === "lab" && needs.labUnheard) {
    const loopLine = `Loop ${needs.labUnheard} to hear it and get its notes.`;
    if (sentences.length > 2 || !sentences.some((x) => x.text.includes(loopLine))) {
      return { ok: false, problem: `Bar not heard yet: answer in two sentences: what the map estimates there, then exactly "${loopLine}"` };
    }
    if (sentences.some((x) => /\bchords?\b/i.test(x.text))) return { ok: false, problem: "Bar not heard yet: no chords. Say what the map estimates, then the loop line." };
  }
  // B6: a question about tone gets one plain line that you can't hear it (and what you can measure).
  if (job === "lab" && needs.labQuestion && TONE_QUESTION.test(needs.labQuestion) && !sentences.some((x) => CANT_HEAR.test(x.text))) {
    return { ok: false, problem: `The question is about tone or sound ("${needs.labQuestion.match(TONE_QUESTION)?.[0]}"), which you can't hear: say so in one sentence: "I can't hear the sound itself; I read measurements: pitch, timing and loudness.", then answer from what the numbers do show.` };
  }
  // Studio start: the key fit comes from code; claiming bass and chords fit over a clash is rejected.
  if (job === "studio_start" && needs.keyRelations && Array.isArray(r.trackIds)) {
    const first = typeof r.trackIds[0] === "string" ? needs.trackRefs?.get(r.trackIds[0].trim().toUpperCase()) ?? r.trackIds[0] : null;
    if (first && needs.keyRelations.get(first) === "far") {
      const bad = sentences.find((x) => KEY_FITS_CLAIM.test(x.text) && !KEY_CLASH_WORDS.test(x.text));
      if (bad) return { ok: false, problem: `"${bad.text}" says the loops fit, but the track's key clashes with the crate's A minor: the bass and chords would clash, only drums and percussion fit. Say that instead.` };
    }
  }
  // Ear training anchors to where Ears listened when it listened at two or more points (Re-run 4).
  if (job === "ear_training" && needs.snippetTimes && Array.isArray(r.trackIds)) {
    const first = typeof r.trackIds[0] === "string" ? needs.trackRefs?.get(r.trackIds[0].trim().toUpperCase()) ?? r.trackIds[0] : null;
    const times = first ? needs.snippetTimes.get(first) : undefined;
    if (times && times.length >= 2) {
      const used = new Set(sentences.flatMap((x) => x.text.match(CLOCK) ?? []).filter((t) => times.includes(t)));
      if (used.size < 2) return { ok: false, problem: `Anchor the moments to the times Ears listened at (${times.join(", ")}) and what it measured there, at least two of them; no early / middle / end.` };
    }
  }
  if (asked === "chat") {
    answer.intent = isIntent(r.intent) ? r.intent : "chat";
    const ids = (Array.isArray(r.trackIds) ? r.trackIds : [])
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .map((x) => needs.trackRefs?.get(x.toUpperCase()) ?? ([...(needs.trackRefs?.values() ?? [])].includes(x) ? x : null))
      .filter((x): x is string => !!x);
    answer.trackIds = [...new Set(ids)].slice(0, 10);
  }

  if (r.genre && typeof r.genre === "object") {
    const g = r.genre as Record<string, unknown>;
    const name = str(g.name, 80), reason = str(g.reason, 600);
    if (name && reason) answer.genre = { name, reason };
  }
  if (Array.isArray(r.listenNext)) {
    const list: ListenNext[] = [];
    for (const x of r.listenNext) {
      const o = (x ?? {}) as Record<string, unknown>;
      const artist = str(o.artist, 120), title = str(o.title, 200), because = str(o.because, 400);
      if (job === "listen_next" && because && NUMERIC_FACT.test(because)) {
        return { ok: false, problem: `The "because" for ${artist} – ${title} states a tempo or key ("${because.match(NUMERIC_FACT)?.[0]}"). Give the reason in words ("a similar tempo", "the same dark, driving feel") without BPM, key or Camelot numbers.` };
      }
      if (job === "listen_next" && artist && title && (NOT_A_TRACK.test(artist) || NOT_A_TRACK.test(title))) {
        return { ok: false, problem: `"${artist} – ${title}" is a chart, playlist or compilation, not a track. Every pick must be one named track (artist and track title); link the chart page with kind chart if that's where you found it.` };
      }
      if (!artist || !title || !because || !isUrl(o.url)) {
        dropped.push(`listen-next item without artist, title, link or because`);
        continue;
      }
      if (isDownloadLink(o.url)) {
        dropped.push(`${artist} – ${title}: no clean link (download site)`);
        continue;
      }
      // A pick's link must lead to that pick: from this answer's search results, its page title
      // naming the artist or the title, and not already used for another pick. Otherwise the pick
      // keeps its name and links a SoundCloud search for it (Re-run 4).
      const key = urlKey(o.url);
      const fromSearch = !needs.searchUrls || needs.searchUrls.has(key);
      const named = !needs.searchTitles || namesPick(needs.searchTitles.get(key), artist, title);
      const reused = list.some((x) => urlKey(x.url) === key);
      const item: ListenNext = fromSearch && named && !reused
        ? { artist, title, url: o.url.trim(), because, kind: linkKind(o.url.trim(), KINDS.includes(o.kind as LinkKind) ? (o.kind as LinkKind) : "article") }
        : { artist, title, url: soundcloudSearch(artist, title), because, kind: "search" };
      if (job === "teach" && isSection(o.section)) item.section = o.section;
      list.push(item);
    }
    // Three picks at most (F4); track pages first.
    answer.listenNext = [...list].sort((a, b) => Number(b.kind === "track") - Number(a.kind === "track")).slice(0, 3);
  }
  if (Array.isArray(r.loops)) {
    const picks: LoopPick[] = [];
    for (const x of r.loops) {
      const o = (x ?? {}) as Record<string, unknown>;
      const id = str(o.id, 60);
      if (!id) continue;
      if (needs.loopIds && !needs.loopIds.has(id)) {
        dropped.push(`loop "${id}" is not in the crate`);
        continue;
      }
      if (!picks.some((p) => p.id === id)) picks.push({ id, why: str(o.why, 300) ?? "" });
    }
    answer.loops = picks.slice(0, 6);
  }
  if (Array.isArray(r.questions)) {
    answer.questions = r.questions
      .map((x) => {
        const o = (x ?? {}) as Record<string, unknown>;
        const question = str(o.question, 300);
        const options = (Array.isArray(o.options) ? o.options : [])
          .map((y) => {
            const p = (y ?? {}) as Record<string, unknown>;
            const label = str(p.label, 160);
            return label ? (isUrl(p.url) ? { label, url: p.url.trim() } : { label }) : null;
          })
          .filter((y): y is { label: string; url?: string } => y !== null)
          .slice(0, 5);
        return question && options.length >= 2 ? { question, options } : null;
      })
      .filter((x): x is Question => x !== null)
      .slice(0, 5);
  }
  if (Array.isArray(r.groups)) {
    answer.groups = r.groups
      .map((x) => {
        const o = (x ?? {}) as Record<string, unknown>;
        const name = str(o.name, 80), reason = str(o.reason, 600);
        const ids = (Array.isArray(o.trackIds) ? o.trackIds : []).filter(
          (id): id is string => typeof id === "string" && (!needs.trackIds || needs.trackIds.has(id)),
        );
        return name && reason && ids.length >= 2 ? { name, reason, trackIds: [...new Set(ids)] } : null;
      })
      .filter((x): x is GroupProposal => x !== null);
  }
  if (r.profileUpdate && typeof r.profileUpdate === "object") {
    const p = r.profileUpdate as Record<string, unknown>;
    const text = str(p.text, 8000), note = str(p.note, 200);
    if (text && note) answer.profileUpdate = { text, note: note.startsWith("Updated:") ? note : `Updated: ${note}` };
  }

  // The person's own lines survive every profile update (setup merges, learning adjusts).
  if (answer.profileUpdate && needs.keepLines?.length) {
    const gone = missingLines(answer.profileUpdate.text, needs.keepLines);
    if (gone.length) return { ok: false, problem: `profileUpdate dropped lines it must keep; keep each word for word: ${gone.map((l) => `"${l}"`).join(" ")}` };
  }

  // What each job must have.
  if (job === "suggest_genre" && !answer.genre) return { ok: false, problem: "suggest_genre needs genre {name, reason}." };
  if (job === "studio_start" && !answer.loops?.length) return { ok: false, problem: "studio_start needs at least one loop id from the crate." };
  if (job === "setup") {
    // Name exactly what's missing, so the retry adds it (a vague message got the same answer back).
    const missing = [
      !answer.profileUpdate && "profileUpdate (the whole profile, with a one-line note)",
      (answer.questions?.length ?? 0) < 3 && `questions: 3–5 tap questions with 2–4 options each (got ${answer.questions?.length ?? 0})`,
    ].filter(Boolean);
    if (missing.length) return { ok: false, problem: `setup is missing ${missing.join(" and ")}.` };
  }
  if (job === "learn" && !answer.profileUpdate) return { ok: false, problem: "learn needs profileUpdate." };
  if (job === "propose_groups" && !answer.groups) return { ok: false, problem: "propose_groups needs groups (may be empty)." };
  return { ok: true, answer, dropped };
}

/** The answer as plain text, for the thread history the next turn reads. */
export function answerText(a: MentorAnswer): string {
  const parts = [a.sentences.map((s) => s.text).join(" ")];
  if (a.genre) parts.push(`Suggested genre: ${a.genre.name} (${a.genre.reason})`);
  if (a.loops?.length) parts.push(`Loops: ${a.loops.map((l) => l.id).join(", ")}`);
  if (a.listenNext?.length) parts.push(`Listen next: ${a.listenNext.map((l) => `${l.artist} – ${l.title}`).join("; ")}`);
  return parts.join("\n");
}
