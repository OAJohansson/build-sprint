import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type Status = "idea" | "building" | "shipped" | "parked";

export type Product = {
  slug: string;
  day: number;
  title: string;
  tagline: string;
  status: Status;
  date: string;
  url: string;
  tags: string[];
  body: string;
  screenshot: string | null;
};

// The write-ups live at the repo root, outside this app. Vercel clones the whole
// repo, and every page is statically generated, so this only runs at build time.
const PRODUCTS_DIR = path.join(process.cwd(), "../../docs/products");
const SHOTS_DIR = path.join(process.cwd(), "public/shots");

export function getProducts(): Product[] {
  return fs
    .readdirSync(PRODUCTS_DIR)
    .filter((f) => /^\d{2}-.+\.md$/.test(f))
    .map((f) => {
      const slug = f.replace(/\.md$/, "");
      const { data, content } = matter(fs.readFileSync(path.join(PRODUCTS_DIR, f), "utf8"));
      const shot = `${slug}.png`;
      return {
        slug,
        day: Number(data.day),
        title: String(data.title ?? slug),
        tagline: String(data.tagline ?? ""),
        status: (data.status ?? "building") as Status,
        date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? ""),
        url: String(data.url ?? ""),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        body: content,
        screenshot: fs.existsSync(path.join(SHOTS_DIR, shot)) ? `/shots/${shot}` : null,
      };
    })
    .sort((a, b) => a.day - b.day);
}

export function getProduct(slug: string) {
  return getProducts().find((p) => p.slug === slug);
}
