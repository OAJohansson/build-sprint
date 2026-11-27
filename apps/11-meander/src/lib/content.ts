// Typed loader for each field's content (phase 4: philosophy and music). A field's schools, thinkers, themes and
// links live as JSON in src/content/<field>/, separate from the code, so sourced content can replace a sample without
// code changes. Music uses philosophy's slots under its own words (L49): genres are schools, "Listen for" lines are
// questions, hallmarks are themes, artists are thinkers. Sphere positions are precomputed by
// `pnpm -F 11-meander positions [music]` (scripts/embed-positions.mjs).
import pSchools from "@/content/philosophy/schools.json";
import pThinkers from "@/content/philosophy/thinkers.json";
import pLinks from "@/content/philosophy/links.json";
import pPositions from "@/content/philosophy/positions.json";
import pPlaces from "@/content/philosophy/places.json";
import pEras from "@/content/philosophy/eras.json";
import mSchools from "@/content/music/schools.json";
import mThinkers from "@/content/music/thinkers.json";
import mLinks from "@/content/music/links.json";
import mPositions from "@/content/music/positions.json";
import mPlaces from "@/content/music/places.json";
import mEras from "@/content/music/eras.json";
import { ERAS, MUSIC_ERAS, type Era, type RawSpan } from "./timeline";

/** Where a claim comes from: a reference URL and the section that supports it. */
export type Source = { url: string; section?: string; quote?: string };

/** A landmark recording (L48): a click opens a search for it, nothing is hosted or embedded. */
export type Recording = { artist?: string; title: string; year: number | null; kind: "song" | "album" };

export type Theme = {
  name: string;
  /** Two or three sentences (L12). Empty while the content is being written. */
  text: string;
  /** Ids of the thinkers this theme belongs to. */
  thinkers: string[];
  sources: Source[];
};

export type School = {
  id: string;
  name: string;
  dates: string;
  questions: string[];
  themes: Theme[];
  /** Ids into thinkers.json, in the order shown. */
  thinkers: string[];
  sources: Source[];
  sample?: boolean;
  /** "eastern" for the Eastern schools (#42); missing for the Western ones. */
  tradition?: string;
  /** "Indian · Hindu", "Chinese": the tag shown with an Eastern school (F4). */
  traditionTag?: string;
  /** Music: one of six families the globe clusters by. */
  family?: string;
  /** A one-line "what this is" written for the card; when missing, the first sentence of `description`. */
  tagline?: string;
  taglineSources?: Source[];
  /** Not shown in full; the card shows its first sentence (see `ledeOf`). */
  dateRange?: string;
  era?: string;
  description?: string;
  debatable?: string | null;
  reactedAgainst?: { text: string; sources: Source[] } | null;
  questionSources?: Source[][];
  /** Music: three landmark recordings (L48). */
  recordings?: Recording[];
  /** Music: further reading given by the content itself; philosophy derives it from its citations. */
  reading?: { url: string; title: string }[];
};

export type Thinker = {
  id: string;
  name: string;
  /** Short name for inline rows ("Beauvoir"). */
  short: string;
  dates: string;
  /** The school whose card lists this thinker. */
  school: string;
  summary: string;
  ideas: string[];
  /** A hand-written study prompt; when missing, one is built from the template below. */
  prompt?: string;
  promptSources?: Source[];
  ideaSources?: Source[][];
  sources: Source[];
  sample?: boolean;
  /** Music: the artist's one recording (L48). */
  recording?: Recording;
};

/** `from` is the older school, `to` the newer one that built on it or pushed against it. */
export type Link = {
  from: string;
  to: string;
  /** "built-then-against": the newer school built on the older one, then pushed against it. "fused" (music): the
   * newer genre fused the older one with something else; drawn like "built". */
  type: "built" | "against" | "built-then-against" | "fused";
  /** A 2–4 word gloss from the research; not shown in the approved design. */
  label?: string;
  /** The same gloss as read from the older school ("from"); when missing, `label` is used from both ends. */
  labelFromOlder?: string;
  reason?: string;
  sources: Source[];
  sample?: boolean;
};

export type LatLon = [number, number];

/** Where and when a school happened, sourced separately (docs/products/11-meander/content/places.json, copied in by
 * `pnpm -F 11-meander places`; music's by `pnpm -F 11-meander music`). */
export type PlaceFacts = { places?: string[]; span?: string | null };

