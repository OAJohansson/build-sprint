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

## Documentation (do this by default, without being asked)

- Keep the product's `docs/products/NN-slug.md` current as you build: scope at the start, then
  "What shipped" and "What I learned" at the end. Update its frontmatter (`status`, `url`,
  `tagline`, `tags`) and run `pnpm sync`.
- Non-obvious setup or architecture choices → a new file in `docs/decisions/` from `TEMPLATE.md`.
- Lessons that apply across products → one line in `docs/learnings.md`.
