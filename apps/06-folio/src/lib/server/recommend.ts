import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { unstable_cache } from "next/cache";
import { lookup } from "@/lib/server/openlibrary";
import type { Book, Found } from "@/lib/types";

// Folio's picks: Claude reads my shelf and names books; code keeps only real ones that aren't on
// it. The model won the lab's exam (lab/results, decision 0018); the prompt mirrors
// lab/folio_lab/llm.py, so change both together or the lab's numbers stop describing the app.

const MODEL = "claude-opus-5-5";
const ASK = 15;
const K = 10;

const SYSTEM = `You are Folio's book recommender. You read one reader's shelf and suggest books \
they will love next. Suggest real, published books only, each one title by its usual author. \
Never suggest a book that is already on the shelf, in any edition.`;

const SCHEMA = {
  type: "object",
  properties: {
    picks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          author: { type: "string" },
          because: { type: "string", description: "The title of the one shelf book it most follows from" },
        },
        required: ["title", "author", "because"],
        additionalProperties: false,
      },
    },
  },
  required: ["picks"],
  additionalProperties: false,
};

type Pick = { title: string; author: string; because: string };

const surname = (author: string) => author.trim().split(/\s+/).at(-1)?.toLowerCase() ?? "";
const norm = (title: string) =>
  title
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .split(":")[0]
    .replace(/^(the|a|an) /, "")
    .replace(/[^a-z0-9]/g, "");
const key = (b: { title: string; author: string }) => `${norm(b.title)}|${surname(b.author)}`;

/** The shelf as the prompt shows it, oldest first (same wording as the lab). */
export function shelfText(books: Book[]): string {
  const when = (b: Book) => b.readOn ?? b.addedOn;
  const sorted = [...books].sort((a, b) => when(a).localeCompare(when(b)));
  const rated = sorted.filter((b) => b.shelf === "read" && b.rating != null).map((b) => `- ${b.title} by ${b.author}: ${b.rating}★`);
  const want = sorted.filter((b) => b.shelf !== "read").map((b) => `- ${b.title} by ${b.author}`);
  // shortcut: the latest 100 rated and 40 want-to-read books only, as in the lab; picks are
  // still checked against the whole shelf.
  const parts = ["Books I've read and rated (1–5 stars), oldest first:", ...rated.slice(-100)];
  if (want.length) parts.push("", "Books on my want-to-read list (don't suggest these):", ...want.slice(-40));
  return parts.join("\n");
}

async function ask(shelf: string): Promise<Pick[]> {
  const client = new Anthropic();
  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM,
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    // if a safety classifier ever declines, the API reruns the request on a fallback model
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{ role: "user", content: `${shelf}\n\nSuggest ${ASK} books I haven't got on my shelf that I'm most likely to love, best first.` }],
  });
  if (res.stop_reason !== "end_turn") throw new Error(`Claude stopped early: ${res.stop_reason}`);
  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Claude returned no picks");
  return (JSON.parse(text.text) as { picks: Pick[] }).picks;
}

/** Ten checked picks for this shelf. Cached by the shelf's text, so they change when I log a book. */
const picksFor = unstable_cache(
  async (shelf: string, shelfKeys: string[], shelfWorks: string[], loved: string[]): Promise<Found[]> => {
    const onShelf = new Set([...shelfKeys, ...shelfWorks]);
    const lovedSet = new Set(loved);
    const named = await ask(shelf);
    const found = await Promise.all(
      named.filter((p) => !onShelf.has(key(p))).map(async (p) => ({ p, book: await lookup({ isbn: null, ...p }) })),
    );
    const picks: Found[] = [];
    for (const { p, book } of found) {
      // not on Open Library: made up, or too obscure to show with a cover; either way, skip it
      if (!book || picks.length === K) continue;
      if ((book.workKey && onShelf.has(book.workKey)) || onShelf.has(key(book))) continue;
      if (picks.some((x) => x.workKey === book.workKey)) continue;
      const because = lovedSet.has(norm(p.because)) ? `Because you loved ${p.because}` : undefined;
      picks.push({ ...book, note: because });
    }
    return picks;
  },
  ["folio-picks", MODEL],
  { revalidate: 60 * 60 * 24 * 7 },
);

export async function recommend(books: Book[]): Promise<Found[]> {
  return picksFor(
    shelfText(books),
    books.map(key),
    books.flatMap((b) => (b.workKey ? [b.workKey] : [])),
    books.filter((b) => (b.rating ?? 0) >= 4).map((b) => norm(b.title)),
  );
}
