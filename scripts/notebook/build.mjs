// Builds the private sprint notebook (.notebook/index.html) from docs/.
// Publish or republish that file as a claude.ai artifact; see AGENTS.md.
// The notebook is one page shared by every session, so it's only built for publishing from the
// latest main with no uncommitted notes (decision 0024). `--preview` builds any branch into
// .notebook/preview.html, for checking only.
import { execFileSync } from "node:child_process";
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

  const brief = file("brief.md");
  if (brief) out.push({ id: "brief", label: "Brief", text: brief, summary: "Problem, jobs, success" });

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

  const story = file("story.md");
  if (story) out.push({ id: "story", label: "Interview story", text: story, summary: storyThemes(story) || "STAR story" });

  const decisions = ls("docs/decisions")
    .filter((f) => /^\d{4}-.*\.md$/.test(f))
    .map((f) => read(`docs/decisions/${f}`))
    .filter((t) => t.includes(p.title) || t.includes(p.slug));
  if (decisions.length) out.push({ id: "decisions", label: "Decisions", text: decisions.map(clean).join("\n\n---\n\n"), summary: `${decisions.length} recorded` });

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

const data = {
  repo: REPO,
  total: TOTAL,
  built: new Date().toISOString().slice(0, 10),
  products,
  ideas: read("docs/ideas.md").replace(/^# .*\n+/, ""),
  pages,
  quiz: quizCards(),
};

// "<" escaped so no doc text can close the script tag early.
const json = JSON.stringify(data).replace(/</g, "\\u003c");
const html = read("scripts/notebook/template.html").replace("/*DATA*/null", json);
const out = path.join(ROOT, preview ? ".notebook/preview.html" : ".notebook/index.html");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`Notebook: ${products.length} product(s) → ${path.relative(ROOT, out)}${preview ? " (preview only, don't publish)" : ""}`);
