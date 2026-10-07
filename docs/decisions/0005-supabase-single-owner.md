# 0005 — CrossFit Log stores data in Supabase, single owner, access code as login

- **Date:** 2026-10-06
- **Status:** accepted

## Context

CrossFit Log's core job is remembering PBs. Data in localStorage (decision 0002) disappears when
the browser is cleared or the phone changes, which is unacceptable for a PB tracker. The app is
also public (portfolio piece) and is used by one person for now.

## Decision

- Store sessions, entries and PB records in a dedicated Supabase project (free tier), schema in
  `apps/01-crossfit/supabase/schema.sql`, tables prefixed `crossfit_`.
- Only the app's server routes talk to Supabase, with `SUPABASE_SECRET_KEY`. RLS is on with no
  policies, so the public key can't read anything.
- No accounts: the existing `ACCESS_CODE` is the login and guards every API route.
- PB detection lives in one shared module (`src/lib/pb.ts`) used by the review screen and by the
  save route, so the "NEW PB" tag and what gets stored always agree.
- Without Supabase env vars in development, an in-memory store stands in; production fails closed.

## Alternatives considered

- Reuse the kids-app Supabase project: works, but mixes two apps' data and keys.
- Vercel Marketplace Postgres: equally fine; Supabase was already set up and familiar.
- Real accounts (email login): parked in the product backlog; every new user would add AI cost.

## Consequences

- Needs `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the Vercel project, plus the schema run once.
- Free Supabase projects pause after a week without activity; restore from the dashboard.
- Recruiters without the code see only the unlock screen until demo mode exists (product backlog).