export type FieldId = "philosophy" | "music";
export const FIELD_IDS: FieldId[] = ["philosophy", "music"];

/** Every word the screens use that differs per field. Philosophy's are the app's words before phase 4, unchanged. */
export type Words = {
  /** The field's name in the switcher. */
  field: string;
  school: string;
  schools: string;
  /** The phone's first view (the list of all schools) and its hidden heading. */
  listMenu: string;
  listTitle: string;
  /** The card's question heading ("It asks") and the themes and thinkers headings. */
  questions: string;
  themes: string;
  thinkersHeading: string;
  idea: string;
  ideas: string;
  /** "Step inside · 5 big ideas", the phone skeleton's "5 big ideas". */
  bigIdeas: string;
  /** "Idea 2 of 5" in the skeleton's picked state. */
  ideaKick: string;
  thinker: string;
  thinkers: string;
  /** The neighbour is the subject and "it" is the focus: [the neighbour is older, the neighbour is newer]. */
  verbs: Record<Link["type"], [string, string]>;
  /** Nothing written yet for a school. */
  pending: string;
  /** Your thread with nothing begun. */
  threadEmpty: string;
  /** A school with every idea opened. */
  allSeen: string;
  timelineTitle: string;
  timelineList: string;
  /** The study prompt when the content gives none. */
  prompt: (t: Thinker, school: School | undefined) => string;
};

const PHILOSOPHY_WORDS: Words = {
  field: "Philosophy",
  school: "school",
  schools: "schools",
  listMenu: "Schools",
  listTitle: "Schools of philosophy",
  questions: "It asks",
  themes: "Themes",
  thinkersHeading: "Thinkers",
  idea: "idea",
  ideas: "ideas",
  bigIdeas: "big ideas",
  ideaKick: "Idea",
  thinker: "thinker",
  thinkers: "thinkers",
  verbs: {
    built: ["inspired it", "grew from it"],
    against: ["provoked it", "pushed back on it"],
    "built-then-against": ["inspired it, then provoked it", "grew from it, then pushed back on it"],
    fused: ["inspired it", "grew from it"],
  },
  pending: "This school’s questions, themes and thinkers are still being written.",
  threadEmpty: "Open a school to begin it. Open every one of its ideas and it shows as all ideas seen.",
  allSeen: "all ideas seen",
  timelineTitle: "The schools in time, earliest first",
  timelineList: "Schools, earliest first",
  prompt: (t, school) => {
    const ideas = t.ideas.length ? ` Cover these key ideas: ${t.ideas.join("; ")}.` : "";
    return `Teach me ${t.name}${school ? ` (${school.name})` : ""} as a short Socratic module. Start with the question ${t.short} was trying to answer and who they were reacting to.${ideas} Ask me one question at a time and finish with a five-question quiz.`;
  },
};

// Link words (L49): "grew out of", "reacted against", "fused with", read with the neighbour as the subject like
// philosophy's ("Disco / gave rise to it" on House's globe, "House / grew out of it" on Disco's).
const MUSIC_WORDS: Words = {
  field: "Music",
  school: "genre",
  schools: "genres",
  listMenu: "Genres",
  listTitle: "Genres of music",
  questions: "Listen for",
  themes: "Hallmarks",
  thinkersHeading: "Artists",
  idea: "hallmark",
  ideas: "hallmarks",
  bigIdeas: "hallmarks",
  ideaKick: "Hallmark",
  thinker: "artist",
  thinkers: "artists",
  verbs: {
    built: ["gave rise to it", "grew out of it"],
    against: ["provoked it", "reacted against it"],
    "built-then-against": ["gave rise to it, then provoked it", "grew out of it, then reacted against it"],
    fused: ["fused with it", "fused with it"],
  },
  pending: "This genre’s listening notes, hallmarks and artists are still being written.",
  threadEmpty: "Open a genre to begin it. Open every one of its hallmarks and it shows as all hallmarks seen.",
  allSeen: "all hallmarks seen",
  timelineTitle: "The genres in time, earliest first",
  timelineList: "Genres, earliest first",
  prompt: (t, school) => {
    const ideas = t.ideas.length ? ` Cover these contributions: ${t.ideas.join("; ")}.` : "";
    const rec = t.recording ? ` Start with ${t.recording.title}${t.recording.year ? ` (${t.recording.year})` : ""}: what to listen for in it.` : "";
    return `Teach me ${t.name}${school ? ` (${school.name})` : ""} as a short listening module.${rec}${ideas} Ask me one question at a time and finish with a five-question quiz.`;
  },
};

