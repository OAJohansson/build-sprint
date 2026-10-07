// Usage: pnpm new <slug> ["Display Title"]
// Copies templates/next-starter to apps/NN-<slug>, creates the write-up in
// docs/products/NN-<slug>.md and refreshes the README table.
import fs from "node:fs";
import path from "node:path";
import { ROOT, APPS_DIR, PRODUCTS_DIR } from "./products.mjs";
import { syncReadme } from "./sync-readme.mjs";

const [rawSlug, ...titleParts] = process.argv.slice(2);
if (!rawSlug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(rawSlug)) {
  console.error('Usage: pnpm new <kebab-slug> ["Display Title"]   e.g. pnpm new crossfit "CrossFit Log"');
  process.exit(1);
}

const taken = [...fs.readdirSync(APPS_DIR), ...fs.readdirSync(PRODUCTS_DIR)]
  .map((f) => /^(\d{2})-/.exec(f)?.[1])
  .filter(Boolean)
  .map(Number);
const day = Math.max(0, ...taken) + 1;
const nn = String(day).padStart(2, "0");
const slug = `${nn}-${rawSlug}`;
const title =
  titleParts.join(" ") ||
  rawSlug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

const appDir = path.join(APPS_DIR, slug);
if (fs.existsSync(appDir)) {
  console.error(`${path.relative(ROOT, appDir)} already exists.`);
  process.exit(1);
}

const fill = (text) =>
  text
    .replaceAll("__SLUG__", slug)
    .replaceAll("__TITLE__", title)
    .replaceAll("__DAY__", String(day))
    .replaceAll("__DATE__", new Date().toISOString().slice(0, 10));

const TEXT = /\.(json|ts|tsx|mjs|css|md)$|^\.gitignore$/;
fs.cpSync(path.join(ROOT, "templates/next-starter"), appDir, {
  recursive: true,
  filter: (src) => !/node_modules|\.next/.test(src),
});
for (const entry of fs.readdirSync(appDir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !TEXT.test(entry.name)) continue;
  const file = path.join(entry.parentPath, entry.name);
  fs.writeFileSync(file, fill(fs.readFileSync(file, "utf8")));
}

const doc = path.join(PRODUCTS_DIR, `${slug}.md`);
fs.writeFileSync(doc, fill(fs.readFileSync(path.join(PRODUCTS_DIR, "TEMPLATE.md"), "utf8")));

// The product's folder: one file per notebook sub-page.
const folder = path.join(PRODUCTS_DIR, slug);
fs.mkdirSync(path.join(folder, "user-testing"), { recursive: true });
const starters = {
  "journal.md": "# Journey\n\nWhat happened, what was decided and why. Newest last.\n",
  "feedback.md": "# Review feedback\n\nStatus: `open` · `fixing` · `fixed` · `parked` · `won't do`\n\n| # | Type | Feedback | Status |\n| --- | --- | --- | --- |\n",
  "backlog.md": "# Backlog\n\n| Idea | Why | Status |\n| --- | --- | --- |\n",
  "learnings.md": "# Learnings\n\nWhat building this product taught me. Newest first.\n",
};
for (const [name, text] of Object.entries(starters)) fs.writeFileSync(path.join(folder, name), text);
syncReadme();

console.log(`
Created day ${day}: ${title}
  app    apps/${slug}
  doc    docs/products/${slug}.md   ← fill in user, problem and bet before coding
  folder docs/products/${slug}/     journal, feedback, user-testing, backlog, learnings

Next:
  pnpm install
  pnpm -F ${slug} dev
  Deploy: vercel.com/new → import build-sprint → Root Directory "apps/${slug}" → Deploy
          then paste the URL into the doc's \`url:\` field.
  After editing the doc: pnpm sync && pnpm notebook (then republish the notebook).
`);
