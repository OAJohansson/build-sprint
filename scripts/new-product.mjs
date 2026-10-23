// Usage: pnpm new <slug> ["Display Title"] [--mode learning|streamlined|founder] [--side]
// Copies templates/next-starter to apps/NN-<slug>, creates the write-up in
// docs/products/NN-<slug>.md and refreshes the README table.
// --mode (decision 0026, default learning) goes on the card; streamlined and founder also get the
// kickoff pack, the agent-checkable evals and the decision log from docs/operating-modes/.
// --side: a side project that follows the playbook but isn't one of the 20, so no day
// number: apps/<slug> and docs/products/<slug>.md.
import fs from "node:fs";
import path from "node:path";
import { ROOT, APPS_DIR, PRODUCTS_DIR } from "./products.mjs";
import { syncReadme } from "./sync-readme.mjs";

const args = process.argv.slice(2);
const side = args.includes("--side");
const modeAt = args.indexOf("--mode");
const mode = modeAt >= 0 ? args[modeAt + 1] : "learning";
if (!["learning", "streamlined", "founder"].includes(mode)) {
  console.error("--mode must be learning, streamlined or founder.");
  process.exit(1);
}
const [rawSlug, ...titleParts] = args.filter((a, i) => a !== "--side" && (modeAt < 0 || (i !== modeAt && i !== modeAt + 1)));
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
const slug = side ? rawSlug : `${nn}-${rawSlug}`;
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
    .replaceAll("__MODE__", mode)
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
const card = fill(fs.readFileSync(path.join(PRODUCTS_DIR, "TEMPLATE.md"), "utf8"));
fs.writeFileSync(doc, side ? card.replace(/^day: .*\n/m, "side: true\n") : card);

// The product's folder: one file per notebook sub-page.
const folder = path.join(PRODUCTS_DIR, slug);
fs.mkdirSync(path.join(folder, "user-testing"), { recursive: true });
const starters = {
  "brief.md": "# Brief\n\nA one-page PRD, written before any code (playbook step 1). Short answers; the success check is filled in at wrap-up.\n\n## Problem\n\n## Who\n\n## Moment of use and jobs to be done\n\n## Today's alternatives\n\n## Riskiest assumptions\n\n## Success: what good looks like\n\n| Signal | How I'll measure it | Target |\n| --- | --- | --- |\n\n## MVP and stop line\n\n## Feature drill-down\n\nThe product's objects, each through four checklists: lifecycle (create, find, change, organise, remove, take out), connections, screen states (empty, working, error, full) and trust (undo, confirm, nothing lost). Claude pre-fills a call and a reason; I change what I disagree with. MVP rows become requirements; Later rows go to the backlog (playbook step 1).\n\n| Object | Action or state | Call | Why |\n| --- | --- | --- | --- |\n\n## Requirements\n\n| # | Must | Check |\n| --- | --- | --- |\n\n**No-gos:** \n\n**Rabbit holes:** \n\n## Unit tests\n\nThe 0–3 pieces of logic that would hurt most if silently wrong, and the edges to check.\n\n## Success check (at wrap-up)\n",
  "story.md": "# Interview story: __TITLE__\n\nWritten at wrap-up (playbook step 4), from the brief, feedback and retro. STAR, tellable in about 2 minutes.\n\n**Headline:** \n\n**Themes:** \n\n## In 30 seconds\n\n## The story\n\n**Situation.**\n\n**Task.**\n\n**Action.**\n\n**Result.**\n\n**What I learned.**\n\n## Assumptions: what I believed vs what was true\n\n| I assumed | Turned out | How I found out |\n| --- | --- | --- |\n\n## Likely follow-ups\n\n## Theme prompts\n\nOne line per theme where this product has a real example; leave the rest empty.\n\n- **Discovery:** *Where did the real problem turn out different from the request?* \n- **Prioritisation:** *What did I decide not to build, and why?* \n- **Metrics:** *How did I know it worked? Which number moved?* \n- **Failure:** *What did I get wrong, and what did I change because of it?* \n- **Ambiguity:** *Which decision did I make with incomplete information, and how did I reduce the risk?* \n- **Trade-offs:** *What did I give up to get something else?* \n- **Craft:** *Which detail made it feel great to use?* \n- **Technical:** *What technical problem did I solve, and how would I explain it simply?* \n- **Working with AI:** *What did AI do well, and where did I have to correct or overrule it?* \n- **Speed:** *How did I ship fast without lowering the bar?* \n\n**Evidence:** \n",
  "journal.md": "# Journey\n\nWhat happened, what was decided and why. Newest last.\n\n## To carry over\n\nFor the shared pages (knowledge bank, problems, learnings, process changes), written once at wrap-up (AGENTS.md).\n\n-\n",
  "feedback.md": "# Review feedback\n\nStatus: `open` · `fixing` · `fixed` · `parked` · `won't do`\n\n| # | Type | Feedback | Status |\n| --- | --- | --- | --- |\n",
  "backlog.md": "# Backlog\n\n| Idea | Why | Status |\n| --- | --- | --- |\n",
  "learnings.md": "# Learnings\n\nWhat building this product taught me.\n\n## Retro\n\n**Numbers:** planned vs actual time, PRs, bugs and who found them (user test, unit test, me). Did the unit-test pick point at the right logic?\n\n**Keep**\n\n**Change**\n\n**Try next time**\n\n**What surprised me**\n\n**Growth:** one thing learned for A (product), B (product craft), C (technical).\n\n**Process changes carried forward** (max 3, logged in `docs/learnings.md`)\n",
};
// Streamlined and Founder: the kickoff pack, the evals (part 1 only: the owner-only part 2 never
// enters the repo) and the decision log.
if (mode !== "learning") {
  const tpl = (name) => fs.readFileSync(path.join(ROOT, "docs/operating-modes", name), "utf8").replaceAll("[Product]", title);
  starters["kickoff.md"] = tpl("kickoff-TEMPLATE.md").replace(/^\*\*Mode:\*\* .*$/m, `**Mode:** ${mode}`);
  starters["evals.md"] =
    tpl("evals-TEMPLATE.md").split(/\n---\n+## Part 2/)[0].trimEnd() +
    "\n\nOwner-only checks: Part 2 of `docs/operating-modes/evals-TEMPLATE.md`, kept outside the repo.\n";
  starters["decisions.md"] =
    "# Decision log\n\nEvery decision except ops (decision 0026): L-numbers for learning decisions, T-numbers for toil. Veto any T-number at any time (\"veto T7\"). Read at the retro.\n\n| # | Date | Decision | Who | Gate or step | Outcome |\n| --- | --- | --- | --- | --- | --- |\n";
}
for (const [name, text] of Object.entries(starters)) fs.writeFileSync(path.join(folder, name), fill(text));
syncReadme();

console.log(`
Created ${side ? "side project" : `day ${day}`}: ${title} (mode: ${mode})
  app    apps/${slug}
  doc    docs/products/${slug}.md   ← fill in user, problem and bet before coding
  folder docs/products/${slug}/     brief, journal, feedback, user-testing, backlog, learnings, story${mode === "learning" ? "" : ", kickoff, evals, decisions"}

Next:
  pnpm install
  pnpm -F ${slug} dev
  Deploy: merge the scaffold to main, then pnpm ship ${slug} (fills .env.local, creates the Vercel project).
  After editing the doc: pnpm sync and commit; republish the notebook from main after merging (see AGENTS.md).
`);
