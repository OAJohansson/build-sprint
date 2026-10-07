// Builds the private sprint notebook (.notebook/index.html) from docs/.
// Publish or republish that file as a claude.ai artifact; see AGENTS.md.
import fs from "node:fs";
import path from "node:path";
import { ROOT, readProducts } from "../products.mjs";

const REPO = "https://github.com/OAJohansson/build-sprint";
const TOTAL = 20;

const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const exists = (f) => fs.existsSync(path.join(ROOT, f));
const ls = (d) => (exists(d) ? fs.readdirSync(path.join(ROOT, d)).sort() : []);

// The notebook can't show repo images, so screenshots become captions.
const clean = (text) => text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "*(screenshot: $1)*").trim();
const tableRows = (text) => text.split("\n").filter((l) => /^\|\s*[^-\s|]/.test(l)).length - 1;

// Each product's folder (docs/products/NN-slug/) becomes sub-pages, in this order.
function sections(p) {
  const dir = `docs/products/${p.slug}`;
  const file = (name) => (exists(`${dir}/${name}`) ? clean(read(`${dir}/${name}`)) : "");
  const out = [];

  const journal = file("journal.md");
  if (journal) out.push({ id: "journey", label: "Journey", text: journal, summary: `${(journal.match(/^### /gm) ?? []).length} steps, ${(journal.match(/^## /gm) ?? []).length} days` });

  const feedback = file("feedback.md");
  if (feedback) {
    const items = (feedback.match(/^\| \d+ \|/gm) ?? []).length;
    const open = (feedback.match(/\| open \|\s*$/gm) ?? []).length;
    out.push({ id: "feedback", label: "Feedback", text: feedback, summary: `${items} items, ${open} open` });
  }

  const ut = `${dir}/user-testing`;
  const reports = ls(ut).filter((f) => /^report-.*\.md$/.test(f)).reverse();
  const testing = [
    ...reports.map((f) => clean(read(`${ut}/${f}`))),
    ...["persona.md", "plan.md"].filter((f) => exists(`${ut}/${f}`)).map((f) => clean(read(`${ut}/${f}`))),
  ];
  if (testing.length) {
    const last = reports[0]?.match(/report-(.*)\.md/)?.[1];
    out.push({ id: "testing", label: "User testing", text: testing.join("\n\n---\n\n"), summary: last ? `Last run ${last}` : "Persona and plan ready" });
  }

  const backlog = file("backlog.md");
  if (backlog) out.push({ id: "backlog", label: "Backlog", text: backlog, summary: `${Math.max(tableRows(backlog), 0)} ideas` });

  const learnings = file("learnings.md");
  if (learnings) out.push({ id: "learnings", label: "Learnings", text: learnings, summary: `${(learnings.match(/^- /gm) ?? []).length} lessons` });

  const decisions = ls("docs/decisions")
    .filter((f) => /^\d{4}-.*\.md$/.test(f))
    .map((f) => read(`docs/decisions/${f}`))
    .filter((t) => t.includes(p.title) || t.includes(p.slug));
  if (decisions.length) out.push({ id: "decisions", label: "Decisions", text: decisions.map(clean).join("\n\n---\n\n"), summary: `${decisions.length} recorded` });

  return out;
}

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
  doc: `${REPO}/tree/main/docs/products/${p.slug}`,
  design: p.design || "",
  sections: sections(p),
}));

// Sprint-wide pages, in menu order after Overview. Links to another page's file open that page;
// other relative links open the file on GitHub.
const PAGES = [
  { id: "playbook", label: "Playbook", eyebrow: "How each day runs", file: "docs/PLAYBOOK.md" },
  { id: "skills", label: "Skills", eyebrow: "Claude skills in the repo", file: ".claude/skills/README.md" },
  { id: "learnings", label: "Learnings", eyebrow: "Across products", file: "docs/learnings.md" },
  { id: "todo", label: "To do", eyebrow: "Sprint to-do", file: "docs/todo.md" },
];
function relink(text, file) {
  const dir = path.posix.dirname(file);
  return text.replace(/\]\((?!https?:|#|mailto:)([^)\s#]+)(#[^)\s]*)?\)/g, (_, target) => {
    const to = path.posix.normalize(path.posix.join(dir, target));
    const page = to === "docs/ideas.md" ? { id: "overview" } : PAGES.find((pg) => pg.file === to);
    return page ? `](#${page.id})` : `](${REPO}/blob/main/${to})`;
  });
}
const pages = PAGES.filter((pg) => exists(pg.file)).map((pg) => {
  const text = read(pg.file);
  return {
    id: pg.id,
    label: pg.label,
    eyebrow: pg.eyebrow,
    title: text.match(/^# (.*)/m)?.[1] ?? pg.label,
    text: relink(text.replace(/^# .*\n+/, ""), pg.file),
    source: `${REPO}/blob/main/${pg.file}`,
  };
});

const data = {
  repo: REPO,
  total: TOTAL,
  built: new Date().toISOString().slice(0, 10),
  products,
  ideas: read("docs/ideas.md").replace(/^# .*\n+/, ""),
  pages,
};

// "<" escaped so no doc text can close the script tag early.
const json = JSON.stringify(data).replace(/</g, "\\u003c");
const html = read("scripts/notebook/template.html").replace("/*DATA*/null", json);
const out = path.join(ROOT, ".notebook/index.html");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`Notebook: ${products.length} product(s) → ${path.relative(ROOT, out)}`);
