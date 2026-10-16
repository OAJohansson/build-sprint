# 0015 — Folio keeps my reading data in the shared Supabase project

- **Date:** 2026-10-16
- **Status:** accepted

## Context

Folio's book data comes from free services through server routes (decision 0014). The question
left was where my own reading data lives: shelves, ratings, one-liners, dates. The owner will
use Folio daily on phone and laptop. localStorage (decision 0002) doesn't sync, is wiped when
the browser is cleared, and Safari deletes it for sites unvisited for 7 days. The free Supabase
plan allows two active projects, and both are in use.

## Decision

- **Storage:** Supabase, following decisions 0005 and 0009: one table, `folio_books`, in the
  project CrossFit Log and Scribble already share. Schema in `apps/06-folio/supabase/schema.sql`,
  run once in the SQL Editor.
- Only the app's server routes talk to the database, with `SUPABASE_SECRET_KEY`. RLS is on with
  no policies, so the public key can't read anything.
- **Login:** an access code (`ACCESS_CODE`) guards every route, typed once per device.
- A book is on my shelves once: `work_key` (the Open Library work id) is unique, which is how
  the import merges editions (*Mindset*, *Fellowship of the Ring*).
- An "Export all" backup, as in Scribble.

## Alternatives considered

- **localStorage:** fastest to build, but no sync, and new ratings and one-liners could be lost.
- **Neon Postgres through Vercel's Storage tab:** free and separate, but a new service, with
  sign-in to build ourselves.
- **A new Supabase project:** not possible on the free plan without pausing one of the two.

## Consequences

- Needs `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (the same values as Scribble's) and `ACCESS_CODE`
  in `.env.local` and Vercel, and the schema run once.
- **Bigger blast radius:** three apps now share one project and one secret key. A bug or leak in
  any of them exposes all three, and they share pauses and limits. Fine for one user (decision
  0009's reasoning); split Folio out as soon as anyone else uses it.
- Daily use of the three apps keeps the free project from pausing.
