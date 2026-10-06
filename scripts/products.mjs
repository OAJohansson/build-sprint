import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const APPS_DIR = path.join(ROOT, "apps");
export const PRODUCTS_DIR = path.join(ROOT, "docs/products");

// Minimal frontmatter reader (flat `key: value` and `[a, b]` lists) so the
// scripts run on a fresh clone before `pnpm install`.
function frontmatter(text) {
  const block = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? "";
  const data = {};
  for (const line of block.split("\n")) {
    const m = /^(\w+):\s*(.*?)\s*(#.*)?$/.exec(line);
    if (!m) continue;
    let value = m[2].replace(/^"(.*)"$/, "$1");
    if (/^\[.*\]$/.test(value)) value = value.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
    else if (/^\d+$/.test(value)) value = Number(value);
    data[m[1]] = value;
  }
  return data;
}

// Every product write-up in docs/products, sorted by day.
export function readProducts() {
  return fs
    .readdirSync(PRODUCTS_DIR)
    .filter((f) => /^\d{2}-.+\.md$/.test(f))
    .map((f) => ({
      ...frontmatter(fs.readFileSync(path.join(PRODUCTS_DIR, f), "utf8")),
      file: f,
      slug: f.replace(/\.md$/, ""),
    }))
    .sort((a, b) => a.day - b.day);
}
