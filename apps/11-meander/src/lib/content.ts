// Typed loader for the field's content. All schools, thinkers, themes and links live as JSON in
// src/content/, separate from the code, so sourced content can replace the sample without code changes.
// Sphere positions are precomputed by `pnpm -F 11-meander positions` (scripts/embed-positions.mjs).
import schoolsFile from "@/content/schools.json";
import thinkersFile from "@/content/thinkers.json";
import linksFile from "@/content/links.json";
import positionsFile from "@/content/positions.json";

/** Where a claim comes from: a reference URL and the section that supports it. */
export type Source = { url: string; section?: string; quote?: string };

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
};

/** `from` is the older school, `to` the newer one that built on it or pushed against it. */
export type Link = {
  from: string;
  to: string;
  /** "built-then-against": the newer school built on the older one, then pushed against it. */
  type: "built" | "against" | "built-then-against";
  /** A 2–4 word gloss from the research; not shown in the approved design. */
  label?: string;
  /** The same gloss as read from the older school ("from"); when missing, `label` is used from both ends. */
  labelFromOlder?: string;
  reason?: string;
  sources: Source[];
  sample?: boolean;
};

export type LatLon = [number, number];

export const schools = schoolsFile.schools as School[];
export const thinkers = thinkersFile.thinkers as Thinker[];
export const links = linksFile.links as Link[];
export const positions = positionsFile as unknown as Record<string, LatLon>;
/** True while any part of the content is the designer's unchecked sample. */
export const isSample = Boolean(schoolsFile.sample || thinkersFile.sample || linksFile.sample);

const schoolMap = new Map(schools.map((s) => [s.id, s]));
const thinkerMap = new Map(thinkers.map((t) => [t.id, t]));

// Fail the build loudly if the data files disagree with each other.
for (const s of schools) {
  if (!positions[s.id]) throw new Error(`content: no position for school "${s.id}"; run pnpm -F 11-meander positions`);
  for (const t of s.thinkers) if (!thinkerMap.has(t)) throw new Error(`content: school "${s.id}" lists unknown thinker "${t}"`);
}
for (const l of links) {
  if (!schoolMap.has(l.from) || !schoolMap.has(l.to)) throw new Error(`content: link ${l.from} → ${l.to} names an unknown school`);
}

export const getSchool = (id: string) => schoolMap.get(id);
export const getThinker = (id: string) => thinkerMap.get(id);

export type Neighbour = {
  school: School; verb: string; against: boolean; link: Link;
  /** The link's short reason as read from the focused school (L20). */
  reason: string;
};

/** A link's gloss read from `focus`: the older end uses `labelFromOlder` when the writer gave one. */
export const reasonFor = (link: Link, focus: string) =>
  (focus === link.from ? link.labelFromOlder || link.label : link.label) ?? "";

/** The verb a neighbour carries, seen from the focused school. */
export function verbFor(link: Link, focus: string) {
  const newer = focus === link.to;
  if (link.type === "built") return newer ? "built on" : "grew from it";
  // "pushed back on it", not "pushed back": the neighbour pushed against the focus (user test F3).
  if (link.type === "against") return newer ? "pushed against" : "pushed back on it";
  return newer ? "built on, then pushed against" : "grew from it, then pushed back on it";
}

/** Schools one thread away from `focus`, in link order. */
export function neighbours(focus: string): Neighbour[] {
  return links
    .filter((l) => l.from === focus || l.to === focus)
    .map((l) => ({
      school: schoolMap.get(l.from === focus ? l.to : l.from)!,
      verb: verbFor(l, focus),
      against: l.type !== "built",
      reason: reasonFor(l, focus),
      link: l,
    }));
}

/** The prompt "Study with Claude" copies. Always names the thinker (R4). */
export function studyPrompt(t: Thinker): string {
  if (t.prompt) return t.prompt;
  const school = schoolMap.get(t.school);
  const ideas = t.ideas.length ? ` Cover these key ideas: ${t.ideas.join("; ")}.` : "";
  return `Teach me ${t.name}${school ? ` (${school.name})` : ""} as a short Socratic module. Start with the question ${t.short} was trying to answer and who they were reacting to.${ideas} Ask me one question at a time and finish with a five-question quiz.`;
}

/** "Critical Theory (Frankfurt School)" → { short: "Critical Theory", aside: "Frankfurt School" }. The globe and
 * the title use the short name; the aside goes into the line under the title. */
export function splitName(name: string): { short: string; aside: string } {
  const m = name.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  return m ? { short: m[1], aside: m[2] } : { short: name, aside: "" };
}

/** The line under a school's title: "Frankfurt School · 1923 – present · you are here". */
export const hereLine = (s: School) => [splitName(s.name).aside, s.dates, "you are here"].filter(Boolean).join(" · ");

/** The one line under a school's name in the card (L20): its tagline, or the first sentence of its description. */
export function ledeOf(s: School): string {
  if (s.tagline) return s.tagline;
  const d = s.description ?? "";
  return d.split(/(?<=[.!?])\s+(?=[A-Z])/)[0] ?? "";
}

/** The same thinker's card in other schools (Sartre, Beauvoir): matched by name (L20, "Also in"). */
export const alsoIn = (t: Thinker): Thinker[] => thinkers.filter((o) => o.name === t.name && o.id !== t.id);
