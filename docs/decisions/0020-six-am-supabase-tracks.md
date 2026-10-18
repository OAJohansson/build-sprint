# 0020 — Six AM saves tracks in the shared Supabase project

- **Date:** 2026-10-19
- **Status:** accepted

## Context

Six AM's track lived only in memory, so a reload lost it. The owner wants their tracks on any
device (owner, 19 Oct), which rules out localStorage (decision 0002): it doesn't sync, and Safari
clears it for sites unvisited for a week. The free Supabase plan allows two active projects, and
both are in use; CrossFit Log, Scribble and Folio already share one (decision 0015).

## Decision

- **Storage:** one table, `sixam_tracks`, in that shared project: a track's name plus its whole
  arrangement (regions and mutes) as JSON. Schema in `apps/07-six-am/supabase/schema.sql`, run
  once in the SQL Editor.
- Only the app's server routes talk to the database, with `SUPABASE_SECRET_KEY`. RLS is on with
  no policies, so the public key can't read anything.
- **Login:** an access code (`ACCESS_CODE`) guards every route, typed once per device.
- **Autosave:** every change is saved a moment after you stop editing; no Save button.
- Without Supabase env vars in development, an in-memory store stands in; production fails closed.

## Alternatives considered

- **localStorage:** simplest, but no other devices (the owner's ask).
- **A new Supabase project:** not possible on the free plan without pausing one of the two.
- **Real accounts:** not needed for one user; the access code is enough.

## Consequences

- Needs `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `ACCESS_CODE` in `.env.local` and on Vercel,
  and the schema run once.
- Four apps now share one project and key: a bug or leak in any of them reaches all four. Fine
  for one user (decision 0015's reasoning); split Six AM out if anyone else uses it.
- A whole track is saved at once (one JSON row). Fine at this size; revisit if tracks get large
  or two devices edit the same track at the same moment (last save wins).
