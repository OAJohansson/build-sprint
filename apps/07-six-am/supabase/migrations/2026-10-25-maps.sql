-- Six AM arrangement maps (Phase 3, S1). ADDITIVE only: one new table, nothing dropped or rewritten.
-- Idempotent: safe to run more than once. Paste into Supabase → SQL Editor → Run (same project as
-- sixam_analyses). Only the app's server talks to it with the secret key, so RLS is on with no
-- policies (decision 0020). Numbers only: no audio is ever stored (Ears' C2, Phase 3's A1).

-- One map per track. id = the analysis id (the track's SoundCloud URL), like sixam_analyses.id; no
-- foreign key, so a map can be saved in the same breath as its first Ears result. data is the
-- TrackMap record (src/lib/map/types.ts): grid, sections, per-bar loudness and layer ESTIMATES.
create table if not exists sixam_maps (
  id text primary key check (char_length(id) between 1 and 600),
  data jsonb not null,
  mapped_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table sixam_maps enable row level security;
