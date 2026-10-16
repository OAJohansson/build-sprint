// Open Library's subjects are reader-tagged and messy (600+ variants on my shelf, other
// languages, noise like "large type books"). These rules map them to a short, fixed list of shelf
// genres; a book can have several, or none (shown as "No genre yet"). Rules from the prototype,
// tested on 285 want-to-read books (journal, 16 Oct).
// shortcut: hand-written rules miss some books (e.g. novels not tagged as fiction); upgrade to a
// Claude classifier with an eval when the unsorted pile matters.

export const UNSORTED = "No genre yet";

export function mapGenres(subjects: string[], year: number | null): string[] {
  const s = subjects.map((x) => x.toLowerCase());
  if (!s.length) return [];
  const has = (...keys: string[]) => s.some((x) => keys.some((k) => x.includes(k)));
  const fiction = has("fiction", "novel", "romans", "ficción", "novela", "roman");
  const kids = has("children's", "juvenile", "young adult", "picture books");
  const genreFiction = has("fantasy", "science fiction");
  const poetry = has("poetry", "drama");
  const g: string[] = [];
  if (has("classics", "classic literature", "great_books_of_the_western_world") || ((fiction || poetry) && (year ?? 9999) < 1950))
    g.push("Classics");
  if (fiction && !kids && !genreFiction && !g.includes("Classics")) g.push("Literary fiction");
  if (has("gay", "lesbian", "lgbt", "queer", "homosexual", "bisexual", "transgender")) g.push("Queer stories");
  if (genreFiction) g.push("Fantasy & sci-fi");
  if (poetry) g.push("Poetry & drama");
  if (!fiction && has("biography", "autobiography", "memoir")) g.push("Memoir");
  if (!fiction && (has("psychology", "self-help", "conduct of life", "self-actualization", "self-improvement", "happiness", "mindfulness") || s.includes("success")))
    g.push("Psychology & self");
  if (!fiction && has("business", "management", "leadership", "entrepreneurship", "commerce")) g.push("Business & product");
  if (!fiction && has("history", "philosophy", "political science", "sociology", "economics", "civilization", "science", "politics", "anthropology"))
    g.push("History & ideas");
  if (kids) g.push("Children's");
  return g;
}
