// Builds the private sprint notebook (.notebook/index.html plus .notebook/data/) from docs/.
// Republish the page and the changed data files to the claude.ai artifact; see AGENTS.md.
// The notebook is one page shared by every session, so it's only built for publishing from the
// latest main with no uncommitted notes (decision 0024). `--preview` builds any branch into
// .notebook/preview.html, for checking only. `--since <published index.html>` lists what changed.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ROOT, readProducts, readSideProjects } from "../products.mjs";

const preview = process.argv.includes("--preview");
const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

// Notes committed on a branch but not on main yet: they exist, but the notebook can't show them.
function unmergedNotes() {
  const refs = git("for-each-ref", "--format=%(refname:short)", "refs/heads", "refs/remotes/origin").split("\n");
  const seen = new Set();
  const out = [];
  for (const ref of refs) {
    if (!ref || ["main", "origin", "origin/HEAD", "origin/main"].includes(ref)) continue;
    const tip = git("rev-parse", ref);
    if (seen.has(tip)) continue;
    seen.add(tip);
    const count = Number(git("rev-list", "--count", `origin/main..${ref}`, "--", "docs"));
    if (count) out.push(`${ref}: ${count} commit(s), last ${git("log", "-1", "--format=%cs", ref)}`);
  }
  return out;
}

if (!preview) {
  try {
    git("fetch", "--quiet", "origin", "main");
  } catch {
    console.warn("Couldn't fetch origin/main; checking against the last fetched copy.");
  }
  const problems = [];
  if (git("rev-parse", "HEAD") !== git("rev-parse", "origin/main"))
    problems.push("This checkout isn't the latest main. Merge first, then build from origin/main (e.g. `git switch --detach origin/main`).");
  if (git("status", "--porcelain", "--", "docs"))
    problems.push("docs/ has uncommitted changes. Commit them on a branch and merge, so the notebook only shows what's on main.");
  if (problems.length) {
    console.error(`Notebook not built for publishing:\n- ${problems.join("\n- ")}\nTo check it locally instead: pnpm notebook --preview`);
    process.exit(1);
  }
  const waiting = unmergedNotes();
  if (waiting.length)
    console.warn(`\n⚠ Notes on branches not merged into main (not in the notebook yet):\n  ${waiting.join("\n  ")}\nMerge them, or delete the branch if it's abandoned.\n`);
}

const REPO = "https://github.com/OAJohansson/build-sprint";
const TOTAL = 20;

const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const exists = (f) => fs.existsSync(path.join(ROOT, f));
const ls = (d) => (exists(d) ? fs.readdirSync(path.join(ROOT, d)).sort() : []);

// The notebook can't show repo images, so screenshots become captions.
const clean = (text) => text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "*(screenshot: $1)*").trim();
const tableRows = (text) => text.split("\n").filter((l) => /^\|\s*[^-\s|]/.test(l)).length - 1;

// An interview story's headline and themes ("**Headline:** …", "**Themes:** A · B").
const storyLine = (text, key) => text.match(new RegExp(`(?:^|\\n)\\*\\*${key}:\\*\\*\\s*([\\s\\S]*?)(?:\\n\\n|$)`))?.[1].replace(/\s+/g, " ").trim() ?? "";
const storyThemes = (text) => storyLine(text, "Themes");

// Each product's folder (docs/products/NN-slug/) becomes sub-pages, in this order.
function sections(p) {
  const dir = `docs/products/${p.slug}`;
  const file = (name) => (exists(`${dir}/${name}`) ? clean(read(`${dir}/${name}`)) : "");
  const out = [];

  // Streamlined and Founder (decision 0026): the owner's kickoff pack and evals come first.
  const kickoff = file("kickoff.md");
  if (kickoff) out.push({ id: "kickoff", label: "Kickoff pack", text: kickoff, summary: kickoff.match(/\*\*Mode:\*\*\s*(\w+)/)?.[1] ?? "Kickoff" });

  const evals = file("evals.md");
  if (evals) out.push({ id: "evals", label: "Evals", text: evals, summary: `${(evals.match(/^- \[[ x]\]/gm) ?? []).length} checks` });

  const brief = file("brief.md");
  if (brief) out.push({ id: "brief", label: "Brief", text: brief, summary: "Problem, jobs, success" });

  const journal = file("journal.md");
  if (journal) out.push({ id: "journey", label: "Journey", text: journal, summary: `${(journal.match(/^### /gm) ?? []).length} steps, ${(journal.match(/^## (?!To carry over)/gm) ?? []).length} days` });

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

  const story = file("story.md");
  if (story) out.push({ id: "story", label: "Interview story", text: story, summary: storyThemes(story) || "STAR story" });

  // The product's own decision log (L- and T-numbers, decision 0026), then the repo decisions about it.
  const log = file("decisions.md");
  const logged = (log.match(/^\| [LT]\d+ \|/gm) ?? []).length;
  const decisions = ls("docs/decisions")
    .filter((f) => /^\d{4}-.*\.md$/.test(f))
    .map((f) => read(`docs/decisions/${f}`))
    .filter((t) => t.includes(p.title) || t.includes(p.slug));
  if (log || decisions.length) {
    const summary = [logged && `${logged} logged`, decisions.length && `${decisions.length} recorded`].filter(Boolean).join(", ") || "Decision log";
    out.push({ id: "decisions", label: "Decisions", text: [log, ...decisions.map(clean)].filter(Boolean).join("\n\n---\n\n"), summary });
  }

  return out;
}

