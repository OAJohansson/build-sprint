-- Scribble schema. Paste into Supabase → SQL Editor → Run (same project as CrossFit Log is fine:
-- tables are prefixed per app). Only the app's server talks to this table (with the secret key),
-- so RLS is on with no policies: the public/anon key can't read or write anything.

create table if not exists scribble_pieces (
  -- Generated on the device, so autosave can upsert the same draft again and again.
  id uuid primary key,
  prompt text not null,
  body text not null default '',
  status text not null default 'draft' check (status in ('draft', 'done')),
  -- { "strength": "...", "tryNext": "..." } once a reader has replied.
  feedback jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists scribble_pieces_updated_idx on scribble_pieces (updated_at desc);

alter table scribble_pieces enable row level security;