export type Fact = { label: string; value: string };
export type Neighbour = {
  school: School; verb: string; against: boolean; link: Link;
  /** The link's short reason as read from the focused school (L20). */
  reason: string;
};

export type Field = {
  id: FieldId;
  words: Words;
  schools: School[];
  thinkers: Thinker[];
  links: Link[];
  positions: Record<string, LatLon>;
  /** True while any part of the content is an unchecked sample. */
  isSample: boolean;
  /** The timeline: its eras, each school's years, and the year ticks under the axis. */
  eras: Era[];
  spans: Record<string, RawSpan>;
  ticks: number[];
  getSchool: (id: string) => School | undefined;
  getThinker: (id: string) => Thinker | undefined;
  /** What a neighbour did, seen from the focused school ("Marxism / inspired it", owner feedback #23). */
  verbFor: (link: Link, focus: string) => string;
  /** Schools one thread away from `focus`, in link order. */
  neighbours: (focus: string) => Neighbour[];
  /** The prompt "Study with Claude" copies. Always names the thinker (R4). */
  studyPrompt: (t: Thinker) => string;
  /** When a school happened: the sourced short span ("1843–1949") when there is one, else its dates. */
  whenOf: (s: School) => string;
  /** "Indian · 5th century BCE – …": the tradition (Eastern schools only), the name's aside and when. */
  metaLine: (s: School) => string;
  /** The line under a school's title: "Frankfurt School · 1923 – present · you are here". */
  hereLine: (s: School) => string;
  /** The same thinker's card in other schools (Sartre, Beauvoir): matched by name (L20, "Also in"). */
  alsoIn: (t: Thinker) => Thinker[];
  /** Thinkers' short names ("Kierkegaard"), skipping ids the content no longer has. */
  surnames: (ids: string[]) => string[];
  /** The first page's labelled lines (L32): When / Where / Inside, each only when we have data for it. */
  schoolFacts: (s: School) => Fact[];
};

type Raw = {
  id: FieldId; words: Words; eras: Era[]; ticks: number[];
  schools: { sample?: boolean; schools: unknown }; thinkers: { sample?: boolean; thinkers: unknown }; links: { sample?: boolean; links: unknown };
  positions: unknown; places: unknown; spans: { eras: unknown };
};

function makeField(raw: Raw): Field {
  const schools = raw.schools.schools as School[];
  const thinkers = raw.thinkers.thinkers as Thinker[];
  const links = raw.links.links as Link[];
  const positions = raw.positions as Record<string, LatLon>;
  const placesFile = raw.places as Record<string, PlaceFacts>;
  const words = raw.words;
  const schoolMap = new Map(schools.map((s) => [s.id, s]));
  const thinkerMap = new Map(thinkers.map((t) => [t.id, t]));

  // Fail the build loudly if the data files disagree with each other.
  for (const s of schools) {
    if (!positions[s.id]) throw new Error(`content: no position for ${raw.id} "${s.id}"; run pnpm -F 11-meander positions ${raw.id}`);
    for (const t of s.thinkers) if (!thinkerMap.has(t)) throw new Error(`content: ${raw.id} "${s.id}" lists unknown thinker "${t}"`);
  }
  for (const l of links) {
    if (!schoolMap.has(l.from) || !schoolMap.has(l.to)) throw new Error(`content: ${raw.id} link ${l.from} → ${l.to} names an unknown school`);
  }

  const verbFor = (link: Link, focus: string) => {
    const [older, newer] = words.verbs[link.type] ?? words.verbs.built;
    return focus === link.to ? older : newer; // focus is the newer end: the neighbour is the older one
  };
  const whenOf = (s: School) => placesFile[s.id]?.span || s.dates;
  const metaLine = (s: School) => [traditionOf(s), splitName(s.name).aside, whenOf(s)].filter(Boolean).join(" · ");
  const surnames = (ids: string[]) => ids.map((id) => thinkerMap.get(id)?.short).filter((s): s is string => !!s);
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return {
    id: raw.id,
    words,
    schools,
    thinkers,
    links,
    positions,
    isSample: Boolean(raw.schools.sample || raw.thinkers.sample || raw.links.sample),
    eras: raw.eras,
    spans: raw.spans.eras as Record<string, RawSpan>,
    ticks: raw.ticks,
    getSchool: (id) => schoolMap.get(id),
    getThinker: (id) => thinkerMap.get(id),
    verbFor,
    neighbours: (focus) =>
      links
        .filter((l) => l.from === focus || l.to === focus)
        .map((l) => ({
          school: schoolMap.get(l.from === focus ? l.to : l.from)!,
          verb: verbFor(l, focus),
          against: l.type === "against" || l.type === "built-then-against",
          reason: reasonFor(l, focus),
          link: l,
        })),
    studyPrompt: (t) => t.prompt || words.prompt(t, schoolMap.get(t.school)),
    whenOf,
    metaLine,
    hereLine: (s) => [metaLine(s), "you are here"].filter(Boolean).join(" · "),
    alsoIn: (t) => thinkers.filter((o) => o.name === t.name && o.id !== t.id),
    surnames,
    schoolFacts: (s) => {
      const p = placesFile[s.id];
      const when = whenOf(s);
      const where = p?.places?.filter(Boolean).join(", ");
      // shortcut: no key-works list in the content yet, so Inside never shows " · K key works"; add it from a works count per school when one is sourced.
      const inside = [
        s.themes.length && plural(s.themes.length, words.idea, words.ideas),
        s.thinkers.length && plural(s.thinkers.length, words.thinker, words.thinkers),
      ].filter(Boolean).join(" · ");
      return [
        when && { label: "When", value: when },
        where && { label: "Where", value: where },
        inside && { label: "Inside", value: inside },
      ].filter((f): f is Fact => !!f);
    },
  };
}

