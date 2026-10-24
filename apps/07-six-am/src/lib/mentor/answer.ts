// The Mentor's structured answer: what the model returns through the `answer` tool, and the
// checks it must pass before anyone sees it (M2 source on every fact, M6 real loops, M7 real
// links). Pure, shared by the server and the panel.

export const JOBS = [
  "explain", "suggest_genre", "teach", "ear_training", "studio_start", "listen_next", "chat",
  "setup", "learn", "propose_groups", "taste_session",
] as const;
export type Job = (typeof JOBS)[number];
export const isJob = (v: unknown): v is Job => typeof v === "string" && (JOBS as readonly string[]).includes(v);

/** Where a fact came from. Ears = the browser's measurements; uploader = SoundCloud title/tags. */
export const SOURCES = ["ears", "uploader", "web", "profile", "general"] as const;
export type Source = (typeof SOURCES)[number];

export type Sentence = { text: string; source: Source; url?: string };
export type ListenNext = { artist: string; title: string; url: string; because: string };
export type GenreCall = { name: string; reason: string };
export type LoopPick = { id: string; why: string };
export type Question = { question: string; options: { label: string; url?: string }[] };
export type GroupProposal = { name: string; reason: string; trackIds: string[] };
export type ProfileUpdate = { text: string; note: string };

export type MentorAnswer = {
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
        properties: { artist: { type: "string" }, title: { type: "string" }, url: { type: "string" }, because: { type: "string" } },
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
};

export type Checked = { ok: true; answer: MentorAnswer; dropped: string[] } | { ok: false; problem: string };

const str = (v: unknown, max = 2000) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const isUrl = (v: unknown): v is string => typeof v === "string" && /^https?:\/\/\S+$/i.test(v.trim());
const isSource = (v: unknown): v is Source => typeof v === "string" && (SOURCES as readonly string[]).includes(v);
/** Same page, ignoring a trailing slash, the fragment and http/https. */
export const urlKey = (u: string) => u.trim().replace(/^https?:\/\//i, "").replace(/#.*$/, "").replace(/\/+$/, "").toLowerCase();

/** Validate and clean the model's answer for a job. Unknown fields are dropped. */
export function checkAnswer(job: Job, raw: unknown, needs: Needs = {}): Checked {
  if (!raw || typeof raw !== "object") return { ok: false, problem: "The answer is not an object." };
  const r = raw as Record<string, unknown>;
  const dropped: string[] = [];

  if (!Array.isArray(r.sentences) || r.sentences.length === 0) return { ok: false, problem: "sentences must be a non-empty array." };
  const sentences: Sentence[] = [];
  for (const [i, s] of r.sentences.entries()) {
    const o = (s ?? {}) as Record<string, unknown>;
    const text = str(o.text);
    if (!text) return { ok: false, problem: `sentences[${i}] has no text.` };
    if (!isSource(o.source)) return { ok: false, problem: `sentences[${i}] has no valid source (one of ${SOURCES.join(", ")}).` };
    if (o.source === "web" && !isUrl(o.url)) return { ok: false, problem: `sentences[${i}] is from the web but has no url.` };
    sentences.push(o.url && isUrl(o.url) ? { text, source: o.source, url: o.url.trim() } : { text, source: o.source });
  }
  const answer: MentorAnswer = { sentences, tellMore: r.tellMore === true };

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
      if (!artist || !title || !because || !isUrl(o.url)) {
        dropped.push(`listen-next item without artist, title, link or because`);
        continue;
      }
      if (needs.searchUrls && !needs.searchUrls.has(urlKey(o.url))) {
        dropped.push(`${artist} – ${title}: link not from this answer's web search`);
        continue;
      }
      list.push({ artist, title, url: o.url.trim(), because });
    }
    answer.listenNext = list.slice(0, 6);
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

  // What each job must have.
  if (job === "suggest_genre" && !answer.genre) return { ok: false, problem: "suggest_genre needs genre {name, reason}." };
  if (job === "studio_start" && !answer.loops?.length) return { ok: false, problem: "studio_start needs at least one loop id from the crate." };
  if (job === "setup" && (!answer.profileUpdate || (answer.questions?.length ?? 0) < 3)) {
    return { ok: false, problem: "setup needs profileUpdate and 3–5 questions with 2+ options each." };
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
