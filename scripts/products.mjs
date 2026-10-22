import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const APPS_DIR = path.join(ROOT, "apps");
export const PRODUCTS_DIR = path.join(ROOT, "docs/products");

// Minimal frontmatter reader (flat `key: value` and `[a, b]` lists) so the
// scripts run on a fresh clone before `pnpm install`.
function frontmatter(text) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  const block = match?.[1] ?? "";
  const data = {};
  for (const line of block.split("\n")) {
    const m = /^(\w+):\s*(.*?)\s*(#.*)?$/.exec(line);
    if (!m) continue;
    let value = m[2].replace(/^"(.*)"$/, "$1");
    if (/^\[.*\]$/.test(value)) value = value.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
    else if (/^\d+$/.test(value)) value = Number(value);
    data[m[1]] = value;
  }
  return { data, body: match ? text.slice(match[0].length) : text };
}

function readCards(pattern) {
  return fs
    .readdirSync(PRODUCTS_DIR)
    .filter((f) => pattern.test(f) && f !== "TEMPLATE.md")
    .map((f) => {
      const { data, body } = frontmatter(fs.readFileSync(path.join(PRODUCTS_DIR, f), "utf8"));
      return { ...data, body, file: f, slug: f.replace(/\.md$/, "") };
    });
}

// Every product write-up in docs/products, sorted by day.
export function readProducts() {
  return readCards(/^\d{2}-.+\.md$/).sort((a, b) => a.day - b.day);
}

// Side projects: same playbook, but not one of the 20 (no day number, e.g. docs/products/website.md).
export function readSideProjects() {
  return readCards(/^[a-z][a-z0-9-]*\.md$/).sort((a, b) => String(a.date).localeCompare(String(b.date)));
}
