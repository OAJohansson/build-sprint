# 20 products in 20 days

One new product every day: scoped in the morning, shipped by night. Small on purpose. The point is
reps in going from idea to something live, plus an honest write-up of what I learned.

**Portfolio site:** _not public yet. Products are tracked in a private notebook built from `docs/` (`pnpm notebook`)._

## Products

<!-- products:start -->
| Day | Product | Problem | Status | Live | Links |
| --: | --- | --- | --- | --- | --- |
| 1 | **CrossFit Log** | Coach says “70% of your 1RM” and I never remember my PBs, because logging lifts after class is too much friction | 🛠️ building | [live](https://crossfit-log.vercel.app) | [write-up](docs/products/01-crossfit.md) · [code](apps/01-crossfit) |
<!-- products:end -->

_This table is generated from `docs/products/*.md`. Run `pnpm sync` after editing frontmatter._

## How it's set up

```
apps/
  portfolio/          hub site listing every product (reads docs/products at build time)
  NN-slug/            one folder per product, each its own Vercel project and URL
templates/
  next-starter/       what `pnpm new` copies: Next.js 16 + Tailwind 4 + shadcn + localStorage hook
docs/
  PLAYBOOK.md         the daily loop
  ideas.md            ideas for the next products
  products/           one write-up per product (problem → scope → what shipped → learnings)
  learnings.md        (later) summary of lessons across products
  decisions/          why it's set up this way
  products/NN-slug/   per product: journal, feedback, user-testing/, backlog, learnings
  user-testing/       simulated user testing: method + persona and plan templates
scripts/              `pnpm new` and `pnpm sync`
.claude/agents/       user-tester: the agent that plays the persona and drives the app
```

Why a monorepo with a Vercel project per app: see
[decision 0001](docs/decisions/0001-monorepo-one-vercel-project-per-app.md).
Why no database by default: see [decision 0002](docs/decisions/0002-localstorage-by-default.md).
Why a private notebook first: see [decision 0003](docs/decisions/0003-private-notebook-before-public-portfolio.md).

## Daily commands

```bash
pnpm new crossfit "CrossFit Log"   # scaffold apps/NN-crossfit + docs/products/NN-crossfit.md
pnpm install
pnpm -F NN-crossfit dev            # run it
pnpm sync                          # refresh the table above from the write-ups
pnpm notebook                      # rebuild the private notebook (then republish it)
pnpm portfolio                     # preview the portfolio site
```

Deploying a new app takes about 2 minutes, once per product: import this repo at
[vercel.com/new](https://vercel.com/new) and set **Root Directory** to `apps/NN-slug`. After that,
every push to `main` redeploys it. Full steps are in [`docs/PLAYBOOK.md`](docs/PLAYBOOK.md#3-ship-15-min-do-it-early-eg-at-lunch).
