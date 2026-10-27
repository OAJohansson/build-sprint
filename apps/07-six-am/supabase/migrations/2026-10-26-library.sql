-- Six AM sound library (Lab S4, L146, L158). ADDITIVE and idempotent: creates one table and its
-- indexes, never drops, deletes or rewrites anything. Paste into Supabase → SQL Editor → Run (same
-- project as sixam_tracks). Only the app's server talks to it with the secret key, so RLS is on
-- with no policies (decision 0020).
--
-- The owner's own sounds only: a preset with its macro values (the sound) linked to a note pattern
-- (the loop), with tags and a name. Settings and numbers, never audio, and never anything of a
-- streamed original (L143): the source song is kept as its title and SoundCloud URL only.

create table if not exists sixam_sounds (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  part text not null check (part in ('bass', 'drums', 'other', 'vocals')),
  preset text not null check (char_length(preset) between 1 and 40),
  -- { tone, length, pitchDrop, drive, wobble, width }, each 0–1 (src/lib/make/presets.ts)
  macros jsonb not null,
  -- { bars: 1 | 2 | 4, notes: [{ step, midi, dur, vel }] } (src/lib/make/library.ts)
  pattern jsonb not null,
  key text not null check (char_length(key) between 1 and 3),
  scale text not null check (scale in ('major', 'minor')),
  bpm numeric not null check (bpm between 40 and 220),
  source_url text check (source_url is null or char_length(source_url) <= 600),
  source_title text check (source_title is null or char_length(source_title) <= 300),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sixam_sounds_created_idx on sixam_sounds (created_at desc);
create index if not exists sixam_sounds_source_idx on sixam_sounds (source_url);
create index if not exists sixam_sounds_tags_idx on sixam_sounds using gin (tags);

alter table sixam_sounds enable row level security;
