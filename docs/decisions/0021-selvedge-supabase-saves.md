# 0021 — Selvedge syncs saves through the shared Supabase project

- **Date:** 2026-10-21
- **Status:** accepted

## Context

Selvedge has two moments on two devices: saving happens on the Android phone, mid-scroll, and
the board is edited on the laptop, because arranging a moodboard on a phone is too fiddly (owner,
21 Oct). localStorage (decision 0002) lives on one device and is far too small for images, so the
saves need a backend. The free Supabase plan allows two active projects, both in use; CrossFit
Log, Scribble, Folio and Six AM share one (decisions 0015, 0020).

## Decision

- **Images:** a private Storage bucket, `selvedge`, in the shared project. Each image is shrunk in
  the browser (long side about 1600 px, WebP) before upload, which keeps it well under Vercel's
  request limit and the free plan's 1 GB.
- **Records:** tables prefixed `selvedge_` for saves (image path or link, source, time) and boards
  (which saves, in what order and size, plus the palette) as JSON. Schema in
  `apps/08-selvedge/supabase/schema.sql`, run once in the SQL Editor.
- Only the app's server routes talk to Supabase, with `SUPABASE_SECRET_KEY`; RLS on, no policies.
- **Login:** an access code (`ACCESS_CODE`), typed once per device, as in Six AM.
- **Offline shares:** the service worker that receives a share keeps it in the browser (IndexedDB)
  until the upload succeeds, so nothing shared is lost.

## Alternatives considered

- **Phone only, in the browser (IndexedDB):** no backend, faster to build, but the board can't be
  edited on the laptop, which is where the owner wants to do it.
- **A new Supabase project:** not possible on the free plan without pausing one of the two.
- **Real accounts:** not needed for one user.

## Consequences

- Needs `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `ACCESS_CODE` in `.env.local` and on Vercel,
  the schema run once and the bucket created.
- Five apps now share one project and key; a leak in any reaches all of them. Fine for one user;
  split Selvedge out if anyone else uses it, since it holds personal photos.
- The share target must work while the access code cookie is set; check it on the probe.
- Revisit storage if saves pass a few thousand, or if two devices edit one board at once (last
  save wins).
