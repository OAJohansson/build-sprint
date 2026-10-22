# 0025 — Ship always builds, even when only keys changed

- **Date:** 2026-10-22
- **Status:** accepted

## Context

`pnpm ship` (decision 0010) sets the env vars from `.env.local` on the Vercel project, then deploys
`main`. Each app's `ignoreCommand` (decision 0016) skips a build when nothing in the app's folder
changed since its last deploy. Keys aren't in the folder, so on 22 Oct shipping 08 Selvedge with new
keys and no code change ended as CANCELED: ship said "env vars brought up to date", reported a
failure, and the live site kept running without the keys. Env vars only reach a site when it builds.

## Decision

Ship tells the skip rule "build this one" through a project env var, `SHIP_BUILD_SHA`:

1. Ship reads the commit `main` is at, sets `SHIP_BUILD_SHA` to it (plain, Production only) along
   with the other keys, and deploys exactly that commit (`gitSource.sha`).
2. Every app's `ignoreCommand` and the starter template's now start with
   `if [ "$VERCEL_GIT_COMMIT_SHA" = "$SHIP_BUILD_SHA" ]; then exit 1; fi;` (exit 1 means build),
   followed by the old folder check.

An ordinary push is a new commit, so it doesn't match and the skip rule works as before. The value
left behind needs no cleanup: it only matches the commit ship deployed. If a ship still ends as
CANCELED, ship now says it was the skip rule (from the build log) and whether the app's `vercel.json`
on `main` has the new check yet.

Checked locally in a `--depth=10` clone, like Vercel's: unchanged app → skip; unchanged app with
`SHIP_BUILD_SHA` = the commit → build; leftover value from an older commit → skip; changed app,
missing previous commit, first deploy → build. Not yet checked with a real ship.

## Alternatives considered

- **A deployment-only env var:** the cleanest signal, but the v13 deployments API no longer accepts
  `env`/`build.env` in the body (checked against the OpenAPI spec on 22 Oct).
- **Redeploy without the ignore step:** the dashboard's Redeploy dialog has a "Use project's Ignore
  Build Step" checkbox, but neither the API spec nor `vercel redeploy` (CLI 54.18.5, which sends
  `deploymentId` and `forceNew=1`) exposes it. Relying on an undocumented field could break silently.
- **`forceNew=1`:** only bypasses de-duplication of identical deployments; the ignore step still runs.
- **A `SHIP_FORCE_BUILD=1` flag set before the deploy and removed after:** works, but if ship
  crashes in between, every push builds that app until someone notices. Tying it to a commit
  makes it expire on its own.
- **Drop the skip rule:** costs one deployment per app per merge again, the reason for 0016.

## Consequences

- A ship always produces a real build (one deployment, which the cancelled one also cost).
- Redeploying that same commit later (from the dashboard, say) builds too, since the value still
  matches. Harmless.
- New apps get the check from `templates/next-starter/vercel.json`. An app whose `vercel.json` lacks
  it can still ship code changes but not key-only changes; ship's message says so.
- Revisit if Vercel documents a way to skip the ignore step from the API.
