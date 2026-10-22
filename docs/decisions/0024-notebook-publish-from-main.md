# 0024 — Publish the notebook only from main

- **Date:** 2026-10-22
- **Status:** accepted

## Context

Worktrees keep parallel sessions out of each other's files, but the notebook is one published
page outside git. Each session built it from its own branch and republished, so whoever published
last won. On 22 Oct the website session published from its branch; a republish from `main` by
the Selvedge session would have dropped the website pages. No notes were lost (they were
committed on the branch), but the notebook stopped being a reliable view of everything. The
owner's requirement: never lose a decision or learning; a notebook that lags a few hours is fine.

## Decision

- Notes are safe once committed: commit `docs/` changes at each step and push the branch.
- The notebook is published only from the latest `main`, as part of merging. Merges are batched
  (about once or twice a day) because each merge costs one deployment per Vercel project
  (decision 0016).
- `pnpm notebook` refuses unless `HEAD` is the latest `origin/main` (a detached checkout counts,
  since a worktree can't check out `main` while the main folder has it) and `docs/` has no
  uncommitted changes. It warns about notes committed on branches not merged into `main` yet.
- `pnpm notebook --preview` builds any branch into `.notebook/preview.html`, for checking only.

## Alternatives considered

- **Rule in AGENTS.md only:** relies on every session remembering it; the website session didn't.
- **Merge after every docs change:** keeps the notebook live but would use up the free plan's
  100 deployments a day.
- **One notebook per branch:** no clashes, but several notebooks to keep track of.

## Consequences

- The notebook lags work in progress by up to half a day; the owner is fine with that.
- Every publish lists forgotten branches with notes, so abandoned work surfaces instead of
  silently missing.
- The guard checks the build, not the publish: an old `index.html` could still be published by
  hand. The AGENTS.md rule covers that gap.
- Revisit if the deploy budget stops being a constraint (fewer projects deploying from git, or a
  paid plan): then merging and publishing after every change becomes possible.
