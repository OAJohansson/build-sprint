# 0001 — One monorepo, one Vercel project per product

- **Date:** 2026-10-06
- **Status:** accepted

## Context

Plan: 20 small products in 20 days, deployed and showcased as a portfolio.
Per-product setup has to be close to zero, and the result has to be easy for a recruiter to browse.

## Decision

A single pnpm-workspace repo. Each product is `apps/NN-slug`, copied from `templates/next-starter`
by `pnpm new`. Each app gets its own Vercel project (Root Directory = `apps/NN-slug`) and its own
`*.vercel.app` URL. A `portfolio` app lists every product by reading `docs/products/*.md`.

## Alternatives considered

- **Repo per product.** Every day would need a new repo, a new Vercel import and copy-pasted
  boilerplate, and the work would be scattered across 20 repos. Too much friction for one-day builds.
- **One Next.js app with a route per product.** No per-day deploy setup, but every product is
  tied to the same dependencies and build, one broken product breaks all of them, and products
  can't have their own URL or stack.

## Consequences

- Setting up a new product means one command plus a ~2 minute Vercel import.
- Products are isolated: separate dependencies, builds and URLs. They can diverge (e.g. one adds a DB).
- Apps don't share code. Shared improvements go into the template and only apply to future products. That's acceptable for throwaway prototypes.
- Revisit if products start needing shared UI or auth, which would mean extracting a `packages/` workspace.
