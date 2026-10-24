# 0027 — Six AM Mentor: a server route for Claude and Supabase for everything

- **Date:** 2026-10-24
- **Status:** accepted

## Context

Six AM's Mentor (Phase 2) answers questions about analysed tracks with Claude, searches the web,
keeps a taste profile and learns from use. A Claude API key can't live in the browser, and the
owner wants nothing to depend on one browser (owner's calls L48–L51). Until now Ears kept its
results in localStorage; only the Studio's tracks used Supabase (decision 0020).

## Decision

- **A Next.js route in `apps/07-six-am`** (e.g. `/api/mentor`) calls the Claude API with
  `ANTHROPIC_API_KEY`, server-side only, behind Six AM's existing access code
  (`src/lib/server/access.ts`). The key is in Vercel env for the 07 project (filled by `pnpm ship`
  from `.env.secrets.local`) and in `.env.example` by name only.
- **Model:** Claude Sonnet 5.5 for every job, prompt caching on the stable system prompt and
  profile, short answers, Anthropic's server-side web search tool when it helps.
- **Supabase** (the existing single-owner project, tables prefixed `sixam_`) stores the taste
  profile, Mentor chats, genre groups, question counts and usage for cost, and Ears' results and
  My genre (migrated once from localStorage). Only the server talks to it with the secret key; RLS
  on with no policies, as in decision 0020.
- **No audio, ever:** what reaches Claude and Supabase is text and numbers (Ears' measurements,
  uploader tags, titles, the owner's words).

## Alternatives considered

- **Calling Claude from the browser with the key:** leaks the key; rejected.
- **Keeping results in localStorage and only the Mentor in Supabase:** two stores to keep in step,
  and the Mentor would miss results from another browser; rejected by the owner.
- **A separate backend service:** more to deploy for one route; the Next.js app already has server
  routes (`/api/tracks`).

## Consequences

- Six AM now has running costs (Claude usage); the panel shows an estimate per answer and per
  day/month, with a 50 questions/day warning.
- Ears needs the access code to sync results, as the Studio already does; offline use falls back to
  a local cache until the next sync.
- **Multi-user later:** today one owner, one access code, rows without an owner column. To extend:
  Supabase Auth, an `owner_id uuid` column on every `sixam_` table (backfilled with the current
  owner), RLS policies `owner_id = auth.uid()`, per-user cost limits, and the access code retired.
  Licences (Essentia models non-commercial, decision in the app README) must be revisited before
  any public release.