const FIELDS: Record<FieldId, Field> = {
  philosophy: makeField({
    id: "philosophy", words: PHILOSOPHY_WORDS, eras: ERAS, ticks: [-500, 1, 500, 1000, 1500, 1800, 1900, 2000],
    schools: pSchools, thinkers: pThinkers, links: pLinks, positions: pPositions, places: pPlaces, spans: pEras,
  }),
  music: makeField({
    id: "music", words: MUSIC_WORDS, eras: MUSIC_ERAS, ticks: [1900, 1920, 1940, 1960, 1970, 1980, 1990, 2000, 2010, 2020],
    schools: mSchools, thinkers: mThinkers, links: mLinks, positions: mPositions, places: mPlaces, spans: mEras,
  }),
};

export const isFieldId = (v: unknown): v is FieldId => typeof v === "string" && (FIELD_IDS as string[]).includes(v);
export const getField = (id: FieldId): Field => FIELDS[id] ?? FIELDS.philosophy;

// ---------- the same in every field ----------

/** A link's gloss read from `focus`: the older end uses `labelFromOlder` when the writer gave one. */
export const reasonFor = (link: Link, focus: string) =>
  (focus === link.from ? link.labelFromOlder || link.label : link.label) ?? "";

/** "Critical Theory (Frankfurt School)" → { short: "Critical Theory", aside: "Frankfurt School" }. The globe and
 * the title use the short name; the aside goes into the line under the title. */
export function splitName(name: string): { short: string; aside: string } {
  const m = name.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  return m ? { short: m[1], aside: m[2] } : { short: name, aside: "" };
}

/** The one line under a school's name in the card (L20): its tagline, or the first sentence of its description. */
export function ledeOf(s: School): string {
  if (s.tagline) return s.tagline;
  const d = s.description ?? "";
  return d.split(/(?<=[.!?])\s+(?=[A-Z])/)[0] ?? "";
}

/** The quiet tradition tag for the Eastern schools (#42, F4): "Indian · Hindu", "Chinese". Set in the content import;
 * Western schools have none, since the field was all Western until now. */
export const traditionOf = (s: School): string => s.traditionTag ?? "";

/** A sentence ends at . ! or ? followed by a space and a capital, opening quote or bracket. */
const SENTENCE_END = /(?<=[.!?])\s+(?=['"‘“(]?[A-Z])/;
export const firstSentence = (text: string) => text.trim().split(SENTENCE_END)[0] ?? "";

/** "Kierkegaard, Sartre and Beauvoir". */
export const andList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/** A theme's short summary for the skeleton's picked state. */
// shortcut: themes have no short summary yet, so this is the first sentence of `text`; write a `summary` per theme and use it here.
export const themeSummary = (t: Theme) => firstSentence(t.text);

/** One click to hear a recording (L48): a YouTube search for artist and title, so a removed video never breaks it. */
export const listenUrl = (r: Recording, artist = r.artist ?? "") =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${r.title}`.trim())}`;
