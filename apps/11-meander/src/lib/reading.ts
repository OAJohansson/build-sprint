// Further reading per school (#39): the encyclopedia entries the school's content already cites, deduped by URL.
// "Start here" is the entry cited most often; "Go deeper" is up to two more, by how often they are cited.
import titlesFile from "@/content/philosophy/titles.json";
import type { School, Source } from "./content";

export type Reading = { url: string; title: string; publisher: string };

const TITLES = titlesFile.titles as Record<string, string>;

const PUBLISHERS: Record<string, string> = {
  "plato.stanford.edu": "Stanford Encyclopedia of Philosophy",
  "iep.utm.edu": "Internet Encyclopedia of Philosophy",
};
/** Music's sources (L46): named for any reading the content lists itself. */
const OTHER_PUBLISHERS: Record<string, string> = { "en.wikipedia.org": "Wikipedia" };

const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
};

/** "lorenzo-valla" -> "Lorenzo Valla": the fallback when the research gave no title. */
export const titleFromSlug = (url: string) =>
  (url.replace(/[?#].*$/, "").replace(/\/+$/, "").split("/").pop() ?? "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

/** Every citation in the school's own content: the school, its tagline, questions, themes and what it reacted against. */
function citations(s: School): Source[] {
  return [
    ...s.sources,
    ...(s.taglineSources ?? []),
    ...(s.questionSources ?? []).flat(),
    ...s.themes.flatMap((t) => t.sources),
    ...(s.reactedAgainst?.sources ?? []),
  ];
}

/** Up to three entries: [start here, ...go deeper]. Only SEP and IEP entries; ties keep the order first cited. */
export function furtherReading(s: School, max = 3): Reading[] {
  // Music lists its own further reading (phase 4); philosophy's is the entries its content cites most.
  if (s.reading?.length) {
    return s.reading.slice(0, max).map((r) => {
      const host = hostOf(r.url);
      return { url: r.url, title: r.title || titleFromSlug(r.url), publisher: PUBLISHERS[host] ?? OTHER_PUBLISHERS[host] ?? host.replace(/^www\./, "") };
    });
  }
  const count = new Map<string, number>();
  for (const c of citations(s)) {
    if (!PUBLISHERS[hostOf(c.url)]) continue;
    count.set(c.url, (count.get(c.url) ?? 0) + 1);
  }
  const out: Reading[] = [];
  const seenTitles = new Set<string>();
  // Map keeps insertion order and sort is stable, so ties stay in the order first cited.
  for (const [url] of [...count].sort((a, b) => b[1] - a[1])) {
    const title = TITLES[url] || titleFromSlug(url);
    // The same entry in both encyclopedias (SEP and IEP "Socrates") is one read, not two.
    if (seenTitles.has(title.toLowerCase())) continue;
    seenTitles.add(title.toLowerCase());
    out.push({ url, title, publisher: PUBLISHERS[hostOf(url)] });
    if (out.length === max) break;
  }
  return out;
}
