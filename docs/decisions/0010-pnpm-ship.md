# 0010 — First deploys through `pnpm ship`, using the Vercel API via the CLI

- **Date:** 2026-10-12
- **Status:** accepted

## Context

Every product's first deploy took 10–15 minutes of dashboard clicks, and twice the project got the
repo's name instead of the product's (Horizon, Scribble), which then needed a rename and a new
domain. Each project also needed the "skip unchanged builds" toggle set by hand.

## Decision

- `scripts/ship.mjs` (`pnpm ship NN-slug`) talks to the Vercel API through `vercel api`, so it
  uses the owner's `vercel login` and needs no separate token. One request creates the project
  with its name, Root Directory, framework, GitHub link and env vars; then it deploys `main` from
  GitHub, waits, reads the `.vercel.app` domain and writes it into the card.
- Env vars come from the app's git-ignored `.env.local` and are sent on stdin, never printed or put
  in command arguments. The owner runs the script, so keys never pass through Claude.
- Re-running updates the Root Directory and env vars (upsert) and redeploys.
- Each app (and the starter) has a `vercel.json` with `ignoreCommand: git diff --quiet HEAD^ HEAD -- .`,
  replacing the dashboard toggle. `portfolio` has none: it must rebuild when `docs/` changes.

## Alternatives considered

- **Plain CLI commands** (`vercel project add`, `vercel link`, `vercel env add` one by one): no
  command sets the Root Directory, and linking the repo root would mix up the apps.
- **A Vercel token in the script:** another secret to manage; `vercel api` reuses the login.
- **Keep clicking:** the retro showed it cost real time and caused the naming mistakes.

## Consequences

- One-time `vercel login` per machine. `vercel api` is in beta; if it changes, the script's API
  calls (v9/v10/v11 projects, v13 deployments) can be swapped to `fetch` with a token.
- The ignore command can't see changes outside the app's folder (e.g. the root lockfile); push a
  change in the app, or redeploy from the dashboard, when only shared files changed.
