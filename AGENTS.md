# Build sprint: conventions

20 products in 20 days. Speed over polish: the goal is shipping something live each day.

## Next.js

The apps use Next.js 16, which has breaking changes from older versions (async `params`,
`PageProps<"/route">` helpers, etc.). Before using an unfamiliar API, read the relevant guide in
`apps/<app>/node_modules/next/dist/docs/`.

## Repo rules

- **pnpm only.** Never npm or yarn.
- **New product = `pnpm new <slug> "Title"`.** Never copy folders by hand. The script numbers the
  day, fills the template and creates the write-up.
- Apps are self-contained: no shared packages, no cross-app imports. Improvements meant for future
  products go into `templates/next-starter`.
- Data goes in localStorage (`useLocalStorage`) unless the product genuinely needs a backend. If
  it does, record why in the product write-up.
- Keep each app deployable on its own from `apps/NN-slug` (Vercel Root Directory).

## Parallel sessions

- Each session works in its own worktree and branch, cut from the latest `origin/main`. Never
  edit in the main checkout while another session is working there.
- Touch only your own files (`apps/NN-slug`, `docs/products/NN-slug*`). Shared files
  (`docs/knowledge-bank.md`, `docs/ideas.md`, `docs/learnings.md`, `README.md`, lockfile) come
  last: merge `main` into your branch first, then add to them.
- Merge or open the PR the same day; a branch that lives for days drifts from `main`.
- **Notes are only safe once committed.** Commit `docs/` changes at each step, not only at the
  end, and push the branch (branch pushes cost no deploys, decision 0016), so nothing is lost if
  a worktree is cleaned up.
- The notebook is shared by every session: publish it **only from `main`**, never from a branch
  (decision 0024). Merging is: merge, then republish from `main` (see Documentation).
- Lockfile conflict: take `main`'s `pnpm-lock.yaml` and run `pnpm install`; never hand-merge it.

## Code habits (decision 0011)

- End each coding reply with one line: what you skipped or didn't check, and any risk the owner
  should know. Leave it out when there is nothing real to say.
- Mark a known shortcut in the code as `// shortcut: <the limit>, <when to upgrade>`, so
  `grep -r "shortcut:" apps/NN-slug` lists a product's weak spots.
- Bug fix: before editing, find every caller of the code you touch and fix the root cause once in
  the shared code. If the root cause is bigger than the bug, say so and let the owner pick patch
  or proper fix.
- Date, time and streak logic lives in a plain function in `src/lib` with a small unit test next
  to it (`*.test.ts`, Vitest; fix "now" with `vi.setSystemTime`): one normal case and the edges
  (midnight, month end, empty history). Run `pnpm -F NN-slug test`. No unit tests for other code.

## Coaching

The owner's goals are in the playbook ("Why I'm doing this"): build good products with AI, learn
product craft, and grow technically. Act as their product coach as well as their builder: name
the practice behind each step (and where it comes from), ask them to make the product calls
instead of making them silently, push back on solution-first thinking, and explain technical
choices briefly in plain words.
- At the feature drill-down (playbook step 1, after the MVP and before design), list the product's
  objects and pre-fill the brief's table for each across lifecycle, connections, screen states
  and trust, with your call (MVP / Later / No) and a one-line reason per row. Ask the owner to
  change only what they disagree with; MVP rows become requirements, Later rows go to the backlog.

## Design skills

Use the project skills in `.claude/skills/` at their playbook step without being asked
(decision 0008): `design-session` for a screen's design (it runs `prototype` for the three
approaches and the `design-critic` subagent for critique, decision 0013), `mobile-native` for phone issues,
`emil-design-eng` while building UI, `animate` only when something needs motion, `dataviz` for
charts, then `break-ui` and `web-design-guidelines` before the own review. When a skill's advice
conflicts with the clean-and-minimal principle (decision 0007), the principle wins.

## Documentation (do this by default, without being asked)

- Keep the product's card `docs/products/NN-slug.md` lean and current: `user`, `problem` and `bet`
  (one line each) before coding; `url` once deployed; 1–3 bullets under `## Learned` and
  `status: shipped` (or `parked`) at the end. Don't add extra sections to the card.
- Everything else about a product goes in its folder `docs/products/NN-slug/`, kept current as you
  work (each file is a sub-page in the notebook):
  - `brief.md`: problem, who, jobs to be done, today's alternatives, riskiest assumptions, success
    measures, MVP and stop line; written before code, success check filled in at wrap-up.
  - `journal.md`: what happened, what was decided and why, in order. Summarise each meaningful
    step of the conversation (requests, pivots, bugs, decisions) as it happens.
  - `feedback.md`: every review comment and user-test finding, numbered, with a status.
  - `user-testing/`: `persona.md`, `plan.md`, `report-YYYY-MM-DD.md` (see `docs/user-testing/README.md`).
  - `backlog.md`: ideas and parked features for this product.
  - `learnings.md`: lessons from this product, plus the retro at wrap-up (see `docs/PLAYBOOK.md`).
  - `story.md`: the interview story at wrap-up (STAR, headline, themes, assumptions vs reality,
    follow-ups); feeds the story bank page (`docs/interview-stories.md`).
- After any change in `docs/`, run `pnpm sync` and commit it on your branch. To check how it
  looks, `pnpm notebook --preview` (writes `.notebook/preview.html`; never publish that file).
- **After each merge to `main`** (merges are batched, about once or twice a day, to save deploys):
  build from the merged commit (`git fetch origin && git switch --detach origin/main` in your
  worktree), run `pnpm notebook`, then republish `.notebook/index.html` with the Artifact tool to
  the existing private notebook, https://claude.ai/artifact/6WgAx5PMZYAzBqCg7zf25b (pass that
  URL; never create a new one). `pnpm notebook` refuses unless the checkout is the latest `main`
  with no uncommitted notes, and warns about notes on branches not merged yet: tell the owner
  about any it lists.
- `docs/knowledge-bank.md` is the owner's general knowledge, separate from product-specific
  learnings, in seven categories (customer insight, product strategy, product delivery, design and
  UX, technology, building with AI, communication and influence), each with subsections. Whenever
  you teach a general concept, add it under the right subsection (what it is, why it matters,
  where we met it, and who it comes from) plus 1–3 quiz questions in the category's `### Quiz` as
  `**Q:**` / `**A:**` pairs; they feed the notebook's Quiz page.
- Non-obvious setup or architecture choices → a new file in `docs/decisions/` from `TEMPLATE.md`.
- `docs/ideas.md` is "Problems to solve": problems (who, when, what it costs) that could become *new* products, written problem-first; add one whenever the owner mentions a problem. `docs/learnings.md` is the summary of learnings
  across products (a notebook page): design principles, 3–7 key learnings per product, and the
  process changelog (each process change from a retro, made before the next product starts).
  Add to it whenever a product teaches something, not only at wrap-up.

## Job hunt

The job search is run from the Job Coach project in claude.ai, not from this repo. Its live
priorities are on the Focus page of the Job Prep Hub (https://claude.ai/artifact/EBNLSbWYvYyf7moz26PCuV#focus,
read it with the Artifact tool) and roles are in the Job Tracker
(https://claude.ai/artifact/UAcFjtMc6G5z8edskbUqeo). When the owner asks "where are we?" or wants
priorities across everything, read Focus first and rank its dated items (interviews, deadlines)
alongside the sprint work. `docs/todo.md` only links to Focus for the
job hunt (Focus is the single source); never copy job items or dates back into it or other docs.