// Side projects (e.g. the website) get the same pages but sit outside the 20: no day, no grid cell.
const products = [...readProducts(), ...readSideProjects()].map((p) => ({
  slug: p.slug,
  day: p.day ?? null,
  side: p.side === true || p.side === "true",
  title: p.title,
  status: p.status || "building",
  date: p.date || "",
  user: p.user || "",
  problem: p.problem || "",
  bet: p.bet || "",
  url: p.url || "",
  tags: Array.isArray(p.tags) ? p.tags : [],
  body: p.body.trim(),
  // `repo:` on the card for products whose code lives outside this monorepo.
  code: p.repo || `${REPO}/tree/main/apps/${p.slug}`,
  doc: `${REPO}/tree/main/docs/products/${p.slug}`,
  design: p.design || "",
  notebook: p.notebook || "",
  sections: sections(p),
}));

// Sprint-wide pages, in menu order after Overview. Links to another page's file open that page;
// other relative links open the file on GitHub.
const PAGES = [
  { id: "playbook", label: "Playbook", eyebrow: "How each day runs", file: "docs/PLAYBOOK.md" },
  { id: "craft", label: "Product craft", eyebrow: "The people behind the playbook", file: "docs/product-craft.md" },
  { id: "skills", label: "Skills", eyebrow: "Claude skills in the repo", file: ".claude/skills/README.md" },
  { id: "learnings", label: "Learnings", eyebrow: "Across products", file: "docs/learnings.md" },
  { id: "stories", label: "Interview stories", eyebrow: "Story bank", file: "docs/interview-stories.md" },
  { id: "knowledge", label: "Knowledge bank", eyebrow: "General knowledge", file: "docs/knowledge-bank.md" },
  { id: "quiz", label: "Quiz", eyebrow: "Active recall", title: "Knowledge quiz", generated: true },
  { id: "problems", label: "Problems to solve", eyebrow: "Pick the next product here", file: "docs/ideas.md" },
  { id: "todo", label: "To do", eyebrow: "Sprint to-do", file: "docs/todo.md" },
];
function relink(text, file) {
  const dir = path.posix.dirname(file);
  return text.replace(/\]\((?!https?:|#|mailto:)([^)\s#]+)(#[^)\s]*)?\)/g, (_, target) => {
    const to = path.posix.normalize(path.posix.join(dir, target));
    const page = PAGES.find((pg) => pg.file === to);
    return page ? `](#${page.id})` : `](${REPO}/blob/main/${to})`;
  });
}
// The story bank's table: one row per product with a story, and which interview themes it covers.
function storyTable() {
  const rows = products
    .map((p) => ({ p, s: p.sections.find((x) => x.id === "story") }))
    .filter((r) => r.s)
    .map(({ p, s }) => `| [${p.side ? "" : `${String(p.day).padStart(2, "0")} `}${p.title}](#${p.slug}.story) | ${storyLine(s.text, "Headline")} | ${storyThemes(s.text)} |`);
  if (!rows.length) return "\nNo stories yet. Each product's story is written at wrap-up.\n";
  const covered = new Set(rows.join(" ").match(/Discovery|Prioritisation|Metrics|Failure|Ambiguity|Trade-offs|Craft|Technical|Working with AI|Speed/g));
  const all = ["Discovery", "Prioritisation", "Metrics", "Failure", "Ambiguity", "Trade-offs", "Craft", "Technical", "Working with AI", "Speed"];
  const missing = all.filter((t) => !covered.has(t));
  return `\n| Product | Headline | Themes |\n| --- | --- | --- |\n${rows.join("\n")}\n\n**No story yet for:** ${missing.length ? missing.join(", ") : "none, every theme is covered"}.\n`;
}

