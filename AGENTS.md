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

## Design skills

Use the project skills in `.claude/skills/` at their playbook step without being asked
(decision 0008): `prototype` for the three approaches, `mobile-native` for phone issues,
`emil-design-eng` while building UI, `animate` only when something needs motion, `dataviz` for
charts, then `break-ui` and `web-design-guidelines` before the own review. When a skill's advice
conflicts with the clean-and-minimal principle (decision 0007), the principle wins.

## Documentation (do this by default, without being asked)

- Keep the product's card `docs/products/NN-slug.md` lean and current: `user`, `problem` and `bet`
  (one line each) before coding; `url` once deployed; 1–3 bullets under `## Learned` and
  `status: shipped` (or `parked`) at the end. Don't add extra sections to the card.
- Everything else about a product goes in its folder `docs/products/NN-slug/`, kept current as you
  work (each file is a sub-page in the notebook):
  - `journal.md`: what happened, what was decided and why, in order. Summarise each meaningful
    step of the conversation (requests, pivots, bugs, decisions) as it happens.
  - `feedback.md`: every review comment and user-test finding, numbered, with a status.
  - `user-testing/`: `persona.md`, `plan.md`, `report-YYYY-MM-DD.md` (see `docs/user-testing/README.md`).
  - `backlog.md`: ideas and parked features for this product.
  - `learnings.md`: lessons from this product, plus the retro at wrap-up (see `docs/PLAYBOOK.md`).
- After any change in `docs/`, run `pnpm sync && pnpm notebook`, then republish
  `.notebook/index.html` with the Artifact tool to the existing private notebook,
  https://claude.ai/artifact/6WgAx5PMZYAzBqCg7zf25b (pass that URL; never create a new one).
- Non-obvious setup or architecture choices → a new file in `docs/decisions/` from `TEMPLATE.md`.
- `docs/ideas.md` is for ideas for *new* products. `docs/learnings.md` is the summary of learnings
  across products (a notebook page): design principles, 3–7 key learnings per product, and the
  process changelog (each process change from a retro, made before the next product starts).
  Add to it whenever a product teaches something, not only at wrap-up.
