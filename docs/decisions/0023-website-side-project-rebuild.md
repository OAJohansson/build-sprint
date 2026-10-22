# 0023 — Andreas Product Portfolio Website: a side project, rebuilt from scratch

- **Date:** 2026-10-22
- **Status:** accepted

## Context

I want a personal website that shows my CV and the 20 products. Day 0 left a rough
`apps/portfolio` skeleton (decisions 0001, 0003) that I never looked at or deployed. I want to
build the website properly, the same way as a sprint product, while product 08 Selvedge is still
in progress, and without it counting as one of the 20.

## Decision

- The website is a **side project**: it follows the full playbook (brief, journal, design session,
  user test, retro, story) but has no day number. `pnpm new <slug> "Title" --side` scaffolds
  `apps/<slug>` and `docs/products/<slug>.md` with `side: true` instead of `day:`.
- The notebook lists side projects under **Alongside the sprint**: they get the same pages but
  no grid cell, and they don't count in the "/20 shipped" tally. The README table stays the 20.
- The old `apps/portfolio` is deleted (git history keeps it) and replaced by `apps/website`,
  started fresh from the starter template. Root script `pnpm portfolio` becomes `pnpm website`.
- It is built in its own worktree and branch (`website`), touching only `apps/website`,
  `docs/products/website*` and the side-project support in `scripts/`.

## Alternatives considered

- **Count it as product 09.** Simple, but it isn't a solution to someone else's problem, and it
  would take a day away from the 20.
- **Keep improving `apps/portfolio`.** Its shape was decided before any discovery; starting fresh
  keeps the brief honest (solution after problem).
- **A separate repo.** Would need its own copy of the product content, which would drift. Here it
  can read `docs/products/` directly if the brief says it should.

## Consequences

- Any future side project (e.g. Scribble for Mac) can use `--side` too.
- Decisions 0001 and 0003 still describe the idea of a portfolio reading the cards; the app name
  and how much it reads from `docs/` is now up to the website's brief.
- Going public is still the owner's call (decision 0003); this decision doesn't change it.
