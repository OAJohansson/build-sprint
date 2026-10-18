# 0016 — Vercel deploys from main only

- **Date:** 2026-10-16
- **Status:** accepted

## Context

Every app in the repo is a Vercel project connected to the same GitHub repo, and Vercel started a
deployment in every project for every push to every branch. Each app's `ignoreCommand` (decision
0010) then cancelled the ones whose folder hadn't changed, but **cancelled deployments still count
toward the free plan's 100 deployments a day**. On 16 Oct about 29 pushes to the `06-folio` branch
made 123 deployments in four other apps, all cancelled, and Folio's first deploy was refused.

## Decision

Every app's `vercel.json`, the portfolio's and the starter template's say:

```json
"git": { "deploymentEnabled": { "**": false, "main": true } }
```

Pushes to any branch create no deployment at all; merges to `main` deploy as before (and the
`ignoreCommand` still skips apps whose folder didn't change). `**` rather than `*`, so branch
names with a slash (e.g. `claude/…`) are covered too.

## Alternatives considered

- **Push less often:** helps, but every push still costs one deployment per app; the cost grows
  with each new product.
- **Upgrade to Vercel Pro:** removes the limit, but costs money for a habit we don't need.
- **Keep previews for the app being built only:** possible per app, but its branch pushes would
  still use the budget; local testing already covers what previews did.

## Consequences

- No preview URLs for branches; a change reaches a real phone only after it merges to `main`. For
  a one-off preview: `vercel deploy` from the app's folder, or turn previews back on for one app.
- A merge to `main` still creates cancelled deployments in apps that didn't change (about one per
  app per merge): batch merges.
- Check after the first merge that apps still deploy from `main`.

## Update, 18 Oct: compare with the last deploy, not the last commit

The `ignoreCommand` was `git diff --quiet HEAD^ HEAD -- .`, which looks only at the last commit of
a push: a push whose last commit didn't touch an app skipped that app even when earlier commits
did (Folio's LLM picks were skipped because the last commit only synced the README). It is now
`[ -n "$VERCEL_GIT_PREVIOUS_SHA" ] && git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- .`:
skip only when nothing in the app changed since its last successful deploy, and always build when
there is no earlier deploy (or the old commit isn't in Vercel's shallow clone).
