// Renders a pilot school (docs/products/11-meander/content/pilot/<id>.json) as a readable Markdown page with
// numbered source footnotes, for the owner's content review before any card design.
//   node apps/11-meander/scripts/pilot-to-md.mjs existentialism
import fs from "node:fs";

const id = process.argv[2] ?? "existentialism";
const dir = new URL("../../../docs/products/11-meander/content/pilot/", import.meta.url);
const d = JSON.parse(fs.readFileSync(new URL(`${id}.json`, dir), "utf8"));

const notes = [], keyOf = new Map();
const host = (u) => (u.includes("plato.stanford.edu") ? "Stanford Encyclopedia of Philosophy" : u.includes("iep.utm.edu") ? "Internet Encyclopedia of Philosophy" : u.includes("openstax") ? "OpenStax, Introduction to Philosophy" : new URL(u).hostname);
const entry = (u) => decodeURIComponent(u.replace(/\/$/, "").split("/").pop()).replace(/-/g, " ");
const cite = (sources = []) =>
  sources
    .map((s) => {
      const k = `${s.url}#${s.section}`;
      if (!keyOf.has(k)) { notes.push(s); keyOf.set(k, notes.length); }
      return `[${keyOf.get(k)}]`;
    })
    .filter((v, i, a) => a.indexOf(v) === i)
    .join("");
const para = (p) => `${p.text} <sup>${cite(p.sources)}</sup>`;

const out = [];
out.push(`# ${d.name}: content pilot`, "");
out.push(`> For review only: the text, not the design. Every claim was graded against the cited source. About ${d.word_count} words, plus the thinkers (unchanged).`, "");
out.push(`*${para(d.tagline)}*`, "");
out.push("## In one minute", "", ...d.overview.map(para).flatMap((t) => [t, ""]));
out.push("## It asks", "", ...d.questions.map((q, i) => `${i + 1}. ${para(q)}`), "");
out.push("## Themes", "");
for (const t of d.themes) {
  out.push(`### ${t.title}`, "", `*${t.summary}*`, "", ...t.paragraphs.map(para).flatMap((x) => [x, ""]));
  if (t.thinkers?.length) out.push(`Thinkers: ${t.thinkers.join(", ")}`, "");
}
for (const s of d.sections) {
  out.push(`## ${s.title}`, "");
  if (s.paragraphs) out.push(...s.paragraphs.map(para).flatMap((x) => [x, ""]));
  if (s.works) out.push(...s.works.map((w) => `- **${w.title}** (${w.author}, ${w.year}): ${w.note} <sup>${cite(w.sources)}</sup>`), "");
}
out.push("## Study this school", "", `> ${para(d.study_prompt)}`, "");
out.push("## Sources", "");
notes.forEach((s, i) => out.push(`${i + 1}. ${host(s.url)}, "${entry(s.url)}", section "${s.section}". ${s.url}`));
out.push("");
fs.writeFileSync(new URL(`${id}.md`, dir), out.join("\n"));
console.log(`wrote ${id}.md: ${notes.length} distinct source sections`);
