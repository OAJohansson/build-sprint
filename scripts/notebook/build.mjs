// Builds the private sprint notebook (.notebook/index.html) from docs/.
// Publish or republish that file as a claude.ai artifact; see AGENTS.md.
import fs from "node:fs";
import path from "node:path";
import { ROOT, readProducts } from "../products.mjs";

const REPO = "https://github.com/OAJohansson/build-sprint";
const TOTAL = 20;

const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const products = readProducts().map((p) => ({
  slug: p.slug,
  day: p.day,
  title: p.title,
  status: p.status || "building",
  date: p.date || "",
  user: p.user || "",
  problem: p.problem || "",
  bet: p.bet || "",
  url: p.url || "",
  tags: Array.isArray(p.tags) ? p.tags : [],
  body: p.body.trim(),
  code: `${REPO}/tree/main/apps/${p.slug}`,
  doc: `${REPO}/blob/main/docs/products/${p.file}`,
}));

const data = {
  repo: REPO,
  total: TOTAL,
  built: new Date().toISOString().slice(0, 10),
  products,
  ideas: read("docs/ideas.md"),
  learnings: read("docs/learnings.md"),
};

// "<" escaped so no doc text can close the script tag early.
const json = JSON.stringify(data).replace(/</g, "\\u003c");
const html = read("scripts/notebook/template.html").replace("/*DATA*/null", json);
const out = path.join(ROOT, ".notebook/index.html");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`Notebook: ${products.length} product(s) → ${path.relative(ROOT, out)}`);
