// Regenerates the product table in README.md from docs/products/*.md frontmatter.
import fs from "node:fs";
import path from "node:path";
import { ROOT, readProducts } from "./products.mjs";

const STATUS = { idea: "💡 idea", building: "🛠️ building", shipped: "✅ shipped", parked: "⏸️ parked" };

export function syncReadme() {
  const rows = readProducts().map((p) =>
    [
      p.day,
      `**${p.title}**`,
      p.problem || "",
      STATUS[p.status] ?? p.status,
      p.url ? `[live](${p.url})` : "—",
      `[write-up](docs/products/${p.file}) · [code](apps/${p.slug})`,
    ].join(" | "),
  );
  const table = [
    "| Day | Product | Problem | Status | Live | Links |",
    "| --: | --- | --- | --- | --- | --- |",
    ...rows.map((r) => `| ${r} |`),
  ].join("\n");

  const file = path.join(ROOT, "README.md");
  const readme = fs.readFileSync(file, "utf8");
  const next = readme.replace(
    /(<!-- products:start -->)[\s\S]*?(<!-- products:end -->)/,
    `$1\n${rows.length ? table : "_Nothing shipped yet — day 1 starts soon._"}\n$2`,
  );
  fs.writeFileSync(file, next);
  console.log(`README.md: ${rows.length} product(s) listed.`);
}

if (import.meta.url === `file://${process.argv[1]}`) syncReadme();
