-- Six AM schema. Paste into Supabase → SQL Editor → Run, in the same project as CrossFit Log,
-- Scribble and Folio (tables are prefixed per app; decision 0020). Only the app's server talks to
-- this table (with the secret key), so RLS is on with no policies: the public key can't read it.

-- One row per track: its name and the whole arrangement (loops on the timeline, muted tracks).
create table if not exists sixam_tracks (
  -- Generated in the browser, so the first autosave can create the row.
  id uuid primary key,
  name text not null check (char_length(name) between 1 and 80),
  -- { "regions": [{ "id", "loopId", "track", "start", "length" }], "muted": [bool × 4] }
  doc jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sixam_tracks_updated_idx on sixam_tracks (updated_at desc);

alter table sixam_tracks enable row level security;
