-- Six AM Mentor (Phase 2, decision 0027). Idempotent: safe to run more than once.
-- Paste into Supabase → SQL Editor → Run (same project as sixam_tracks). Only the app's server
-- talks to these tables with the secret key, so RLS is on with no policies (decision 0020).
-- Text and numbers only: no audio is ever stored (Ears' C2).

-- My taste: one row (id = 1). Hand edits and learned updates both rewrite `text`; `history` keeps
-- the "Updated: …" notes as [{ "at": iso, "note": text, "by": "owner" | "mentor" }].
create table if not exists sixam_taste_profile (
  id smallint primary key default 1 check (id = 1),
  text text not null default '' check (char_length(text) <= 8000),
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Mentor chats. thread_id is an analysis id (the track's SoundCloud URL), 'general' for no track,
-- or a background thread ('learn', 'setup', 'groups', 'taste'). One row per turn.
create table if not exists sixam_mentor_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id text not null check (char_length(thread_id) between 1 and 600),
  role text not null check (role in ('user', 'assistant')),
  job text not null,
  -- user: what was asked; assistant: the validated answer as JSON text.
  content text not null,
  -- assistant only: [{ "text", "source", "url"? }] and the raw API usage, for cost.
  sources jsonb,
  usage jsonb,
  cost_usd numeric(10, 6) not null default 0,
  -- user rows: true when the person started it (job button, chat, setup…); background learning
  -- is false. The daily question count (50/day warning) counts these.
  counted boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists sixam_mentor_messages_thread_idx on sixam_mentor_messages (thread_id, created_at);
create index if not exists sixam_mentor_messages_created_idx on sixam_mentor_messages (created_at);

-- Genre groups that grow from the library (no fixed family list, L50).
create table if not exists sixam_genre_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  reason text not null default '',
  track_ids jsonb not null default '[]'::jsonb,
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sixam_genre_groups_status_idx on sixam_genre_groups (status, updated_at desc);

-- Ears results, migrated once from localStorage, then kept here. id = the track's SoundCloud URL.
-- data is the EarsAnalysis record (numbers and track metadata); my_genre is kept in its own column
-- so a re-analysis never loses it.
create table if not exists sixam_analyses (
  id text primary key check (char_length(id) between 1 and 600),
  track_id bigint,
  data jsonb not null,
  my_genre text check (my_genre is null or char_length(my_genre) between 1 and 80),
  analysed_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists sixam_analyses_analysed_idx on sixam_analyses (analysed_at desc);

alter table sixam_taste_profile enable row level security;
alter table sixam_mentor_messages enable row level security;
alter table sixam_genre_groups enable row level security;
alter table sixam_analyses enable row level security;