// Quiz cards from the knowledge bank: "**Q:** … / **A:** …" pairs, grouped by "## Topic".
function quizCards() {
  if (!exists("docs/knowledge-bank.md")) return [];
  const cards = [];
  for (const section of read("docs/knowledge-bank.md").split(/\n(?=## )/).slice(1)) {
    const topic = section.match(/^## (.*)/)[1].trim();
    for (const m of section.matchAll(/\*\*Q:\*\*\s*([\s\S]*?)\n\*\*A:\*\*\s*([\s\S]*?)(?=\n\s*\n|$)/g)) {
      cards.push({ topic, q: m[1].trim(), a: m[2].trim() });
    }
  }
  return cards;
}

const pages = PAGES.filter((pg) => pg.generated || exists(pg.file)).map((pg) => {
  if (pg.generated) return { id: pg.id, label: pg.label, eyebrow: pg.eyebrow, title: pg.title, text: "", source: `${REPO}/blob/main/docs/knowledge-bank.md` };
  const text = read(pg.file) + (pg.id === "stories" ? storyTable() : "");
  return {
    id: pg.id,
    label: pg.label,
    eyebrow: pg.eyebrow,
    title: text.match(/^# (.*)/m)?.[1] ?? pg.label,
    text: relink(text.replace(/^# .*\n+/, ""), pg.file),
    source: `${REPO}/blob/main/${pg.file}`,
  };
});

// The notebook is a small page plus one text file per product sub-page and sprint page, so a
// republish only sends what changed (decision 0030). The page holds the menu and every file's
// hash; it fetches a file's text when that view opens.
const files = {}; // published path → content
const put = (file, text) => ((files[file] = text), file);

const data = {
  repo: REPO,
  total: TOTAL,
  built: new Date().toISOString().slice(0, 10),
  products: products.map(({ sections: secs, ...p }) => ({
    ...p,
    sections: secs.map(({ text, ...s }) => ({ ...s, file: put(`data/products/${p.slug}/${s.id}.txt`, text) })),
  })),
  ideas: put("data/ideas.txt", read("docs/ideas.md").replace(/^# .*\n+/, "")),
  pages: pages.map(({ text, ...pg }) => (pg.id === "quiz" ? pg : { ...pg, file: put(`data/pages/${pg.id}.txt`, text) })),
  // One card per line, so the file reads well before publishing.
  quiz: put("data/quiz.json", `[\n${quizCards().map((c) => JSON.stringify(c)).join(",\n")}\n]\n`),
};
const hash = (text) => createHash("sha256").update(text).digest("hex").slice(0, 12);
data.files = Object.fromEntries(Object.entries(files).map(([f, t]) => [f, hash(t)]));

// "<" escaped so no doc text can close the script tag early.
const inline = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
const template = read("scripts/notebook/template.html");
const page = (embedded) => template.replace("/*DATA*/null", inline(data)).replace("/*INLINE*/null", embedded ? inline(files) : "null");

function writeSplit(dir) {
  fs.rmSync(path.join(dir, "data"), { recursive: true, force: true });
  for (const [f, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    fs.writeFileSync(path.join(dir, f), text);
  }
  fs.writeFileSync(path.join(dir, "index.html"), page(false));
}

const NB = path.join(ROOT, ".notebook");
fs.mkdirSync(NB, { recursive: true });
const kb = (n) => `${Math.round(n / 1024)} KB`;

if (preview) {
  // preview.html carries every file inline so it opens straight from disk; preview/ is the real
  // split, to check through a local server (python3 -m http.server -d .notebook/preview).
  fs.writeFileSync(path.join(NB, "preview.html"), page(true));
  writeSplit(path.join(NB, "preview"));
  console.log(`Notebook preview: ${products.length} product(s) → .notebook/preview.html (and the split in .notebook/preview/). Don't publish these.`);
  process.exit(0);
}

writeSplit(NB);

// What changed since the live notebook: compare with the hashes in the published page. Read the
// artifact first (Artifact tool, action "read"), then pass the file it saved: --since <file>.
const sinceArg = process.argv.indexOf("--since");
const sinceFile = sinceArg > -1 ? process.argv[sinceArg + 1] : null;
let before = null;
if (sinceFile) {
  const old = fs.readFileSync(path.resolve(sinceFile), "utf8").match(/const DATA = (\{.*\});\s*$/m);
  before = old ? JSON.parse(old[1]).files ?? null : null;
  if (!before) console.warn(`⚠ ${sinceFile} has no file hashes (an old single-file notebook?). Publishing everything.`);
}
const changed = Object.keys(files).filter((f) => !before || before[f] !== data.files[f]);
const removed = before ? Object.keys(before).filter((f) => !(f in files)) : [];
const plan = { file_path: ".notebook/index.html", root: ".notebook", files: changed, removed };
fs.writeFileSync(path.join(NB, "publish.json"), JSON.stringify(plan, null, 2) + "\n");

const size = (f) => Buffer.byteLength(files[f]);
const pageSize = Buffer.byteLength(page(false));
console.log(`Notebook: ${products.length} product(s), ${Object.keys(files).length} data files → .notebook/`);
console.log(`Publish: index.html (${kb(pageSize)}) + ${changed.length} changed file(s) (${kb(changed.reduce((n, f) => n + size(f), 0))})${removed.length ? `, ${removed.length} removed` : ""}${before ? "" : " — full publish, no --since given"}`);
for (const f of changed) console.log(`  ${f}  ${kb(size(f))}`);
for (const f of removed) console.log(`  ${f}  (removed: pass null in the files map)`);
console.log("Plan written to .notebook/publish.json.");
